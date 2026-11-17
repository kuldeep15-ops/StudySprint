
import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { supabaseAdmin } from "@/app/lib/supabaseAdmin";

type RazorpayWebhookPayload = {
  event?: string;
  payload?: {
    payment?: {
      entity?: {
        id?: string;
        order_id?: string;
        amount?: number;
        currency?: string;
        status?: string;
      };
    };
  };
};

export async function POST(request: Request) {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.error("RAZORPAY_WEBHOOK_SECRET is missing.");

      return NextResponse.json(
        { error: "Webhook is not configured." },
        { status: 500 }
      );
    }

    const signature = request.headers.get("x-razorpay-signature");

    if (!signature || !/^[a-f0-9]{64}$/i.test(signature)) {
      return NextResponse.json(
        { error: "Invalid webhook signature." },
        { status: 400 }
      );
    }

    const rawBody = await request.text();

    const expectedSignature = createHmac("sha256", webhookSecret)
      .update(rawBody)
      .digest("hex");

    const expectedBuffer = Buffer.from(expectedSignature, "hex");
    const receivedBuffer = Buffer.from(signature, "hex");

    if (
      expectedBuffer.length !== receivedBuffer.length ||
      !timingSafeEqual(expectedBuffer, receivedBuffer)
    ) {
      return NextResponse.json(
        { error: "Webhook signature verification failed." },
        { status: 400 }
      );
    }

    let payload: RazorpayWebhookPayload;

    try {
      payload = JSON.parse(rawBody);
    } catch {
      return NextResponse.json(
        { error: "Invalid webhook payload." },
        { status: 400 }
      );
    }

    if (payload.event !== "payment.captured") {
      return NextResponse.json({
        received: true,
        ignored: true,
      });
    }

    const payment = payload.payload?.payment?.entity;

    if (
      !payment?.id ||
      !payment.order_id ||
      payment.status !== "captured" ||
      payment.currency !== "INR" ||
      !Number.isSafeInteger(payment.amount)
    ) {
      return NextResponse.json(
        { error: "Incomplete or invalid captured payment." },
        { status: 400 }
      );
    }

    const { data: order, error: orderError } = await supabaseAdmin
      .from("ai_credit_orders")
      .select("id, amount_paise, status, razorpay_payment_id")
      .eq("razorpay_order_id", payment.order_id)
      .maybeSingle();

    if (orderError) {
      console.error("Webhook order lookup failed:", orderError.message);

      return NextResponse.json(
        { error: "Unable to find payment order." },
        { status: 500 }
      );
    }

    if (!order) {
      console.error("Webhook received for unknown order:", payment.order_id);

      return NextResponse.json(
        { error: "Payment order not found." },
        { status: 404 }
      );
    }

    if (Number(order.amount_paise) !== Number(payment.amount)) {
      console.error("Webhook payment amount mismatch:", payment.order_id);

      return NextResponse.json(
        { error: "Payment amount does not match the order." },
        { status: 400 }
      );
    }

    if (
      order.status === "paid" &&
      order.razorpay_payment_id !== payment.id
    ) {
      console.error("Order already paid with another payment:", order.id);

      return NextResponse.json(
        { error: "Order payment conflict." },
        { status: 409 }
      );
    }

    const { data: granted, error: grantError } = await supabaseAdmin.rpc(
      "grant_paid_ai_credits",
      {
        p_order_id: order.id,
        p_payment_id: payment.id,
      }
    );

    if (grantError) {
      console.error("Webhook credit grant failed:", grantError.message);

      return NextResponse.json(
        { error: "Credit activation failed. Razorpay will retry." },
        { status: 500 }
      );
    }

    if (granted !== true) {
      return NextResponse.json(
        { error: "Credit activation was not confirmed." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      received: true,
      success: true,
    });
  } catch (error) {
    console.error("Razorpay webhook error:", error);

    return NextResponse.json(
      { error: "Webhook processing failed." },
      { status: 500 }
    );
  }
}
