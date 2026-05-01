"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Container from "@/components/Container";
import { createClient } from "@/lib/supabase-browser";
import {
  POOL_TYPE_OPTIONS,
  PoolType,
  getPoolTypeMeta,
} from "@/lib/pool-types";
import {
  PoolPlanCode,
  formatPlanPrice,
  getPlanMemberLabel,
  getPoolPlan,
  getPoolPlans,
} from "@/lib/plans";

export default function NewPoolPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [name, setName] = useState("");
  const [gameType, setGameType] = useState<PoolType>("world_cup");
  const [planCode, setPlanCode] = useState<PoolPlanCode>("starter");
  const [activateFreeAsAdmin, setActivateFreeAsAdmin] = useState(false);

  const [isAppAdmin, setIsAppAdmin] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(true);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedType = getPoolTypeMeta(gameType);
  const selectedPlan = getPoolPlan(planCode);
  const plans = getPoolPlans();

  useEffect(() => {
    let isMounted = true;

    async function checkAppAdmin() {
      setCheckingAdmin(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        if (isMounted) {
          setIsAppAdmin(false);
          setActivateFreeAsAdmin(false);
          setCheckingAdmin(false);
        }

        return;
      }

      const { data } = await supabase
        .from("app_admins")
        .select("user_id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (isMounted) {
        const admin = Boolean(data);
        setIsAppAdmin(admin);
        setActivateFreeAsAdmin(admin);
        setCheckingAdmin(false);
      }
    }

    checkAppAdmin();

    return () => {
      isMounted = false;
    };
  }, [supabase]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedName = name.trim();
    const plan = getPoolPlan(planCode);

    if (!trimmedName) {
      setError("Enter a pool name.");
      return;
    }

    if (!plan) {
      setError("Choose a valid package.");
      return;
    }

    setLoading(true);
    setError(null);

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setError("Your session could not be loaded. Please log in again.");
      setLoading(false);
      router.push("/auth");
      return;
    }

    let allowAdminWaiver = false;

    if (activateFreeAsAdmin) {
      const { data: appAdmin, error: adminError } = await supabase
        .from("app_admins")
        .select("user_id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (adminError) {
        setError(`Admin check failed: ${adminError.message}`);
        setLoading(false);
        return;
      }

      allowAdminWaiver = Boolean(appAdmin);

      if (!allowAdminWaiver) {
        setError("Only app admins can activate a pool for free.");
        setLoading(false);
        return;
      }
    }

    const paymentStatus = allowAdminWaiver ? "waived" : "pending";
    const poolStatus = allowAdminWaiver ? "active" : "pending_payment";

    const { data, error } = await supabase
      .from("pools")
      .insert({
        name: trimmedName,
        game_type: gameType,
        owner_id: user.id,
        plan_code: plan.code,
        payment_status: paymentStatus,
        status: poolStatus,
        max_members: plan.maxMembers,
        paid_at: allowAdminWaiver ? new Date().toISOString() : null,
      })
      .select("id")
      .single();

    if (error || !data) {
      setError(error?.message ?? "Creating pool failed.");
      setLoading(false);
      return;
    }

    if (allowAdminWaiver) {
      router.push(`/pools/${data.id}`);
    } else {
      router.push(`/pools/${data.id}/payment`);
    }

    router.refresh();
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

            <div className="mx-auto mt-8 grid max-w-5xl gap-5 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
              <section className="rounded-[2rem] border border-white/10 bg-white/[0.05] p-5 shadow-2xl backdrop-blur-xl sm:p-7">
                <Link
                  href="/dashboard"
                  className="inline-flex text-sm font-semibold text-zinc-400 transition hover:text-white"
                >
                  ← Back to dashboard
                </Link>

                <p className="mt-8 text-xs font-bold uppercase tracking-[0.22em] text-emerald-300">
                  Create pool
                </p>

                <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">
                  Start your own Poolr group
                </h1>

                <p className="mt-4 max-w-2xl text-sm leading-6 text-zinc-400 sm:text-base">
                  Choose a pool type and package. The pool admin pays once per
                  pool. Members can join without paying.
                </p>

                <form onSubmit={handleSubmit} className="mt-8 space-y-6">
                  <div>
                    <label
                      htmlFor="name"
                      className="mb-2 block text-sm font-black text-white"
                    >
                      Pool name
                    </label>

                    <input
                      id="name"
                      name="name"
                      type="text"
                      required
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      placeholder="Office World Cup Pool"
                      className="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-4 text-sm font-semibold text-white outline-none transition placeholder:text-zinc-600 focus:border-emerald-300/70"
                    />
                  </div>

                  <div>
                    <p className="mb-3 block text-sm font-black text-white">
                      Pool type
                    </p>

                    <div className="grid gap-3">
                      {POOL_TYPE_OPTIONS.map((option) => {
                        const isSelected = gameType === option.value;

                        return (
                          <label
                            key={option.value}
                            className={`cursor-pointer rounded-[1.5rem] border p-4 transition ${
                              isSelected
                                ? "border-emerald-300/60 bg-emerald-300/10"
                                : "border-white/10 bg-black/20 hover:border-emerald-300/25 hover:bg-white/[0.04]"
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <input
                                type="radio"
                                name="gameType"
                                value={option.value}
                                checked={isSelected}
                                onChange={() => setGameType(option.value)}
                                className="mt-1 accent-emerald-300"
                              />

                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <h2 className="text-base font-black text-white sm:text-lg">
                                    {option.label}
                                  </h2>

                                  <span
                                    className={`rounded-full border px-2.5 py-1 text-xs font-black uppercase tracking-wide ${
                                      isSelected
                                        ? "border-emerald-300/30 bg-emerald-300/10 text-emerald-200"
                                        : "border-white/10 bg-white/[0.04] text-zinc-300"
                                    }`}
                                  >
                                    {option.shortLabel}
                                  </span>
                                </div>

                                <p className="mt-2 text-sm leading-6 text-zinc-400">
                                  {option.description}
                                </p>
                              </div>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <p className="mb-3 block text-sm font-black text-white">
                      Package
                    </p>

                    <div className="grid gap-3 sm:grid-cols-2">
                      {plans.map((plan) => {
                        const isSelected = planCode === plan.code;

                        return (
                          <label
                            key={plan.code}
                            className={`relative cursor-pointer rounded-[1.5rem] border p-4 transition ${
                              isSelected
                                ? "border-emerald-300/60 bg-emerald-300/10"
                                : "border-white/10 bg-black/20 hover:border-emerald-300/25 hover:bg-white/[0.04]"
                            }`}
                          >
                            {plan.highlighted ? (
                              <span className="absolute right-3 top-3 rounded-full border border-emerald-300/30 bg-emerald-300/10 px-2.5 py-1 text-[0.65rem] font-black uppercase tracking-wide text-emerald-200">
                                Meest gekozen
                              </span>
                            ) : null}

                            <div className="flex items-start gap-3">
                              <input
                                type="radio"
                                name="planCode"
                                value={plan.code}
                                checked={isSelected}
                                onChange={() => setPlanCode(plan.code)}
                                className="mt-1 accent-emerald-300"
                              />

                              <div className="min-w-0 pr-8">
                                <h2 className="text-base font-black text-white sm:text-lg">
                                  {plan.name}
                                </h2>

                                <p className="mt-2 text-2xl font-black text-emerald-200">
                                  {formatPlanPrice(plan.priceCents)}
                                </p>

                                <p className="mt-1 text-sm font-bold text-white">
                                  {getPlanMemberLabel(plan)}
                                </p>

                                <p className="mt-2 text-sm leading-6 text-zinc-400">
                                  {plan.description}
                                </p>
                              </div>
                            </div>
                          </label>
                        );
                      })}
                    </div>

                    <p className="mt-3 text-xs leading-5 text-zinc-500">
                      You pay once per pool. Members do not pay. You can upgrade
                      later and only pay the difference.
                    </p>
                  </div>

                  {isAppAdmin ? (
                    <div className="rounded-[1.5rem] border border-amber-300/20 bg-amber-300/10 p-4">
                      <label className="flex cursor-pointer items-start gap-3">
                        <input
                          type="checkbox"
                          checked={activateFreeAsAdmin}
                          onChange={(event) =>
                            setActivateFreeAsAdmin(event.target.checked)
                          }
                          className="mt-1 accent-amber-300"
                        />

                        <span>
                          <span className="block text-sm font-black text-amber-100">
                            App admin: activate this pool for free
                          </span>

                          <span className="mt-1 block text-sm leading-6 text-amber-100/75">
                            Use this for your own pools, colleagues, test groups
                            or demos. Normal users will not see this option.
                          </span>
                        </span>
                      </label>
                    </div>
                  ) : null}

                  <div className="rounded-[1.5rem] border border-white/10 bg-black/20 p-4">
                    <p className="text-sm font-black text-white">
                      What happens next
                    </p>

                    <div className="mt-3 grid gap-2 text-sm leading-6 text-zinc-400">
                      <p>• A new {selectedType.label} pool is created</p>
                      <p>• You become the owner automatically</p>
                      <p>
                        • Package: {selectedPlan?.name ?? "Starter"} —{" "}
                        {selectedPlan
                          ? getPlanMemberLabel(selectedPlan)
                          : "Tot 10 deelnemers"}
                      </p>
                      {activateFreeAsAdmin && isAppAdmin ? (
                        <p>• App admin mode: pool is activated immediately</p>
                      ) : (
                        <p>• After payment, the pool becomes active</p>
                      )}
                    </div>
                  </div>

                  {error ? (
                    <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                      {error}
                    </div>
                  ) : null}

                  <button
                    type="submit"
                    disabled={loading || checkingAdmin}
                    className="w-full rounded-2xl bg-emerald-300 px-5 py-4 text-sm font-black text-zinc-950 transition hover:bg-emerald-200 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loading
                      ? "Creating pool..."
                      : activateFreeAsAdmin && isAppAdmin
                        ? "Create free admin pool"
                        : "Create pool and continue to payment"}
                  </button>
                </form>
              </section>

              <aside className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-5 backdrop-blur sm:p-6">
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-emerald-300">
                  Paid per pool
                </p>

                <div className="mt-5 grid gap-3">
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                    <p className="text-sm font-black text-white">
                      Admin pays once
                    </p>
                    <p className="mt-1 text-sm leading-6 text-zinc-400">
                      The pool owner pays one time for the selected package.
                      Members can join without paying.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                    <p className="text-sm font-black text-white">
                      Upgrade later
                    </p>
                    <p className="mt-1 text-sm leading-6 text-zinc-400">
                      Need more members later? Upgrade the pool and only pay the
                      price difference.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                    <p className="text-sm font-black text-white">
                      App admin exception
                    </p>
                    <p className="mt-1 text-sm leading-6 text-zinc-400">
                      App admins can activate pools for free for internal use,
                      colleagues, demos or testing.
                    </p>
                  </div>
                </div>

                <Link
                  href="/join"
                  className="mt-5 inline-flex w-full justify-center rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-black text-white transition hover:bg-white/[0.08]"
                >
                  Join an existing pool
                </Link>
              </aside>
            </div>
          </div>
        </Container>
      </section>
    </main>
  );
}