
import { NextResponse } from "next/server";
import { createHmac } from "crypto";
import { supabaseAdmin } from "@/app/lib/supabaseAdmin";

export async function POST(request: Request) {
  try {
    // Same-origin protection
    const origin = request.headers.get("origin");
    const requestOrigin = new URL(request.url).origin;
    const fetchSite = request.headers.get("sec-fetch-site");

    if (
      (origin && origin !== requestOrigin) ||
      fetchSite === "cross-site"
    ) {
      return NextResponse.json(
        { error: "Invalid request origin." },
        { status: 403 }
      );
    }

    // Read and validate actual request body size
    const rawBody = await request.text();

    if (new TextEncoder().encode(rawBody).byteLength > 150000) {
      return NextResponse.json(
        { error: "Request is too large." },
        { status: 413 }
      );
    }

    let body: unknown;

    try {
      body = JSON.parse(rawBody);
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON data." },
        { status: 400 }
      );
    }

    if (
      !body ||
      typeof body !== "object" ||
      Array.isArray(body)
    ) {
      return NextResponse.json(
        { error: "Invalid request data." },
        { status: 400 }
      );
    }

    const { subjectName, unitTitle, topic, content } =
      body as Record<string, unknown>;

    if (
      typeof subjectName !== "string" ||
      typeof unitTitle !== "string" ||
      typeof topic !== "string" ||
      typeof content !== "string" ||
      !subjectName.trim() ||
      !unitTitle.trim() ||
      !topic.trim() ||
      !content.trim()
    ) {
      return NextResponse.json(
        { error: "All fields are required." },
        { status: 400 }
      );
    }

    if (
      subjectName.length > 200 ||
      unitTitle.length > 200 ||
      topic.length > 300
    ) {
      return NextResponse.json(
        { error: "Some fields are too long." },
        { status: 400 }
      );
    }

    if (content.length > 100000) {
      return NextResponse.json(
        { error: "Notes are too long." },
        { status: 400 }
      );
    }

    // Rate limiting
    const rateLimitSecret = process.env.SHARE_RATE_LIMIT_SECRET;

    if (!rateLimitSecret) {
      console.error("Share rate-limit secret is missing.");

      return NextResponse.json(
        { error: "Sharing is temporarily unavailable." },
        { status: 503 }
      );
    }

    const realIp = request.headers.get("x-real-ip");
    const forwardedFor = request.headers.get("x-forwarded-for");

    const clientIp =
      realIp?.trim() ||
      forwardedFor?.split(",")[0]?.trim() ||
      (process.env.NODE_ENV !== "production"
        ? "local-development"
        : "");

    if (!clientIp || clientIp.length > 100) {
      return NextResponse.json(
        { error: "Could not verify your request." },
        { status: 503 }
      );
    }

    const ipHash = createHmac("sha256", rateLimitSecret)
      .update(clientIp)
      .digest("hex");

    const { data: allowed, error: rateLimitError } =
      await supabaseAdmin.rpc("check_share_rate_limit", {
        p_ip_hash: ipHash,
        p_limit: 5,
        p_window_seconds: 3600,
      });

    if (rateLimitError) {
      console.error("Share rate-limit error:", rateLimitError);

      return NextResponse.json(
        { error: "Sharing is temporarily unavailable." },
        { status: 503 }
      );
    }

    if (allowed !== true) {
      return NextResponse.json(
        {
          error: "Sharing limit reached. Please try again after one hour.",
        },
        {
          status: 429,
          headers: {
            "Retry-After": "3600",
            "Cache-Control": "no-store",
          },
        }
      );
    }

    // Save shared notes
    const { data, error } = await supabaseAdmin
      .from("shared_notes")
      .insert({
        subject_name: subjectName.trim(),
        unit_title: unitTitle.trim(),
        topic: topic.trim(),
        content: content.trim(),
      })
      .select("id")
      .single();

    if (error) {
      console.error("Share notes database error:", error);

      return NextResponse.json(
        { error: "Could not save notes." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { id: data.id },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    console.error("Share notes API error:", error);

    return NextResponse.json(
      { error: "Something went wrong." },
      { status: 500 }
    );
  }
}
