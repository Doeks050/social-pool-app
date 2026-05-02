import Link from "next/link";
import type { Language } from "@/lib/i18n";
import { sendOfficeBingoMessageAction } from "@/app/pools/[id]/office-bingo/actions";

export type OfficeBingoDashboardPool = {
  id: string;
  name: string;
};

export type OfficeBingoDashboardEvent = {
  id: string;
  plan: string;
  status: string;
  target_name: string | null;
  expires_at: string;
};

export type OfficeBingoDashboardRound = {
  id: string;
  title: string;
  status: string;
  grid_size: number;
};

export type OfficeBingoDashboardCardCell = {
  id: string;
  item_id: string;
  position_index: number;
  label: string;
};

export type OfficeBingoDashboardWinner = {
  id: string;
  user_id: string;
  display_name: string;
  win_type: "line" | "full_card";
  won_at: string;
};

export type OfficeBingoDashboardMessage = {
  id: string;
  user_id: string;
  display_name: string;
  message: string;
  created_at: string;
};

export type OfficeBingoDashboardProps = {
  pool: OfficeBingoDashboardPool;
  language: Language;
  isHost: boolean;
  event: OfficeBingoDashboardEvent | null;
  round: OfficeBingoDashboardRound | null;
  calledItemIds: string[];
  calledLabels: string[];
  winners: OfficeBingoDashboardWinner[];
  messages: OfficeBingoDashboardMessage[];
  cardCells: OfficeBingoDashboardCardCell[];
};

type LeaderboardRow = {
  userId: string;
  displayName: string;
  lineWins: number;
  fullCardWins: number;
  points: number;
};

const copy = {
  en: {
    officeBingo: "Office Bingo",
    hostDashboard: "Host dashboard",
    openHostDashboard: "Open host dashboard",
    hostSetupTitle: "Office Bingo is not set up yet",
    hostSetupDescription:
      "Create the first round and generate cards from the host dashboard.",
    memberSetupTitle: "Office Bingo is not ready yet",
    memberSetupDescription: "The host still needs to set up this Office Bingo.",
    myCard: "My card",
    myCardIntro: "Your live Office Bingo card.",
    completedCardIntro: "This round is completed. Your card is now locked.",
    completedTitle: "Round completed",
    completedDescription:
      "A full card winner has been found. This Office Bingo is now closed.",
    fullCardWinnerKnown: "Full card winner known",
    noCardTitle: "No card yet",
    noCardDescription:
      "The host still needs to start or update cards for this round.",
    gameStatus: "Game status",
    status: "Status",
    target: "Target",
    round: "Round",
    plan: "Plan",
    winners: "Winners",
    noWinners: "No winners yet.",
    lineBingo: "Line bingo",
    fullCard: "Full card",
    calledMoments: "Called moments",
    noCalledMoments: "No moments have been called yet.",
    leaderboard: "Leaderboard",
    noLeaderboard: "No leaderboard yet. Winners will appear here automatically.",
    points: "pts",
    lineShort: "line",
    fullShort: "full",
    chat: "Chat",
    noMessages: "No messages yet.",
    messagePlaceholder: "Type a message...",
    send: "Send",
    active: "Active",
    draft: "Draft",
    published: "Published",
    completed: "Completed",
    expired: "Expired",
    archived: "Archived",
  },
  nl: {
    officeBingo: "Office Bingo",
    hostDashboard: "Host dashboard",
    openHostDashboard: "Open host dashboard",
    hostSetupTitle: "Office Bingo is nog niet ingesteld",
    hostSetupDescription:
      "Maak de eerste ronde en genereer kaarten via het host dashboard.",
    memberSetupTitle: "Office Bingo is nog niet klaar",
    memberSetupDescription: "De host moet deze Office Bingo nog instellen.",
    myCard: "Mijn kaart",
    myCardIntro: "Jouw live Office Bingo kaart.",
    completedCardIntro: "Deze ronde is afgerond. Je kaart is nu vergrendeld.",
    completedTitle: "Ronde afgerond",
    completedDescription:
      "Er is een volle kaart winnaar gevonden. Deze Office Bingo is nu gesloten.",
    fullCardWinnerKnown: "Volle kaart winnaar bekend",
    noCardTitle: "Nog geen kaart",
    noCardDescription:
      "De host moet nog kaarten starten of updaten voor deze ronde.",
    gameStatus: "Spelstatus",
    status: "Status",
    target: "Doel",
    round: "Ronde",
    plan: "Pakket",
    winners: "Winnaars",
    noWinners: "Nog geen winnaars.",
    lineBingo: "Rij bingo",
    fullCard: "Volle kaart",
    calledMoments: "Afgevinkte momenten",
    noCalledMoments: "Nog geen momenten afgevinkt.",
    leaderboard: "Leaderboard",
    noLeaderboard:
      "Nog geen leaderboard. Winnaars verschijnen hier automatisch.",
    points: "pt",
    lineShort: "rij",
    fullShort: "vol",
    chat: "Chat",
    noMessages: "Nog geen berichten.",
    messagePlaceholder: "Typ een bericht...",
    send: "Verstuur",
    active: "Actief",
    draft: "Concept",
    published: "Gepubliceerd",
    completed: "Afgerond",
    expired: "Verlopen",
    archived: "Gearchiveerd",
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

function getLeaderboardRows(winners: OfficeBingoDashboardWinner[]) {
  const rowsMap = new Map<string, LeaderboardRow>();

  for (const winner of winners) {
    const existing = rowsMap.get(winner.user_id) ?? {
      userId: winner.user_id,
      displayName: winner.display_name,
      lineWins: 0,
      fullCardWins: 0,
      points: 0,
    };

    if (winner.win_type === "line") {
      existing.lineWins += 1;
      existing.points += 1;
    }

    if (winner.win_type === "full_card") {
      existing.fullCardWins += 1;
      existing.points += 3;
    }

    rowsMap.set(winner.user_id, existing);
  }

  return [...rowsMap.values()].sort((a, b) => {
    if (b.points !== a.points) {
      return b.points - a.points;
    }

    if (b.fullCardWins !== a.fullCardWins) {
      return b.fullCardWins - a.fullCardWins;
    }

    return b.lineWins - a.lineWins;
  });
}

function BingoCardPreview({
  cells,
  calledItemIds,
  gridSize,
}: {
  cells: OfficeBingoDashboardCardCell[];
  calledItemIds: Set<string>;
  gridSize: number;
}) {
  return (
    <div
      className="grid gap-2"
      style={{
        gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))`,
      }}
    >
      {cells.map((cell) => {
        const isCalled = calledItemIds.has(cell.item_id);

        return (
          <div
            key={cell.id}
            className={`flex aspect-square items-center justify-center rounded-2xl border p-2 text-center text-[10px] font-black leading-tight sm:text-xs ${
              isCalled
                ? "border-emerald-300/45 bg-emerald-300/[0.16] text-emerald-50 shadow-[0_0_18px_rgba(110,231,183,0.10)]"
                : "border-white/10 bg-black/25 text-zinc-200"
            }`}
          >
            {cell.label}
          </div>
        );
      })}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
      <span className="text-xs font-bold text-zinc-400">{label}</span>
      <span className="text-right text-sm font-black text-white">{value}</span>
    </div>
  );
}

function CompletedBanner({
  language,
  fullCardWinner,
}: {
  language: Language;
  fullCardWinner: OfficeBingoDashboardWinner | null;
}) {
  const t = copy[language];

  return (
    <section className="rounded-[1.5rem] border border-emerald-300/25 bg-emerald-300/[0.10] p-5 text-center backdrop-blur-xl">
      <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-200">
        {t.fullCardWinnerKnown}
      </p>
      <h2 className="mt-2 text-3xl font-black tracking-tight text-white">
        {t.completedTitle}
      </h2>
      <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-emerald-50/80">
        {t.completedDescription}
      </p>

      {fullCardWinner ? (
        <div className="mx-auto mt-4 w-fit rounded-2xl border border-emerald-300/25 bg-black/20 px-5 py-3">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-200">
            {t.fullCard}
          </p>
          <p className="mt-1 text-lg font-black text-white">
            {fullCardWinner.display_name}
          </p>
        </div>
      ) : null}
    </section>
  );
}

function LeaderboardCard({
  rows,
  language,
}: {
  rows: LeaderboardRow[];
  language: Language;
}) {
  const t = copy[language];

  return (
    <section className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4 backdrop-blur-xl sm:p-5">
      <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-200">
        {t.leaderboard}
      </p>

      {rows.length > 0 ? (
        <div className="mt-4 grid gap-2">
          {rows.map((row, index) => (
            <div
              key={row.userId}
              className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/20 p-3"
            >
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-emerald-300/25 bg-emerald-300/10 text-sm font-black text-emerald-100">
                  {index + 1}
                </div>

                <div className="min-w-0">
                  <p className="truncate text-sm font-black text-white">
                    {row.displayName}
                  </p>
                  <p className="mt-1 text-xs font-semibold text-zinc-500">
                    {row.lineWins} {t.lineShort} · {row.fullCardWins}{" "}
                    {t.fullShort}
                  </p>
                </div>
              </div>

              <div className="shrink-0 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-sm font-black text-white">
                {row.points} {t.points}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-3 text-sm leading-6 text-zinc-400">
          {t.noLeaderboard}
        </p>
      )}
    </section>
  );
}

function ChatCard({
  poolId,
  language,
  messages,
}: {
  poolId: string;
  language: Language;
  messages: OfficeBingoDashboardMessage[];
}) {
  const t = copy[language];
  const action = sendOfficeBingoMessageAction.bind(null, poolId);

  return (
    <section className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4 backdrop-blur-xl sm:p-5">
      <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-200">
        {t.chat}
      </p>

      <div className="mt-4 flex max-h-[320px] flex-col gap-2 overflow-y-auto rounded-2xl border border-white/10 bg-black/20 p-3">
        {messages.length > 0 ? (
          messages.map((message) => (
            <div
              key={message.id}
              className="rounded-2xl border border-white/10 bg-white/[0.04] p-3"
            >
              <div className="flex items-start justify-between gap-3">
                <p className="min-w-0 truncate text-xs font-black text-white">
                  {message.display_name}
                </p>
                <p className="shrink-0 text-[10px] font-semibold text-zinc-500">
                  {formatDateTime(message.created_at, language)}
                </p>
              </div>

              <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-5 text-zinc-300">
                {message.message}
              </p>
            </div>
          ))
        ) : (
          <p className="py-6 text-center text-sm leading-6 text-zinc-400">
            {t.noMessages}
          </p>
        )}
      </div>

      <form action={action} className="mt-3 flex gap-2">
        <input
          name="message"
          type="text"
          maxLength={500}
          required
          placeholder={t.messagePlaceholder}
          className="min-w-0 flex-1 rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm font-semibold text-white outline-none transition placeholder:text-zinc-600 focus:border-emerald-300/50"
        />

        <button
          type="submit"
          className="rounded-2xl bg-emerald-300 px-4 py-3 text-sm font-black text-zinc-950 transition hover:bg-emerald-200"
        >
          {t.send}
        </button>
      </form>
    </section>
  );
}

export default function OfficeBingoDashboard({
  pool,
  language,
  isHost,
  event,
  round,
  calledItemIds,
  calledLabels,
  winners,
  messages,
  cardCells,
}: OfficeBingoDashboardProps) {
  const t = copy[language];
  const calledSet = new Set(calledItemIds);
  const leaderboardRows = getLeaderboardRows(winners);
  const isCompleted =
    round?.status === "completed" || event?.status === "completed";
  const fullCardWinner =
    winners.find((winner) => winner.win_type === "full_card") ?? null;

  if (!event || !round) {
    return (
      <section className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl">
        <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-200">
              {t.officeBingo}
            </p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-white">
              {isHost ? t.hostSetupTitle : t.memberSetupTitle}
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">
              {isHost ? t.hostSetupDescription : t.memberSetupDescription}
            </p>
          </div>

          {isHost ? (
            <Link
              href={`/pools/${pool.id}/office-bingo`}
              className="rounded-2xl bg-emerald-300 px-5 py-3 text-center text-sm font-black text-zinc-950 transition hover:bg-emerald-200"
            >
              {t.openHostDashboard}
            </Link>
          ) : null}
        </div>
      </section>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {isCompleted ? (
        <CompletedBanner language={language} fullCardWinner={fullCardWinner} />
      ) : null}

      <section className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.045] p-4 shadow-2xl backdrop-blur-xl sm:p-5">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-200">
                {t.myCard}
              </p>
              <h2 className="mt-1 text-2xl font-black tracking-tight text-white">
                {isCompleted ? t.completedCardIntro : t.myCardIntro}
              </h2>
            </div>

            <div className="flex flex-wrap items-center gap-2 sm:justify-end">
              <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1.5 text-xs font-black text-zinc-300">
                {round.title}
              </span>

              {isHost ? (
                <Link
                  href={`/pools/${pool.id}/office-bingo`}
                  className="rounded-full bg-emerald-300 px-3.5 py-1.5 text-xs font-black text-zinc-950 transition hover:bg-emerald-200"
                >
                  {t.hostDashboard}
                </Link>
              ) : null}
            </div>
          </div>

          {cardCells.length > 0 ? (
            <BingoCardPreview
              cells={cardCells}
              calledItemIds={calledSet}
              gridSize={round.grid_size}
            />
          ) : (
            <div className="rounded-2xl border border-white/10 bg-black/20 p-5 text-center">
              <h3 className="text-xl font-black text-white">
                {t.noCardTitle}
              </h3>
              <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-zinc-400">
                {t.noCardDescription}
              </p>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <section className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4 backdrop-blur-xl sm:p-5">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-200">
              {t.gameStatus}
            </p>

            <div className="mt-4 grid gap-2">
              <InfoRow
                label={t.status}
                value={getStatusLabel(round.status, language)}
              />
              <InfoRow label={t.target} value={event.target_name ?? "-"} />
              <InfoRow label={t.round} value={round.title} />
              <InfoRow label={t.plan} value={event.plan} />
            </div>
          </section>

          <section className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4 backdrop-blur-xl sm:p-5">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-200">
              {t.winners}
            </p>

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
                      {winner.display_name}
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
          </section>
        </div>
      </section>

      <section className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4 backdrop-blur-xl sm:p-5">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-200">
          {t.calledMoments}
        </p>

        {calledLabels.length > 0 ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {calledLabels.map((label) => (
              <span
                key={label}
                className="rounded-full border border-emerald-300/25 bg-emerald-300/10 px-3 py-1.5 text-xs font-bold text-emerald-100"
              >
                {label}
              </span>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-sm leading-6 text-zinc-400">
            {t.noCalledMoments}
          </p>
        )}
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <LeaderboardCard rows={leaderboardRows} language={language} />
        <ChatCard poolId={pool.id} language={language} messages={messages} />
      </section>
    </div>
  );
}