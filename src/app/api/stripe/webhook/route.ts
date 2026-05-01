import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase-admin";
import { stripe } from "@/lib/stripe";

async function activatePoolFromCheckoutSession(
  session: Stripe.Checkout.Session
) {
  const poolId = session.metadata?.pool_id;
  const userId = session.metadata?.user_id;
  const paymentType = session.metadata?.payment_type ?? "initial_purchase";
  const toPlanCode = session.metadata?.to_plan_code ?? null;

  if (!poolId) {
    throw new Error("Stripe session is missing metadata.pool_id.");
  }

  const supabase = createAdminClient();

  const paidAt = new Date().toISOString();
  const paymentIntentId =
    typeof session.payment_intent === "string" ? session.payment_intent : null;

  const customerId =
    typeof session.customer === "string" ? session.customer : null;

  const amountTotal = session.amount_total ?? 0;
  const currency = session.currency ?? "eur";

  const { error: poolUpdateError } = await supabase
    .from("pools")
    .update({
      payment_status: "paid",
      status: "active",
      paid_at: paidAt,
      stripe_checkout_session_id: session.id,
      stripe_payment_intent_id: paymentIntentId,
      stripe_customer_id: customerId,
    })
    .eq("id", poolId);

  if (poolUpdateError) {
    throw new Error(`Pool update failed: ${poolUpdateError.message}`);
  }

  const { data: existingPayment, error: existingPaymentError } = await supabase
    .from("pool_payments")
    .select("id")
    .eq("stripe_checkout_session_id", session.id)
    .maybeSingle();

  if (existingPaymentError) {
    throw new Error(
      `Payment lookup failed: ${existingPaymentError.message}`
    );
  }

  if (existingPayment?.id) {
    const { error: paymentUpdateError } = await supabase
      .from("pool_payments")
      .update({
        status: "paid",
        stripe_payment_intent_id: paymentIntentId,
        stripe_customer_id: customerId,
        amount_cents: amountTotal,
        currency,
      })
      .eq("id", existingPayment.id);

    if (paymentUpdateError) {
      throw new Error(
        `Payment update failed: ${paymentUpdateError.message}`
      );
    }

    return;
  }

  const { error: paymentInsertError } = await supabase
    .from("pool_payments")
    .insert({
      pool_id: poolId,
      user_id: userId,
      payment_type: paymentType,
      from_plan_code: null,
      to_plan_code: toPlanCode,
      amount_cents: amountTotal,
      currency,
      status: "paid",
      stripe_checkout_session_id: session.id,
      stripe_payment_intent_id: paymentIntentId,
      stripe_customer_id: customerId,
    });

  if (paymentInsertError) {
    throw new Error(`Payment insert failed: ${paymentInsertError.message}`);
  }
}

async function markCheckoutSessionFailed(
  session: Stripe.Checkout.Session,
  status: "failed" | "cancelled"
) {
  const poolId = session.metadata?.pool_id;

  if (!poolId) return;

  const supabase = createAdminClient();

  await supabase
    .from("pool_payments")
    .update({ status })
    .eq("stripe_checkout_session_id", session.id);

  await supabase
    .from("pools")
    .update({
      payment_status: status,
      status: "pending_payment",
    })
    .eq("id", poolId)
    .neq("payment_status", "paid")
    .neq("payment_status", "waived");
}

export async function POST(request: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    return NextResponse.json(
      { error: "Missing STRIPE_WEBHOOK_SECRET environment variable." },
      { status: 500 }
    );
  }

  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Missing Stripe signature." },
      { status: 400 }
    );
  }

  const rawBody = await request.text();

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      webhookSecret
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Invalid Stripe webhook.";

    return NextResponse.json({ error: message }, { status: 400 });
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;

      if (session.payment_status === "paid") {
        await activatePoolFromCheckoutSession(session);
      }
    }

    if (event.type === "checkout.session.expired") {
      const session = event.data.object as Stripe.Checkout.Session;
      await markCheckoutSessionFailed(session, "cancelled");
    }

    if (event.type === "checkout.session.async_payment_failed") {
      const session = event.data.object as Stripe.Checkout.Session;
      await markCheckoutSessionFailed(session, "failed");
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Webhook handling failed.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}