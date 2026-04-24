"use client";

import { FormEvent, useEffect, useState } from "react";

type MatchPredictionCardProps = {
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
  poolId: string;
  prediction: {
    id: string;
    predicted_home_score: number | null;
    predicted_away_score: number | null;
    points_awarded?: number | null;
  } | null;
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

function getStageLabel(match: MatchPredictionCardProps["match"]) {
  if (match.group_label && match.group_label.trim()) {
    const value = match.group_label.trim();

    if (value.toLowerCase().startsWith("group ")) {
      return value;
    }

    return `Group ${value}`;
  }

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

function isEditable(match: MatchPredictionCardProps["match"]) {
  if (
    match.status === "finished" ||
    match.status === "locked" ||
    match.status === "live"
  ) {
    return false;
  }

  return new Date(match.starts_at).getTime() > Date.now();
}

function getScoreValue(value: number | null | undefined) {
  return value === null || value === undefined ? "" : String(value);
}

export default function MatchPredictionCard({
  match,
  poolId,
  prediction,
}: MatchPredictionCardProps) {
  const homeDisplay = getDisplayTeam(match.home_team, match.home_slot);
  const awayDisplay = getDisplayTeam(match.away_team, match.away_slot);
  const editable = isEditable(match);

  const [homeScore, setHomeScore] = useState(
    getScoreValue(prediction?.predicted_home_score)
  );
  const [awayScore, setAwayScore] = useState(
    getScoreValue(prediction?.predicted_away_score)
  );
  const [hasPrediction, setHasPrediction] = useState(Boolean(prediction));
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setHomeScore(getScoreValue(prediction?.predicted_home_score));
    setAwayScore(getScoreValue(prediction?.predicted_away_score));
    setHasPrediction(Boolean(prediction));
    setMessage(null);
    setError(null);
  }, [
    prediction?.id,
    prediction?.predicted_home_score,
    prediction?.predicted_away_score,
  ]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!editable) {
      return;
    }

    setLoading(true);
    setMessage(null);
    setError(null);

    try {
      const response = await fetch(`/api/pools/${poolId}/predictions/save`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          matchId: match.id,
          predictedHomeScore: Number(homeScore),
          predictedAwayScore: Number(awayScore),
        }),
      });

      const result = (await response.json()) as {
        ok?: boolean;
        message?: string;
        error?: string;
      };

      if (!response.ok || !result.ok) {
        setError(result.error ?? "Voorspelling opslaan is mislukt.");
        setLoading(false);
        return;
      }

      setHasPrediction(true);
      setMessage(result.message ?? "Voorspelling opgeslagen.");
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

            {match.match_number !== null ? (
              <span className="rounded-full border border-zinc-700 bg-zinc-950 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-300">
                Match {match.match_number}
              </span>
            ) : null}
          </div>

          <p className="mt-0.5 text-[11px] text-zinc-400">
            {formatMatchDate(match.starts_at)}
          </p>
        </div>

        <div
          className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${getStatusClasses(
            match.status
          )}`}
        >
          {getStatusLabel(match.status)}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-2.5">
        <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-2 rounded-lg border border-zinc-800 bg-zinc-950/60 p-2.5">
          <div>
            <p className="mb-1 text-sm font-semibold text-white">
              {homeDisplay}
            </p>
            <input
              name="predicted_home_score"
              type="number"
              min="0"
              inputMode="numeric"
              value={homeScore}
              onChange={(event) => setHomeScore(event.target.value)}
              disabled={!editable || loading}
              className="h-10 w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 text-center text-sm font-semibold text-white outline-none transition focus:border-white disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="-"
              required={editable}
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
              name="predicted_away_score"
              type="number"
              min="0"
              inputMode="numeric"
              value={awayScore}
              onChange={(event) => setAwayScore(event.target.value)}
              disabled={!editable || loading}
              className="h-10 w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 text-center text-sm font-semibold text-white outline-none transition focus:border-white disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="-"
              required={editable}
            />
          </div>
        </div>

        {error ? (
          <div className="mt-2 rounded-md border border-red-500/30 bg-red-500/10 px-2.5 py-1.5 text-[11px] text-red-200">
            {error}
          </div>
        ) : null}

        {message ? (
          <div className="mt-2 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1.5 text-[11px] text-emerald-200">
            {message}
          </div>
        ) : null}

        <div className="mt-2 flex items-center justify-between gap-2">
          <div className="text-[10px] text-zinc-500">
            {hasPrediction
              ? "Voorspelling opgeslagen"
              : editable
              ? "Nog geen voorspelling"
              : "Voorspellen niet meer mogelijk"}
          </div>

          <button
            type="submit"
            disabled={!editable || loading}
            className="rounded-md bg-white px-3 py-1.5 text-[11px] font-semibold text-zinc-950 transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Opslaan..." : "Opslaan"}
          </button>
        </div>
      </form>

      {match.status === "finished" &&
      match.home_score !== null &&
      match.away_score !== null ? (
        <div className="mt-2 rounded-md border border-sky-500/20 bg-sky-500/10 px-2.5 py-1.5 text-[11px] text-sky-100">
          Uitslag: <span className="font-semibold">{match.home_score}</span> -{" "}
          <span className="font-semibold">{match.away_score}</span>
        </div>
      ) : null}
    </div>
  );
}