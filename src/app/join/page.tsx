"use client";

import { FormEvent, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Container from "@/components/Container";
import { createClient } from "@/lib/supabase-browser";
import { useLanguage } from "@/hooks/useLanguage";
import { getPoolPlan } from "@/lib/plans";

const copy = {
  en: {
    dashboard: "Dashboard",
    backToDashboard: "← Back to dashboard",
    joinPool: "Join pool",
    title: "Enter your invite code",
    intro:
      "Join a private Poolr group with the code shared by the pool owner. Once the code is verified, you will be added instantly.",
    inviteCode: "Invite code",
    invitePlaceholder: "A1B2C3D4",
    findingPool: "Finding pool...",
    joinButton: "Join pool",
    enterInviteCode: "Enter an invite code.",
    sessionError: "Your session could not be loaded. Please log in again.",
    noPool: "No pool found with this invite code.",
    inactivePool:
      "This pool is not active yet. Ask the pool owner to complete the payment first.",
    poolFull:
      "This pool has reached the maximum number of members for its package.",
    countError: "The member count could not be checked. Please try again.",
    alreadyMemberRedirect: "You are already a member of this pool.",
    howItWorks: "How it works",
    stepOneTitle: "1. Get the code",
    stepOneText: "Ask the pool owner for the private invite code.",
    stepTwoTitle: "2. Join instantly",
    stepTwoText: "Poolr checks the code and adds you as a member.",
    stepThreeTitle: "3. Make predictions",
    stepThreeText: "Submit your predictions before matches lock.",
    createOwnPool: "Create your own pool",
  },
  nl: {
    dashboard: "Dashboard",
    backToDashboard: "← Terug naar dashboard",
    joinPool: "Poule joinen",
    title: "Vul je invite code in",
    intro:
      "Doe mee met een privé Poolr-groep via de code die je van de poulebeheerder hebt gekregen. Zodra de code klopt, word je direct toegevoegd.",
    inviteCode: "Invite code",
    invitePlaceholder: "A1B2C3D4",
    findingPool: "Poule zoeken...",
    joinButton: "Poule joinen",
    enterInviteCode: "Vul een invite code in.",
    sessionError: "Je sessie kon niet worden geladen. Log opnieuw in.",
    noPool: "Geen poule gevonden met deze invite code.",
    inactivePool:
      "Deze poule is nog niet actief. Vraag de poulebeheerder om de betaling eerst af te ronden.",
    poolFull:
      "Deze poule heeft het maximale aantal leden voor dit pakket bereikt.",
    countError: "Het aantal leden kon niet worden gecontroleerd. Probeer opnieuw.",
    alreadyMemberRedirect: "Je bent al lid van deze poule.",
    howItWorks: "Hoe het werkt",
    stepOneTitle: "1. Krijg de code",
    stepOneText: "Vraag de poulebeheerder om de privé invite code.",
    stepTwoTitle: "2. Join direct",
    stepTwoText: "Poolr controleert de code en voegt je toe als lid.",
    stepThreeTitle: "3. Voorspel mee",
    stepThreeText: "Vul je voorspellingen in voordat wedstrijden sluiten.",
    createOwnPool: "Maak je eigen poule",
  },
};

function isPoolUsable(input: {
  status: string | null;
  payment_status: string | null;
}) {
  return (
    input.status === "active" &&
    (input.payment_status === "paid" || input.payment_status === "waived")
  );
}

export default function JoinPoolPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const { language, setLanguage } = useLanguage();

  const t = copy[language];

  const [inviteCode, setInviteCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const cleanedCode = inviteCode.trim().toUpperCase();

    if (!cleanedCode) {
      setError(t.enterInviteCode);
      return;
    }

    setLoading(true);
    setError(null);

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setError(t.sessionError);
      setLoading(false);
      router.push("/auth");
      return;
    }

    const { data: pool, error: poolError } = await supabase
      .from("pools")
      .select(
        "id, name, invite_code, plan_code, status, payment_status"
      )
      .eq("invite_code", cleanedCode)
      .maybeSingle();

    if (poolError) {
      setError(poolError.message);
      setLoading(false);
      return;
    }

    if (!pool) {
      setError(t.noPool);
      setLoading(false);
      return;
    }

    if (
      !isPoolUsable({
        status: pool.status,
        payment_status: pool.payment_status,
      })
    ) {
      setError(t.inactivePool);
      setLoading(false);
      return;
    }

    const { data: existingMembership, error: membershipCheckError } =
      await supabase
        .from("pool_members")
        .select("pool_id")
        .eq("pool_id", pool.id)
        .eq("user_id", user.id)
        .maybeSingle();

    if (membershipCheckError) {
      setError(membershipCheckError.message);
      setLoading(false);
      return;
    }

    if (existingMembership) {
      router.push(`/pools/${pool.id}`);
      router.refresh();
      return;
    }

    const plan = getPoolPlan(pool.plan_code) ?? getPoolPlan("starter");

    if (!plan) {
      setError(t.poolFull);
      setLoading(false);
      return;
    }

    const { count: memberCount, error: countError } = await supabase
      .from("pool_members")
      .select("pool_id", { count: "exact", head: true })
      .eq("pool_id", pool.id);

    if (countError || memberCount === null) {
      setError(countError?.message ?? t.countError);
      setLoading(false);
      return;
    }

    if (memberCount >= plan.maxMembers) {
      setError(t.poolFull);
      setLoading(false);
      return;
    }

    const { error: insertError } = await supabase.from("pool_members").insert({
      pool_id: pool.id,
      user_id: user.id,
      role: "member",
    });

    if (insertError) {
      setError(insertError.message);
      setLoading(false);
      return;
    }

    router.push(`/pools/${pool.id}`);
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

              <div className="flex items-center gap-2">
                <div className="flex rounded-full border border-white/15 bg-white/5 p-1 backdrop-blur">
                  <button
                    type="button"
                    onClick={() => setLanguage("en")}
                    className={`rounded-full px-3 py-1.5 text-xs font-black transition ${
                      language === "en"
                        ? "bg-emerald-300 text-zinc-950"
                        : "text-white/70 hover:text-white"
                    }`}
                  >
                    EN
                  </button>

                  <button
                    type="button"
                    onClick={() => setLanguage("nl")}
                    className={`rounded-full px-3 py-1.5 text-xs font-black transition ${
                      language === "nl"
                        ? "bg-emerald-300 text-zinc-950"
                        : "text-white/70 hover:text-white"
                    }`}
                  >
                    NL
                  </button>
                </div>

                <Link
                  href="/dashboard"
                  className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white/90 backdrop-blur transition hover:bg-white/10"
                >
                  {t.dashboard}
                </Link>
              </div>
            </header>

            <div className="mx-auto mt-8 grid max-w-5xl gap-5 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
              <section className="rounded-[2rem] border border-white/10 bg-white/[0.05] p-5 shadow-2xl backdrop-blur-xl sm:p-7">
                <Link
                  href="/dashboard"
                  className="inline-flex text-sm font-semibold text-zinc-400 transition hover:text-white"
                >
                  {t.backToDashboard}
                </Link>

                <p className="mt-8 text-xs font-bold uppercase tracking-[0.22em] text-emerald-300">
                  {t.joinPool}
                </p>

                <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">
                  {t.title}
                </h1>

                <p className="mt-4 max-w-2xl text-sm leading-6 text-zinc-400 sm:text-base">
                  {t.intro}
                </p>

                <form onSubmit={handleSubmit} className="mt-8 space-y-5">
                  <div>
                    <label
                      htmlFor="inviteCode"
                      className="mb-2 block text-sm font-black text-white"
                    >
                      {t.inviteCode}
                    </label>

                    <input
                      id="inviteCode"
                      name="inviteCode"
                      type="text"
                      required
                      value={inviteCode}
                      onChange={(event) => setInviteCode(event.target.value)}
                      placeholder={t.invitePlaceholder}
                      className="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-4 text-center text-lg font-black uppercase tracking-[0.26em] text-white outline-none transition placeholder:text-zinc-600 focus:border-emerald-300/70"
                    />
                  </div>

                  {error ? (
                    <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                      {error}
                    </div>
                  ) : null}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-2xl bg-emerald-300 px-5 py-4 text-sm font-black text-zinc-950 transition hover:bg-emerald-200 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loading ? t.findingPool : t.joinButton}
                  </button>
                </form>
              </section>

              <aside className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-5 backdrop-blur sm:p-6">
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-emerald-300">
                  {t.howItWorks}
                </p>

                <div className="mt-5 grid gap-3">
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                    <p className="text-sm font-black text-white">
                      {t.stepOneTitle}
                    </p>
                    <p className="mt-1 text-sm leading-6 text-zinc-400">
                      {t.stepOneText}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                    <p className="text-sm font-black text-white">
                      {t.stepTwoTitle}
                    </p>
                    <p className="mt-1 text-sm leading-6 text-zinc-400">
                      {t.stepTwoText}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                    <p className="text-sm font-black text-white">
                      {t.stepThreeTitle}
                    </p>
                    <p className="mt-1 text-sm leading-6 text-zinc-400">
                      {t.stepThreeText}
                    </p>
                  </div>
                </div>

                <Link
                  href="/pools/new"
                  className="mt-5 inline-flex w-full justify-center rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-black text-white transition hover:bg-white/[0.08]"
                >
                  {t.createOwnPool}
                </Link>
              </aside>
            </div>
          </div>
        </Container>
      </section>
    </main>
  );
}