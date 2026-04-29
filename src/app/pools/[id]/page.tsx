import Image from "next/image";
import { unstable_noStore as noStore } from "next/cache";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import Container from "@/components/Container";
import { createClient } from "@/lib/supabase";
import { getLanguageFromCookieValue, type Language } from "@/lib/i18n";
import { getPoolTypeMeta } from "@/lib/pool-types";
import NextMatchHighlight from "@/components/world-cup/NextMatchHighlight";

type PoolPageProps = {
  params: Promise<{
    id: string;
  }>;
};

type PoolMemberRow = {
  user_id: string;
  role: string;
  joined_at: string;
};

type ProfileRow = {
  id: string;
  display_name: string | null;
};

type NextMatchRow = {
  id: string;
  starts_at: string;
  stage: string | null;
  round_name: string | null;
  group_label: string | null;
  match_number: number | null;
  home_team: string | null;
  away_team: string | null;
  home_slot: string | null;
  away_slot: string | null;
};

const copy = {
  en: {
    dashboard: "Dashboard",
    you: "You",
    joined: "Joined",
    owner: "Owner",
    admin: "Admin",
    member: "Member",
    members: "members",
    oneMember: "member",
    worldCupPool: "World Cup Pool",
    officeBingo: "Office Bingo",
    f1Pool: "F1 Pool",
    poolDashboard: "pool dashboard",
    joinCode: "Join code",
    predict: "Predict",
    poolMenu: "Pool menu",
    poolMenuIntro: "Navigate to the main parts of this pool.",
    predictLabel: "Predict",
    matchesTitle: "Matches",
    matchesDescription: "Submit and review match predictions.",
    bonusLabel: "Bonus",
    questionsTitle: "Questions",
    questionsDescription: "Extra predictions for bonus points.",
    groupsLabel: "Groups",
    standingsTitle: "Standings",
    standingsDescription: "View group tables and progress.",
    rankingLabel: "Ranking",
    leaderboardTitle: "Leaderboard",
    leaderboardDescription: "Follow the pool ranking.",
    setupLabel: "Setup",
    settingsTitle: "Settings",
    settingsDescription: "Manage board size and rules.",
    cardsLabel: "Cards",
    playerCardsTitle: "Player cards",
    playerCardsDescription: "View unique player bingo cards.",
    claimsLabel: "Claims",
    bingoClaimsTitle: "Bingo claims",
    bingoClaimsDescription: "Review submitted claims.",
    weekendsLabel: "Weekends",
    raceWeekendsTitle: "Race weekends",
    raceWeekendsDescription: "Manage F1 sessions.",
    predictionsTitle: "Predictions",
    predictionsDescription: "Open prediction forms.",
    poolMembers: "Pool members",
    inThisPool: "in this pool.",
    noMembers: "No members found yet.",
    unknownUserPrefix: "User",
  },
  nl: {
    dashboard: "Dashboard",
    you: "Jij",
    joined: "Lid sinds",
    owner: "Eigenaar",
    admin: "Admin",
    member: "Lid",
    members: "leden",
    oneMember: "lid",
    worldCupPool: "WK-poule",
    officeBingo: "Office Bingo",
    f1Pool: "F1-poule",
    poolDashboard: "poule dashboard",
    joinCode: "Join code",
    predict: "Voorspellen",
    poolMenu: "Poule menu",
    poolMenuIntro: "Ga naar de belangrijkste onderdelen van deze poule.",
    predictLabel: "Voorspel",
    matchesTitle: "Wedstrijden",
    matchesDescription: "Vul voorspellingen in en bekijk ze terug.",
    bonusLabel: "Bonus",
    questionsTitle: "Vragen",
    questionsDescription: "Extra voorspellingen voor bonuspunten.",
    groupsLabel: "Groepen",
    standingsTitle: "Standen",
    standingsDescription: "Bekijk poulestanden en voortgang.",
    rankingLabel: "Ranking",
    leaderboardTitle: "Ranglijst",
    leaderboardDescription: "Volg de ranking binnen deze poule.",
    setupLabel: "Instellen",
    settingsTitle: "Instellingen",
    settingsDescription: "Beheer kaartgrootte en regels.",
    cardsLabel: "Kaarten",
    playerCardsTitle: "Spelerskaarten",
    playerCardsDescription: "Bekijk unieke bingo kaarten per speler.",
    claimsLabel: "Claims",
    bingoClaimsTitle: "Bingo claims",
    bingoClaimsDescription: "Controleer ingediende claims.",
    weekendsLabel: "Weekends",
    raceWeekendsTitle: "Raceweekends",
    raceWeekendsDescription: "Beheer F1-sessies.",
    predictionsTitle: "Voorspellingen",
    predictionsDescription: "Open voorspelformulieren.",
    poolMembers: "Pouleleden",
    inThisPool: "in deze poule.",
    noMembers: "Nog geen leden gevonden.",
    unknownUserPrefix: "Gebruiker",
  },
} satisfies Record<Language, Record<string, string>>;

function getDisplayName(
  userId: string,
  profilesMap: Map<string, string>,
  language: Language
) {
  const profileName = profilesMap.get(userId)?.trim();

  if (profileName) {
    return profileName;
  }

  return `${copy[language].unknownUserPrefix} ${userId.slice(0, 8)}`;
}

function getInitials(name: string) {
  const cleanName = name.trim();

  if (!cleanName) {
    return "U";
  }

  const parts = cleanName.split(/\s+/).filter(Boolean);

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

function formatJoinedDate(value: string, language: Language) {
  return new Intl.DateTimeFormat(language === "nl" ? "nl-NL" : "en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Europe/Amsterdam",
  }).format(new Date(value));
}

function getRoleLabel(role: string, language: Language) {
  const t = copy[language];

  switch (role) {
    case "owner":
      return t.owner;
    case "admin":
      return t.admin;
    default:
      return t.member;
  }
}

function getPoolTypeDisplay(poolType: string, language: Language) {
  const t = copy[language];

  switch (poolType) {
    case "world_cup":
      return t.worldCupPool;
    case "office_bingo":
      return t.officeBingo;
    case "f1":
      return t.f1Pool;
    default:
      return poolType;
  }
}

type ActionCardProps = {
  href: string;
  title: string;
  description: string;
  label: string;
  primary?: boolean;
};

function ActionCard({
  href,
  title,
  description,
  label,
  primary = false,
}: ActionCardProps) {
  return (
    <Link
      href={href}
      className={`group relative flex min-h-[132px] flex-col items-center justify-center overflow-hidden rounded-2xl border p-4 text-center transition active:scale-[0.99] ${
        primary
          ? "border-emerald-300/35 bg-emerald-300/[0.10] hover:border-emerald-200/50 hover:bg-emerald-300/[0.14]"
          : "border-white/10 bg-black/20 hover:border-emerald-300/30 hover:bg-emerald-300/[0.05]"
      }`}
    >
      <div
        className={`absolute inset-x-0 top-0 h-px ${
          primary
            ? "bg-gradient-to-r from-transparent via-emerald-200/70 to-transparent"
            : "bg-gradient-to-r from-transparent via-white/15 to-transparent"
        }`}
      />

      <p
        className={`text-[10px] font-black uppercase tracking-[0.22em] ${
          primary ? "text-emerald-200" : "text-zinc-500"
        }`}
      >
        {label}
      </p>

      <h3 className="mt-2 text-lg font-black tracking-tight text-white">
        {title}
      </h3>

      <p className="mx-auto mt-2 max-w-[220px] text-sm leading-5 text-zinc-400">
        {description}
      </p>
    </Link>
  );
}

type MemberCardProps = {
  member: PoolMemberRow;
  displayName: string;
  isCurrentUser: boolean;
  language: Language;
};

function MemberCard({
  member,
  displayName,
  isCurrentUser,
  language,
}: MemberCardProps) {
  const t = copy[language];

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border p-4 ${
        isCurrentUser
          ? "border-emerald-300/35 bg-emerald-300/[0.09]"
          : "border-white/10 bg-black/20"
      }`}
    >
      <div
        className={`absolute inset-x-0 top-0 h-px ${
          isCurrentUser
            ? "bg-gradient-to-r from-transparent via-emerald-200/70 to-transparent"
            : "bg-gradient-to-r from-transparent via-white/15 to-transparent"
        }`}
      />

      <div className="flex items-center gap-3">
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border text-sm font-black ${
            isCurrentUser
              ? "border-emerald-200/30 bg-emerald-300/15 text-emerald-100"
              : "border-white/10 bg-white/[0.04] text-zinc-200"
          }`}
        >
          {getInitials(displayName)}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-center gap-2">
            <p className="truncate text-sm font-black text-white">
              {displayName}
            </p>

            {isCurrentUser ? (
              <span className="shrink-0 rounded-full border border-emerald-300/25 bg-emerald-300/10 px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.14em] text-emerald-200">
                {t.you}
              </span>
            ) : null}
          </div>

          <p className="mt-1 text-xs font-semibold text-zinc-500">
            {t.joined} {formatJoinedDate(member.joined_at, language)}
          </p>
        </div>

        <span
          className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] ${
            member.role === "owner"
              ? "border-emerald-300/30 bg-emerald-300/10 text-emerald-200"
              : member.role === "admin"
              ? "border-sky-300/25 bg-sky-300/10 text-sky-200"
              : "border-white/10 bg-white/[0.04] text-zinc-400"
          }`}
        >
          {getRoleLabel(member.role, language)}
        </span>
      </div>
    </div>
  );
}

export default async function PoolDetailPage({ params }: PoolPageProps) {
  noStore();

  const { id } = await params;

  const cookieStore = await cookies();
  const language = getLanguageFromCookieValue(
    cookieStore.get("poolr-language")?.value
  );
  const t = copy[language];

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth");
  }

  const { data: membership } = await supabase
    .from("pool_members")
    .select("role")
    .eq("pool_id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!membership) {
    notFound();
  }

  const { data: pool } = await supabase
    .from("pools")
    .select("id, name, game_type, invite_code, created_at")
    .eq("id", id)
    .maybeSingle();

  if (!pool) {
    notFound();
  }

  const { data: members } = await supabase
    .from("pool_members")
    .select("user_id, role, joined_at")
    .eq("pool_id", id)
    .order("joined_at", { ascending: true });

  const typedMembers = (members ?? []) as PoolMemberRow[];
  const memberUserIds = typedMembers.map((member) => member.user_id);

  let profilesMap = new Map<string, string>();

  if (memberUserIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, display_name")
      .in("id", memberUserIds);

    profilesMap = new Map(
      ((profiles ?? []) as ProfileRow[]).map((profile) => [
        profile.id,
        profile.display_name ?? "",
      ])
    );
  }

  const poolType = getPoolTypeMeta(pool.game_type);
  const isWorldCup = pool.game_type === "world_cup";

  let nextMatch: NextMatchRow | null = null;

  if (isWorldCup) {
    const { data: nextMatchData } = await supabase
      .from("matches")
      .select(
        "id, starts_at, stage, round_name, group_label, match_number, home_team, away_team, home_slot, away_slot"
      )
      .eq("tournament", "world_cup_2026")
      .gt("starts_at", new Date().toISOString())
      .order("starts_at", { ascending: true })
      .order("match_number", { ascending: true })
      .limit(1)
      .maybeSingle();

    nextMatch = (nextMatchData ?? null) as NextMatchRow | null;
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#030706] text-white">
      <section className="relative min-h-screen">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(34,255,160,0.13),transparent_34%),radial-gradient(circle_at_85%_38%,rgba(20,184,166,0.08),transparent_30%),linear-gradient(180deg,#04100c_0%,#030706_52%,#020403_100%)]" />
        <div className="absolute inset-0 opacity-[0.08] [background-image:linear-gradient(rgba(255,255,255,0.16)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.16)_1px,transparent_1px)] [background-size:64px_64px]" />

        <Container>
          <div className="relative z-10 py-4 sm:py-5">
            <header className="flex items-center justify-between gap-4">
              <Link href="/" className="flex items-center">
                <Image
                  src="/brand/poolr-logo-dark.png"
                  alt="Poolr"
                  width={340}
                  height={100}
                  priority
                  className="h-[52px] w-auto sm:h-[64px]"
                />
              </Link>

              <Link
                href="/dashboard"
                className="rounded-full border border-white/15 bg-white/5 px-3.5 py-2 text-xs font-bold text-white/90 backdrop-blur transition hover:bg-white/10 sm:text-sm"
              >
                {t.dashboard}
              </Link>
            </header>

            <div className="mx-auto mt-4 flex max-w-6xl flex-col gap-4">
              <section className="rounded-[1.5rem] border border-white/10 bg-white/[0.045] p-4 shadow-2xl backdrop-blur-xl sm:p-5">
                <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
                  <div className="min-w-0">
                    <div className="mb-3 flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1.5 text-xs font-bold text-emerald-200">
                        <span className="h-2 w-2 rounded-full bg-emerald-300 shadow-[0_0_14px_rgba(110,231,183,0.9)]" />
                        {getPoolTypeDisplay(pool.game_type, language)}
                      </span>

                      <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1.5 text-xs font-bold text-zinc-300">
                        {getRoleLabel(membership.role, language)}
                      </span>

                      <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1.5 text-xs font-bold text-zinc-300">
                        {typedMembers.length}{" "}
                        {typedMembers.length === 1 ? t.oneMember : t.members}
                      </span>
                    </div>

                    <h1 className="truncate text-3xl font-black tracking-tight text-white sm:text-4xl">
                      {pool.name}
                    </h1>

                    <p className="mt-1 text-sm font-semibold text-zinc-400">
                      {poolType.shortLabel} {t.poolDashboard}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-emerald-300/20 bg-emerald-300/10 px-4 py-3 lg:min-w-[260px]">
                    <p className="text-[10px] font-black uppercase tracking-[0.22em] text-emerald-200">
                      {t.joinCode}
                    </p>

                    <div className="mt-1 flex items-end justify-between gap-3">
                      <p className="text-2xl font-black tracking-widest text-white">
                        {pool.invite_code}
                      </p>

                      {isWorldCup ? (
                        <Link
                          href={`/pools/${pool.id}/matches`}
                          className="hidden rounded-xl bg-emerald-300 px-3 py-2 text-xs font-black text-zinc-950 transition hover:bg-emerald-200 sm:inline-flex"
                        >
                          {t.predict}
                        </Link>
                      ) : null}
                    </div>
                  </div>
                </div>
              </section>

              {isWorldCup ? (
                <NextMatchHighlight poolId={pool.id} match={nextMatch} />
              ) : null}

              <section className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4 backdrop-blur-xl sm:p-5">
                <div className="mb-4 text-center">
                  <h2 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
                    {t.poolMenu}
                  </h2>
                  <p className="mx-auto mt-2 max-w-xl text-sm leading-5 text-zinc-400">
                    {t.poolMenuIntro}
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {pool.game_type === "world_cup" ? (
                    <>
                      <ActionCard
                        href={`/pools/${pool.id}/matches`}
                        label={t.predictLabel}
                        title={t.matchesTitle}
                        description={t.matchesDescription}
                        primary
                      />

                      <ActionCard
                        href={`/pools/${pool.id}/bonus`}
                        label={t.bonusLabel}
                        title={t.questionsTitle}
                        description={t.questionsDescription}
                      />

                      <ActionCard
                        href={`/pools/${pool.id}/standings`}
                        label={t.groupsLabel}
                        title={t.standingsTitle}
                        description={t.standingsDescription}
                      />

                      <ActionCard
                        href={`/pools/${pool.id}/leaderboard`}
                        label={t.rankingLabel}
                        title={t.leaderboardTitle}
                        description={t.leaderboardDescription}
                      />
                    </>
                  ) : pool.game_type === "office_bingo" ? (
                    <>
                      <ActionCard
                        href={`/pools/${pool.id}`}
                        label={t.setupLabel}
                        title={t.settingsTitle}
                        description={t.settingsDescription}
                        primary
                      />

                      <ActionCard
                        href={`/pools/${pool.id}`}
                        label={t.cardsLabel}
                        title={t.playerCardsTitle}
                        description={t.playerCardsDescription}
                      />

                      <ActionCard
                        href={`/pools/${pool.id}`}
                        label={t.claimsLabel}
                        title={t.bingoClaimsTitle}
                        description={t.bingoClaimsDescription}
                      />
                    </>
                  ) : (
                    <>
                      <ActionCard
                        href={`/pools/${pool.id}`}
                        label={t.weekendsLabel}
                        title={t.raceWeekendsTitle}
                        description={t.raceWeekendsDescription}
                        primary
                      />

                      <ActionCard
                        href={`/pools/${pool.id}`}
                        label={t.predictLabel}
                        title={t.predictionsTitle}
                        description={t.predictionsDescription}
                      />

                      <ActionCard
                        href={`/pools/${pool.id}`}
                        label={t.rankingLabel}
                        title={t.standingsTitle}
                        description={t.leaderboardDescription}
                      />
                    </>
                  )}
                </div>
              </section>

              <section className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4 backdrop-blur-xl sm:p-5">
                <div className="mb-4 text-center">
                  <h2 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
                    {t.poolMembers}
                  </h2>
                  <p className="mx-auto mt-2 max-w-xl text-sm leading-5 text-zinc-400">
                    {typedMembers.length}{" "}
                    {typedMembers.length === 1 ? t.oneMember : t.members}{" "}
                    {t.inThisPool}
                  </p>
                </div>

                {typedMembers.length > 0 ? (
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {typedMembers.map((member) => {
                      const displayName = getDisplayName(
                        member.user_id,
                        profilesMap,
                        language
                      );

                      return (
                        <MemberCard
                          key={member.user_id}
                          member={member}
                          displayName={displayName}
                          isCurrentUser={member.user_id === user.id}
                          language={language}
                        />
                      );
                    })}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-5 text-center">
                    <p className="text-sm font-semibold text-zinc-400">
                      {t.noMembers}
                    </p>
                  </div>
                )}
              </section>
            </div>
          </div>
        </Container>
      </section>
    </main>
  );
}