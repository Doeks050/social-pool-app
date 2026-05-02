import Image from "next/image";
import { unstable_noStore as noStore } from "next/cache";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import Container from "@/components/Container";
import { createClient } from "@/lib/supabase";
import { getLanguageFromCookieValue, type Language } from "@/lib/i18n";
import {
  callOfficeBingoItemAction,
  createFreeOfficeBingoAction,
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

type OfficeBingoCardRow = {
  id: string;
};

const copy = {
  en: {
    dashboard: "Dashboard",
    backToPool: "Back to pool",
    officeBingo: "Office Bingo",
    hostDashboard: "Host dashboard",
    setupTitle: "Create Office Bingo",
    setupDescription:
      "Create the first free 3x3 Office Bingo round. Cards can be generated after setup.",
    targetLabel: "Who is this bingo about?",
    targetPlaceholder: "For example: Alex",
    createBingo: "Create Office Bingo",
    memberNoticeTitle: "Host controls are hidden",
    memberNoticeDescription:
      "Only the pool host can create cards and mark official moments. Go back to the pool dashboard to view your card.",
    goBack: "Go back",
    generateCards: "Generate / update cards",
    generateDescription:
      "Creates one unique card for every pool member that does not have a card yet.",
    officialMoments: "Official moments",
    officialMomentsDescription:
      "Click a moment to mark it as officially happened. Click again to undo.",
    called: "Called",
    notCalled: "Not called",
    markCalled: "Mark called",
    undo: "Undo",
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
    setupTitle: "Office Bingo aanmaken",
    setupDescription:
      "Maak de eerste gratis 3x3 Office Bingo ronde aan. Daarna kun je kaarten genereren.",
    targetLabel: "Over wie gaat deze bingo?",
    targetPlaceholder: "Bijvoorbeeld: Alex",
    createBingo: "Office Bingo aanmaken",
    memberNoticeTitle: "Hostbeheer is verborgen",
    memberNoticeDescription:
      "Alleen de poule host kan kaarten maken en officiële momenten afvinken. Ga terug naar het pouledashboard om je kaart te bekijken.",
    goBack: "Ga terug",
    generateCards: "Kaarten genereren / updaten",
    generateDescription:
      "Maakt één unieke kaart voor ieder poulelid dat nog geen kaart heeft.",
    officialMoments: "Officiële momenten",
    officialMomentsDescription:
      "Klik op een moment om hem officieel af te vinken. Klik opnieuw om terug te draaien.",
    called: "Afgevinkt",
    notCalled: "Niet afgevinkt",
    markCalled: "Afvinken",
    undo: "Terugdraaien",
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

  const { data: eventData } = await supabase
    .from("office_bingo_events")
    .select("id, pool_id, plan, status, target_name, expires_at")
    .eq("pool_id", pool.id)
    .maybeSingle();

  event = (eventData ?? null) as OfficeBingoEventRow | null;

  if (event) {
    const { data: roundData } = await supabase
      .from("office_bingo_rounds")
      .select(
        "id, event_id, pool_id, round_number, title, status, grid_size, diagonal_enabled"
      )
      .eq("event_id", event.id)
      .eq("round_number", 1)
      .maybeSingle();

    round = (roundData ?? null) as OfficeBingoRoundRow | null;
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
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-200">
                      {t.officeBingo}
                    </p>
                    <h1 className="mt-1 text-3xl font-black tracking-tight text-white sm:text-4xl">
                      {t.hostDashboard}
                    </h1>
                    <p className="mt-1 text-sm font-semibold text-zinc-400">
                      {pool.name}
                    </p>
                  </div>

                  {event && round ? (
                    <div className="grid gap-2 sm:min-w-[320px]">
                      <InfoRow
                        label={t.status}
                        value={getStatusLabel(round.status, language)}
                      />
                      <InfoRow label={t.target} value={event.target_name ?? "-"} />
                      <InfoRow label={t.round} value={round.title} />
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
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-200">
                    {t.setupTitle}
                  </p>
                  <h2 className="mt-2 text-2xl font-black tracking-tight text-white">
                    {t.setupTitle}
                  </h2>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">
                    {t.setupDescription}
                  </p>

                  <form
                    action={createFreeOfficeBingoAction.bind(null, pool.id)}
                    className="mt-5 grid gap-3 sm:max-w-xl"
                  >
                    <label className="grid gap-2">
                      <span className="text-sm font-bold text-zinc-300">
                        {t.targetLabel}
                      </span>
                      <input
                        name="targetName"
                        type="text"
                        required
                        maxLength={60}
                        placeholder={t.targetPlaceholder}
                        className="rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm font-semibold text-white outline-none transition placeholder:text-zinc-600 focus:border-emerald-300/50"
                      />
                    </label>

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
                  <section className="grid gap-4 lg:grid-cols-[0.75fr_1.25fr]">
                    <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl">
                      <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-200">
                        {t.cards}
                      </p>
                      <h2 className="mt-2 text-2xl font-black tracking-tight text-white">
                        {cardCount} {t.cardCount}
                      </h2>
                      <p className="mt-2 text-sm leading-6 text-zinc-400">
                        {t.generateDescription}
                      </p>

                      <form action={generateCards} className="mt-5">
                        <button
                          type="submit"
                          className="w-full rounded-2xl bg-emerald-300 px-5 py-3 text-sm font-black text-zinc-950 transition hover:bg-emerald-200"
                        >
                          {t.generateCards}
                        </button>
                      </form>
                    </div>

                    <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl">
                      <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-200">
                        {t.winners}
                      </p>

                      {winners.length > 0 ? (
                        <div className="mt-4 grid gap-2">
                          {winners.map((winner) => (
                            <div
                              key={winner.id}
                              className="rounded-2xl border border-white/10 bg-black/20 p-3"
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
                  </section>

                  <section className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl">
                    <div className="mb-4">
                      <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-200">
                        {t.officialMoments}
                      </p>
                      <h2 className="mt-2 text-2xl font-black tracking-tight text-white">
                        {t.officialMoments}
                      </h2>
                      <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">
                        {t.officialMomentsDescription}
                      </p>
                    </div>

                    {items.length > 0 ? (
                      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
                                className={`group flex min-h-[132px] w-full flex-col justify-between rounded-2xl border p-4 text-left transition active:scale-[0.99] ${
                                  isCalled
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
                                    isCalled
                                      ? "border-white/10 bg-black/20 text-white"
                                      : "border-emerald-300/25 bg-emerald-300/10 text-emerald-100"
                                  }`}
                                >
                                  {isCalled ? t.undo : t.markCalled}
                                </span>
                              </button>
                            </form>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="rounded-2xl border border-white/10 bg-black/20 p-5 text-center">
                        <p className="text-sm font-semibold text-zinc-400">
                          {t.noItems}
                        </p>
                      </div>
                    )}
                  </section>
                </>
              )}
            </div>
          </div>
        </Container>
      </section>
    </main>
  );
}