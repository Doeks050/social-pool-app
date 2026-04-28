"use client";

import { useState } from "react";

type ResetAllResultsButtonProps = {
  action: () => void;
};

export default function ResetAllResultsButton({
  action,
}: ResetAllResultsButtonProps) {
  const [confirmed, setConfirmed] = useState(false);

  return (
    <div className="flex flex-col gap-2 sm:items-end">
      {!confirmed ? (
        <button
          type="button"
          onClick={() => setConfirmed(true)}
          className="w-full rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-200 transition hover:border-red-400 hover:bg-red-500/20 sm:w-auto"
        >
          Verwijder alle uitslagen
        </button>
      ) : (
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          <form action={action}>
            <button
              type="submit"
              className="w-full rounded-xl bg-red-500 px-4 py-2 text-sm font-bold text-white transition hover:bg-red-400 sm:w-auto"
            >
              Zeker weten
            </button>
          </form>

          <button
            type="button"
            onClick={() => setConfirmed(false)}
            className="w-full rounded-xl border border-zinc-700 px-4 py-2 text-sm font-semibold text-zinc-200 transition hover:bg-zinc-800 sm:w-auto"
          >
            Annuleren
          </button>
        </div>
      )}

      {confirmed ? (
        <p className="max-w-xs text-right text-xs leading-5 text-red-200">
          Dit verwijdert alle ingevulde WK-uitslagen en herberekende punten.
        </p>
      ) : null}
    </div>
  );
}