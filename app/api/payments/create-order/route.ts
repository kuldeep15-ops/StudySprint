
import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import { randomUUID } from "crypto";
import { supabaseAdmin } from "@/app/lib/supabaseAdmin";
import { createSupabaseServerClient } from "@/app/lib/supabaseServer";

function getRazorpay() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    throw new Error("Razorpay environment variables are missing.");
  }

  return {
    keyId,
    client: new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    }),
  };
}

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Payment karne ke liye login required hai." },
        { status: 401 }
      );
    }

    let body: { planId?: string };

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid request data." },
        { status: 400 }
      );
    }

    const planId = body.planId?.trim();

    if (
      !planId ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        planId
      )
    ) {
      return NextResponse.json(
        { error: "Invalid credit plan." },
        { status: 400 }
      );
    }

    const { data: plan, error: planError } = await supabaseAdmin
      .from("ai_credit_plans")
      .select("id, name, price_paise, credits, validity_days, is_active")
      .eq("id", planId)
      .eq("is_active", true)
      .maybeSingle();

    if (planError) {
      console.error("Credit plan lookup failed:", planError.message);
      return NextResponse.json(
        { error: "Unable to load this plan. Please try again." },
        { status: 500 }
      );
    }

    if (!plan) {
      return NextResponse.json(
        { error: "This credit plan is no longer available." },
        { status: 404 }
      );
    }

    const amount = Number(plan.price_paise);
    const credits = Number(plan.credits);
    const validityDays = Number(plan.validity_days);

    if (
      !Number.isSafeInteger(amount) ||
      amount < 100 ||
      !Number.isInteger(credits) ||
      credits < 1 ||
      !Number.isInteger(validityDays) ||
      validityDays < 1
    ) {
      return NextResponse.json(
        { error: "This credit plan has invalid settings." },
        { status: 400 }
      );
    }

    const { keyId, client } = getRazorpay();
    const localOrderId = randomUUID();

    const razorpayOrder = await client.orders.create({
      amount,
      currency: "INR",
      receipt: localOrderId.replace(/-/g, "").slice(0, 40),
      notes: {
        local_order_id: localOrderId,
        student_id: user.id,
        plan_id: plan.id,
      },
    });

    const { error: insertError } = await supabaseAdmin
      .from("ai_credit_orders")
      .insert({
        id: localOrderId,
        student_id: user.id,
        plan_id: plan.id,
        plan_name: plan.name,
        credits,
        validity_days: validityDays,
        amount_paise: amount,
        razorpay_order_id: razorpayOrder.id,
        status: "pending",
      });

    if (insertError) {
      console.error(
        "Payment order database insert failed:",
        insertError.message
      );

      return NextResponse.json(
        { error: "Unable to create your payment order. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      keyId,
      orderId: razorpayOrder.id,
      localOrderId,
      amount,
      currency: "INR",
      planName: plan.name,
      credits,
      validityDays,
    });
  } catch (error) {
    console.error("Create payment order error:", error);

    return NextResponse.json(
      { error: "Unable to start payment. Please try again later." },
      { status: 500 }
    );
  }
}
