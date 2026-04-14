"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";

type MatchResultAdminCardProps = {
  match: {
    id: string;
    stage: string;
    round_name: string;
    home_team: string;
    away_team: string;
    starts_at: string;
    status: string;
    home_score: number | null;
    away_score: number | null;
  };
};

export default function MatchResultAdminCard({
  match,
}: MatchResultAdminCardProps) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [homeScore, setHomeScore] = useState(
    match.home_score !== null ? String(match.home_score) : ""
  );
  const [awayScore, setAwayScore] = useState(
    match.away_score !== null ? String(match.away_score) : ""
  );
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const formattedStart = useMemo(() => {
    return new Intl.DateTimeFormat("nl-NL", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "Europe/Amsterdam",
    }).format(new Date(match.starts_at));
  }, [match.starts_at]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const parsedHome = Number(homeScore);
    const parsedAway = Number(awayScore);

    if (
      !Number.isInteger(parsedHome) ||
      !Number.isInteger(parsedAway) ||
      parsedHome < 0 ||
      parsedAway < 0
    ) {
      setError("Vul geldige scores van 0 of hoger in.");
      return;
    }

    setLoading(true);
    setError(null);
    setMessage(null);

    const { error: rpcError } = await supabase.rpc(
      "submit_world_cup_match_result_admin",
      {
        target_match_id: match.id,
        new_home_score: parsedHome,
        new_away_score: parsedAway,
      }
    );

    if (rpcError) {
      setError(rpcError.message);
      setLoading(false);
      return;
    }

    setMessage("Officiële uitslag opgeslagen en scoring bijgewerkt.");
    setLoading(false);
    router.refresh();
  }

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-zinc-700 px-2.5 py-1 text-xs uppercase tracking-wide text-zinc-300">
              {match.stage}
            </span>
            <span className="text-sm text-zinc-400">{match.round_name}</span>
          </div>

          <h2 className="mt-3 text-xl font-semibold">
            {match.home_team} vs {match.away_team}
          </h2>

          <p className="mt-2 text-sm text-zinc-400">Start: {formattedStart}</p>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 px-4 py-3 text-sm">
          <div className="font-semibold capitalize text-white">
            {match.status}
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-5 space-y-4">
        <div className="grid gap-4 sm:grid-cols-[1fr_auto_1fr] sm:items-end">
          <div>
            <label className="mb-2 block text-sm font-medium text-zinc-200">
              {match.home_team}
            </label>
            <input
              type="number"
              min="0"
              inputMode="numeric"
              value={homeScore}
              onChange={(event) => setHomeScore(event.target.value)}
              disabled={loading}
              className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-white outline-none transition focus:border-white disabled:opacity-60"
            />
          </div>

          <div className="pb-3 text-center text-lg font-semibold text-zinc-400">
            -
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-zinc-200">
              {match.away_team}
            </label>
            <input
              type="number"
              min="0"
              inputMode="numeric"
              value={awayScore}
              onChange={(event) => setAwayScore(event.target.value)}
              disabled={loading}
              className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-white outline-none transition focus:border-white disabled:opacity-60"
            />
          </div>
        </div>

        {error ? (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        ) : null}

        {message ? (
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
            {message}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={loading}
          className="rounded-xl bg-white px-5 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Opslaan..." : "Officiële uitslag opslaan"}
        </button>
      </form>
    </div>
  );
}