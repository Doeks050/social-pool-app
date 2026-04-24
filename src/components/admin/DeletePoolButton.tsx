"use client";

import { useState } from "react";

type DeletePoolButtonProps = {
  poolId: string;
  poolName: string;
};

export default function DeletePoolButton({
  poolId,
  poolName,
}: DeletePoolButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function deletePool() {
    const confirmed = window.confirm(
      `Weet je zeker dat je "${poolName}" wilt verwijderen? Dit wist leden, voorspellingen en bonusantwoorden.`
    );

    if (!confirmed) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/pools/delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ poolId }),
      });

      const result = (await response.json()) as {
        ok?: boolean;
        error?: string;
      };

      if (!response.ok || !result.ok) {
        setError(result.error ?? "Pool verwijderen mislukt.");
        setLoading(false);
        return;
      }

      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Onbekende fout.");
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        onClick={deletePool}
        disabled={loading}
        className="w-full rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-xs font-semibold text-red-200 transition hover:border-red-500/50 hover:bg-red-500/15 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Verwijderen..." : "Verwijder pool"}
      </button>

      {error ? <p className="text-xs text-red-200">{error}</p> : null}
    </div>
  );
}