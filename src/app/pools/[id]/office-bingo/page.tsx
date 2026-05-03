import Image from "next/image";
import { unstable_noStore as noStore } from "next/cache";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import Container from "@/components/Container";
import OfficeBingoRoundHistory from "@/components/office-bingo/OfficeBingoRoundHistory";
import { createClient } from "@/lib/supabase";
import { getLanguageFromCookieValue, type Language } from "@/lib/i18n";
import {
  callOfficeBingoItemAction,
  createFreeOfficeBingoAction,
  createNextOfficeBingoRoundAction,
  generateOfficeBingoCardsAction,
  uncallOfficeBingoItemAction,
} from "./actions";

type OfficeBingoPageProps = {
  params: Promise<{
    id: string;
  }>;
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

type OfficeBingoItemRow = {
  id: string;
  label: string;
  sort_order: number;
};

type OfficeBingoCalledItemRow = {
  item_id: string;
};

type OfficeBingoWinnerRow = {
  id: string;
  user_id: string;
  win_type: "line" | "full_card";
  won_at: string;
};

type OfficeBingoRoundHistoryRow = {
  id: string;
  round_number: number;
  title: string;
  status: string;
  created_at: string | null;
};

type OfficeBingoRoundHistoryWinnerRow = {
  round_id: string;
  user_id: string;
  display_name: string;
  win_type: "line" | "full_card";
  won_at: string;
};

const copy = {
  en: {
    dashboard: "Dashboard",
    backToPool: "Back to pool",
    officeBingo: "Office Bingo",
    hostDashboard: "Host dashboard",
    hostDashboardDescription:
      "Manage rounds, cards, official moments and winners.",
    roundControl: "Round control",
    setupTitle: "Create free Office Bingo",
    setupDescription:
      "Start a free 3x3 Office Bingo with a safe general office template. You can generate cards after setup.",
    freeTemplateTitle: "General Office Bingo",
    freeTemplateDescription:
      "Includes general office moments such as coffee, late arrivals, forgotten items and harmless office chaos.",
    createBingo: "Start free Office Bingo",
    memberNoticeTitle: "Host controls are hidden",
    memberNoticeDescription:
      "Only the pool host can create cards and mark official moments. Go back to the pool dashboard to view your card.",
    goBack: "Go back",
    generateCards: "Generate / update cards",
    generateDescription:
      "Generate one unique card for every pool member that does not have a card yet.",
    completedGenerateDescription:
      "This round is completed. Cards are locked for this round.",
    completedTitle: "Round completed",
    completedDescription:
      "A full card winner has been found. Prepare the next round when you are ready.",
    prepareNextRound: "Prepare next round",
    nextRoundDescription:
      "The next round starts as a draft with the same moments. You can review everything before generating new cards.",
    officialMoments: "Official moments",
    officialMomentsDescription:
      "Use these buttons as the official source of truth. Members cannot mark their own card.",
    completedMomentsDescription:
      "This round is completed. Official moments are locked.",
    called: "Called",
    notCalled: "Not called",
    markCalled: "Mark called",
    undo: "Undo",
    locked: "Locked",
    noItems: "No bingo moments found yet.",
    winners: "Winners",
    noWinners: "No winners yet.",
    lineBingo: "Line bingo",
    fullCard: "Full card",
    cards: "Cards",
    cardCount: "cards generated",
    status: "Status",
    round: "Round",
    target: "Target",
    plan: "Plan",
    active: "Active",
    draft: "Draft",
    published: "Published",
    completed: "Completed",
    expired: "Expired",
    archived: "Archived",
    unknownUserPrefix: "User",
  },
  nl: {
    dashboard: "Dashboard",
    backToPool: "Terug naar poule",
    officeBingo: "Office Bingo",
    hostDashboard: "Host dashboard",
    hostDashboardDescription:
      "Beheer rondes, kaarten, officiële momenten en winnaars.",
    roundControl: "Rondebeheer",
    setupTitle: "Gratis Office Bingo aanmaken",
    setupDescription:
      "Start een gratis 3x3 Office Bingo met een veilige algemene kantoor-template. Daarna kun je kaarten genereren.",
    freeTemplateTitle: "Algemene Office Bingo",
    freeTemplateDescription:
      "Met algemene kantoormomenten zoals koffie, te laat binnenkomen, iets vergeten en onschuldige kantoorchaos.",
    createBingo: "Gratis Office Bingo starten",
    memberNoticeTitle: "Hostbeheer is verborgen",
    memberNoticeDescription:
      "Alleen de poule host kan kaarten maken en officiële momenten afvinken. Ga terug naar het pouledashboard om je kaart te bekijken.",
    goBack: "Ga terug",
    generateCards: "Kaarten genereren / updaten",
    generateDescription:
      "Genereer één unieke kaart voor ieder poulelid dat nog geen kaart heeft.",
    completedGenerateDescription:
      "Deze ronde is afgerond. Kaarten zijn vergrendeld voor deze ronde.",
    completedTitle: "Ronde afgerond",
    completedDescription:
      "Er is een volle kaart winnaar gevonden. Bereid de volgende ronde voor wanneer je klaar bent.",
    prepareNextRound: "Nieuwe ronde voorbereiden",
    nextRoundDescription:
      "De volgende ronde start als concept met dezelfde momenten. Je kunt alles controleren voordat je nieuwe kaarten genereert.",
    officialMoments: "Officiële momenten",
    officialMomentsDescription:
      "Gebruik deze knoppen als officiële waarheid. Members kunnen hun eigen kaart niet afvinken.",
    completedMomentsDescription:
      "Deze ronde is afgerond. Officiële momenten zijn vergrendeld.",
    called: "Afgevinkt",
    notCalled: "Niet afgevinkt",
    markCalled: "Afvinken",
    undo: "Terugdraaien",
    locked: "Vergrendeld",
    noItems: "Nog geen bingo momenten gevonden.",
    winners: "Winnaars",
    noWinners: "Nog geen winnaars.",
    lineBingo: "Rij bingo",
    fullCard: "Volle kaart",
    cards: "Kaarten",
    cardCount: "kaarten gegenereerd",
    status: "Status",
    round: "Ronde",
    target: "Doel",
    plan: "Pakket",
    active: "Actief",
    draft: "Concept",
    published: "Gepubliceerd",
    completed: "Afgerond",
    expired: "Verlopen",
    archived: "Gearchiveerd",
    unknownUserPrefix: "Gebruiker",
  },
} satisfies Record<Language, Record<string, string>>;

function getStatusLabel(status: string, language: Language) {
  const t = copy[language];

  switch (status) {
    case "active":
      return t.active;
    case "draft":
      return t.draft;
    case "published":
      return t.published;
    case "completed":
      return t.completed;
    case "expired":
      return t.expired;
    case "archived":
      return t.archived;
    default:
      return status;
  }
}

function formatDateTime(value: string, language: Language) {
  return new Intl.DateTimeFormat(language === "nl" ? "nl-NL" : "en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Amsterdam",
  }).format(new Date(value));
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

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
      <span className="text-xs font-bold text-zinc-400">{label}</span>
      <span className="text-right text-sm font-black text-white">{value}</span>
    </div>
  );
}

function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description?: string;
}) {
  return (
    <div>
      <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-200">
        {eyebrow}
      </p>
      <h2 className="mt-2 text-2xl font-black tracking-tight text-white">
        {title}
      </h2>
      {description ? (
        <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">
          {description}
        </p>
      ) : null}
    </div>
  );
}

export default async function OfficeBingoPage({ params }: OfficeBingoPageProps) {
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
    .select("id, name, game_type")
    .eq("id", id)
    .maybeSingle();

  if (!pool || pool.game_type !== "office_bingo") {
    notFound();
  }

  const currentRole = membership?.role ?? "app_admin";
  const isPoolAdmin =
    isAppAdmin || currentRole === "owner" || currentRole === "admin";

  let event: OfficeBingoEventRow | null = null;
  let round: OfficeBingoRoundRow | null = null;
  let items: OfficeBingoItemRow[] = [];
  let calledItemIds = new Set<string>();
  let winners: OfficeBingoWinnerRow[] = [];
  let cardCount = 0;
  let profilesMap = new Map<string, string>();
  let roundHistory: OfficeBingoRoundHistoryRow[] = [];
  let roundHistoryWinners: OfficeBingoRoundHistoryWinnerRow[] = [];

  const { data: eventData } = await supabase
    .from("office_bingo_events")
    .select("id, pool_id, plan, status, target_name, expires_at")
    .eq("pool_id", pool.id)
    .maybeSingle();

  event = (eventData ?? null) as OfficeBingoEventRow | null;

  if (event) {
    const { data: roundHistoryData } = await supabase
      .from("office_bingo_rounds")
      .select("id, round_number, title, status, created_at")
      .eq("event_id", event.id)
      .order("round_number", { ascending: false });

    roundHistory = (roundHistoryData ?? []) as OfficeBingoRoundHistoryRow[];

    const latestRoundId = roundHistory[0]?.id ?? null;

    if (latestRoundId) {
      const { data: roundData } = await supabase
        .from("office_bingo_rounds")
        .select(
          "id, event_id, pool_id, round_number, title, status, grid_size, diagonal_enabled"
        )
        .eq("id", latestRoundId)
        .maybeSingle();

      round = (roundData ?? null) as OfficeBingoRoundRow | null;
    }

    const roundIds = roundHistory.map((historyRound) => historyRound.id);

    if (roundIds.length > 0) {
      const { data: historyWinnerData } = await supabase
        .from("office_bingo_winners")
        .select("round_id, user_id, win_type, won_at")
        .in("round_id", roundIds)
        .order("won_at", { ascending: true });

      const rawHistoryWinners = (historyWinnerData ?? []) as {
        round_id: string;
        user_id: string;
        win_type: "line" | "full_card";
        won_at: string;
      }[];

      const historyWinnerUserIds = [
        ...new Set(rawHistoryWinners.map((winner) => winner.user_id)),
      ];

      let historyProfilesMap = new Map<string, string>();

      if (historyWinnerUserIds.length > 0) {
        const { data: historyProfiles } = await supabase
          .from("profiles")
          .select("id, display_name")
          .in("id", historyWinnerUserIds);

        historyProfilesMap = new Map(
          (
            (historyProfiles ?? []) as {
              id: string;
              display_name: string | null;
            }[]
          ).map((profile) => [profile.id, profile.display_name ?? ""])
        );
      }

      roundHistoryWinners = rawHistoryWinners.map((winner) => ({
        ...winner,
        display_name:
          historyProfilesMap.get(winner.user_id)?.trim() ||
          `${copy[language].unknownUserPrefix} ${winner.user_id.slice(0, 8)}`,
      }));
    }
  }

  if (round) {
    const { data: itemData } = await supabase
      .from("office_bingo_items")
      .select("id, label, sort_order")
      .eq("round_id", round.id)
      .order("sort_order", { ascending: true });

    items = (itemData ?? []) as OfficeBingoItemRow[];

    const { data: calledData } = await supabase
      .from("office_bingo_called_items")
      .select("item_id")
      .eq("round_id", round.id);

    const calledRows = (calledData ?? []) as OfficeBingoCalledItemRow[];
    calledItemIds = new Set(calledRows.map((item) => item.item_id));

    const { data: cardData, count } = await supabase
      .from("office_bingo_cards")
      .select("id", { count: "exact" })
      .eq("round_id", round.id);

    cardCount = count ?? (cardData ?? []).length;

    const { data: winnerData } = await supabase
      .from("office_bingo_winners")
      .select("id, user_id, win_type, won_at")
      .eq("round_id", round.id)
      .order("won_at", { ascending: true });

    winners = (winnerData ?? []) as OfficeBingoWinnerRow[];

    const winnerUserIds = [...new Set(winners.map((winner) => winner.user_id))];

    if (winnerUserIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, display_name")
        .in("id", winnerUserIds);

      profilesMap = new Map(
        ((profiles ?? []) as { id: string; display_name: string | null }[]).map(
          (profile) => [profile.id, profile.display_name ?? ""]
        )
      );
    }
  }

  const generateCards = generateOfficeBingoCardsAction.bind(null, pool.id);
  const createNextRound = createNextOfficeBingoRoundAction.bind(null, pool.id);
  const isCompleted =
    round?.status === "completed" || event?.status === "completed";

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

              <div className="flex items-center gap-2">
                <Link
                  href={`/pools/${pool.id}`}
                  className="rounded-full border border-white/15 bg-white/5 px-3.5 py-2 text-xs font-bold text-white/90 backdrop-blur transition hover:bg-white/10 sm:text-sm"
                >
                  {t.backToPool}
                </Link>

                <Link
                  href="/dashboard"
                  className="hidden rounded-full border border-white/15 bg-white/5 px-3.5 py-2 text-xs font-bold text-white/90 backdrop-blur transition hover:bg-white/10 sm:inline-flex sm:text-sm"
                >
                  {t.dashboard}
                </Link>
              </div>
            </header>

            <div className="mx-auto mt-4 flex max-w-6xl flex-col gap-4">
              <section className="rounded-[1.5rem] border border-white/10 bg-white/[0.045] p-4 shadow-2xl backdrop-blur-xl sm:p-5">
                <div className="grid gap-5 lg:grid-cols-[1fr_360px] lg:items-center">
                  <div className="flex min-h-[150px] flex-col justify-center">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full border border-emerald-300/25 bg-emerald-300/10 px-3 py-1.5 text-xs font-black text-emerald-100">
                        {t.officeBingo}
                      </span>

                      <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1.5 text-xs font-black text-zinc-300">
                        {pool.name}
                      </span>
                    </div>

                    <h1 className="mt-4 text-3xl font-black tracking-tight text-white sm:text-4xl">
                      {t.hostDashboard}
                    </h1>

                    <p className="mt-2 max-w-xl text-sm leading-6 text-zinc-400">
                      {t.hostDashboardDescription}
                    </p>
                  </div>

                  {event && round ? (
                    <div className="grid gap-2">
                      <InfoRow
                        label={t.status}
                        value={getStatusLabel(round.status, language)}
                      />
                      <InfoRow label={t.round} value={round.title} />
                      <InfoRow
                        label={t.target}
                        value={event.target_name ?? "-"}
                      />
                      <InfoRow label={t.plan} value={event.plan} />
                    </div>
                  ) : null}
                </div>
              </section>

              {!isPoolAdmin ? (
                <section className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-5 text-center backdrop-blur-xl">
                  <h2 className="text-2xl font-black tracking-tight text-white">
                    {t.memberNoticeTitle}
                  </h2>
                  <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-zinc-400">
                    {t.memberNoticeDescription}
                  </p>
                  <Link
                    href={`/pools/${pool.id}`}
                    className="mt-4 inline-flex rounded-2xl bg-emerald-300 px-5 py-3 text-sm font-black text-zinc-950 transition hover:bg-emerald-200"
                  >
                    {t.goBack}
                  </Link>
                </section>
              ) : !event || !round ? (
                <section className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl">
                  <SectionHeading
                    eyebrow={t.officeBingo}
                    title={t.setupTitle}
                    description={t.setupDescription}
                  />

                  <div className="mt-5 rounded-2xl border border-emerald-300/20 bg-emerald-300/10 p-4 sm:max-w-xl">
                    <p className="text-sm font-black text-emerald-100">
                      {t.freeTemplateTitle}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-emerald-50/75">
                      {t.freeTemplateDescription}
                    </p>
                  </div>

                  <form
                    action={createFreeOfficeBingoAction.bind(null, pool.id)}
                    className="mt-4 grid gap-3 sm:max-w-xl"
                  >
                    <input type="hidden" name="targetName" value="" />

                    <button
                      type="submit"
                      className="rounded-2xl bg-emerald-300 px-5 py-3 text-sm font-black text-zinc-950 transition hover:bg-emerald-200"
                    >
                      {t.createBingo}
                    </button>
                  </form>
                </section>
              ) : (
                <>
                  <section className="grid gap-4 lg:grid-cols-[0.85fr_1.15fr]">
                    <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl">
                      <SectionHeading
                        eyebrow={t.roundControl}
                        title={
                          isCompleted
                            ? t.completedTitle
                            : `${getStatusLabel(round.status, language)} · ${
                                round.title
                              }`
                        }
                        description={
                          isCompleted
                            ? t.completedDescription
                            : t.nextRoundDescription
                        }
                      />

                      {isCompleted ? (
                        <form action={createNextRound} className="mt-5">
                          <button
                            type="submit"
                            className="w-full rounded-2xl bg-emerald-300 px-5 py-3 text-sm font-black text-zinc-950 transition hover:bg-emerald-200"
                          >
                            {t.prepareNextRound}
                          </button>
                        </form>
                      ) : (
                        <div className="mt-5 rounded-2xl border border-emerald-300/20 bg-emerald-300/10 p-4">
                          <p className="text-sm font-bold leading-6 text-emerald-50/80">
                            {t.officialMomentsDescription}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl">
                        <SectionHeading
                          eyebrow={t.cards}
                          title={`${cardCount} ${t.cardCount}`}
                          description={
                            isCompleted
                              ? t.completedGenerateDescription
                              : t.generateDescription
                          }
                        />

                        <form action={generateCards} className="mt-5">
                          <button
                            type="submit"
                            disabled={isCompleted}
                            className={`w-full rounded-2xl px-5 py-3 text-sm font-black transition ${
                              isCompleted
                                ? "cursor-not-allowed bg-zinc-700 text-zinc-400"
                                : "bg-emerald-300 text-zinc-950 hover:bg-emerald-200"
                            }`}
                          >
                            {isCompleted ? t.locked : t.generateCards}
                          </button>
                        </form>
                      </div>

                      <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl">
                        <SectionHeading eyebrow={t.winners} title={t.winners} />

                        {winners.length > 0 ? (
                          <div className="mt-4 grid gap-2">
                            {winners.map((winner) => (
                              <div
                                key={winner.id}
                                className={`rounded-2xl border p-3 ${
                                  winner.win_type === "full_card"
                                    ? "border-emerald-300/35 bg-emerald-300/[0.12]"
                                    : "border-white/10 bg-black/20"
                                }`}
                              >
                                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-emerald-200">
                                  {winner.win_type === "full_card"
                                    ? t.fullCard
                                    : t.lineBingo}
                                </p>
                                <p className="mt-1 text-sm font-black text-white">
                                  {getDisplayName(
                                    winner.user_id,
                                    profilesMap,
                                    language
                                  )}
                                </p>
                                <p className="mt-1 text-xs font-semibold text-zinc-500">
                                  {formatDateTime(winner.won_at, language)}
                                </p>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="mt-3 text-sm leading-6 text-zinc-400">
                            {t.noWinners}
                          </p>
                        )}
                      </div>
                    </div>
                  </section>

                  <section className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl">
                    <SectionHeading
                      eyebrow={t.officialMoments}
                      title={t.officialMoments}
                      description={
                        isCompleted
                          ? t.completedMomentsDescription
                          : t.officialMomentsDescription
                      }
                    />

                    {items.length > 0 ? (
                      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {items.map((item) => {
                          const isCalled = calledItemIds.has(item.id);
                          const action = isCalled
                            ? uncallOfficeBingoItemAction.bind(null, pool.id)
                            : callOfficeBingoItemAction.bind(null, pool.id);

                          return (
                            <form key={item.id} action={action}>
                              <input
                                type="hidden"
                                name="itemId"
                                value={item.id}
                              />

                              <button
                                type="submit"
                                disabled={isCompleted}
                                className={`group flex min-h-[132px] w-full flex-col justify-between rounded-2xl border p-4 text-left transition active:scale-[0.99] ${
                                  isCompleted
                                    ? "cursor-not-allowed border-white/10 bg-black/20 opacity-70"
                                    : isCalled
                                    ? "border-emerald-300/40 bg-emerald-300/[0.14] hover:bg-emerald-300/[0.18]"
                                    : "border-white/10 bg-black/20 hover:border-emerald-300/30 hover:bg-emerald-300/[0.06]"
                                }`}
                              >
                                <div>
                                  <p
                                    className={`text-[10px] font-black uppercase tracking-[0.18em] ${
                                      isCalled
                                        ? "text-emerald-200"
                                        : "text-zinc-500"
                                    }`}
                                  >
                                    {isCalled ? t.called : t.notCalled}
                                  </p>
                                  <h3 className="mt-2 text-base font-black leading-5 text-white">
                                    {item.label}
                                  </h3>
                                </div>

                                <span
                                  className={`mt-4 inline-flex w-fit rounded-full border px-3 py-1.5 text-xs font-black ${
                                    isCompleted
                                      ? "border-white/10 bg-white/[0.04] text-zinc-400"
                                      : isCalled
                                      ? "border-white/10 bg-black/20 text-white"
                                      : "border-emerald-300/25 bg-emerald-300/10 text-emerald-100"
                                  }`}
                                >
                                  {isCompleted
                                    ? t.locked
                                    : isCalled
                                    ? t.undo
                                    : t.markCalled}
                                </span>
                              </button>
                            </form>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-5 text-center">
                        <p className="text-sm font-semibold text-zinc-400">
                          {t.noItems}
                        </p>
                      </div>
                    )}
                  </section>

                  <OfficeBingoRoundHistory
                    language={language}
                    rounds={roundHistory}
                    currentRoundId={round.id}
                    winners={roundHistoryWinners}
                  />
                </>
              )}
            </div>
          </div>
        </Container>
      </section>
    </main>
  );
}