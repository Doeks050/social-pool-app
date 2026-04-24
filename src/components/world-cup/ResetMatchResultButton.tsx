"use client";

import { useState } from "react";

type ResetMatchResultButtonProps = {
  matchId: string;
};

export default function ResetMatchResultButton({
  matchId,
}: ResetMatchResultButtonProps) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function resetResult() {
    const confirmed = window.confirm(
      "Weet je zeker dat je deze uitslag en de punten voor deze wedstrijd wilt resetten?"
    );

    if (!confirmed) {
      return;
    }

    setLoading(true);
    setMessage(null);
    setError(null);

    try {
      const response = await fetch("/api/admin/world-cup/results/reset", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          matchId,
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
    <div className="space-y-2">
      <button
        type="button"
        onClick={resetResult}
        disabled={loading}
        className="w-full rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-200 transition hover:border-red-500/50 hover:bg-red-500/15 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Resetten..." : "Reset uitslag en punten"}
      </button>

      {error ? (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-200">
          {error}
        </div>
      ) : null}

      {message ? (
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-200">
          {message}
        </div>
      ) : null}
    </div>
  );
}