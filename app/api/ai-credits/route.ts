
import { NextResponse, connection } from "next/server";
import { supabaseAdmin } from "@/app/lib/supabaseAdmin";
import { createSupabaseServerClient } from "@/app/lib/supabaseServer";

const STUDENT_FREE_LIMIT = 7;

export async function GET() {
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

    const now = new Date().toISOString();

    const [usageResult, paidResult, plansResult] = await Promise.all([
      supabaseAdmin
        .from("student_ai_usage")
        .select("*", { count: "exact", head: true })
        .eq("student_id", user.id)
        .eq("feature", "ai_notes")
        .is("paid_credit_lot_id", null)
        .in("status", ["reserved", "completed"]),

      supabaseAdmin
        .from("student_paid_credit_lots")
        .select("remaining_credits")
        .eq("student_id", user.id)
        .gt("remaining_credits", 0)
        .gt("expires_at", now),

      supabaseAdmin
        .from("ai_credit_plans")
        .select(
          "id, name, description, price_paise, credits, validity_days, is_featured, sort_order"
        )
        .eq("is_active", true)
        .order("sort_order", { ascending: true }),
    ]);

    if (usageResult.error) {
      console.error("Free credits fetch failed:", usageResult.error.message);
    }

    if (paidResult.error) {
      console.error("Paid credits fetch failed:", paidResult.error.message);
    }

    if (plansResult.error) {
      console.error("Credit plans fetch failed:", plansResult.error.message);
    }

    if (usageResult.error || paidResult.error || plansResult.error) {
      return NextResponse.json(
        { error: "Unable to fetch AI credits. Please try again." },
        {
          status: 503,
          headers: { "Cache-Control": "no-store" },
        }
      );
    }

    const used = usageResult.count ?? 0;
    const freeRemaining = Math.max(0, STUDENT_FREE_LIMIT - used);

    const paidRemaining = (paidResult.data ?? []).reduce(
      (total, lot) => total + Math.max(0, Number(lot.remaining_credits) || 0),
      0
    );

    const plans = (plansResult.data ?? []).map((plan) => ({
      id: plan.id,
      name: plan.name,
      description: plan.description,
      pricePaise: Number(plan.price_paise),
      credits: Number(plan.credits),
      validityDays: Number(plan.validity_days),
      isFeatured: Boolean(plan.is_featured),
    }));

    return NextResponse.json(
      {
        loggedIn: true,
        freeLimit: STUDENT_FREE_LIMIT,
        used,
        remaining: freeRemaining,
        freeRemaining,
        paidRemaining,
        totalRemaining: freeRemaining + paidRemaining,
        plans,
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
