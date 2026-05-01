import Image from "next/image";
import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";
import { notFound, redirect } from "next/navigation";
import Container from "@/components/Container";
import { createClient } from "@/lib/supabase";
import {
  formatPlanPrice,
  getPlanMemberLabel,
  getPoolPlan,
  isPaidPoolStatus,
} from "@/lib/plans";
import { getPoolTypeMeta } from "@/lib/pool-types";

type PaymentPageProps = {
  params: Promise<{
    id: string;
  }>;
};

type PoolRow = {
  id: string;
  name: string;
  game_type: string;
  owner_id: string;
  plan_code: string | null;
  payment_status: string | null;
  status: string | null;
  max_members: number | null;
};

type MembershipRow = {
  role: string;
};

export default async function PoolPaymentPage({ params }: PaymentPageProps) {
  noStore();

  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth");
  }

  const { data: pool } = await supabase
    .from("pools")
    .select(
      "id, name, game_type, owner_id, plan_code, payment_status, status, max_members"
    )
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

  if (
    typedPool.status === "active" &&
    isPaidPoolStatus(typedPool.payment_status)
  ) {
    redirect(`/pools/${typedPool.id}`);
  }

  const selectedPlan = getPoolPlan(typedPool.plan_code);
  const poolType = getPoolTypeMeta(typedPool.game_type);

  if (!selectedPlan) {
    notFound();
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

            <div className="mx-auto mt-8 grid max-w-5xl gap-5 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
              <section className="rounded-[2rem] border border-white/10 bg-white/[0.05] p-5 shadow-2xl backdrop-blur-xl sm:p-7">
                <Link
                  href="/dashboard"
                  className="inline-flex text-sm font-semibold text-zinc-400 transition hover:text-white"
                >
                  ← Back to dashboard
                </Link>

                <p className="mt-8 text-xs font-bold uppercase tracking-[0.22em] text-emerald-300">
                  Activate pool
                </p>

                <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">
                  Complete payment
                </h1>

                <p className="mt-4 max-w-2xl text-sm leading-6 text-zinc-400 sm:text-base">
                  Your pool has been created, but it is not active yet. Complete
                  the one-time payment to invite members and start playing.
                </p>

                <div className="mt-8 rounded-[1.5rem] border border-emerald-300/20 bg-emerald-300/10 p-5">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-200">
                        Selected package
                      </p>

                      <h2 className="mt-2 text-2xl font-black text-white">
                        {selectedPlan.name}
                      </h2>

                      <p className="mt-1 text-sm font-bold text-emerald-100">
                        {getPlanMemberLabel(selectedPlan)}
                      </p>
                    </div>

                    <div className="text-left sm:text-right">
                      <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-200">
                        One-time price
                      </p>

                      <p className="mt-2 text-4xl font-black text-white">
                        {formatPlanPrice(selectedPlan.priceCents)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-2 text-sm leading-6 text-emerald-50/80">
                    <p>• Pool admin pays once per pool</p>
                    <p>• Members do not pay</p>
                    <p>• You can upgrade later and only pay the difference</p>
                  </div>
                </div>

                <div className="mt-5 rounded-[1.5rem] border border-white/10 bg-black/20 p-5">
                  <p className="text-sm font-black text-white">Pool summary</p>

                  <div className="mt-4 grid gap-3 text-sm">
                    <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-3">
                      <span className="text-zinc-500">Pool</span>
                      <span className="text-right font-bold text-white">
                        {typedPool.name}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-3">
                      <span className="text-zinc-500">Type</span>
                      <span className="text-right font-bold text-white">
                        {poolType.label}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-3">
                      <span className="text-zinc-500">Status</span>
                      <span className="rounded-full border border-amber-300/25 bg-amber-300/10 px-3 py-1 text-xs font-black uppercase tracking-wide text-amber-100">
                        Payment pending
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-4">
                      <span className="text-zinc-500">Max members</span>
                      <span className="text-right font-bold text-white">
                        {selectedPlan.maxMembers}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-6">
                  <button
                    type="button"
                    disabled
                    className="w-full cursor-not-allowed rounded-2xl bg-emerald-300 px-5 py-4 text-sm font-black text-zinc-950 opacity-60"
                  >
                    Stripe payment coming in next step
                  </button>

                  <p className="mt-3 text-center text-xs leading-5 text-zinc-500">
                    The payment screen is ready. The next step connects this
                    button to Stripe Checkout.
                  </p>
                </div>
              </section>

              <aside className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-5 backdrop-blur sm:p-6">
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-emerald-300">
                  Payment rules
                </p>

                <div className="mt-5 grid gap-3">
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                    <p className="text-sm font-black text-white">
                      No free public pools
                    </p>
                    <p className="mt-1 text-sm leading-6 text-zinc-400">
                      Normal users must activate a pool with a one-time payment
                      before inviting members.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                    <p className="text-sm font-black text-white">
                      Members join free
                    </p>
                    <p className="mt-1 text-sm leading-6 text-zinc-400">
                      Only the organizer pays. Friends, colleagues or players do
                      not need to pay to join.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                    <p className="text-sm font-black text-white">
                      Upgrade later
                    </p>
                    <p className="mt-1 text-sm leading-6 text-zinc-400">
                      If the group grows, the admin can upgrade the pool later
                      and only pay the price difference.
                    </p>
                  </div>
                </div>

                <Link
                  href="/dashboard"
                  className="mt-5 inline-flex w-full justify-center rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-black text-white transition hover:bg-white/[0.08]"
                >
                  Back to dashboard
                </Link>
              </aside>
            </div>
          </div>
        </Container>
      </section>
    </main>
  );
}