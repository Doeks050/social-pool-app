"use client";

import { useEffect, useState } from "react";

type WorldCupScoreNoticeModalProps = {
  language?: "nl" | "en";
};

const STORAGE_KEY = "poolr-world-cup-regular-time-score-notice-dismissed-v1";

export default function WorldCupScoreNoticeModal({
  language = "nl",
}: WorldCupScoreNoticeModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  useEffect(() => {
    const dismissed = window.localStorage.getItem(STORAGE_KEY);

    if (dismissed !== "true") {
      setIsOpen(true);
    }
  }, []);

  function closeModal() {
    if (dontShowAgain) {
      window.localStorage.setItem(STORAGE_KEY, "true");
    }

    setIsOpen(false);
  }

  if (!isOpen) {
    return null;
  }

  const isDutch = language === "nl";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl border border-amber-300/30 bg-[#08110d] p-5 shadow-2xl shadow-black/40">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-amber-300/30 bg-amber-300/15 text-xl font-black text-amber-200">
            !
          </div>

          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-200">
              {isDutch ? "Let op!" : "Important!"}
            </p>

            <h2 className="mt-2 text-xl font-black tracking-tight text-white">
              {isDutch
                ? "Voorspellingen tellen over 90 minuten"
                : "Predictions count over 90 minutes"}
            </h2>

            <p className="mt-3 text-sm leading-6 text-zinc-300">
              {isDutch
                ? "Scores die je invult gelden voor de 90 minuten speeltijd van de wedstrijd. Verlenging en penalties tellen niet mee."
                : "Submitted scores count for the 90 minutes of regular match time only. Extra time and penalties do not count."}
            </p>
          </div>
        </div>

        <label className="mt-5 flex cursor-pointer items-center gap-3 rounded-2xl border border-white/10 bg-black/20 p-3 text-sm font-semibold text-zinc-300">
          <input
            type="checkbox"
            checked={dontShowAgain}
            onChange={(event) => setDontShowAgain(event.target.checked)}
            className="h-4 w-4 accent-amber-300"
          />

          <span>
            {isDutch ? "Niet meer tonen" : "Don't show me again"}
          </span>
        </label>

        <button
          type="button"
          onClick={closeModal}
          className="mt-4 w-full rounded-2xl bg-amber-300 px-5 py-3 text-sm font-black text-zinc-950 transition hover:bg-amber-200"
        >
          {isDutch ? "Begrepen" : "Got it"}
        </button>
      </div>
    </div>
  );
}