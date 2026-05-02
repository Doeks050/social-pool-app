import Image from "next/image";
import Link from "next/link";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { unstable_noStore as noStore } from "next/cache";
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

type PoolRow = {
  id: string;
  name: string;
  game_type: string;
  invite_code: string;
};

type MembershipRow = {
  role: string;
};

type ProfileRow = {
  id: string;
  display_name: string | null;
};

type PoolMemberRow = {
  user_id: string;
  role: string;
  joined_at: string;
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
  called_at: string;
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
    backToPool: "Back to pool",
    officeBingo: "Office Bingo",
    setupTitle: "Create your Office Bingo",
    setupIntro:
      "Enter the colleague name. The free version uses a fixed 3x3 card with safe office humor.",
    colleagueName: "Colleague name",
    colleaguePlaceholder: "For example: Mark",
    createBingo: "Create Office Bingo",
    eventInfo: "Game info",
    plan: "Plan",
    status: "Status",
    expires: "Expires",
    joinCode: "Join code",
    adminPanel: "Admin panel",
    generateCards: "Generate cards for members",
    calledItems: "Official results",
    calledItemsIntro:
      "Only the host/admin marks what officially happened. Cards update from these results.",
    mark: "Mark",
    undo: "Undo",
    playerCard: "Your card",
    noCard:
      "Your card is not generated yet. Ask the host to generate cards after members joined.",
    winners: "Winners",
    noWinners: "No winners yet.",
    lineBingo: "Line bingo",
    fullCard: "Full card",
    members: "members",
    cardsGenerated: "cards generated",
    setupNeeded: "Setup needed",
    active: "Active",
    draft: "Draft",
    published: "Published",
    completed: "Completed",
    expired: "Expired",
    archived: "Archived",
    unknownUserPrefix: "User",
    called: "Called",
    notCalled: "Not called",
  },
  nl: {
    dashboard: "Dashboard",
    backToPool: "Terug naar poule",
    officeBingo: "Office Bingo",
    setupTitle: "Maak je Office Bingo",
    setupIntro:
      "Vul de naam van de collega in. De gratis versie gebruikt een vaste 3x3 kaart met veilige kantoorhumor.",
    colleagueName: "Naam collega",
    colleaguePlaceholder: "Bijvoorbeeld: Mark",
    createBingo: "Office Bingo maken",
    eventInfo: "Spelinfo",
    plan: "Pakket",
    status: "Status",
    expires: "Verloopt",
    joinCode: "Join code",
    adminPanel: "Admin paneel",
    generateCards: "Kaarten maken voor leden",
    calledItems: "Officiële resultaten",
    calledItemsIntro:
      "Alleen de host/admin vinkt af wat officieel is gebeurd. Kaarten worden bijgewerkt op basis van deze resultaten.",
    mark: "Afvinken",
    undo: "Terugzetten",
    playerCard: "Jouw kaart",
    noCard:
      "Jouw kaart is nog niet gemaakt. Vraag de host om kaarten te maken nadat leden zijn gejoined.",
    winners: "Winnaars",
    noWinners: "Nog geen winnaars.",
    lineBingo: "Rij bingo",
    fullCard: "Volle kaart",
    members: "leden",
    cardsGenerated: "kaarten gemaakt",
    setupNeeded: "Instellen nodig",
    active: "Actief",
    draft: "Concept",
    published: "Gepubliceerd",
    completed: "Afgerond",
    expired: "Verlopen",
    archived: "Gearchiveerd",
    unknownUserPrefix: "Gebruiker",
    called: "Afgevinkt",
    notCalled: "Niet afgevinkt",
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

function formatDate(value: string, language: Language) {
  return new Intl.DateTimeFormat(language === "nl" ? "nl-NL" : "en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
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

function getCellLabel(cell: OfficeBingoCardCellRow) {
  const item = Array.isArray(cell.office_bingo_items)
    ? cell.office_bingo_items[0]
    : cell.office_bingo_items;

  return item?.label ?? "";
}

function SetupForm({
  poolId,
  language,
}: {
  poolId: string;
  language: Language;
}) {
  const t = copy[language];
  const action = createFreeOfficeBingoAction.bind(null, poolId);

  return (
    <section className="rounded-[1.5rem] border border-white/10 bg-white/[0.045] p-4 shadow-2xl backdrop-blur-xl sm:p-5">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-200">
          {t.setupNeeded}
        </p>

        <h1 className="mt-2 text-3xl font-black tracking-tight text-white sm:text-4xl">
          {t.setupTitle}
        </h1>

        <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-zinc-400">
          {t.setupIntro}
        </p>
      </div>

      <form action={action} className="mx-auto mt-6 max-w-xl">
        <label
          htmlFor="targetName"
          className="text-xs font-black uppercase tracking-[0.18em] text-zinc-400"
        >
          {t.colleagueName}
        </label>

        <input
          id="targetName"
          name="targetName"
          type="text"
          required
          maxLength={40}
          placeholder={t.colleaguePlaceholder}
          className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-base font-bold text-white outline-none transition placeholder:text-zinc-600 focus:border-emerald-300/50"
        />

        <button
          type="submit"
          className="mt-4 w-full rounded-2xl bg-emerald-300 px-5 py-3 text-sm font-black text-zinc-950 transition hover:bg-emerald-200"
        >
          {t.createBingo}
        </button>
      </form>
    </section>
  );
}

function InfoPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">
        {label}
      </p>
      <p className="mt-1 text-sm font-black text-white">{value}</p>
    </div>
  );
}

function WinnerBadge({
  winner,
  displayName,
  language,
}: {
  winner: OfficeBingoWinnerRow;
  displayName: string;
  language: Language;
}) {
  const t = copy[language];
  const isFullCard = winner.win_type === "full_card";

  return (
    <div
      className={`rounded-2xl border p-4 ${
        isFullCard
          ? "border-amber-300/35 bg-amber-300/[0.10]"
          : "border-emerald-300/30 bg-emerald-300/[0.08]"
      }`}
    >
      <p
        className={`text-[10px] font-black uppercase tracking-[0.18em] ${
          isFullCard ? "text-amber-200" : "text-emerald-200"
        }`}
      >
        {isFullCard ? t.fullCard : t.lineBingo}
      </p>
      <p className="mt-1 text-base font-black text-white">{displayName}</p>
      <p className="mt-1 text-xs font-semibold text-zinc-500">
        {formatDate(winner.won_at, language)}
      </p>
    </div>
  );
}

export default async function OfficeBingoPage({
  params,
}: OfficeBingoPageProps) {
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

  const typedMembership = membership as MembershipRow;
  const isAdmin = ["owner", "admin"].includes(typedMembership.role);

  const { data: pool } = await supabase
    .from("pools")
    .select("id, name, game_type, invite_code")
    .eq("id", id)
    .maybeSingle();

  if (!pool) {
    notFound();
  }

  const typedPool = pool as PoolRow;

  if (typedPool.game_type !== "office_bingo") {
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

  const { data: event } = await supabase
    .from("office_bingo_events")
    .select("id, pool_id, plan, status, target_name, expires_at")
    .eq("pool_id", id)
    .maybeSingle();

  const typedEvent = (event ?? null) as OfficeBingoEventRow | null;

  let round: OfficeBingoRoundRow | null = null;
  let items: OfficeBingoItemRow[] = [];
  let calledItemIds = new Set<string>();
  let winners: OfficeBingoWinnerRow[] = [];
  let userCard: OfficeBingoCardRow | null = null;
  let userCardCells: OfficeBingoCardCellRow[] = [];
  let cardCount = 0;

  if (typedEvent) {
    const { data: roundData } = await supabase
      .from("office_bingo_rounds")
      .select(
        "id, event_id, pool_id, round_number, title, status, grid_size, diagonal_enabled"
      )
      .eq("event_id", typedEvent.id)
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
      .select("item_id, called_at")
      .eq("round_id", round.id);

    const calledItems = (calledData ?? []) as OfficeBingoCalledItemRow[];
    calledItemIds = new Set(calledItems.map((item) => item.item_id));

    const { data: winnerData } = await supabase
      .from("office_bingo_winners")
      .select("id, user_id, win_type, winning_positions, won_at")
      .eq("round_id", round.id)
      .order("won_at", { ascending: true });

    winners = (winnerData ?? []) as OfficeBingoWinnerRow[];

    const { count } = await supabase
      .from("office_bingo_cards")
      .select("id", { count: "exact", head: true })
      .eq("round_id", round.id);

    cardCount = count ?? 0;

    const { data: cardData } = await supabase
      .from("office_bingo_cards")
      .select("id, user_id")
      .eq("round_id", round.id)
      .eq("user_id", user.id)
      .maybeSingle();

    userCard = (cardData ?? null) as OfficeBingoCardRow | null;

    if (userCard) {
      const { data: cellData } = await supabase
        .from("office_bingo_card_cells")
        .select(
          "id, card_id, item_id, position_index, office_bingo_items(label)"
        )
        .eq("card_id", userCard.id)
        .order("position_index", { ascending: true });

      userCardCells = (cellData ?? []) as OfficeBingoCardCellRow[];
    }
  }

  const generateCardsAction = generateOfficeBingoCardsAction.bind(null, id);

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
                  href={`/pools/${id}`}
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

                    <h1 className="mt-2 text-3xl font-black tracking-tight text-white sm:text-4xl">
                      {typedPool.name}
                    </h1>
                  </div>

                  <div className="rounded-2xl border border-emerald-300/20 bg-emerald-300/10 px-4 py-3">
                    <p className="text-[10px] font-black uppercase tracking-[0.22em] text-emerald-200">
                      {t.joinCode}
                    </p>
                    <p className="mt-1 text-2xl font-black tracking-widest text-white">
                      {typedPool.invite_code}
                    </p>
                  </div>
                </div>
              </section>

              {!typedEvent || !round ? (
                isAdmin ? (
                  <SetupForm poolId={id} language={language} />
                ) : (
                  <section className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-6 text-center backdrop-blur-xl">
                    <h2 className="text-2xl font-black text-white">
                      {t.setupNeeded}
                    </h2>
                    <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-zinc-400">
                      {language === "nl"
                        ? "De host moet deze Office Bingo nog instellen."
                        : "The host still needs to set up this Office Bingo."}
                    </p>
                  </section>
                )
              ) : (
                <>
                  <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <InfoPill label={t.plan} value={typedEvent.plan} />
                    <InfoPill
                      label={t.status}
                      value={getStatusLabel(round.status, language)}
                    />
                    <InfoPill
                      label={t.expires}
                      value={formatDate(typedEvent.expires_at, language)}
                    />
                    <InfoPill
                      label={t.members}
                      value={`${typedMembers.length} ${t.members} · ${cardCount} ${t.cardsGenerated}`}
                    />
                  </section>

                  {isAdmin ? (
                    <section className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4 backdrop-blur-xl sm:p-5">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-200">
                            {t.adminPanel}
                          </p>
                          <h2 className="mt-1 text-2xl font-black tracking-tight text-white">
                            {round.title}
                          </h2>
                        </div>

                        <form action={generateCardsAction}>
                          <button
                            type="submit"
                            className="w-full rounded-2xl bg-emerald-300 px-5 py-3 text-sm font-black text-zinc-950 transition hover:bg-emerald-200 sm:w-auto"
                          >
                            {t.generateCards}
                          </button>
                        </form>
                      </div>
                    </section>
                  ) : null}

                  <section className="grid gap-4 lg:grid-cols-[1fr_380px]">
                    <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4 backdrop-blur-xl sm:p-5">
                      <div className="mb-4">
                        <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-200">
                          {t.calledItems}
                        </p>
                        <p className="mt-2 text-sm leading-6 text-zinc-400">
                          {t.calledItemsIntro}
                        </p>
                      </div>

                      <div className="grid gap-2">
                        {items.map((item) => {
                          const isCalled = calledItemIds.has(item.id);
                          const action = isCalled
                            ? uncallOfficeBingoItemAction.bind(null, id)
                            : callOfficeBingoItemAction.bind(null, id);

                          return (
                            <div
                              key={item.id}
                              className={`rounded-2xl border p-3 ${
                                isCalled
                                  ? "border-emerald-300/30 bg-emerald-300/[0.08]"
                                  : "border-white/10 bg-black/20"
                              }`}
                            >
                              <div className="flex items-center justify-between gap-3">
                                <div className="min-w-0">
                                  <p className="text-sm font-black text-white">
                                    {item.label}
                                  </p>
                                  <p
                                    className={`mt-1 text-[10px] font-black uppercase tracking-[0.16em] ${
                                      isCalled
                                        ? "text-emerald-200"
                                        : "text-zinc-500"
                                    }`}
                                  >
                                    {isCalled ? t.called : t.notCalled}
                                  </p>
                                </div>

                                {isAdmin ? (
                                  <form action={action}>
                                    <input
                                      type="hidden"
                                      name="itemId"
                                      value={item.id}
                                    />
                                    <button
                                      type="submit"
                                      className={`rounded-xl px-3 py-2 text-xs font-black transition ${
                                        isCalled
                                          ? "border border-white/10 bg-white/5 text-zinc-200 hover:bg-white/10"
                                          : "bg-emerald-300 text-zinc-950 hover:bg-emerald-200"
                                      }`}
                                    >
                                      {isCalled ? t.undo : t.mark}
                                    </button>
                                  </form>
                                ) : null}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="flex flex-col gap-4">
                      <section className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4 backdrop-blur-xl sm:p-5">
                        <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-200">
                          {t.playerCard}
                        </p>

                        {userCard && userCardCells.length > 0 ? (
                          <div
                            className="mt-4 grid gap-2"
                            style={{
                              gridTemplateColumns: `repeat(${round.grid_size}, minmax(0, 1fr))`,
                            }}
                          >
                            {userCardCells.map((cell) => {
                              const isCalled = calledItemIds.has(cell.item_id);

                              return (
                                <div
                                  key={cell.id}
                                  className={`flex aspect-square items-center justify-center rounded-2xl border p-2 text-center text-[11px] font-black leading-tight sm:text-xs ${
                                    isCalled
                                      ? "border-emerald-300/40 bg-emerald-300/[0.14] text-emerald-50"
                                      : "border-white/10 bg-black/25 text-zinc-200"
                                  }`}
                                >
                                  {getCellLabel(cell)}
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <p className="mt-3 text-sm leading-6 text-zinc-400">
                            {t.noCard}
                          </p>
                        )}
                      </section>

                      <section className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4 backdrop-blur-xl sm:p-5">
                        <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-200">
                          {t.winners}
                        </p>

                        {winners.length > 0 ? (
                          <div className="mt-4 grid gap-3">
                            {winners.map((winner) => (
                              <WinnerBadge
                                key={winner.id}
                                winner={winner}
                                displayName={getDisplayName(
                                  winner.user_id,
                                  profilesMap,
                                  language
                                )}
                                language={language}
                              />
                            ))}
                          </div>
                        ) : (
                          <p className="mt-3 text-sm leading-6 text-zinc-400">
                            {t.noWinners}
                          </p>
                        )}
                      </section>
                    </div>
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