
import { NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { createSupabaseServerClient } from "@/app/lib/supabaseServer";
import { supabaseAdmin } from "@/app/lib/supabaseAdmin";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const ACTIONS = ["start", "heartbeat", "pageview", "end"] as const;
const MAX_BODY_SIZE = 4096;

class RequestTooLargeError extends Error {}

async function readLimitedBody(request: Request): Promise<string> {
  const reader = request.body?.getReader();

  if (!reader) return "";

  const chunks: Uint8Array[] = [];
  let totalSize = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();

      if (done) break;

      totalSize += value.byteLength;

      if (totalSize > MAX_BODY_SIZE) {
        await reader.cancel();
        throw new RequestTooLargeError();
      }

      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  const body = new Uint8Array(totalSize);
  let offset = 0;

  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }

  return new TextDecoder().decode(body);
}

function isValidPath(path: unknown): path is string {
  return (
    typeof path === "string" &&
    path.length > 0 &&
    path.length <= 500 &&
    path.startsWith("/") &&
    !path.startsWith("//") &&
    !path.includes("\\") &&
    !/[\u0000-\u001f\u007f]/.test(path)
  );
}

function getRateLimitKey(request: Request) {
  // Vercel provides the client IP through x-real-ip.
  const ip =
    request.headers.get("x-real-ip")?.trim() || "unknown";

  return createHash("sha256").update(ip).digest("hex");
}

export async function POST(request: Request) {
  try {
    const contentLength = Number(
      request.headers.get("content-length") || 0
    );

    if (contentLength > MAX_BODY_SIZE) {
      return NextResponse.json(
        { error: "Request too large" },
        { status: 413 }
      );
    }

    const rateKey = getRateLimitKey(request);

    const { data: allowed, error: rateError } =
      await supabaseAdmin.rpc("allow_visitor_tracking", {
        p_key: rateKey,
        p_limit: 60,
        p_window_seconds: 60,
      });

    if (rateError) {
      console.error("Visitor rate limit error:", rateError);

      return NextResponse.json(
        { error: "Tracking temporarily unavailable" },
        { status: 503 }
      );
    }

    if (allowed !== true) {
      return NextResponse.json(
        { error: "Too many requests" },
        {
          status: 429,
          headers: { "Retry-After": "60" },
        }
      );
    }

    let rawBody: string;

    try {
      rawBody = await readLimitedBody(request);
    } catch (error) {
      if (error instanceof RequestTooLargeError) {
        return NextResponse.json(
          { error: "Request too large" },
          { status: 413 }
        );
      }

      throw error;
    }

    let body: unknown;

    try {
      body = JSON.parse(rawBody);
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON" },
        { status: 400 }
      );
    }

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json(
        { error: "Invalid request" },
        { status: 400 }
      );
    }

    const { action, sessionId, visitorId, path } =
      body as Record<string, unknown>;

    if (
      typeof action !== "string" ||
      !ACTIONS.includes(action as (typeof ACTIONS)[number]) ||
      typeof sessionId !== "string" ||
      !UUID_REGEX.test(sessionId) ||
      typeof visitorId !== "string" ||
      !UUID_REGEX.test(visitorId)
    ) {
      return NextResponse.json(
        { error: "Invalid request" },
        { status: 400 }
      );
    }

    if (
      (action === "start" || action === "pageview") &&
      !isValidPath(path)
    ) {
      return NextResponse.json(
        { error: "Invalid path" },
        { status: 400 }
      );
    }

    const supabase = await createSupabaseServerClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const now = new Date().toISOString();

    if (action === "start") {
      const { error } = await supabaseAdmin
        .from("visitor_sessions")
        .insert({
          session_id: sessionId,
          visitor_id: visitorId,
          user_id: user?.id ?? null,
          started_at: now,
          last_seen_at: now,
          page_count: 1,
        });

      if (error) {
        if (error.code === "23505") {
          const { data: existingSession } = await supabaseAdmin
            .from("visitor_sessions")
            .select("session_id")
            .eq("session_id", sessionId)
            .eq("visitor_id", visitorId)
            .is("ended_at", null)
            .maybeSingle();

          if (existingSession) {
            return NextResponse.json({ success: true });
          }

          return NextResponse.json(
            { error: "Session already ended" },
            { status: 409 }
          );
        }

        throw error;
      }

      const { error: pageError } = await supabaseAdmin
        .from("visitor_pageviews")
        .insert({ session_id: sessionId, path });

      if (pageError) {
        // Remove incomplete session if its first pageview fails.
        const { error: cleanupError } = await supabaseAdmin
          .from("visitor_sessions")
          .delete()
          .eq("session_id", sessionId)
          .eq("visitor_id", visitorId);

        if (cleanupError) {
          console.error("Incomplete session cleanup error:", cleanupError);
        }

        throw pageError;
      }

      return NextResponse.json({ success: true });
    }

    if (action === "pageview") {
      const { data: session, error: sessionError } =
        await supabaseAdmin
          .from("visitor_sessions")
          .select("page_count")
          .eq("session_id", sessionId)
          .eq("visitor_id", visitorId)
          .is("ended_at", null)
          .maybeSingle();

      if (sessionError) throw sessionError;

      if (!session) {
        return NextResponse.json(
          { error: "Session not found" },
          { status: 404 }
        );
      }

      const { error: pageError } = await supabaseAdmin
        .from("visitor_pageviews")
        .insert({ session_id: sessionId, path });

      if (pageError) throw pageError;

      const { error } = await supabaseAdmin
        .from("visitor_sessions")
        .update({
          last_seen_at: now,
          page_count: session.page_count + 1,
          user_id: user?.id ?? null,
        })
        .eq("session_id", sessionId)
        .eq("visitor_id", visitorId)
        .is("ended_at", null);

      if (error) throw error;

      return NextResponse.json({ success: true });
    }

    if (action === "heartbeat") {
      const { error } = await supabaseAdmin
        .from("visitor_sessions")
        .update({
          last_seen_at: now,
          user_id: user?.id ?? null,
        })
        .eq("session_id", sessionId)
        .eq("visitor_id", visitorId)
        .is("ended_at", null);

      if (error) throw error;

      return NextResponse.json({ success: true });
    }

    if (action === "end") {
      const { error } = await supabaseAdmin
        .from("visitor_sessions")
        .update({
          last_seen_at: now,
          ended_at: now,
        })
        .eq("session_id", sessionId)
        .eq("visitor_id", visitorId)
        .is("ended_at", null);

      if (error) throw error;

      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { error: "Invalid action" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Visitor tracking error:", error);

    return NextResponse.json(
      { error: "Tracking failed" },
      { status: 500 }
    );
  }
}
