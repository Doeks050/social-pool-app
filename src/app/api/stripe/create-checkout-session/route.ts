import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase";
import { getPoolPlan, isPaidPoolStatus } from "@/lib/plans";
import { stripe } from "@/lib/stripe";

type PoolRow = {
    id: string;
    name: string;
    owner_id: string;
    plan_code: string | null;
    payment_status: string | null;
    status: string | null;
};

type MembershipRow = {
    role: string;
};

function getSiteUrl() {
    const siteUrl =
        process.env.NEXT_PUBLIC_SITE_URL ||
        process.env.VERCEL_URL ||
        "http://localhost:3000";

    if (siteUrl.startsWith("http://") || siteUrl.startsWith("https://")) {
        return siteUrl.replace(/\/$/, "");
    }

    return `https://${siteUrl}`.replace(/\/$/, "");
}

async function getPoolIdFromRequest(request: Request) {
    const contentType = request.headers.get("content-type") ?? "";

    if (contentType.includes("application/json")) {
        const body = (await request.json()) as { poolId?: unknown };
        return typeof body.poolId === "string" ? body.poolId : "";
    }

    const formData = await request.formData();
    const poolId = formData.get("poolId");

    return typeof poolId === "string" ? poolId : "";
}

export async function POST(request: Request) {
    const supabase = await createClient();

    const {
        data: { user },
        error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
        return NextResponse.json(
            { error: `Auth error: ${userError.message}` },
            { status: 500 }
        );
    }

    if (!user) {
        return NextResponse.json({ error: "Niet ingelogd." }, { status: 401 });
    }

    let poolId = "";

    try {
        poolId = (await getPoolIdFromRequest(request)).trim();
    } catch {
        return NextResponse.json(
            { error: "Ongeldige request body." },
            { status: 400 }
        );
    }

    if (!poolId) {
        return NextResponse.json(
            { error: "Geen pool id ontvangen." },
            { status: 400 }
        );
    }

    const { data: pool, error: poolError } = await supabase
        .from("pools")
        .select("id, name, owner_id, plan_code, payment_status, status")
        .eq("id", poolId)
        .maybeSingle();

    if (poolError) {
        return NextResponse.json({ error: poolError.message }, { status: 500 });
    }

    if (!pool) {
        return NextResponse.json(
            { error: "Pool niet gevonden." },
            { status: 404 }
        );
    }

    const typedPool = pool as PoolRow;

    const { data: membership, error: membershipError } = await supabase
        .from("pool_members")
        .select("role")
        .eq("pool_id", typedPool.id)
        .eq("user_id", user.id)
        .maybeSingle();

    if (membershipError) {
        return NextResponse.json(
            { error: membershipError.message },
            { status: 500 }
        );
    }

    if (!membership) {
        return NextResponse.json(
            { error: "Je bent geen lid van deze pool." },
            { status: 403 }
        );
    }

    const typedMembership = membership as MembershipRow;

    const canManagePayment =
        typedPool.owner_id === user.id ||
        typedMembership.role === "owner" ||
        typedMembership.role === "admin";

    if (!canManagePayment) {
        return NextResponse.json(
            { error: "Alleen de pool admin kan betalen." },
            { status: 403 }
        );
    }

    if (
        typedPool.status === "active" &&
        isPaidPoolStatus(typedPool.payment_status)
    ) {
        return NextResponse.redirect(
            `${getSiteUrl()}/pools/${typedPool.id}`,
            303
        );
    }

    const plan = getPoolPlan(typedPool.plan_code);

    if (!plan) {
        return NextResponse.json(
            { error: "Deze pool heeft geen geldig pakket." },
            { status: 400 }
        );
    }

    const siteUrl = getSiteUrl();

    const checkoutSession = await stripe.checkout.sessions.create({
        mode: "payment",
        payment_method_types: ["card", "ideal"],
        customer_email: user.email ?? undefined,
        success_url: `${siteUrl}/pools/${typedPool.id}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${siteUrl}/pools/${typedPool.id}/payment`,
        line_items: [
            {
                quantity: 1,
                price_data: {
                    currency: plan.currency,
                    unit_amount: plan.priceCents,
                    product_data: {
                        name: `Poolr ${plan.name} Pool`,
                        description: `${typedPool.name} — tot ${plan.maxMembers} deelnemers`,
                    },
                },
            },
        ],
        metadata: {
            pool_id: typedPool.id,
            user_id: user.id,
            payment_type: "initial_purchase",
            to_plan_code: plan.code,
        },
    });

    const { error: paymentInsertError } = await supabase
        .from("pool_payments")
        .insert({
            pool_id: typedPool.id,
            user_id: user.id,
            payment_type: "initial_purchase",
            from_plan_code: null,
            to_plan_code: plan.code,
            amount_cents: plan.priceCents,
            currency: plan.currency,
            status: "pending",
            stripe_checkout_session_id: checkoutSession.id,
            stripe_payment_intent_id:
                typeof checkoutSession.payment_intent === "string"
                    ? checkoutSession.payment_intent
                    : null,
            stripe_customer_id:
                typeof checkoutSession.customer === "string"
                    ? checkoutSession.customer
                    : null,
        });

    if (paymentInsertError) {
        return NextResponse.json(
            { error: paymentInsertError.message },
            { status: 500 }
        );
    }

    const { error: poolUpdateError } = await supabase
        .from("pools")
        .update({
            stripe_checkout_session_id: checkoutSession.id,
            stripe_customer_id:
                typeof checkoutSession.customer === "string"
                    ? checkoutSession.customer
                    : null,
        })
        .eq("id", typedPool.id);

    if (poolUpdateError) {
        return NextResponse.json(
            { error: poolUpdateError.message },
            { status: 500 }
        );
    }

    if (!checkoutSession.url) {
        return NextResponse.json(
            { error: "Stripe checkout URL kon niet worden gemaakt." },
            { status: 500 }
        );
    }

    return NextResponse.redirect(checkoutSession.url, 303);
}