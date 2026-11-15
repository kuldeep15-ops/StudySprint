
import { NextResponse, connection } from "next/server";
import { supabaseAdmin } from "@/app/lib/supabaseAdmin";
import { createSupabaseServerClient } from "@/app/lib/supabaseServer";

const STUDENT_FREE_LIMIT = 7;

export async function GET() {
  // Wait for the incoming request before accessing cookies.
  await connection();

  try {
    const supabase = await createSupabaseServerClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        {
          loggedIn: false,
          error: "AI Notes generate karne ke liye login required hai.",
        },
        {
          status: 401,
          headers: { "Cache-Control": "no-store" },
        }
      );
    }

    const { count, error } = await supabaseAdmin
      .from("student_ai_usage")
      .select("*", { count: "exact", head: true })
      .eq("student_id", user.id)
      .eq("feature", "ai_notes")
      .in("status", ["reserved", "completed"]);

    if (error) {
      console.error("AI credits fetch failed:", error.message);

      return NextResponse.json(
        { error: "Unable to fetch AI credits. Please try again." },
        {
          status: 503,
          headers: { "Cache-Control": "no-store" },
        }
      );
    }

    const used = count ?? 0;
    const remaining = Math.max(0, STUDENT_FREE_LIMIT - used);

    return NextResponse.json(
      {
        loggedIn: true,
        freeLimit: STUDENT_FREE_LIMIT,
        used,
        remaining,
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      }
    );
  } catch (error) {
    console.error("AI credits API error:", error);

    return NextResponse.json(
      { error: "Unable to fetch AI credits. Please try again." },
      {
        status: 500,
        headers: { "Cache-Control": "no-store" },
      }
    );
  }
}
