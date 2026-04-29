"use client";

import { useEffect, useMemo, useState } from "react";
import type { Language } from "@/lib/i18n";

type BonusDeadlineCountdownProps = {
  lockAt: string | null;
  isLocked: boolean;
  language: Language;
};

const copy = {
  en: {
    locked: "Locked",
    daysLeft: "days left",
    lessThan24HoursLeft: "Less than 24 hours left",
    countdownUnavailable: "Countdown unavailable",
    noFirstMatchFound: "No first World Cup match was found.",
    bonusQuestionsLocked: "Bonus questions locked",
    firstMatchStarted: "The first World Cup match has started.",
    locksAtFirstKickoff: "Locks at first kick-off",
    days: "Days",
    hours: "Hours",
    min: "Min",
    sec: "Sec",
  },
  nl: {
    locked: "Gesloten",
    daysLeft: "dagen over",
    lessThan24HoursLeft: "Minder dan 24 uur over",
    countdownUnavailable: "Countdown niet beschikbaar",
    noFirstMatchFound: "Er is geen eerste WK-wedstrijd gevonden.",
    bonusQuestionsLocked: "Bonusvragen gesloten",
    firstMatchStarted: "De eerste WK-wedstrijd is begonnen.",
    locksAtFirstKickoff: "Sluit bij eerste aftrap",
    days: "Dagen",
    hours: "Uren",
    min: "Min",
    sec: "Sec",
  },
} satisfies Record<Language, Record<string, string>>;

function formatCountdown(targetDate: string, now: number, language: Language) {
  const t = copy[language];

  const target = new Date(targetDate).getTime();
  const diff = target - now;

  if (diff <= 0) {
    return {
      days: "00",
      hours: "00",
      minutes: "00",
      seconds: "00",
      label: t.locked,
    };
  }

  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return {
    days: String(days).padStart(2, "0"),
    hours: String(hours).padStart(2, "0"),
    minutes: String(minutes).padStart(2, "0"),
    seconds: String(seconds).padStart(2, "0"),
    label: days > 0 ? `${days} ${t.daysLeft}` : t.lessThan24HoursLeft,
  };
}

export default function BonusDeadlineCountdown({
  lockAt,
  isLocked,
  language,
}: BonusDeadlineCountdownProps) {
  const t = copy[language];
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const interval = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => window.clearInterval(interval);
  }, []);

  const countdown = useMemo(() => {
    if (!lockAt) {
      return null;
    }

    return formatCountdown(lockAt, now, language);
  }, [lockAt, now, language]);

  if (!lockAt || !countdown) {
    return (
      <div className="rounded-2xl border border-orange-300/25 bg-orange-300/10 px-4 py-3 text-center">
        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-orange-100">
          {t.countdownUnavailable}
        </p>
        <p className="mt-1 text-sm font-semibold text-orange-100">
          {t.noFirstMatchFound}
        </p>
      </div>
    );
  }

  if (isLocked || countdown.label === t.locked) {
    return (
      <div className="rounded-2xl border border-orange-300/25 bg-orange-300/10 px-4 py-4 text-center">
        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-orange-100">
          {t.bonusQuestionsLocked}
        </p>
        <p className="mt-2 text-3xl font-black tracking-tight text-white">
          {t.locked}
        </p>
        <p className="mt-1 text-sm font-semibold text-zinc-400">
          {t.firstMatchStarted}
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-emerald-300/25 bg-emerald-300/10 px-4 py-4">
      <div className="text-center">
        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-emerald-200">
          {t.locksAtFirstKickoff}
        </p>
        <p className="mt-1 text-xs font-semibold text-zinc-400">
          {countdown.label}
        </p>
      </div>

      <div className="mt-4 grid grid-cols-4 gap-2">
        <div className="rounded-xl border border-white/10 bg-black/25 px-2 py-2 text-center">
          <p className="font-mono text-2xl font-black leading-none text-white">
            {countdown.days}
          </p>
          <p className="mt-1 text-[9px] font-black uppercase tracking-[0.14em] text-zinc-500">
            {t.days}
          </p>
        </div>

        <div className="rounded-xl border border-white/10 bg-black/25 px-2 py-2 text-center">
          <p className="font-mono text-2xl font-black leading-none text-white">
            {countdown.hours}
          </p>
          <p className="mt-1 text-[9px] font-black uppercase tracking-[0.14em] text-zinc-500">
            {t.hours}
          </p>
        </div>

        <div className="rounded-xl border border-white/10 bg-black/25 px-2 py-2 text-center">
          <p className="font-mono text-2xl font-black leading-none text-white">
            {countdown.minutes}
          </p>
          <p className="mt-1 text-[9px] font-black uppercase tracking-[0.14em] text-zinc-500">
            {t.min}
          </p>
        </div>

        <div className="rounded-xl border border-white/10 bg-black/25 px-2 py-2 text-center">
          <p className="font-mono text-2xl font-black leading-none text-white">
            {countdown.seconds}
          </p>
          <p className="mt-1 text-[9px] font-black uppercase tracking-[0.14em] text-zinc-500">
            {t.sec}
          </p>
        </div>
      </div>
    </div>
  );
}