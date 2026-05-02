import Image from "next/image";
import { unstable_noStore as noStore } from "next/cache";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import Container from "@/components/Container";
import { createClient } from "@/lib/supabase";
import { getLanguageFromCookieValue, type Language } from "@/lib/i18n";
import { getPoolTypeMeta } from "@/lib/pool-types";
import { getDefaultPoolPlan, getPoolPlan } from "@/lib/plans";
import NextMatchHighlight from "@/components/world-cup/NextMatchHighlight";
import OfficeBingoDashboard from "@/components/office-bingo/OfficeBingoDashboard";

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

type OfficeBingoEventRow = {
  id: string;
  pool_id: string;
  plan: string;
  status: string;
  target_name: string | null;
  expires_at: string;
};

type OfficeBingoRoundRow = {
  id: string;
  event_id: string;
  pool_id: string;
  round_number: number;
  title: string;
  status: string;
  grid_size: number;
  diagonal_enabled: boolean;
};

type OfficeBingoCalledItemRow = {
  item_id: string;
};

type OfficeBingoWinnerRow = {
  id: string;
  user_id: string;
  win_type: "line" | "full_card";
  winning_positions: number[];
  won_at: string;
};

type OfficeBingoCardRow = {
  id: string;
  user_id: string;
};

type OfficeBingoMessageRow = {
  id: string;
  user_id: string;
  message: string;
  created_at: string;
};

type OfficeBingoCardCellRow = {
  id: string;
  card_id: string;
  item_id: string;
  position_index: number;
  office_bingo_items:
  | {
    label: string;
  }
  | {
    label: string;
  }[]
  | null;
};

const copy = {
  en: {
    dashboard: "Dashboard",
    you: "You",
    joined: "Joined",
    owner: "Owner",
    admin: "Admin",
    appAdmin: "App admin",
    member: "Member",
    members: "members",
    oneMember: "member",
    worldCupPool: "World Cup Pool",
    officeBingo: "Office Bingo",
    f1Pool: "F1 Pool",
    poolDashboard: "pool dashboard",
    joinCode: "Join code",
    predict: "Predict",
    plan: "Package",
    memberLimit: "Members",
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
    appAdmin: "App admin",
    member: "Lid",
    members: "leden",
    oneMember: "lid",
    worldCupPool: "WK-poule",
    officeBingo: "Office Bingo",
    f1Pool: "F1-poule",
    poolDashboard: "poule dashboard",
    joinCode: "Join code",
    predict: "Voorspellen",
    plan: "Pakket",
    memberLimit: "Leden",
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

function isPoolActiveAndPaid(input: {
  status: string | null;
  paymentStatus: string | null;
}) {
  return (
    input.status === "active" &&
    (input.paymentStatus === "paid" || input.paymentStatus === "waived")
  );
}

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
    case "app_admin":
      return t.appAdmin;
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
      className={`group relative flex min-h-[132px] flex-col items-center justify-center overflow-hidden rounded-2xl border p-4 text-center transition active:scale-[0.99] ${primary
          ? "border-emerald-300/35 bg-emerald-300/[0.10] hover:border-emerald-200/50 hover:bg-emerald-300/[0.14]"
          : "border-white/10 bg-black/20 hover:border-emerald-300/30 hover:bg-emerald-300/[0.05]"
        }`}
    >
      <div
        className={`absolute inset-x-0 top-0 h-px ${primary
            ? "bg-gradient-to-r from-transparent via-emerald-200/70 to-transparent"
            : "bg-gradient-to-r from-transparent via-white/15 to-transparent"
          }`}
      />

      <p
        className={`text-[10px] font-black uppercase tracking-[0.22em] ${primary ? "text-emerald-200" : "text-zinc-500"
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

function MemberCard({
  member,
  displayName,
  isCurrentUser,
  language,
}: {
  member: PoolMemberRow;
  displayName: string;
  isCurrentUser: boolean;
  language: Language;
}) {
  const t = copy[language];

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border p-4 ${isCurrentUser
          ? "border-emerald-300/35 bg-emerald-300/[0.09]"
          : "border-white/10 bg-black/20"
        }`}
    >
      <div
        className={`absolute inset-x-0 top-0 h-px ${isCurrentUser
            ? "bg-gradient-to-r from-transparent via-emerald-200/70 to-transparent"
            : "bg-gradient-to-r from-transparent via-white/15 to-transparent"
          }`}
      />

      <div className="flex items-center gap-3">
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border text-sm font-black ${isCurrentUser
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
          className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] ${member.role === "owner"
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

  const { data: appAdmin } = await supabase
    .from("app_admins")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  const isAppAdmin = Boolean(appAdmin);

  const { data: membership } = await supabase
    .from("pool_members")
    .select("role")
    .eq("pool_id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!membership && !isAppAdmin) {
    notFound();
  }

  const { data: pool } = await supabase
    .from("pools")
    .select(
      "id, name, game_type, invite_code, created_at, status, payment_status, plan_code, max_members"
    )
    .eq("id", id)
    .maybeSingle();

  if (!pool) {
    notFound();
  }

  if (
    !isAppAdmin &&
    !isPoolActiveAndPaid({
      status: pool.status,
      paymentStatus: pool.payment_status,
    })
  ) {
    redirect(`/pools/${pool.id}/payment`);
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
  const poolPlan = getPoolPlan(pool.plan_code) ?? getDefaultPoolPlan();
  const maxMembers =
    typeof pool.max_members === "number" && pool.max_members > 0
      ? pool.max_members
      : poolPlan.maxMembers;

  const currentRole = membership?.role ?? "app_admin";
  const isPoolAdmin =
    isAppAdmin || currentRole === "owner" || currentRole === "admin";
  const isWorldCup = pool.game_type === "world_cup";
  const isOfficeBingo = pool.game_type === "office_bingo";

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

  let officeBingoEvent: OfficeBingoEventRow | null = null;
  let officeBingoRound: OfficeBingoRoundRow | null = null;
  let officeBingoCalledItemIds = new Set<string>();
  let officeBingoCalledLabels: string[] = [];
  let officeBingoWinners: OfficeBingoWinnerRow[] = [];
  let officeBingoMessages: OfficeBingoMessageRow[] = [];
  let officeBingoUserCard: OfficeBingoCardRow | null = null;
  let officeBingoUserCardCells: OfficeBingoCardCellRow[] = [];

  if (isOfficeBingo) {
    const { data: eventData } = await supabase
      .from("office_bingo_events")
      .select("id, pool_id, plan, status, target_name, expires_at")
      .eq("pool_id", pool.id)
      .maybeSingle();

    officeBingoEvent = (eventData ?? null) as OfficeBingoEventRow | null;

    if (officeBingoEvent) {
      const { data: roundData } = await supabase
        .from("office_bingo_rounds")
        .select(
          "id, event_id, pool_id, round_number, title, status, grid_size, diagonal_enabled"
        )
        .eq("event_id", officeBingoEvent.id)
        .order("round_number", { ascending: false })
        .limit(1)
        .maybeSingle();

      officeBingoRound = (roundData ?? null) as OfficeBingoRoundRow | null;
    }

    if (officeBingoRound) {
      const { data: calledData } = await supabase
        .from("office_bingo_called_items")
        .select("item_id")
        .eq("round_id", officeBingoRound.id);

      const calledRows = (calledData ?? []) as OfficeBingoCalledItemRow[];
      officeBingoCalledItemIds = new Set(
        calledRows.map((item) => item.item_id)
      );

      if (calledRows.length > 0) {
        const { data: calledLabelData } = await supabase
          .from("office_bingo_items")
          .select("id, label")
          .eq("round_id", officeBingoRound.id)
          .in(
            "id",
            calledRows.map((item) => item.item_id)
          )
          .limit(6);

        officeBingoCalledLabels = ((calledLabelData ?? []) as {
          id: string;
          label: string;
        }[]).map((item) => item.label);
      }

      const { data: winnerData } = await supabase
        .from("office_bingo_winners")
        .select("id, user_id, win_type, winning_positions, won_at")
        .eq("round_id", officeBingoRound.id)
        .order("won_at", { ascending: true });

      officeBingoWinners = (winnerData ?? []) as OfficeBingoWinnerRow[];

      const { data: messageData } = await supabase
        .from("office_bingo_messages")
        .select("id, user_id, message, created_at")
        .eq("pool_id", pool.id)
        .eq("round_id", officeBingoRound.id)
        .order("created_at", { ascending: false })
        .limit(20);

      officeBingoMessages = (messageData ?? []) as OfficeBingoMessageRow[];

      const { data: cardData } = await supabase
        .from("office_bingo_cards")
        .select("id, user_id")
        .eq("round_id", officeBingoRound.id)
        .eq("user_id", user.id)
        .maybeSingle();

      officeBingoUserCard = (cardData ?? null) as OfficeBingoCardRow | null;

      if (officeBingoUserCard) {
        const { data: cellData } = await supabase
          .from("office_bingo_card_cells")
          .select(
            "id, card_id, item_id, position_index, office_bingo_items(label)"
          )
          .eq("card_id", officeBingoUserCard.id)
          .order("position_index", { ascending: true });

        officeBingoUserCardCells = (cellData ?? []) as OfficeBingoCardCellRow[];
      }
    }
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
                        {getRoleLabel(currentRole, language)}
                      </span>

                      <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1.5 text-xs font-bold text-zinc-300">
                        {t.plan}: {poolPlan.name}
                      </span>

                      <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1.5 text-xs font-bold text-zinc-300">
                        {t.memberLimit}: {typedMembers.length}/{maxMembers}
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

              {isOfficeBingo ? (
                <OfficeBingoDashboard
                  pool={{
                    id: pool.id,
                    name: pool.name,
                  }}
                  language={language}
                  isHost={isPoolAdmin}
                  event={
                    officeBingoEvent
                      ? {
                        id: officeBingoEvent.id,
                        plan: officeBingoEvent.plan,
                        status: officeBingoEvent.status,
                        target_name: officeBingoEvent.target_name,
                        expires_at: officeBingoEvent.expires_at,
                      }
                      : null
                  }
                  round={
                    officeBingoRound
                      ? {
                        id: officeBingoRound.id,
                        title: officeBingoRound.title,
                        status: officeBingoRound.status,
                        grid_size: officeBingoRound.grid_size,
                      }
                      : null
                  }
                  calledItemIds={[...officeBingoCalledItemIds]}
                  calledLabels={officeBingoCalledLabels}
                  winners={officeBingoWinners.map((winner) => ({
                    id: winner.id,
                    user_id: winner.user_id,
                    display_name: getDisplayName(
                      winner.user_id,
                      profilesMap,
                      language
                    ),
                    win_type: winner.win_type,
                    won_at: winner.won_at,
                  }))}
                  messages={officeBingoMessages
                    .slice()
                    .reverse()
                    .map((message) => ({
                      id: message.id,
                      user_id: message.user_id,
                      display_name: getDisplayName(
                        message.user_id,
                        profilesMap,
                        language
                      ),
                      message: message.message,
                      created_at: message.created_at,
                    }))}
                  cardCells={officeBingoUserCardCells.map((cell) => {
                    const item = Array.isArray(cell.office_bingo_items)
                      ? cell.office_bingo_items[0]
                      : cell.office_bingo_items;

                    return {
                      id: cell.id,
                      item_id: cell.item_id,
                      position_index: cell.position_index,
                      label: item?.label ?? "",
                    };
                  })}
                />
              ) : (
                <section className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4 backdrop-blur-xl sm:p-5">
                  <div className="mb-4 text-center">
                    <h2 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
                      {language === "nl" ? "Poule menu" : "Pool menu"}
                    </h2>
                    <p className="mx-auto mt-2 max-w-xl text-sm leading-5 text-zinc-400">
                      {language === "nl"
                        ? "Ga naar de belangrijkste onderdelen van deze poule."
                        : "Navigate to the main parts of this pool."}
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
              )}

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