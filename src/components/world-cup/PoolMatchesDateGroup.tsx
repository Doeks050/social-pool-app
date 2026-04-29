"use client";

import { useState } from "react";
import MatchPredictionCard from "@/components/world-cup/MatchPredictionCard";
import type { Language } from "@/lib/i18n";

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
  language: Language;
};

const copy = {
  en: {
    matchDay: "Match day",
    predicted: "predicted",
    finished: "finished",
    open: "open",
    locked: "locked",
    match: "match",
    matches: "matches",
  },
  nl: {
    matchDay: "Wedstrijddag",
    predicted: "voorspeld",
    finished: "afgelopen",
    open: "open",
    locked: "gesloten",
    match: "wedstrijd",
    matches: "wedstrijden",
  },
} satisfies Record<Language, Record<string, string>>;

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
  language,
}: PoolMatchesDateGroupProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const t = copy[language];

  const predictedCount = matches.filter((match) => predictions[match.id]).length;
  const { openCount, lockedCount, finishedCount } = getStateSummary(matches);

  return (
    <section className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.035] backdrop-blur">
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="flex w-full items-center justify-between gap-3 px-3.5 py-2.5 text-left transition hover:bg-white/[0.04] sm:px-4"
      >
        <div className="min-w-0">
          <p className="text-[9px] font-black uppercase tracking-[0.18em] text-emerald-300">
            {t.matchDay}
          </p>

          <h2 className="mt-0.5 truncate text-sm font-black capitalize text-white sm:text-base">
            {label}
          </h2>

          <p className="mt-0.5 text-[11px] text-zinc-400">
            {predictedCount}/{matches.length} {t.predicted}
            {finishedCount > 0 ? ` · ${finishedCount} ${t.finished}` : ""}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          <div className="hidden items-center gap-1 md:flex">
            {openCount > 0 ? (
              <span className="rounded-full border border-emerald-300/25 bg-emerald-300/10 px-2 py-0.5 text-[10px] font-bold text-emerald-200">
                {openCount} {t.open}
              </span>
            ) : null}

            {lockedCount > 0 ? (
              <span className="rounded-full border border-orange-300/20 bg-orange-300/10 px-2 py-0.5 text-[10px] font-bold text-orange-100">
                {lockedCount} {t.locked}
              </span>
            ) : null}
          </div>

          <span className="rounded-full border border-white/10 bg-black/25 px-2 py-0.5 text-[10px] font-bold text-zinc-300">
            {matches.length} {matches.length === 1 ? t.match : t.matches}
          </span>

          <span className="flex h-7 w-7 items-center justify-center rounded-xl border border-white/10 bg-black/25 text-sm font-black text-emerald-200">
            {isOpen ? "−" : "+"}
          </span>
        </div>
      </button>

      {isOpen ? (
        <div className="border-t border-white/10 p-2.5 sm:p-3">
          <div className="grid gap-2.5 md:grid-cols-2 2xl:grid-cols-3">
            {matches.map((match) => (
              <MatchPredictionCard
                key={match.id}
                match={match}
                poolId={poolId}
                prediction={predictions[match.id] ?? null}
                language={language}
              />
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}