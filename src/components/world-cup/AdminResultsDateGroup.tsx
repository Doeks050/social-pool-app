"use client";

import { useState } from "react";
import MatchResultAdminCard from "@/components/world-cup/MatchResultAdminCard";
import ResetMatchResultButton from "@/components/world-cup/ResetMatchResultButton";
import KnockoutOverridePanel from "@/components/world-cup/KnockoutOverridePanel";

type AdminResultsMatch = {
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
  home_team_locked_by_admin: boolean;
  away_team_locked_by_admin: boolean;
};

type MatchOptions = {
  homeOptions: string[];
  awayOptions: string[];
};

type AdminResultsDateGroupProps = {
  label: string;
  matches: AdminResultsMatch[];
  matchOptions: Record<string, MatchOptions>;
  defaultOpen?: boolean;
};

function isKnockoutLike(match: AdminResultsMatch) {
  return (match.stage_type ?? "").toLowerCase() !== "group";
}

export default function AdminResultsDateGroup({
  label,
  matches,
  matchOptions,
  defaultOpen = false,
}: AdminResultsDateGroupProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const finishedCount = matches.filter(
    (match) => match.status === "finished"
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
            {finishedCount}/{matches.length} uitslagen ingevuld
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
            {matches.map((match) => {
              const options = matchOptions[match.id] ?? {
                homeOptions: [],
                awayOptions: [],
              };

              return (
                <div
                  key={match.id}
                  className="space-y-2 rounded-xl border border-zinc-800/60 bg-zinc-950/20 p-2"
                >
                  <MatchResultAdminCard match={match} />

                  <ResetMatchResultButton matchId={match.id} />

                  {isKnockoutLike(match) ? (
                    <KnockoutOverridePanel
                      matchId={match.id}
                      homeSlot={match.home_slot}
                      awaySlot={match.away_slot}
                      homeTeam={match.home_team}
                      awayTeam={match.away_team}
                      homeTeamLockedByAdmin={match.home_team_locked_by_admin}
                      awayTeamLockedByAdmin={match.away_team_locked_by_admin}
                      homeOptions={options.homeOptions}
                      awayOptions={options.awayOptions}
                    />
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      ) : null}
    </section>
  );
}