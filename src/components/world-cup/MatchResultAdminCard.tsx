"use client";

import { FormEvent, useState } from "react";

type MatchResultAdminCardProps = {
  match: {
    id: string;
    stage: string | null;
    round_name: string | null;
    stage_type: string | null;
    group_label: string | null;
    round_order: number | null;
    match_number: number | null;
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
};

function formatMatchDate(value: string) {
  return new Intl.DateTimeFormat("nl-NL", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Europe/Amsterdam",
  }).format(new Date(value));
}

function getDisplayTeam(team: string | null, slot: string | null) {
  if (team && team.trim()) return team;
  if (slot && slot.trim()) return slot;
  return "TBD";
}

function getStageLabel(match: MatchResultAdminCardProps["match"]) {
  if (match.group_label) return match.group_label;
  if (match.round_name) return match.round_name;
  if (match.stage) return match.stage;
  return "Wedstrijd";
}

function getStatusLabel(status: string) {
  if (status === "finished") return "Finished";
  if (status === "live") return "Live";
  if (status === "locked") return "Locked";
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

export default function MatchResultAdminCard({
  match,
}: MatchResultAdminCardProps) {
  const homeDisplay = getDisplayTeam(match.home_team, match.home_slot);
  const awayDisplay = getDisplayTeam(match.away_team, match.away_slot);
  const matchNumber = match.match_number;

  const [homeScore, setHomeScore] = useState(
    match.home_score === null ? "" : String(match.home_score)
  );
  const [awayScore, setAwayScore] = useState(
    match.away_score === null ? "" : String(match.away_score)
  );
  const [status, setStatus] = useState(match.status);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setMessage(null);
    setError(null);

    try {
      const response = await fetch("/api/admin/world-cup/results/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          matchId: match.id,
          homeScore: Number(homeScore),
          awayScore: Number(awayScore),
        }),
      });

      const result = (await response.json()) as {
        ok?: boolean;
        message?: string;
        error?: string;
      };

      if (!response.ok || !result.ok) {
        setError(result.error ?? "Opslaan mislukt.");
        setLoading(false);
        return;
      }

      setStatus("finished");
      setMessage(result.message ?? "Resultaat opgeslagen.");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Onbekende fout tijdens opslaan."
      );
    }

    setLoading(false);
  }

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/70 p-2.5 transition hover:border-zinc-700">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-500">
              {getStageLabel(match)}
            </p>

            {matchNumber !== null ? (
              <span className="rounded-full border border-zinc-700 bg-zinc-950 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-300">
                Match {matchNumber}
              </span>
            ) : null}
          </div>

          <p className="mt-0.5 text-[11px] text-zinc-400">
            {formatMatchDate(match.starts_at)}
          </p>
        </div>

        <div
          className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${getStatusClasses(
            status
          )}`}
        >
          {getStatusLabel(status)}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-2.5">
        <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-2 rounded-lg border border-zinc-800 bg-zinc-950/60 p-2.5">
          <div>
            <p className="mb-1 text-sm font-semibold text-white">
              {homeDisplay}
            </p>
            <input
              name="home_score"
              type="number"
              min="0"
              inputMode="numeric"
              value={homeScore}
              onChange={(event) => setHomeScore(event.target.value)}
              className="h-10 w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 text-center text-sm font-semibold text-white outline-none transition focus:border-white"
              placeholder="0"
              required
              disabled={loading}
            />
          </div>

          <div className="pb-2 text-center text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
            VS
          </div>

          <div>
            <p className="mb-1 text-sm font-semibold text-white">
              {awayDisplay}
            </p>
            <input
              name="away_score"
              type="number"
              min="0"
              inputMode="numeric"
              value={awayScore}
              onChange={(event) => setAwayScore(event.target.value)}
              className="h-10 w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 text-center text-sm font-semibold text-white outline-none transition focus:border-white"
              placeholder="0"
              required
              disabled={loading}
            />
          </div>
        </div>

        {error ? (
          <div className="mt-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-200">
            {error}
          </div>
        ) : null}

        {message ? (
          <div className="mt-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-200">
            {message}
          </div>
        ) : null}

        <div className="mt-2 flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="rounded-md bg-white px-3 py-1.5 text-[11px] font-semibold text-zinc-950 transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Opslaan..." : "Opslaan"}
          </button>
        </div>
      </form>
    </div>
  );
}