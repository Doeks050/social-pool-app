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
  inviteCode: string;
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
    welcome: "Welcome back",
    intro: "Manage your pools and continue where you left off.",
    createPool: "Create pool",
    joinPool: "Join with code",
    yourPools: "Your pools",
    noPoolsYet: "No pools yet",
    noPoolsIntro:
      "Create your first pool or join an existing one with a private code.",
    createFirstPool: "Create first pool",
    openPool: "Open pool",
    inviteCode: "Code",
    profile: "Profile",
    admin: "Admin",
    owner: "Owner",
    member: "Member",
    active: "Active",
    pending: "Pending",
    paymentRequired: "Payment required",
    needsAttention: "Needs attention",
    paymentRequiredDescription: "This pool still needs to be paid and activated.",
    attentionEmpty: "Nothing needs your attention right now.",
    manageAdmin: "Manage admin tools",
    worldCupPool: "World Cup",
    officeBingo: "Office Bingo",
    f1Pool: "F1 Pool",
  },
  nl: {
    playerFallback: "Speler",
    dashboard: "Dashboard",
    welcome: "Welkom terug",
    intro: "Beheer je poules en ga verder waar je gebleven was.",
    createPool: "Poule maken",
    joinPool: "Join met code",
    yourPools: "Jouw poules",
    noPoolsYet: "Nog geen poules",
    noPoolsIntro:
      "Maak je eerste poule of doe mee met een bestaande poule via een privécode.",
    createFirstPool: "Eerste poule maken",
    openPool: "Open poule",
    inviteCode: "Code",
    profile: "Profiel",
    admin: "Admin",
    owner: "Eigenaar",
    member: "Lid",
    active: "Actief",
    pending: "In afwachting",
    paymentRequired: "Betaling vereist",
    needsAttention: "Aandacht nodig",
    paymentRequiredDescription:
      "Deze poule moet nog betaald en geactiveerd worden.",
    attentionEmpty: "Er is nu niets dat je aandacht nodig heeft.",
    manageAdmin: "Admin tools beheren",
    worldCupPool: "WK-poule",
    officeBingo: "Office Bingo",
    f1Pool: "F1-poule",
  },
};

function getRoleLabel(role: string, language: "en" | "nl") {
  const t = copy[language];

  if (role === "owner") return t.owner;
  if (role === "admin") return t.admin;

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

  if (gameType === "world_cup") return t.worldCupPool;
  if (gameType === "office_bingo") return t.officeBingo;
  if (gameType === "f1") return t.f1Pool;

  return fallback;
}

function getStatusLabel(pool: DashboardPool, language: "en" | "nl") {
  const t = copy[language];

  if (pool.needsPayment) return t.paymentRequired;
  if (pool.isActive) return t.active;

  return t.pending;
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

      if (!pool) return null;

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
        inviteCode: pool.invite_code,
        role: membership.role,
        status: pool.status,
        paymentStatus: pool.payment_status,
        isActive: active,
        needsPayment,
        href: needsPayment ? `/pools/${pool.id}/payment` : `/pools/${pool.id}`,
      };
    })
    .filter(Boolean) as DashboardPool[];

  const attentionPools = myPools.filter((pool) => pool.needsPayment);

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#030706] text-white">
      <section className="relative min-h-screen">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(34,255,160,0.12),transparent_34%),linear-gradient(180deg,#04100c_0%,#030706_52%,#020403_100%)]" />
        <div className="absolute inset-0 opacity-[0.05] [background-image:linear-gradient(rgba(255,255,255,0.16)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.16)_1px,transparent_1px)] [background-size:64px_64px]" />

        <Container>
          <div className="relative z-10 py-4 sm:py-6">
            <header className="flex min-w-0 items-center justify-between gap-3">
              <Link href="/" className="flex min-w-0 items-center">
                <Image
                  src="/brand/poolr-logo-dark.png"
                  alt="Poolr"
                  width={340}
                  height={100}
                  priority
                  className="h-11 w-auto max-w-[150px] sm:h-16 sm:max-w-none"
                />
              </Link>

              <div className="flex shrink-0 items-center gap-2">
                <Link
                  href="/profile"
                  className="rounded-full border border-white/15 bg-white/5 px-3 py-2 text-xs font-bold text-white/90 transition hover:bg-white/10 sm:text-sm"
                >
                  {t.profile}
                </Link>

                {appAdmin ? (
                  <Link
                    href="/admin"
                    className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-2 text-xs font-bold text-emerald-100 transition hover:bg-emerald-300/15 sm:text-sm"
                  >
                    {t.admin}
                  </Link>
                ) : null}

                <SignOutButton />
              </div>
            </header>

            <div className="mx-auto mt-5 flex max-w-5xl flex-col gap-4 sm:mt-7">
              <section className="rounded-3xl border border-white/10 bg-white/[0.06] p-4 shadow-2xl backdrop-blur-xl sm:p-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                  <div className="min-w-0">
                    <p className="text-[10px] font-black uppercase tracking-[0.22em] text-emerald-300 sm:text-xs">
                      {t.dashboard}
                    </p>

                    <h1 className="mt-2 break-words text-2xl font-black tracking-tight text-white sm:text-4xl">
                      {t.welcome}, {displayName}
                    </h1>

                    <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">
                      {t.intro}
                    </p>
                  </div>

                  <div className="grid gap-2 sm:grid-cols-2 lg:w-[320px] lg:shrink-0">
                    <Link
                      href="/pools/new"
                      className="rounded-2xl bg-emerald-300 px-5 py-3 text-center text-sm font-black text-zinc-950 transition hover:bg-emerald-200"
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
              </section>

              <section className="rounded-3xl border border-white/10 bg-white/[0.06] p-4 backdrop-blur-xl sm:p-6">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-emerald-300 sm:text-xs">
                    {t.yourPools}
                  </p>

                  <h2 className="mt-1 text-xl font-black tracking-tight sm:text-3xl">
                    {myPools.length === 0
                      ? t.noPoolsYet
                      : `${myPools.length} ${t.yourPools.toLowerCase()}`}
                  </h2>
                </div>

                {myPools.length === 0 ? (
                  <div className="mt-4 rounded-2xl border border-dashed border-white/15 bg-black/20 p-4 sm:p-5">
                    <p className="max-w-xl text-sm leading-6 text-zinc-400">
                      {t.noPoolsIntro}
                    </p>

                    <div className="mt-4 grid gap-2 sm:flex">
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
                  <div className="mt-4 grid gap-3">
                    {myPools.map((pool) => (
                      <div
                        key={pool.id}
                        className="rounded-2xl border border-white/10 bg-black/20 p-4 transition hover:border-white/20 hover:bg-black/25"
                      >
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                          <div className="min-w-0">
                            <h3 className="break-words text-lg font-black tracking-tight text-white sm:text-xl">
                              {pool.name}
                            </h3>

                            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs font-semibold text-zinc-400">
                              <span>{pool.gameTypeLabel}</span>
                              <span className="text-zinc-600">•</span>
                              <span>{getRoleLabel(pool.role, language)}</span>
                              <span className="text-zinc-600">•</span>
                              <span
                                className={
                                  pool.needsPayment
                                    ? "text-amber-200"
                                    : pool.isActive
                                      ? "text-emerald-200"
                                      : "text-zinc-300"
                                }
                              >
                                {getStatusLabel(pool, language)}
                              </span>
                            </div>

                            <p className="mt-2 text-xs text-zinc-500">
                              {t.inviteCode}: {pool.inviteCode}
                            </p>
                          </div>

                          <Link
                            href={pool.href}
                            className={
                              pool.needsPayment
                                ? "rounded-2xl bg-amber-300 px-5 py-3 text-center text-sm font-black text-zinc-950 transition hover:bg-amber-200 sm:w-[150px]"
                                : "rounded-2xl bg-emerald-300 px-5 py-3 text-center text-sm font-black text-zinc-950 transition hover:bg-emerald-200 sm:w-[150px]"
                            }
                          >
                            {pool.needsPayment ? t.paymentRequired : t.openPool}
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <section className="rounded-3xl border border-white/10 bg-white/[0.06] p-4 backdrop-blur-xl sm:p-6">
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-emerald-300 sm:text-xs">
                  {t.needsAttention}
                </p>

                {attentionPools.length === 0 ? (
                  <p className="mt-2 text-sm leading-6 text-zinc-400">
                    {t.attentionEmpty}
                  </p>
                ) : (
                  <div className="mt-4 grid gap-3">
                    {attentionPools.map((pool) => (
                      <Link
                        key={pool.id}
                        href={pool.href}
                        className="rounded-2xl border border-amber-300/25 bg-amber-300/10 p-4 transition hover:border-amber-300/45"
                      >
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <h3 className="font-black text-white">
                              {pool.name}
                            </h3>
                            <p className="mt-1 text-sm text-zinc-400">
                              {t.paymentRequiredDescription}
                            </p>
                          </div>

                          <span className="text-sm font-black text-amber-200">
                            {t.paymentRequired}
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </section>

              {appAdmin ? (
                <Link
                  href="/admin"
                  className="rounded-2xl border border-emerald-300/20 bg-emerald-300/10 p-4 text-sm font-black text-emerald-100 transition hover:bg-emerald-300/15 sm:p-5"
                >
                  {t.manageAdmin}
                </Link>
              ) : null}
            </div>
          </div>
        </Container>
      </section>
    </main>
  );
}