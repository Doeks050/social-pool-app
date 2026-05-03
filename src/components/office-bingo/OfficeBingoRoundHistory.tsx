import type { Language } from "@/lib/i18n";

export type OfficeBingoRoundHistoryRound = {
  id: string;
  round_number: number;
  title: string;
  status: string;
  created_at: string | null;
};

export type OfficeBingoRoundHistoryWinner = {
  round_id: string;
  user_id: string;
  display_name: string;
  win_type: "line" | "full_card";
  won_at: string;
};

type OfficeBingoRoundHistoryProps = {
  language: Language;
  rounds: OfficeBingoRoundHistoryRound[];
  currentRoundId: string | null;
  winners: OfficeBingoRoundHistoryWinner[];
};

const MAX_VISIBLE_PREVIOUS_ROUNDS = 8;

const copy = {
  en: {
    roundHistory: "Round history",
    roundHistoryDescription: "A compact overview of previous Office Bingo rounds.",
    round: "Round",
    status: "Status",
    lineBingo: "Line bingo",
    fullCard: "Full card",
    noFullCardWinner: "-",
    noRoundHistory: "No previous rounds yet.",
    active: "Active",
    draft: "Draft",
    published: "Published",
    completed: "Completed",
    expired: "Expired",
    archived: "Archived",
    moreRounds: "older rounds hidden",
  },
  nl: {
    roundHistory: "Rondegeschiedenis",
    roundHistoryDescription: "Compact overzicht van eerdere Office Bingo rondes.",
    round: "Ronde",
    status: "Status",
    lineBingo: "Rij bingo",
    fullCard: "Volle kaart",
    noFullCardWinner: "-",
    noRoundHistory: "Nog geen eerdere rondes.",
    active: "Actief",
    draft: "Concept",
    published: "Gepubliceerd",
    completed: "Afgerond",
    expired: "Verlopen",
    archived: "Gearchiveerd",
    moreRounds: "oudere rondes verborgen",
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

export default function OfficeBingoRoundHistory({
  language,
  rounds,
  currentRoundId,
  winners,
}: OfficeBingoRoundHistoryProps) {
  const t = copy[language];

  const previousRounds = rounds.filter(
    (historyRound) => historyRound.id !== currentRoundId
  );

  const visibleRounds = previousRounds.slice(0, MAX_VISIBLE_PREVIOUS_ROUNDS);
  const hiddenRoundCount = Math.max(
    0,
    previousRounds.length - visibleRounds.length
  );

  return (
    <section className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-200">
            {t.roundHistory}
          </p>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-white">
            {t.roundHistory}
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">
            {t.roundHistoryDescription}
          </p>
        </div>

        {hiddenRoundCount > 0 ? (
          <span className="w-fit rounded-full border border-white/10 bg-black/20 px-3 py-1.5 text-xs font-black text-zinc-400">
            +{hiddenRoundCount} {t.moreRounds}
          </span>
        ) : null}
      </div>

      {visibleRounds.length > 0 ? (
        <div className="mt-5 overflow-hidden rounded-2xl border border-white/10 bg-black/20">
          <div className="hidden grid-cols-[1.2fr_0.8fr_0.8fr_1fr] gap-3 border-b border-white/10 bg-white/[0.04] px-4 py-3 text-[10px] font-black uppercase tracking-[0.16em] text-zinc-500 sm:grid">
            <div>{t.round}</div>
            <div>{t.status}</div>
            <div>{t.lineBingo}</div>
            <div>{t.fullCard}</div>
          </div>

          <div className="divide-y divide-white/10">
            {visibleRounds.map((historyRound) => {
              const roundWinners = winners.filter(
                (winner) => winner.round_id === historyRound.id
              );

              const lineWinnerCount = roundWinners.filter(
                (winner) => winner.win_type === "line"
              ).length;

              const fullCardWinner =
                roundWinners.find((winner) => winner.win_type === "full_card") ??
                null;

              return (
                <div
                  key={historyRound.id}
                  className="grid gap-2 px-4 py-4 sm:grid-cols-[1.2fr_0.8fr_0.8fr_1fr] sm:items-center sm:gap-3"
                >
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-500 sm:hidden">
                      {t.round}
                    </p>
                    <p className="text-sm font-black text-white">
                      {historyRound.title}
                    </p>
                  </div>

                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-500 sm:hidden">
                      {t.status}
                    </p>
                    <span className="inline-flex rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs font-black text-zinc-300">
                      {getStatusLabel(historyRound.status, language)}
                    </span>
                  </div>

                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-500 sm:hidden">
                      {t.lineBingo}
                    </p>
                    <p className="text-sm font-black text-white">
                      {lineWinnerCount}
                    </p>
                  </div>

                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-500 sm:hidden">
                      {t.fullCard}
                    </p>
                    <p className="truncate text-sm font-black text-emerald-100">
                      {fullCardWinner
                        ? fullCardWinner.display_name
                        : t.noFullCardWinner}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-5 text-center">
          <p className="text-sm font-semibold text-zinc-400">
            {t.noRoundHistory}
          </p>
        </div>
      )}
    </section>
  );
}