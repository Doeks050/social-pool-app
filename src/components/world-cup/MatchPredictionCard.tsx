"use client";

import { FormEvent, useEffect, useState } from "react";
import type { Language } from "@/lib/i18n";
import { getTeamFlagAlt, getTeamFlagSrc } from "@/lib/world-cup-flags";

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
  language: Language;
};

type TeamPredictionRowProps = {
  teamName: string;
  score: string;
  scoreName: string;
  editable: boolean;
  loading: boolean;
  onScoreChange: (value: string) => void;
};

const copy = {
  en: {
    group: "Group",
    match: "Match",
    finished: "Finished",
    live: "Live",
    locked: "Locked",
    open: "Open",
    startsIn: "Starts in",
    prediction: "Prediction",
    score: "Score",
    savingPredictionFailed: "Saving prediction failed.",
    predictionSaved: "Prediction saved.",
    unknownSaveError: "Unknown error while saving.",
    final: "Final",
    points: "pts",
    saved: "Saved",
    noPrediction: "No prediction",
    saving: "Saving...",
    update: "Update",
    save: "Save",
    tbd: "TBD",
    locking: "locking...",
  },
  nl: {
    group: "Groep",
    match: "Wedstrijd",
    finished: "Afgelopen",
    live: "Live",
    locked: "Gesloten",
    open: "Open",
    startsIn: "Start over",
    prediction: "Voorspelling",
    score: "Score",
    savingPredictionFailed: "Opslaan van voorspelling mislukt.",
    predictionSaved: "Voorspelling opgeslagen.",
    unknownSaveError: "Onbekende fout tijdens opslaan.",
    final: "Eindstand",
    points: "ptn",
    saved: "Opgeslagen",
    noPrediction: "Geen voorspelling",
    saving: "Opslaan...",
    update: "Bijwerken",
    save: "Opslaan",
    tbd: "N.t.b.",
    locking: "sluit...",
  },
} satisfies Record<Language, Record<string, string>>;

function formatMatchDate(value: string, language: Language) {
  return new Intl.DateTimeFormat(language === "nl" ? "nl-NL" : "en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Europe/Amsterdam",
  }).format(new Date(value));
}

function getDisplayTeam(
  team: string | null,
  slot: string | null,
  language: Language
) {
  const t = copy[language];

  if (team && team.trim()) return team;
  if (slot && slot.trim()) return slot;
  return t.tbd;
}

function getStageLabel(
  match: MatchPredictionCardProps["match"],
  language: Language
) {
  const t = copy[language];

  if (match.group_label && match.group_label.trim()) {
    const value = match.group_label.trim();

    if (value.toLowerCase().startsWith("group ")) {
      return language === "nl"
        ? value.replace(/^group/i, t.group)
        : value;
    }

    return `${t.group} ${value}`;
  }

  if (match.round_name) return match.round_name;
  if (match.stage) return match.stage;
  return t.match;
}

function getStatusLabel(status: string, language: Language) {
  const t = copy[language];

  if (status === "finished") return t.finished;
  if (status === "live") return t.live;
  if (status === "locked") return t.locked;
  return t.open;
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

function isEditable(match: MatchPredictionCardProps["match"], now: number) {
  if (
    match.status === "finished" ||
    match.status === "locked" ||
    match.status === "live"
  ) {
    return false;
  }

  return new Date(match.starts_at).getTime() > now;
}

function getScoreValue(value: number | null | undefined) {
  return value === null || value === undefined ? "" : String(value);
}

function formatCountdown(targetDate: string, now: number, language: Language) {
  const t = copy[language];
  const target = new Date(targetDate).getTime();
  const diff = target - now;

  if (diff <= 0) {
    return t.locking;
  }

  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (days > 0) {
    return `${days}d ${hours}h`;
  }

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }

  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }

  return `${seconds}s`;
}

function TeamPredictionRow({
  teamName,
  score,
  scoreName,
  editable,
  loading,
  onScoreChange,
}: TeamPredictionRowProps) {
  const flagSrc = getTeamFlagSrc(teamName);

  return (
    <div className="grid grid-cols-[2.5rem_minmax(0,1fr)_3rem] items-center gap-2.5 rounded-xl border border-white/10 bg-[#06110d]/95 px-2.5 py-2">
      <div className="flex h-8 w-10 items-center justify-center rounded-lg border border-white/10 bg-black/35">
        {flagSrc ? (
          <img
            src={flagSrc}
            alt={getTeamFlagAlt(teamName)}
            width={80}
            height={60}
            className="h-[21px] w-[31px] rounded object-cover shadow-[0_0_0_1px_rgba(255,255,255,0.14)]"
            loading="lazy"
          />
        ) : (
          <span className="text-[8px] font-black uppercase tracking-wide text-zinc-500">
            TBD
          </span>
        )}
      </div>

      <p className="min-w-0 truncate text-sm font-black leading-none text-white">
        {teamName}
      </p>

      <input
        name={scoreName}
        type="number"
        min="0"
        inputMode="numeric"
        value={score}
        onChange={(event) => onScoreChange(event.target.value)}
        disabled={!editable || loading}
        className="h-9 w-12 rounded-lg border border-emerald-300/20 bg-black/45 px-1 text-center text-sm font-black text-white outline-none transition placeholder:text-zinc-600 focus:border-emerald-300/80 focus:bg-black/70 disabled:cursor-not-allowed disabled:opacity-50"
        placeholder="-"
        required={editable}
      />
    </div>
  );
}

export default function MatchPredictionCard({
  match,
  poolId,
  prediction,
  language,
}: MatchPredictionCardProps) {
  const t = copy[language];

  const homeDisplay = getDisplayTeam(match.home_team, match.home_slot, language);
  const awayDisplay = getDisplayTeam(match.away_team, match.away_slot, language);

  const [now, setNow] = useState(Date.now());
  const editable = isEditable(match, now);
  const showCountdown = editable && new Date(match.starts_at).getTime() > now;

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
    const interval = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => window.clearInterval(interval);
  }, []);

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
        setError(result.error ?? t.savingPredictionFailed);
        setLoading(false);
        return;
      }

      setHasPrediction(true);
      setMessage(result.message ?? t.predictionSaved);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.unknownSaveError);
    }

    setLoading(false);
  }

  return (
    <article className="rounded-2xl border border-white/10 bg-black/20 p-3.5 transition hover:border-emerald-300/25 hover:bg-white/[0.04]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-emerald-300">
              {getStageLabel(match, language)}
            </p>

            {match.match_number !== null ? (
              <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-zinc-300">
                {t.match} {match.match_number}
              </span>
            ) : null}
          </div>

          <p className="mt-1 text-[11px] font-medium text-zinc-500">
            {formatMatchDate(match.starts_at, language)}
          </p>
        </div>

        <div
          className={`shrink-0 rounded-full border px-2 py-1 text-[9px] font-black uppercase tracking-wide ${getStatusClasses(
            editable ? "open" : match.status
          )}`}
        >
          {editable ? t.open : getStatusLabel(match.status, language)}
        </div>
      </div>

      {showCountdown ? (
        <div className="mt-3 flex items-center justify-between rounded-xl border border-emerald-300/25 bg-emerald-300/[0.08] px-3 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
          <span className="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-200/80">
            {t.startsIn}
          </span>
          <span className="font-mono text-base font-black leading-none text-emerald-100">
            {formatCountdown(match.starts_at, now, language)}
          </span>
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="mt-3">
        <div className="rounded-2xl border border-white/10 bg-black/20 p-2">
          <div className="grid grid-cols-[1fr_3rem] items-center gap-2 px-1 pb-1.5">
            <span className="text-[9px] font-black uppercase tracking-[0.16em] text-zinc-500">
              {t.prediction}
            </span>
            <span className="text-center text-[9px] font-black uppercase tracking-[0.12em] text-zinc-500">
              {t.score}
            </span>
          </div>

          <div className="grid gap-1.5">
            <TeamPredictionRow
              teamName={homeDisplay}
              score={homeScore}
              scoreName="predicted_home_score"
              editable={editable}
              loading={loading}
              onScoreChange={setHomeScore}
            />

            <TeamPredictionRow
              teamName={awayDisplay}
              score={awayScore}
              scoreName="predicted_away_score"
              editable={editable}
              loading={loading}
              onScoreChange={setAwayScore}
            />
          </div>
        </div>

        {error ? (
          <div className="mt-2 rounded-lg border border-red-500/30 bg-red-500/10 px-2.5 py-1.5 text-xs text-red-200">
            {error}
          </div>
        ) : null}

        {message ? (
          <div className="mt-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1.5 text-xs text-emerald-200">
            {message}
          </div>
        ) : null}

        {match.status === "finished" &&
        match.home_score !== null &&
        match.away_score !== null ? (
          <div className="mt-2 rounded-lg border border-sky-400/20 bg-sky-400/10 px-2.5 py-1.5 text-xs text-sky-100">
            {t.final}: <span className="font-black">{match.home_score}</span> -{" "}
            <span className="font-black">{match.away_score}</span>
            {prediction?.points_awarded !== null &&
            prediction?.points_awarded !== undefined ? (
              <span className="ml-1.5 text-sky-200">
                · {prediction.points_awarded} {t.points}
              </span>
            ) : null}
          </div>
        ) : null}

        <div className="mt-2.5 flex items-center justify-between gap-2">
          <div className="truncate text-[11px] font-medium text-zinc-500">
            {hasPrediction ? t.saved : editable ? t.noPrediction : t.locked}
          </div>

          <button
            type="submit"
            disabled={!editable || loading}
            className="shrink-0 rounded-lg bg-emerald-300 px-3.5 py-2 text-xs font-black text-zinc-950 transition hover:bg-emerald-200 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? t.saving : hasPrediction ? t.update : t.save}
          </button>
        </div>
      </form>
    </article>
  );
}