type MatchPredictionCardProps = {
  match: {
    id: string;
    stage: string | null;
    round_name: string | null;
    stage_type: string | null;
    group_label: string | null;
    round_order: number | null;
    bracket_code: string | null;
    starts_at: string;
    status: string;
    home_team: string | null;
    away_team: string | null;
    home_slot: string | null;
    away_slot: string | null;
    home_score: number | null;
    away_score: number | null;
    is_knockout: boolean | null;
  };
  prediction: {
    id: string;
    predicted_home_score: number | null;
    predicted_away_score: number | null;
  } | null;
  saveAction: (formData: FormData) => Promise<void>;
};

function formatMatchDate(value: string) {
  return new Intl.DateTimeFormat("nl-NL", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/Amsterdam",
  }).format(new Date(value));
}

function getDisplayTeam(team: string | null, slot: string | null) {
  if (team && team.trim()) return team;
  if (slot && slot.trim()) return slot;
  return "TBD";
}

function getStageLabel(match: MatchPredictionCardProps["match"]) {
  if (match.group_label) return `Group ${match.group_label}`;
  if (match.round_name) return match.round_name;
  if (match.stage) return match.stage;
  return "Wedstrijd";
}

function getStatusLabel(status: string) {
  if (status === "finished") return "Finished";
  if (status === "live") return "Live";
  if (status === "locked") return "Gelockt";
  return "Open";
}

function getStatusClasses(status: string) {
  if (status === "finished") {
    return "border-sky-500/30 bg-sky-500/10 text-sky-200";
  }

  if (status === "live") {
    return "border-red-500/30 bg-red-500/10 text-red-200";
  }

  if (status === "locked") {
    return "border-amber-500/30 bg-amber-500/10 text-amber-200";
  }

  return "border-emerald-500/30 bg-emerald-500/10 text-emerald-200";
}

function isEditable(status: string) {
  return status !== "finished" && status !== "locked" && status !== "live";
}

export default function MatchPredictionCard({
  match,
  prediction,
  saveAction,
}: MatchPredictionCardProps) {
  const homeDisplay = getDisplayTeam(match.home_team, match.home_slot);
  const awayDisplay = getDisplayTeam(match.away_team, match.away_slot);
  const editable = isEditable(match.status);

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4 transition hover:border-zinc-700">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">
            {getStageLabel(match)}
          </p>
          <p className="mt-1 text-sm text-zinc-400">{formatMatchDate(match.starts_at)}</p>
        </div>

        <div
          className={`shrink-0 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-wide ${getStatusClasses(
            match.status
          )}`}
        >
          {getStatusLabel(match.status)}
        </div>
      </div>

      <form action={saveAction} className="mt-4">
        <input type="hidden" name="match_id" value={match.id} />

        <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-3 rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4">
          <div>
            <p className="mb-2 text-base font-semibold text-white">{homeDisplay}</p>
            <input
              name="predicted_home_score"
              type="number"
              min="0"
              inputMode="numeric"
              defaultValue={prediction?.predicted_home_score ?? ""}
              disabled={!editable}
              className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-center text-lg font-semibold text-white outline-none transition focus:border-white disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="-"
              required={editable}
            />
          </div>

          <div className="pb-3 text-center text-sm font-semibold uppercase tracking-wide text-zinc-500">
            VS
          </div>

          <div>
            <p className="mb-2 text-base font-semibold text-white">{awayDisplay}</p>
            <input
              name="predicted_away_score"
              type="number"
              min="0"
              inputMode="numeric"
              defaultValue={prediction?.predicted_away_score ?? ""}
              disabled={!editable}
              className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-center text-lg font-semibold text-white outline-none transition focus:border-white disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="-"
              required={editable}
            />
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between gap-3">
          <div className="text-xs text-zinc-500">
            {prediction
              ? "Voorspelling opgeslagen"
              : editable
              ? "Nog geen voorspelling"
              : "Voorspellen niet meer mogelijk"}
          </div>

          <button
            type="submit"
            disabled={!editable}
            className="rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-zinc-950 transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Opslaan
          </button>
        </div>
      </form>

      {match.status === "finished" &&
      match.home_score !== null &&
      match.away_score !== null ? (
        <div className="mt-4 rounded-xl border border-sky-500/20 bg-sky-500/10 px-4 py-3 text-sm text-sky-100">
          Uitslag: <span className="font-semibold">{match.home_score}</span> -{" "}
          <span className="font-semibold">{match.away_score}</span>
        </div>
      ) : null}
    </div>
  );
}