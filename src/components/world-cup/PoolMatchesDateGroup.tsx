"use client";

import { useState } from "react";
import MatchPredictionCard from "@/components/world-cup/MatchPredictionCard";

type MatchRow = {
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

type PredictionRow = {
  id: string;
  match_id: string;
  predicted_home_score: number | null;
  predicted_away_score: number | null;
  points_awarded: number | null;
};

type PoolMatchesDateGroupProps = {
  label: string;
  poolId: string;
  matches: MatchRow[];
  predictions: Record<string, PredictionRow>;
  defaultOpen?: boolean;
};

function getMatchState(match: MatchRow): "open" | "locked" | "finished" {
  const hasResult =
    match.status === "finished" &&
    match.home_score !== null &&
    match.away_score !== null;

  if (hasResult) {
    return "finished";
  }

  if (new Date(match.starts_at).getTime() <= Date.now()) {
    return "locked";
  }

  return "open";
}

export default function PoolMatchesDateGroup({
  label,
  poolId,
  matches,
  predictions,
  defaultOpen = false,
}: PoolMatchesDateGroupProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const predictedCount = matches.filter((match) => predictions[match.id]).length;
  const finishedCount = matches.filter(
    (match) => getMatchState(match) === "finished"
  ).length;

  return (
    <section className="rounded-xl border border-zinc-800 bg-zinc-900/40">
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="flex w-full items-center justify-between gap-3 px-3 py-3 text-left transition hover:bg-zinc-900/70"
      >
        <div className="min-w-0">
          <h2 className="truncate text-sm font-semibold capitalize text-white sm:text-base">
            {label}
          </h2>
          <p className="mt-0.5 text-[11px] text-zinc-500">
            {predictedCount}/{matches.length} voorspeld
            {finishedCount > 0 ? ` · ${finishedCount} finished` : ""}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <span className="rounded-full border border-zinc-700 bg-zinc-950 px-2.5 py-1 text-[11px] font-semibold text-zinc-300">
            {matches.length} {matches.length === 1 ? "wedstrijd" : "wedstrijden"}
          </span>

          <span className="flex h-7 w-7 items-center justify-center rounded-full border border-zinc-700 bg-zinc-950 text-sm text-zinc-300">
            {isOpen ? "−" : "+"}
          </span>
        </div>
      </button>

      {isOpen ? (
        <div className="border-t border-zinc-800 p-3">
          <div className="grid gap-2 lg:grid-cols-2">
            {matches.map((match) => (
              <MatchPredictionCard
                key={match.id}
                match={match}
                poolId={poolId}
                prediction={predictions[match.id] ?? null}
              />
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}