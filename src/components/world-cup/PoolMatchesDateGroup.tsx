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

function getStateSummary(matches: MatchRow[]) {
  const openCount = matches.filter((match) => getMatchState(match) === "open")
    .length;
  const lockedCount = matches.filter(
    (match) => getMatchState(match) === "locked"
  ).length;
  const finishedCount = matches.filter(
    (match) => getMatchState(match) === "finished"
  ).length;

  return { openCount, lockedCount, finishedCount };
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
  const { openCount, lockedCount, finishedCount } = getStateSummary(matches);

  return (
    <section className="overflow-hidden rounded-[1.5rem] border border-white/10 bg-white/[0.04] backdrop-blur">
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left transition hover:bg-white/[0.04] sm:px-5"
      >
        <div className="min-w-0">
          <p className="mb-1 text-[11px] font-black uppercase tracking-[0.2em] text-emerald-300">
            Match day
          </p>
          <h2 className="truncate text-base font-black capitalize text-white sm:text-lg">
            {label}
          </h2>
          <p className="mt-1 text-xs text-zinc-400">
            {predictedCount}/{matches.length} predicted
            {finishedCount > 0 ? ` · ${finishedCount} finished` : ""}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <div className="hidden items-center gap-1 sm:flex">
            {openCount > 0 ? (
              <span className="rounded-full border border-emerald-300/25 bg-emerald-300/10 px-2.5 py-1 text-[11px] font-bold text-emerald-200">
                {openCount} open
              </span>
            ) : null}

            {lockedCount > 0 ? (
              <span className="rounded-full border border-orange-300/20 bg-orange-300/10 px-2.5 py-1 text-[11px] font-bold text-orange-100">
                {lockedCount} locked
              </span>
            ) : null}
          </div>

          <span className="rounded-full border border-white/10 bg-black/25 px-2.5 py-1 text-[11px] font-bold text-zinc-300">
            {matches.length} {matches.length === 1 ? "match" : "matches"}
          </span>

          <span className="flex h-9 w-9 items-center justify-center rounded-2xl border border-white/10 bg-black/25 text-lg font-black text-emerald-200">
            {isOpen ? "−" : "+"}
          </span>
        </div>
      </button>

      {isOpen ? (
        <div className="border-t border-white/10 p-3 sm:p-4">
          <div className="grid gap-3">
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