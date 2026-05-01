import Image from "next/image";
import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";
import { notFound, redirect } from "next/navigation";
import Container from "@/components/Container";
import { createClient } from "@/lib/supabase";
import { createAdminClient } from "@/lib/supabase-admin";
import { stripe } from "@/lib/stripe";

type PaymentSuccessPageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    session_id?: string;
  }>;
};

type PoolRow = {
  id: string;
  name: string;
  owner_id: string;
  payment_status: string | null;
  status: string | null;
};

type MembershipRow = {
  role: string;
};

async function finalizePaidCheckoutSession(input: {
  poolId: string;
  userId: string;
  sessionId: string;
}) {
  const session = await stripe.checkout.sessions.retrieve(input.sessionId);

  if (session.metadata?.pool_id !== input.poolId) {
    throw new Error("Stripe session hoort niet bij deze pool.");
  }

  if (session.metadata?.user_id !== input.userId) {
    throw new Error("Stripe session hoort niet bij deze gebruiker.");
  }

  if (session.payment_status !== "paid") {
    return {
      activated: false,
      paymentStatus: session.payment_status,
    };
  }

  const supabaseAdmin = createAdminClient();

  const paidAt = new Date().toISOString();

  const paymentIntentId =
    typeof session.payment_intent === "string" ? session.payment_intent : null;

  const customerId =
    typeof session.customer === "string" ? session.customer : null;

  const amountTotal = session.amount_total ?? 0;
  const currency = session.currency ?? "eur";
  const paymentType = session.metadata?.payment_type ?? "initial_purchase";
  const toPlanCode = session.metadata?.to_plan_code ?? null;

  const { error: poolUpdateError } = await supabaseAdmin
    .from("pools")
    .update({
      payment_status: "paid",
      status: "active",
      paid_at: paidAt,
      stripe_checkout_session_id: session.id,
      stripe_payment_intent_id: paymentIntentId,
      stripe_customer_id: customerId,
    })
    .eq("id", input.poolId);

  if (poolUpdateError) {
    throw new Error(poolUpdateError.message);
  }

  const { data: existingPayment, error: existingPaymentError } =
    await supabaseAdmin
      .from("pool_payments")
      .select("id")
      .eq("stripe_checkout_session_id", session.id)
      .maybeSingle();

  if (existingPaymentError) {
    throw new Error(existingPaymentError.message);
  }

  if (existingPayment?.id) {
    const { error: paymentUpdateError } = await supabaseAdmin
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
      throw new Error(paymentUpdateError.message);
    }
  } else {
    const { error: paymentInsertError } = await supabaseAdmin
      .from("pool_payments")
      .insert({
        pool_id: input.poolId,
        user_id: input.userId,
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
      throw new Error(paymentInsertError.message);
    }
  }

  return {
    activated: true,
    paymentStatus: session.payment_status,
  };
}

export default async function PaymentSuccessPage({
  params,
  searchParams,
}: PaymentSuccessPageProps) {
  noStore();

  const { id } = await params;
  const { session_id: sessionId } = await searchParams;

  if (!sessionId) {
    redirect(`/pools/${id}/payment`);
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth");
  }

  const { data: pool } = await supabase
    .from("pools")
    .select("id, name, owner_id, payment_status, status")
    .eq("id", id)
    .maybeSingle();

  if (!pool) {
    notFound();
  }

  const typedPool = pool as PoolRow;

  const { data: membership } = await supabase
    .from("pool_members")
    .select("role")
    .eq("pool_id", typedPool.id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!membership) {
    notFound();
  }

  const typedMembership = membership as MembershipRow;

  const canManagePayment =
    typedPool.owner_id === user.id ||
    typedMembership.role === "owner" ||
    typedMembership.role === "admin";

  if (!canManagePayment) {
    notFound();
  }

  let activationError: string | null = null;
  let activated = false;

  try {
    const result = await finalizePaidCheckoutSession({
      poolId: typedPool.id,
      userId: user.id,
      sessionId,
    });

    activated = result.activated;
  } catch (error) {
    activationError =
      error instanceof Error
        ? error.message
        : "Betaling kon niet worden verwerkt.";
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#030706] text-white">
      <section className="relative min-h-screen">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_10%,rgba(34,255,160,0.13),transparent_32%),radial-gradient(circle_at_85%_45%,rgba(20,184,166,0.08),transparent_30%),linear-gradient(180deg,#04100c_0%,#030706_54%,#020403_100%)]" />
        <div className="absolute inset-0 opacity-[0.11] [background-image:linear-gradient(rgba(255,255,255,0.16)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.16)_1px,transparent_1px)] [background-size:64px_64px]" />

        <Container>
          <div className="relative z-10 py-5 sm:py-6">
            <header className="flex items-center justify-between gap-4">
              <Link href="/" className="flex items-center">
                <Image
                  src="/brand/poolr-logo-dark.png"
                  alt="Poolr"
                  width={340}
                  height={100}
                  priority
                  className="h-[72px] w-auto sm:h-[88px] lg:h-24"
                />
              </Link>

              <Link
                href="/dashboard"
                className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white/90 backdrop-blur transition hover:bg-white/10"
              >
                Dashboard
              </Link>
            </header>

            <div className="mx-auto mt-10 max-w-2xl rounded-[2rem] border border-white/10 bg-white/[0.05] p-5 text-center shadow-2xl backdrop-blur-xl sm:p-8">
              {activated ? (
                <>
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-emerald-300/30 bg-emerald-300/10 text-3xl">
                    ✓
                  </div>

                  <p className="mt-6 text-xs font-bold uppercase tracking-[0.22em] text-emerald-300">
                    Payment successful
                  </p>

                  <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">
                    Pool activated
                  </h1>

                  <p className="mt-4 text-sm leading-6 text-zinc-400 sm:text-base">
                    De betaling is gelukt. Je pool{" "}
                    <span className="font-bold text-white">
                      {typedPool.name}
                    </span>{" "}
                    is nu actief.
                  </p>

                  <Link
                    href={`/pools/${typedPool.id}`}
                    className="mt-8 inline-flex w-full justify-center rounded-2xl bg-emerald-300 px-5 py-4 text-sm font-black text-zinc-950 transition hover:bg-emerald-200 sm:w-auto"
                  >
                    Go to pool
                  </Link>
                </>
              ) : (
                <>
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-amber-300/30 bg-amber-300/10 text-3xl">
                    !
                  </div>

                  <p className="mt-6 text-xs font-bold uppercase tracking-[0.22em] text-amber-300">
                    Payment not completed
                  </p>

                  <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">
                    Pool not activated yet
                  </h1>

                  <p className="mt-4 text-sm leading-6 text-zinc-400 sm:text-base">
                    De betaling is nog niet als betaald bevestigd. Probeer de
                    betaling opnieuw.
                  </p>

                  {activationError ? (
                    <div className="mt-5 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-left text-sm text-red-200">
                      {activationError}
                    </div>
                  ) : null}

                  <Link
                    href={`/pools/${typedPool.id}/payment`}
                    className="mt-8 inline-flex w-full justify-center rounded-2xl bg-emerald-300 px-5 py-4 text-sm font-black text-zinc-950 transition hover:bg-emerald-200 sm:w-auto"
                  >
                    Try payment again
                  </Link>
                </>
              )}
            </div>
          </div>
        </Container>
      </section>
    </main>
  );
}