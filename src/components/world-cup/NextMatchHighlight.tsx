"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useLanguage } from "@/hooks/useLanguage";
import { getTeamFlagAlt, getTeamFlagSrc } from "@/lib/world-cup-flags";

type NextMatchHighlightProps = {
  poolId: string;
  match: {
    id: string;
    starts_at: string;
    stage: string | null;
    round_name: string | null;
    group_label: string | null;
    match_number: number | null;
    home_team: string | null;
    away_team: string | null;
    home_slot: string | null;
    away_slot: string | null;
  } | null;
};

const copy = {
  en: {
    nextMatch: "Next match",
    noUpcomingMatches: "No upcoming matches",
    noOpenMatch: "There is currently no open World Cup match available.",
    group: "Group",
    match: "Match",
    startsIn: "Starts in",
    days: "days",
    hours: "hours",
    min: "min",
    sec: "sec",
    hour: "hour",
    predictionLocks: "Your prediction locks when the match starts.",
    predictMatch: "Predict match",
  },
  nl: {
    nextMatch: "Volgende wedstrijd",
    noUpcomingMatches: "Geen aankomende wedstrijden",
    noOpenMatch: "Er is momenteel geen open WK-wedstrijd beschikbaar.",
    group: "Groep",
    match: "Wedstrijd",
    startsIn: "Start over",
    days: "dagen",
    hours: "uren",
    min: "min",
    sec: "sec",
    hour: "uur",
    predictionLocks: "Je voorspelling sluit zodra de wedstrijd begint.",
    predictMatch: "Wedstrijd voorspellen",
  },
};

function formatMatchDate(value: string, language: "en" | "nl") {
  return new Intl.DateTimeFormat(language === "nl" ? "nl-NL" : "en-GB", {
    weekday: "long",
    day: "2-digit",
    month: "short",
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

function getStageLabel(
  match: NonNullable<NextMatchHighlightProps["match"]>,
  language: "en" | "nl"
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
  return t.nextMatch;
}

function formatCountdown(
  targetDate: string,
  now: number,
  language: "en" | "nl"
) {
  const t = copy[language];
  const target = new Date(targetDate).getTime();
  const diff = target - now;

  if (diff <= 0) {
    return {
      expired: true,
      blocks: [
        { value: "0", label: t.days },
        { value: "0", label: t.hours },
        { value: "0", label: t.min },
      ],
    };
  }

  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (days > 0) {
    return {
      expired: false,
      blocks: [
        { value: String(days), label: t.days },
        { value: String(hours), label: t.hours },
        { value: String(minutes), label: t.min },
      ],
    };
  }

  if (hours > 0) {
    return {
      expired: false,
      blocks: [
        { value: String(hours), label: t.hours },
        { value: String(minutes), label: t.min },
        { value: String(seconds), label: t.sec },
      ],
    };
  }

  return {
    expired: false,
    blocks: [
      { value: String(minutes), label: t.min },
      { value: String(seconds), label: t.sec },
      { value: "<1", label: t.hour },
    ],
  };
}

function FlagBox({ teamName }: { teamName: string }) {
  const flagSrc = getTeamFlagSrc(teamName);

  return (
    <div className="flex h-14 w-16 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-black/35">
      {flagSrc ? (
        <img
          src={flagSrc}
          alt={getTeamFlagAlt(teamName)}
          width={80}
          height={60}
          className="h-[34px] w-[48px] rounded-md object-cover shadow-[0_0_0_1px_rgba(255,255,255,0.18)]"
          loading="lazy"
        />
      ) : (
        <span className="text-[9px] font-black uppercase tracking-wide text-zinc-500">
          TBD
        </span>
      )}
    </div>
  );
}

function TeamSide({ teamName }: { teamName: string }) {
  return (
    <div className="flex min-w-0 flex-col items-center text-center">
      <FlagBox teamName={teamName} />

      <p className="mt-3 max-w-full truncate text-xl font-black leading-tight text-white sm:text-2xl">
        {teamName}
      </p>
    </div>
  );
}

export default function NextMatchHighlight({
  poolId,
  match,
}: NextMatchHighlightProps) {
  const router = useRouter();
  const { language } = useLanguage();
  const t = copy[language];

  const [now, setNow] = useState(Date.now());
  const [hasRefreshed, setHasRefreshed] = useState(false);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => window.clearInterval(interval);
  }, []);

  const countdown = useMemo(() => {
    if (!match) return null;
    return formatCountdown(match.starts_at, now, language);
  }, [match, now, language]);

  useEffect(() => {
    if (!match || !countdown?.expired || hasRefreshed) {
      return;
    }

    setHasRefreshed(true);

    const timeout = window.setTimeout(() => {
      router.refresh();
    }, 1500);

    return () => window.clearTimeout(timeout);
  }, [countdown?.expired, hasRefreshed, match, router]);

  if (!match) {
    return (
      <section className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-5 text-center backdrop-blur-xl">
        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-emerald-300">
          {t.nextMatch}
        </p>

        <h2 className="mt-2 text-2xl font-black tracking-tight text-white">
          {t.noUpcomingMatches}
        </h2>

        <p className="mt-2 text-sm leading-6 text-zinc-400">
          {t.noOpenMatch}
        </p>
      </section>
    );
  }

  const homeDisplay = getDisplayTeam(match.home_team, match.home_slot);
  const awayDisplay = getDisplayTeam(match.away_team, match.away_slot);

  return (
    <section className="relative overflow-hidden rounded-[1.5rem] border border-emerald-300/20 bg-[#07110d]/95 shadow-[0_20px_70px_rgba(0,0,0,0.35)]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(110,231,183,0.16),transparent_34%),radial-gradient(circle_at_80%_30%,rgba(20,184,166,0.08),transparent_28%)]" />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-200/55 to-transparent" />

      <div className="relative z-10 p-4 sm:p-5">
        <div className="text-center">
          <div className="flex flex-wrap items-center justify-center gap-2">
            <span className="rounded-full border border-emerald-300/30 bg-emerald-300/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-emerald-200">
              {t.nextMatch}
            </span>

            <span className="rounded-full border border-white/10 bg-black/25 px-3 py-1 text-[10px] font-black uppercase tracking-wide text-zinc-300">
              {getStageLabel(match, language)}
            </span>

            {match.match_number !== null ? (
              <span className="rounded-full border border-white/10 bg-black/25 px-3 py-1 text-[10px] font-black uppercase tracking-wide text-zinc-300">
                {t.match} {match.match_number}
              </span>
            ) : null}
          </div>

          <h2 className="mt-3 text-2xl font-black tracking-tight text-white sm:text-3xl">
            {homeDisplay} vs {awayDisplay}
          </h2>

          <p className="mt-1.5 text-sm font-semibold text-zinc-400">
            {formatMatchDate(match.starts_at, language)}
          </p>
        </div>

        <div className="mx-auto mt-5 max-w-4xl rounded-[1.5rem] border border-white/10 bg-black/20 p-4">
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
            <TeamSide teamName={homeDisplay} />

            <div className="flex justify-center">
              <div className="flex h-11 w-11 items-center justify-center rounded-full border border-emerald-300/20 bg-emerald-300/10 text-[11px] font-black uppercase tracking-[0.16em] text-emerald-200">
                vs
              </div>
            </div>

            <TeamSide teamName={awayDisplay} />
          </div>
        </div>

        <div className="mx-auto mt-4 max-w-3xl rounded-[1.5rem] border border-emerald-300/25 bg-emerald-300/[0.08] p-4 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-emerald-200/90">
            {t.startsIn}
          </p>

          <div className="mt-3 grid grid-cols-3 gap-2">
            {countdown?.blocks.map((block) => (
              <div
                key={`${block.label}-${block.value}`}
                className="rounded-2xl border border-white/10 bg-black/35 px-3 py-3 text-center"
              >
                <p className="font-mono text-3xl font-black leading-none tracking-tight text-emerald-100 sm:text-4xl">
                  {block.value}
                </p>

                <p className="mt-1.5 text-[9px] font-black uppercase tracking-[0.16em] text-emerald-200/75">
                  {block.label}
                </p>
              </div>
            ))}
          </div>

          <p className="mt-3 text-xs font-semibold text-zinc-400">
            {t.predictionLocks}
          </p>
        </div>

        <div className="mt-4 flex justify-center">
          <Link
            href={`/pools/${poolId}/matches`}
            className="inline-flex w-full max-w-xs items-center justify-center rounded-2xl bg-emerald-300 px-5 py-3 text-sm font-black text-zinc-950 transition hover:bg-emerald-200 active:scale-[0.99]"
          >
            {t.predictMatch}
          </Link>
        </div>
      </div>
    </section>
  );
}