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

const copy = {
    en: {
        roundHistory: "Round history",
        roundHistoryDescription:
            "Previous rounds stay visible here. The latest round is the active management round.",
        previousRound: "Previous round",
        noRoundHistory: "No previous rounds yet.",
        winners: "Winners",
        noWinners: "No winners yet.",
        lineBingo: "Line bingo",
        fullCard: "Full card",
        active: "Active",
        draft: "Draft",
        published: "Published",
        completed: "Completed",
        expired: "Expired",
        archived: "Archived",
    },
    nl: {
        roundHistory: "Rondegeschiedenis",
        roundHistoryDescription:
            "Eerdere rondes blijven hier zichtbaar. De nieuwste ronde is de actieve beheerronde.",
        previousRound: "Eerdere ronde",
        noRoundHistory: "Nog geen eerdere rondes.",
        winners: "Winnaars",
        noWinners: "Nog geen winnaars.",
        lineBingo: "Rij bingo",
        fullCard: "Volle kaart",
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

    return (
        <section className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-200">
                {t.roundHistory}
            </p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-white">
                {t.roundHistory}
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">
                {t.roundHistoryDescription}
            </p>

            {previousRounds.length > 0 ? (
                <div className="mt-4 grid gap-3">
                    {previousRounds.map((historyRound) => {
                        const roundWinners = winners.filter(
                            (winner) => winner.round_id === historyRound.id
                        );
                        const fullCardWinner =
                            roundWinners.find((winner) => winner.win_type === "full_card") ??
                            null;

                        return (
                            <div
                                key={historyRound.id}
                                className="rounded-2xl border border-white/10 bg-black/20 p-4"
                            >
                                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                    <div>
                                        <p className="text-xs font-black uppercase tracking-[0.16em] text-zinc-500">
                                            {t.previousRound}
                                        </p>
                                        <h3 className="mt-1 text-lg font-black text-white">
                                            {historyRound.title}
                                        </h3>
                                    </div>

                                    <span className="w-fit rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-black text-zinc-300">
                                        {getStatusLabel(historyRound.status, language)}
                                    </span>
                                </div>

                                {roundWinners.length > 0 ? (
                                    <div className="mt-3 grid gap-2">
                                        {roundWinners.map((winner) => (
                                            <div
                                                key={`${historyRound.id}-${winner.user_id}-${winner.win_type}`}
                                                className={`rounded-2xl border p-3 ${winner.win_type === "full_card"
                                                        ? "border-emerald-300/25 bg-emerald-300/[0.10]"
                                                        : "border-white/10 bg-white/[0.04]"
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
                                    <p className="mt-3 text-sm font-semibold text-zinc-500">
                                        {t.noWinners}
                                    </p>
                                )}

                                {fullCardWinner ? null : null}
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-5 text-center">
                    <p className="text-sm font-semibold text-zinc-400">
                        {t.noRoundHistory}
                    </p>
                </div>
            )}
        </section>
    );
}