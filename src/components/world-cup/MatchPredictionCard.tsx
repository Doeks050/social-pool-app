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
  return new Intl.DateTimeFormat("en-GB", {
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
  return "Match";
}

function getStatusLabel(status: string) {
  if (status === "finished") return "Finished";
  if (status === "live") return "Live";
  if (status === "locked") return "Locked";
  return "Open";
}

function getStatusClasses(status: string) {
  if (status === "finished") {
    return "border-sky-400/25 bg-sky-400/10 text-sky-100";
  }

  if (status === "live") {
    return "border-red-400/30 bg-red-400/10 text-red-100";
  }

  if (status === "locked") {
    return "border-orange-300/25 bg-orange-300/10 text-orange-100";
  }

  return "border-emerald-300/30 bg-emerald-300/10 text-emerald-200";
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
        setError(result.error ?? "Saving prediction failed.");
        setLoading(false);
        return;
      }

      setHasPrediction(true);
      setMessage(result.message ?? "Prediction saved.");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unknown error while saving."
      );
    }

    setLoading(false);
  }

  return (
    <article className="rounded-[1.25rem] border border-white/10 bg-black/20 p-3.5 transition hover:border-emerald-300/25 hover:bg-white/[0.04]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-300">
              {getStageLabel(match)}
            </p>

            {match.match_number !== null ? (
              <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-zinc-300">
                Match {match.match_number}
              </span>
            ) : null}
          </div>

          <p className="mt-1 text-[11px] font-medium text-zinc-400">
            {formatMatchDate(match.starts_at)}
          </p>
        </div>

        <div
          className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-wide ${getStatusClasses(
            match.status
          )}`}
        >
          {getStatusLabel(match.status)}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-4">
        <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-2 rounded-[1rem] border border-white/10 bg-[#06110d]/80 p-3">
          <div className="min-w-0">
            <p className="mb-2 truncate text-sm font-black text-white">
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
              className="h-11 w-full rounded-xl border border-white/10 bg-black/25 px-3 text-center text-base font-black text-white outline-none transition placeholder:text-zinc-600 focus:border-emerald-300/70 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="-"
              required={editable}
            />
          </div>

          <div className="pb-3 text-center text-[11px] font-black uppercase tracking-wide text-zinc-500">
            VS
          </div>

          <div className="min-w-0">
            <p className="mb-2 truncate text-sm font-black text-white">
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
              className="h-11 w-full rounded-xl border border-white/10 bg-black/25 px-3 text-center text-base font-black text-white outline-none transition placeholder:text-zinc-600 focus:border-emerald-300/70 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="-"
              required={editable}
            />
          </div>
        </div>

        {error ? (
          <div className="mt-2 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-200">
            {error}
          </div>
        ) : null}

        {message ? (
          <div className="mt-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-200">
            {message}
          </div>
        ) : null}

        {match.status === "finished" &&
        match.home_score !== null &&
        match.away_score !== null ? (
          <div className="mt-3 rounded-xl border border-sky-400/20 bg-sky-400/10 px-3 py-2 text-xs text-sky-100">
            Final score:{" "}
            <span className="font-black">{match.home_score}</span> -{" "}
            <span className="font-black">{match.away_score}</span>
            {prediction?.points_awarded !== null &&
            prediction?.points_awarded !== undefined ? (
              <span className="ml-2 text-sky-200">
                · {prediction.points_awarded} pts
              </span>
            ) : null}
          </div>
        ) : null}

        <div className="mt-3 flex items-center justify-between gap-3">
          <div className="text-[11px] font-medium text-zinc-500">
            {hasPrediction
              ? "Prediction saved"
              : editable
              ? "No prediction yet"
              : "Prediction locked"}
          </div>

          <button
            type="submit"
            disabled={!editable || loading}
            className="rounded-xl bg-emerald-300 px-4 py-2 text-xs font-black text-zinc-950 transition hover:bg-emerald-200 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Saving..." : hasPrediction ? "Update" : "Save"}
          </button>
        </div>
      </form>
    </article>
  );
}