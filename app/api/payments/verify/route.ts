
import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import { createHmac, timingSafeEqual } from "crypto";
import { supabaseAdmin } from "@/app/lib/supabaseAdmin";
import { createSupabaseServerClient } from "@/app/lib/supabaseServer";

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Please login to verify payment." },
        { status: 401 }
      );
    }

    let body: {
      razorpay_order_id?: string;
      razorpay_payment_id?: string;
      razorpay_signature?: string;
    };

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid request data." },
        { status: 400 }
      );
    }

    const orderId = body.razorpay_order_id?.trim();
    const paymentId = body.razorpay_payment_id?.trim();
    const signature = body.razorpay_signature?.trim();

    if (
      !orderId ||
      !paymentId ||
      !signature ||
      !/^[a-f0-9]{64}$/i.test(signature)
    ) {
      return NextResponse.json(
        { error: "Payment verification details are incomplete." },
        { status: 400 }
      );
    }

    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      console.error("Razorpay environment variables are missing.");

      return NextResponse.json(
        { error: "Payment verification is not configured." },
        { status: 500 }
      );
    }

    const { data: order, error: orderError } = await supabaseAdmin
      .from("ai_credit_orders")
      .select(
        "id, student_id, plan_name, credits, amount_paise, razorpay_order_id, razorpay_payment_id, status"
      )
      .eq("razorpay_order_id", orderId)
      .eq("student_id", user.id)
      .maybeSingle();

    if (orderError) {
      console.error("Order lookup failed:", orderError.message);

      return NextResponse.json(
        { error: "Unable to verify this order." },
        { status: 500 }
      );
    }

    if (!order) {
      return NextResponse.json(
        { error: "Payment order not found." },
        { status: 404 }
      );
    }

    if (order.status === "failed") {
      return NextResponse.json(
        { error: "This payment order has been marked as failed." },
        { status: 400 }
      );
    }

    const expectedSignature = createHmac("sha256", keySecret)
      .update(`${orderId}|${paymentId}`)
      .digest("hex");

    const expectedBuffer = Buffer.from(expectedSignature, "hex");
    const receivedBuffer = Buffer.from(signature, "hex");

    if (
      expectedBuffer.length !== receivedBuffer.length ||
      !timingSafeEqual(expectedBuffer, receivedBuffer)
    ) {
      return NextResponse.json(
        { error: "Invalid payment signature." },
        { status: 400 }
      );
    }

    const razorpay = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });

    const payment = await razorpay.payments.fetch(paymentId);

    if (
      payment.order_id !== orderId ||
      Number(payment.amount) !== Number(order.amount_paise) ||
      payment.currency !== "INR" ||
      payment.status !== "captured"
    ) {
      return NextResponse.json(
        {
          error:
            "Payment is not captured or payment details do not match this order.",
        },
        { status: 400 }
      );
    }

    if (
      order.status === "paid" &&
      order.razorpay_payment_id !== paymentId
    ) {
      return NextResponse.json(
        { error: "This order has already been paid using another payment." },
        { status: 409 }
      );
    }

    const { data: granted, error: grantError } = await supabaseAdmin.rpc(
      "grant_paid_ai_credits",
      {
        p_order_id: order.id,
        p_payment_id: paymentId,
      }
    );

    if (grantError) {
      console.error("Credit grant failed:", grantError.message);

      return NextResponse.json(
        {
          error:
            "Payment was received, but credits could not be activated yet. Please contact support.",
          paymentReceived: true,
        },
        { status: 500 }
      );
    }

    if (granted !== true) {
      return NextResponse.json(
        {
          error:
            "Payment was received, but credit activation needs verification.",
          paymentReceived: true,
        },
        { status: 409 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Payment verified and credits added successfully.",
      planName: order.plan_name,
      creditsAdded: order.credits,
    });
  } catch (error) {
    console.error("Payment verification error:", error);

    return NextResponse.json(
      { error: "Unable to verify payment. Please try again." },
      { status: 500 }
    );
  }
}
