import Image from "next/image";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import Container from "@/components/Container";
import SignOutButton from "@/components/SignOutButton";
import { createClient } from "@/lib/supabase";
import { getLanguageFromCookieValue } from "@/lib/i18n";
import { getPoolTypeMeta } from "@/lib/pool-types";

type PoolMembershipRow = {
  role: string;
  joined_at: string;
  pools:
    | {
        id: string;
        name: string;
        game_type: string;
        invite_code: string;
        created_at: string;
        status: string | null;
        payment_status: string | null;
      }
    | {
        id: string;
        name: string;
        game_type: string;
        invite_code: string;
        created_at: string;
        status: string | null;
        payment_status: string | null;
      }[]
    | null;
};

type DashboardPool = {
  id: string;
  name: string;
  gameType: string;
  gameTypeLabel: string;
  gameTypeShortLabel: string;
  inviteCode: string;
  createdAt: string;
  role: string;
  status: string | null;
  paymentStatus: string | null;
  isActive: boolean;
  needsPayment: boolean;
  href: string;
};

const copy = {
  en: {
    playerFallback: "Player",
    dashboard: "Dashboard",
    welcome: "Welcome",
    intro:
      "Manage your pools, join private competitions and keep track of every leaderboard from one place.",
    createPool: "Create pool",
    joinPool: "Join pool",
    activePool: "Active pool",
    activePools: "Active pools",
    worldCupReady: "World Cup pool ready",
    modesInProgress: "Modes in progress",
    adminTools: "Admin tools",
    manageWorldCup: "Manage World Cup content",
    adminIntro:
      "Enter official results and manage bonus questions for all World Cup pools.",
    results: "Results",
    bonusQuestions: "Bonus questions",
    yourPools: "Your pools",
    continuePlaying: "Continue playing",
    memberOfStart: "You are currently a member of",
    pool: "pool",
    pools: "pools",
    joinViaCode: "Join via code",
    newPool: "New pool",
    noPoolsYet: "No pools yet",
    noPoolsIntro:
      "Create your first Poolr competition or join an existing pool with a private invite code.",
    createFirstPool: "Create first pool",
    inviteCode: "Invite code",
    backHome: "← Back to home",
    owner: "Owner",
    admin: "Admin",
    member: "Member",
    worldCupPool: "World Cup pool",
    officeBingo: "Office Bingo",
    f1Pool: "F1 Pool",
    wkShort: "WC",
    paymentRequired: "Payment required",
    paymentRequiredDescription:
      "This pool has been created, but still needs to be paid and activated.",
  },
  nl: {
    playerFallback: "Speler",
    dashboard: "Dashboard",
    welcome: "Welkom",
    intro:
      "Beheer je poules, doe mee aan privécompetities en volg al je ranglijsten vanaf één plek.",
    createPool: "Poule maken",
    joinPool: "Poule joinen",
    activePool: "Actieve poule",
    activePools: "Actieve poules",
    worldCupReady: "WK-poule klaar voor gebruik",
    modesInProgress: "Speltypes in ontwikkeling",
    adminTools: "Admin tools",
    manageWorldCup: "WK-content beheren",
    adminIntro:
      "Vul officiële uitslagen in en beheer bonusvragen voor alle WK-poules.",
    results: "Uitslagen",
    bonusQuestions: "Bonusvragen",
    yourPools: "Jouw poules",
    continuePlaying: "Verder spelen",
    memberOfStart: "Je bent momenteel lid van",
    pool: "poule",
    pools: "poules",
    joinViaCode: "Join via code",
    newPool: "Nieuwe poule",
    noPoolsYet: "Nog geen poules",
    noPoolsIntro:
      "Maak je eerste Poolr-competitie of doe mee met een bestaande poule via een privé invite code.",
    createFirstPool: "Eerste poule maken",
    inviteCode: "Invite code",
    backHome: "← Terug naar home",
    owner: "Eigenaar",
    admin: "Admin",
    member: "Lid",
    worldCupPool: "WK-poule",
    officeBingo: "Office Bingo",
    f1Pool: "F1-poule",
    wkShort: "WK",
    paymentRequired: "Betaling vereist",
    paymentRequiredDescription:
      "Deze poule is aangemaakt, maar nog niet betaald/geactiveerd.",
  },
};

function getPoolCardClasses(gameType: string) {
  if (gameType === "world_cup") {
    return "border-emerald-300/25 bg-emerald-300/[0.06] hover:border-emerald-300/50";
  }

  return "border-white/10 bg-white/[0.04] hover:border-white/20";
}

function getPoolTypeBadgeClasses(gameType: string) {
  if (gameType === "world_cup") {
    return "border-emerald-300/30 bg-emerald-300/10 text-emerald-200";
  }

  return "border-white/10 bg-white/[0.04] text-zinc-300";
}

function getRoleLabel(role: string, language: "en" | "nl") {
  const t = copy[language];

  if (role === "owner") {
    return t.owner;
  }

  if (role === "admin") {
    return t.admin;
  }

  return t.member;
}

function isPaidPoolStatus(paymentStatus: string | null | undefined) {
  return paymentStatus === "paid" || paymentStatus === "waived";
}

function isActivePool(input: {
  status: string | null | undefined;
  paymentStatus: string | null | undefined;
}) {
  return input.status === "active" && isPaidPoolStatus(input.paymentStatus);
}

function canManagePoolPayment(role: string) {
  return role === "owner" || role === "admin";
}

function getPoolTypeLabel(
  gameType: string,
  fallback: string,
  language: "en" | "nl"
) {
  const t = copy[language];

  if (gameType === "world_cup") {
    return t.worldCupPool;
  }

  if (gameType === "office_bingo") {
    return t.officeBingo;
  }

  if (gameType === "f1") {
    return t.f1Pool;
  }

  return fallback;
}

function getPoolTypeShortLabel(
  gameType: string,
  fallback: string,
  language: "en" | "nl"
) {
  const t = copy[language];

  if (gameType === "world_cup") {
    return t.wkShort;
  }

  if (gameType === "office_bingo") {
    return "Bingo";
  }

  if (gameType === "f1") {
    return "F1";
  }

  return fallback;
}

export default async function DashboardPage() {
  const supabase = await createClient();

  const cookieStore = await cookies();
  const language = getLanguageFromCookieValue(
    cookieStore.get("poolr-language")?.value
  );
  const t = copy[language];

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .maybeSingle();

  const { data: appAdmin } = await supabase
    .from("app_admins")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  const { data: memberships } = await supabase
    .from("pool_members")
    .select(
      "role, joined_at, pools(id, name, game_type, invite_code, created_at, status, payment_status)"
    )
    .eq("user_id", user.id)
    .order("joined_at", { ascending: false });

  const displayName =
    profile?.display_name?.trim() || user.email || t.playerFallback;

  const myPools = ((memberships ?? []) as PoolMembershipRow[])
    .map((membership) => {
      const pool = Array.isArray(membership.pools)
        ? membership.pools[0]
        : membership.pools;

      if (!pool) {
        return null;
      }

      const typeMeta = getPoolTypeMeta(pool.game_type);
      const active = isActivePool({
        status: pool.status,
        paymentStatus: pool.payment_status,
      });

      const needsPayment =
        pool.status === "pending_payment" &&
        pool.payment_status === "pending" &&
        canManagePoolPayment(membership.role);

      return {
        id: pool.id,
        name: pool.name,
        gameType: pool.game_type,
        gameTypeLabel: getPoolTypeLabel(pool.game_type, typeMeta.label, language),
        gameTypeShortLabel: getPoolTypeShortLabel(
          pool.game_type,
          typeMeta.shortLabel,
          language
        ),
        inviteCode: pool.invite_code,
        createdAt: pool.created_at,
        role: membership.role,
        status: pool.status,
        paymentStatus: pool.payment_status,
        isActive: active,
        needsPayment,
        href: needsPayment ? `/pools/${pool.id}/payment` : `/pools/${pool.id}`,
      };
    })
    .filter(Boolean) as DashboardPool[];

  const activePools = myPools.filter((pool) => pool.isActive);

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

              <div className="flex items-center gap-3">
                {appAdmin ? (
                  <Link
                    href="/admin"
                    className="hidden rounded-full border border-emerald-300/20 bg-emerald-300/10 px-4 py-2 text-sm font-semibold text-emerald-100 transition hover:bg-emerald-300/15 sm:inline-flex"
                  >
                    Admin
                  </Link>
                ) : null}
                <SignOutButton />
              </div>
            </header>

            <div className="mt-8 grid gap-5">
              <section className="rounded-[2rem] border border-white/10 bg-white/[0.05] p-5 shadow-2xl backdrop-blur-xl sm:p-7">
                <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.22em] text-emerald-300">
                      {t.dashboard}
                    </p>
                    <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">
                      {t.welcome}, {displayName}
                    </h1>
                    <p className="mt-4 max-w-2xl text-sm leading-6 text-zinc-400 sm:text-base">
                      {t.intro}
                    </p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <Link
                      href="/pools/new"
                      className="rounded-2xl bg-emerald-300 px-5 py-3 text-center text-sm font-black text-zinc-950 shadow-[0_18px_60px_rgba(16,185,129,0.22)] transition hover:bg-emerald-200"
                    >
                      {t.createPool}
                    </Link>

                    <Link
                      href="/join"
                      className="rounded-2xl border border-white/15 bg-white/5 px-5 py-3 text-center text-sm font-black text-white transition hover:bg-white/10"
                    >
                      {t.joinPool}
                    </Link>
                  </div>
                </div>

                <div className="mt-7 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                    <p className="text-3xl font-black">{activePools.length}</p>
                    <p className="mt-1 text-sm text-zinc-400">
                      {activePools.length === 1 ? t.activePool : t.activePools}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-emerald-300/20 bg-emerald-300/10 p-4">
                    <p className="text-3xl font-black text-emerald-200">WK</p>
                    <p className="mt-1 text-sm text-zinc-400">
                      {t.worldCupReady}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                    <p className="text-3xl font-black">2</p>
                    <p className="mt-1 text-sm text-zinc-400">
                      {t.modesInProgress}
                    </p>
                  </div>
                </div>
              </section>

              {appAdmin ? (
                <section className="rounded-[2rem] border border-emerald-300/20 bg-emerald-300/[0.06] p-5 sm:p-6">
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.22em] text-emerald-300">
                        {t.adminTools}
                      </p>
                      <h2 className="mt-2 text-2xl font-black tracking-tight">
                        {t.manageWorldCup}
                      </h2>
                      <p className="mt-2 text-sm leading-6 text-zinc-400">
                        {t.adminIntro}
                      </p>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <Link
                        href="/admin/world-cup/results"
                        className="rounded-2xl bg-emerald-300 px-5 py-3 text-center text-sm font-black text-zinc-950 transition hover:bg-emerald-200"
                      >
                        {t.results}
                      </Link>

                      <Link
                        href="/admin/world-cup/bonus"
                        className="rounded-2xl border border-white/15 bg-white/5 px-5 py-3 text-center text-sm font-black text-white transition hover:bg-white/10"
                      >
                        {t.bonusQuestions}
                      </Link>
                    </div>
                  </div>
                </section>
              ) : null}

              <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-5 backdrop-blur sm:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.22em] text-emerald-300">
                      {t.yourPools}
                    </p>
                    <h2 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">
                      {t.continuePlaying}
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-zinc-400">
                      {t.memberOfStart} {myPools.length}{" "}
                      {myPools.length === 1 ? t.pool : t.pools}.
                    </p>
                  </div>

                  <div className="hidden gap-3 sm:flex">
                    <Link
                      href="/join"
                      className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
                    >
                      {t.joinViaCode}
                    </Link>

                    <Link
                      href="/pools/new"
                      className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
                    >
                      {t.newPool}
                    </Link>
                  </div>
                </div>

                {myPools.length === 0 ? (
                  <div className="mt-6 rounded-[1.5rem] border border-dashed border-white/15 bg-black/20 p-6">
                    <h3 className="text-xl font-black">{t.noPoolsYet}</h3>
                    <p className="mt-2 max-w-xl text-sm leading-6 text-zinc-400">
                      {t.noPoolsIntro}
                    </p>

                    <div className="mt-5 grid gap-3 sm:flex">
                      <Link
                        href="/pools/new"
                        className="rounded-2xl bg-emerald-300 px-5 py-3 text-center text-sm font-black text-zinc-950 transition hover:bg-emerald-200"
                      >
                        {t.createFirstPool}
                      </Link>

                      <Link
                        href="/join"
                        className="rounded-2xl border border-white/15 bg-white/5 px-5 py-3 text-center text-sm font-black text-white transition hover:bg-white/10"
                      >
                        {t.joinPool}
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="mt-6 grid gap-3">
                    {myPools.map((pool) => (
                      <Link
                        key={pool.id}
                        href={pool.href}
                        className={`rounded-[1.5rem] border p-5 transition ${
                          pool.needsPayment
                            ? "border-amber-300/30 bg-amber-300/[0.08] hover:border-amber-300/50"
                            : getPoolCardClasses(pool.gameType)
                        }`}
                      >
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="text-xl font-black">
                                {pool.name}
                              </h3>

                              <span className="rounded-full border border-white/10 bg-black/20 px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-zinc-300">
                                {getRoleLabel(pool.role, language)}
                              </span>

                              <span
                                className={`rounded-full border px-2.5 py-1 text-xs font-bold uppercase tracking-wide ${getPoolTypeBadgeClasses(
                                  pool.gameType
                                )}`}
                              >
                                {pool.gameTypeShortLabel}
                              </span>

                              {pool.needsPayment ? (
                                <span className="rounded-full border border-amber-300/30 bg-amber-300/10 px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-amber-200">
                                  {t.paymentRequired}
                                </span>
                              ) : null}
                            </div>

                            <p className="mt-2 text-sm leading-6 text-zinc-400">
                              {pool.needsPayment
                                ? t.paymentRequiredDescription
                                : pool.gameTypeLabel}
                            </p>
                          </div>

                          <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-zinc-400">
                            {t.inviteCode}{" "}
                            <span className="font-black text-white">
                              {pool.inviteCode}
                            </span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </section>

              <Link
                href="/"
                className="inline-flex text-sm font-semibold text-zinc-400 transition hover:text-white"
              >
                {t.backHome}
              </Link>
            </div>
          </div>
        </Container>
      </section>
    </main>
  );
}