type MatchResultAdminCardProps = {
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
  if (team && team.trim()) {
    return team;
  }

  if (slot && slot.trim()) {
    return slot;
  }

  return "TBD";
}

function getStatusLabel(status: string) {
  if (status === "finished") return "Finished";
  if (status === "live") return "Live";
  if (status === "locked") return "Locked";
  return "Scheduled";
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

export default function MatchResultAdminCard({
  match,
  saveAction,
}: MatchResultAdminCardProps) {
  const homeDisplay = getDisplayTeam(match.home_team, match.home_slot);
  const awayDisplay = getDisplayTeam(match.away_team, match.away_slot);

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
            {match.group_label || match.round_name || match.stage || "Wedstrijd"}
          </p>
          <h3 className="mt-1 text-lg font-semibold text-white">
            {homeDisplay} vs {awayDisplay}
          </h3>
          <p className="mt-2 text-sm text-zinc-400">
            Start: {formatMatchDate(match.starts_at)}
          </p>

          {match.bracket_code ? (
            <p className="mt-1 text-xs uppercase tracking-wide text-zinc-500">
              {match.bracket_code}
            </p>
          ) : null}
        </div>

        <div
          className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium uppercase tracking-wide ${getStatusClasses(
            match.status
          )}`}
        >
          {getStatusLabel(match.status)}
        </div>
      </div>

      <form action={saveAction} className="mt-5 space-y-4">
        <input type="hidden" name="match_id" value={match.id} />

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-zinc-300">
              {homeDisplay}
            </label>
            <input
              name="home_score"
              type="number"
              min="0"
              defaultValue={match.home_score ?? ""}
              className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-white outline-none transition focus:border-white"
              placeholder="0"
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-zinc-300">
              {awayDisplay}
            </label>
            <input
              name="away_score"
              type="number"
              min="0"
              defaultValue={match.away_score ?? ""}
              className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-white outline-none transition focus:border-white"
              placeholder="0"
              required
            />
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="submit"
            className="rounded-xl bg-white px-5 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-zinc-200"
          >
            Resultaat opslaan
          </button>
        </div>
      </form>
    </div>
  );
}