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
    hostSetupTitle: "Office Bingo is not set up yet",
    hostSetupDescription:
      "Create the first round and generate cards from the host dashboard.",
    memberSetupTitle: "Office Bingo is not ready yet",
    memberSetupDescription: "The host still needs to set up this Office Bingo.",
    myCard: "My card",
    myCardIntro: "Your live Office Bingo card.",
    completedCardIntro: "This round is completed. Your card is now locked.",
    roundCompleted: "Round completed",
    waitingForHost: "Waiting for host",
    noCardTitle: "No card yet",
    noCardDescription:
      "The host still needs to start or update cards for this round.",
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
  },
  nl: {
    officeBingo: "Office Bingo",
    hostSetupTitle: "Office Bingo is nog niet ingesteld",
    hostSetupDescription:
      "Maak de eerste ronde en genereer kaarten via het host dashboard.",
    memberSetupTitle: "Office Bingo is nog niet klaar",
    memberSetupDescription: "De host moet deze Office Bingo nog instellen.",
    myCard: "Mijn kaart",
    myCardIntro: "Jouw live Office Bingo kaart.",
    completedCardIntro: "Deze ronde is afgerond. Je kaart is nu vergrendeld.",
    roundCompleted: "Ronde voltooid",
    waitingForHost: "Wachten op host",
    noCardTitle: "Nog geen kaart",
    noCardDescription:
      "De host moet nog kaarten starten of updaten voor deze ronde.",
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
  },
} satisfies Record<Language, Record<string, string>>;

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
    if (b.points !== a.points) return b.points - a.points;
    if (b.fullCardWins !== a.fullCardWins) return b.fullCardWins - a.fullCardWins;
    return b.lineWins - a.lineWins;
  });
}

function BingoCardPreview({
  cells,
  calledItemIds,
  gridSize,
  isCompleted,
  language,
}: {
  cells: OfficeBingoDashboardCardCell[];
  calledItemIds: Set<string>;
  gridSize: number;
  isCompleted: boolean;
  language: Language;
}) {
  const t = copy[language];

  return (
    <div className="mx-auto w-full max-w-[520px]">
      <div className="relative overflow-hidden rounded-[1.75rem] border border-amber-300/60 bg-gradient-to-b from-[#ffe790] to-[#f3c84f] p-3 shadow-[0_24px_60px_rgba(0,0,0,0.32)] sm:p-4">
        <div className="mb-3 rounded-[1.25rem] border border-white/10 bg-[#07150f] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
          <div className="grid grid-cols-[46px_1fr_46px] items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-emerald-300/30 bg-white">
              <img
                src="/brand/poolr-icon.png"
                alt="Poolr"
                className="h-8 w-8 object-contain"
              />
            </div>

            <div className="min-w-0 text-center">
              <p className="text-[10px] font-black uppercase tracking-[0.28em] text-emerald-200">
                Poolr
              </p>
              <h3 className="mt-0.5 text-3xl font-black uppercase leading-none tracking-[0.1em] text-white sm:text-4xl">
                Bingo
              </h3>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-amber-200/50 bg-amber-100 text-xs font-black text-zinc-950">
              {gridSize}×{gridSize}
            </div>
          </div>
        </div>

        <div
          className="grid gap-2 rounded-[1.25rem] border border-amber-900/20 bg-amber-900/20 p-2"
          style={{
            gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))`,
          }}
        >
          {cells.map((cell) => {
            const isCalled = calledItemIds.has(cell.item_id);

            return (
              <div
                key={cell.id}
                className={`relative flex aspect-square items-center justify-center overflow-hidden rounded-2xl border p-2 text-center text-[10px] font-black leading-tight transition sm:text-xs ${
                  isCalled
                    ? "border-rose-400/45 bg-[#fff1a7] text-zinc-950"
                    : "border-amber-900/15 bg-[#fff8d8] text-zinc-900"
                }`}
              >
                <span className="relative z-10 line-clamp-4">{cell.label}</span>

                {isCalled ? (
                  <span className="absolute inset-[13%] rounded-full border-[5px] border-rose-500/85" />
                ) : null}
              </div>
            );
          })}
        </div>

        <div className="mt-3 text-center text-[10px] font-black uppercase tracking-[0.22em] text-amber-950/65">
          Office Bingo
        </div>

        {isCompleted ? (
          <div className="absolute inset-x-4 top-1/2 z-20 -translate-y-1/2 rounded-[1.5rem] border border-emerald-300/35 bg-zinc-950/78 px-5 py-8 text-center shadow-[0_24px_70px_rgba(0,0,0,0.45)] backdrop-blur-md">
            <p className="text-[11px] font-black uppercase tracking-[0.24em] text-emerald-200">
              {t.roundCompleted}
            </p>
            <h3 className="mt-2 text-3xl font-black tracking-tight text-white">
              {t.waitingForHost}
            </h3>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function WinnersCard({
  winners,
  language,
}: {
  winners: OfficeBingoDashboardWinner[];
  language: Language;
}) {
  const t = copy[language];

  return (
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
                {winner.win_type === "full_card" ? t.fullCard : t.lineBingo}
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
        <p className="mt-3 text-sm leading-6 text-zinc-400">{t.noWinners}</p>
      )}
    </section>
  );
}

function CalledMomentsCard({
  labels,
  language,
}: {
  labels: string[];
  language: Language;
}) {
  const t = copy[language];

  return (
    <section className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4 backdrop-blur-xl sm:p-5">
      <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-200">
        {t.calledMoments}
      </p>

      {labels.length > 0 ? (
        <div className="mt-4 flex max-h-[210px] flex-wrap gap-2 overflow-y-auto pr-1">
          {labels.map((label) => (
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

      <div className="mt-4 min-h-[300px] max-h-[520px] overflow-y-auto rounded-[1.25rem] border border-white/10 bg-black/25 p-4">
        {messages.length > 0 ? (
          <div className="flex flex-col gap-3">
            {messages.map((message) => (
              <div
                key={message.id}
                className="rounded-2xl border border-white/10 bg-white/[0.045] p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="min-w-0 truncate text-sm font-black text-white">
                    {message.display_name}
                  </p>
                  <p className="shrink-0 text-[11px] font-semibold text-zinc-500">
                    {formatDateTime(message.created_at, language)}
                  </p>
                </div>

                <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-zinc-300">
                  {message.message}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex min-h-[260px] items-center justify-center text-center">
            <p className="text-sm leading-6 text-zinc-400">{t.noMessages}</p>
          </div>
        )}
      </div>

      <form
        action={action}
        className="mt-3 rounded-[1.25rem] border border-white/10 bg-black/20 p-2 sm:flex sm:gap-2"
      >
        <input
          name="message"
          type="text"
          maxLength={500}
          required
          placeholder={t.messagePlaceholder}
          className="min-w-0 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm font-semibold text-white outline-none transition placeholder:text-zinc-600 focus:border-emerald-300/50 sm:flex-1"
        />

        <button
          type="submit"
          className="mt-2 w-full rounded-2xl bg-emerald-300 px-5 py-3 text-sm font-black text-zinc-950 transition hover:bg-emerald-200 sm:mt-0 sm:w-auto"
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
        </div>
      </section>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <section className="rounded-[1.5rem] border border-white/10 bg-white/[0.045] p-4 shadow-2xl backdrop-blur-xl sm:p-5">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-200">
              {t.myCard}
            </p>
            <h2 className="mt-1 text-2xl font-black tracking-tight text-white">
              {isCompleted ? t.completedCardIntro : t.myCardIntro}
            </h2>
          </div>

          <span className="w-fit rounded-full border border-white/10 bg-black/20 px-3 py-1.5 text-xs font-black text-zinc-300">
            {round.title}
          </span>
        </div>

        {cardCells.length > 0 ? (
          <BingoCardPreview
            cells={cardCells}
            calledItemIds={calledSet}
            gridSize={round.grid_size}
            isCompleted={isCompleted}
            language={language}
          />
        ) : (
          <div className="rounded-2xl border border-white/10 bg-black/20 p-5 text-center">
            <h3 className="text-xl font-black text-white">{t.noCardTitle}</h3>
            <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-zinc-400">
              {t.noCardDescription}
            </p>
          </div>
        )}
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <WinnersCard winners={winners} language={language} />
        <CalledMomentsCard labels={calledLabels} language={language} />
        <LeaderboardCard rows={leaderboardRows} language={language} />
      </section>

      <ChatCard poolId={pool.id} language={language} messages={messages} />
    </div>
  );
}