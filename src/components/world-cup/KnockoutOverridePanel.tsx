"use client";

import { useState } from "react";

type KnockoutOverridePanelProps = {
  matchId: string;
  homeSlot: string | null;
  awaySlot: string | null;
  homeTeam: string | null;
  awayTeam: string | null;
  homeTeamLockedByAdmin: boolean;
  awayTeamLockedByAdmin: boolean;
  homeOptions: string[];
  awayOptions: string[];
};

function prettifySlot(slot: string | null) {
  if (!slot) return "Automatische plek";

  return slot
    .replace(/_/g, " ")
    .replace(/\bgroup\b/gi, "Group")
    .replace(/\bwinner\b/gi, "Winner")
    .replace(/\brunnerup\b/gi, "Runner-up")
    .replace(/\bloser\b/gi, "Loser")
    .replace(/\bround\b/gi, "Round")
    .replace(/\bof\b/gi, "of")
    .replace(/\bquarterfinal\b/gi, "Quarterfinal")
    .replace(/\bsemifinal\b/gi, "Semifinal")
    .replace(/\bfinal\b/gi, "Final");
}

type SidePanelProps = {
  matchId: string;
  side: "home" | "away";
  slot: string | null;
  currentTeam: string | null;
  locked: boolean;
  options: string[];
};

function SidePanel({
  matchId,
  side,
  slot,
  currentTeam,
  locked,
  options,
}: SidePanelProps) {
  const [selectedTeam, setSelectedTeam] = useState(currentTeam ?? "");
  const [isLocked, setIsLocked] = useState(locked);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function saveOverride() {
    setLoading(true);
    setMessage(null);
    setError(null);

    try {
      const response = await fetch("/api/admin/world-cup/results/override", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          matchId,
          side,
          teamName: selectedTeam,
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

      setIsLocked(true);
      setMessage(result.message ?? "Opgeslagen.");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Onbekende fout tijdens opslaan."
      );
    }

    setLoading(false);
  }

  async function resetOverride() {
    const confirmed = window.confirm(
      `Weet je zeker dat je ${side === "home" ? "home" : "away"} wilt resetten naar auto-sync?`
    );

    if (!confirmed) {
      return;
    }

    setLoading(true);
    setMessage(null);
    setError(null);

    try {
      const response = await fetch("/api/admin/world-cup/results/reset-override", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          matchId,
          side,
        }),
      });

      const result = (await response.json()) as {
        ok?: boolean;
        message?: string;
        error?: string;
      };

      if (!response.ok || !result.ok) {
        setError(result.error ?? "Reset mislukt.");
        setLoading(false);
        return;
      }

      setIsLocked(false);
      setMessage(result.message ?? "Reset uitgevoerd.");
      window.location.reload();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Onbekende fout tijdens reset."
      );
    }

    setLoading(false);
  }

  return (
    <div className="rounded-md border border-zinc-800 bg-zinc-950/40 p-2.5">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-300">
            {side === "home" ? "Home side" : "Away side"}
          </p>
          <p className="mt-0.5 text-[10px] text-zinc-500">
            {prettifySlot(slot)}
          </p>
        </div>

        {isLocked ? (
          <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-200">
            Locked
          </span>
        ) : (
          <span className="rounded-full border border-zinc-700 bg-zinc-900 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-400">
            Auto
          </span>
        )}
      </div>

      <div className="space-y-2">
        <select
          value={selectedTeam}
          onChange={(event) => setSelectedTeam(event.target.value)}
          disabled={loading}
          className="h-10 w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 text-sm text-white outline-none transition focus:border-white disabled:opacity-60"
        >
          <option value="">Kies land</option>
          {options.map((team) => (
            <option key={`${side}-${matchId}-${team}`} value={team}>
              {team}
            </option>
          ))}
        </select>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={saveOverride}
            disabled={loading}
            className="rounded-md bg-white px-3 py-1.5 text-[11px] font-semibold text-zinc-950 transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading
              ? "Opslaan..."
              : side === "home"
              ? "Home opslaan"
              : "Away opslaan"}
          </button>

          <button
            type="button"
            onClick={resetOverride}
            disabled={loading}
            className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-[11px] font-semibold text-zinc-200 transition hover:border-zinc-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {side === "home" ? "Reset home" : "Reset away"}
          </button>
        </div>
      </div>

      {error ? (
        <div className="mt-2 rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-[11px] text-red-200">
          {error}
        </div>
      ) : null}

      {message ? (
        <div className="mt-2 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-[11px] text-emerald-200">
          {message}
        </div>
      ) : null}
    </div>
  );
}

export default function KnockoutOverridePanel({
  matchId,
  homeSlot,
  awaySlot,
  homeTeam,
  awayTeam,
  homeTeamLockedByAdmin,
  awayTeamLockedByAdmin,
  homeOptions,
  awayOptions,
}: KnockoutOverridePanelProps) {
  return (
    <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
      <div className="mb-2">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-200">
          Handmatige knockout override
        </p>
        <p className="mt-1 text-[11px] text-zinc-400">
          Groepsslots tonen alleen landen uit de juiste groep.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <SidePanel
          matchId={matchId}
          side="home"
          slot={homeSlot}
          currentTeam={homeTeam}
          locked={homeTeamLockedByAdmin}
          options={homeOptions}
        />

        <SidePanel
          matchId={matchId}
          side="away"
          slot={awaySlot}
          currentTeam={awayTeam}
          locked={awayTeamLockedByAdmin}
          options={awayOptions}
        />
      </div>
    </div>
  );
}