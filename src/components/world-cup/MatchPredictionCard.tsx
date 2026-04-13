"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";

type MatchPredictionCardProps = {
  poolId: string;
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
  initialPrediction: {
    predicted_home_score: number;
    predicted_away_score: number;
  } | null;
};

function getMatchState(match: MatchPredictionCardProps["match"]) {
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

function getStatusLabel(state: "open" | "locked" | "finished") {
  if (state === "open") return "Open";
  if (state === "locked") return "Gelockt";
  return "Finished";
}

function getStatusClasses(state: "open" | "locked" | "finished") {
  if (state === "open") {
    return "border-emerald-500/30 bg-emerald-500/10 text-emerald-200";
  }

  if (state === "locked") {
    return "border-amber-500/30 bg-amber-500/10 text-amber-200";
  }

  return "border-sky-500/30 bg-sky-500/10 text-sky-200";
}

export default function MatchPredictionCard({
  poolId,
  match,
  initialPrediction,
}: MatchPredictionCardProps) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [homeScore, setHomeScore] = useState(
    initialPrediction ? String(initialPrediction.predicted_home_score) : ""
  );
  const [awayScore, setAwayScore] = useState(
    initialPrediction ? String(initialPrediction.predicted_away_score) : ""
  );
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const matchState = getMatchState(match);
  const isLocked = matchState !== "open";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isLocked) {
      setError("Deze wedstrijd is gelockt en kan niet meer aangepast worden.");
      return;
    }

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

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setError("Je sessie kon niet worden geladen. Log opnieuw in.");
      setLoading(false);
      router.push("/auth");
      return;
    }

    const { error: upsertError } = await supabase.from("predictions").upsert(
      {
        pool_id: poolId,
        match_id: match.id,
        user_id: user.id,
        predicted_home_score: parsedHome,
        predicted_away_score: parsedAway,
      },
      {
        onConflict: "pool_id,match_id,user_id",
      }
    );

    if (upsertError) {
      setError(upsertError.message);
      setLoading(false);
      return;
    }

    setMessage("Voorspelling opgeslagen.");
    setLoading(false);
    router.refresh();
  }

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full border px-2.5 py-1 text-[11px] font-medium uppercase tracking-wide ${getStatusClasses(
                matchState
              )}`}
            >
              {getStatusLabel(matchState)}
            </span>

            <span className="text-xs text-zinc-500">
              {new Date(match.starts_at).toLocaleString("nl-NL", {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </span>
          </div>

          <h3 className="mt-3 text-base font-semibold text-white sm:text-lg">
            {match.home_team} vs {match.away_team}
          </h3>

          {matchState === "finished" &&
          match.home_score !== null &&
          match.away_score !== null ? (
            <p className="mt-1 text-sm text-zinc-300">
              Uitslag:{" "}
              <span className="font-semibold text-white">
                {match.home_score} - {match.away_score}
              </span>
            </p>
          ) : initialPrediction ? (
            <p className="mt-1 text-sm text-zinc-400">
              Mijn voorspelling:{" "}
              <span className="font-medium text-white">
                {initialPrediction.predicted_home_score} -{" "}
                {initialPrediction.predicted_away_score}
              </span>
            </p>
          ) : (
            <p className="mt-1 text-sm text-zinc-500">
              Nog geen voorspelling ingevuld
            </p>
          )}
        </div>

        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-[1fr_auto_1fr_auto] items-end gap-2 lg:min-w-[360px]"
        >
          <div>
            <label className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-zinc-500">
              Home
            </label>
            <input
              type="number"
              min="0"
              inputMode="numeric"
              value={homeScore}
              onChange={(event) => setHomeScore(event.target.value)}
              disabled={isLocked || loading}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white outline-none transition focus:border-white disabled:opacity-60"
            />
          </div>

          <div className="pb-2 text-sm font-semibold text-zinc-500">-</div>

          <div>
            <label className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-zinc-500">
              Away
            </label>
            <input
              type="number"
              min="0"
              inputMode="numeric"
              value={awayScore}
              onChange={(event) => setAwayScore(event.target.value)}
              disabled={isLocked || loading}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white outline-none transition focus:border-white disabled:opacity-60"
            />
          </div>

          <button
            type="submit"
            disabled={isLocked || loading}
            className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-zinc-950 transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLocked ? "Dicht" : loading ? "..." : "Opslaan"}
          </button>
        </form>
      </div>

      {matchState === "locked" ? (
        <p className="mt-3 text-xs text-amber-300">
          Deze wedstrijd is gelockt. Je voorspelling kan niet meer aangepast
          worden.
        </p>
      ) : null}

      {error ? (
        <div className="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      {message ? (
        <div className="mt-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
          {message}
        </div>
      ) : null}
    </div>
  );
}