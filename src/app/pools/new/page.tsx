"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Container from "@/components/Container";
import { createClient } from "@/lib/supabase-browser";
import {
  POOL_TYPE_OPTIONS,
  PoolType,
  getPoolTypeMeta,
} from "@/lib/pool-types";

export default function NewPoolPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [name, setName] = useState("");
  const [gameType, setGameType] = useState<PoolType>("world_cup");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedType = getPoolTypeMeta(gameType);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedName = name.trim();

    if (!trimmedName) {
      setError("Vul een poolnaam in.");
      return;
    }

    setLoading(true);
    setError(null);

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

    const { data, error } = await supabase
      .from("pools")
      .insert({
        name: trimmedName,
        game_type: gameType,
        owner_id: user.id,
      })
      .select("id")
      .single();

    if (error || !data) {
      setError(error?.message ?? "Pool aanmaken mislukt.");
      setLoading(false);
      return;
    }

    router.push(`/pools/${data.id}`);
    router.refresh();
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <section className="py-16">
        <Container>
          <div className="mx-auto max-w-3xl">
            <Link
              href="/dashboard"
              className="mb-8 inline-flex text-sm text-zinc-400 transition hover:text-white"
            >
              ← Terug naar dashboard
            </Link>

            <div className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-6 sm:p-8">
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-400">
                Nieuwe pool
              </p>

              <h1 className="text-3xl font-bold tracking-tight">
                Maak een nieuwe pool
              </h1>

              <p className="mt-3 text-sm leading-6 text-zinc-400">
                Kies eerst welk soort pool je wilt maken. Daarna kan de app per
                type zijn eigen flow en regels krijgen.
              </p>

              <form onSubmit={handleSubmit} className="mt-8 space-y-8">
                <div>
                  <label
                    htmlFor="name"
                    className="mb-2 block text-sm font-medium text-zinc-200"
                  >
                    Poolnaam
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Bijv. Werk Pool 2026"
                    className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-zinc-500 focus:border-white"
                  />
                </div>

                <div>
                  <p className="mb-3 block text-sm font-medium text-zinc-200">
                    Welk type pool wil je maken?
                  </p>

                  <div className="grid gap-4">
                    {POOL_TYPE_OPTIONS.map((option) => {
                      const isSelected = gameType === option.value;

                      return (
                        <label
                          key={option.value}
                          className={`cursor-pointer rounded-2xl border p-5 transition ${
                            isSelected
                              ? "border-white bg-zinc-950"
                              : "border-zinc-800 bg-zinc-950/60 hover:border-zinc-600"
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <input
                              type="radio"
                              name="gameType"
                              value={option.value}
                              checked={isSelected}
                              onChange={() => setGameType(option.value)}
                              className="mt-1"
                            />

                            <div>
                              <div className="flex items-center gap-2">
                                <h2 className="text-lg font-semibold text-white">
                                  {option.label}
                                </h2>
                                <span className="rounded-full border border-zinc-700 px-2.5 py-1 text-xs uppercase tracking-wide text-zinc-300">
                                  {option.shortLabel}
                                </span>
                              </div>

                              <p className="mt-2 text-sm leading-6 text-zinc-400">
                                {option.description}
                              </p>
                            </div>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-5">
                  <h2 className="text-lg font-semibold">Wat wordt nu aangemaakt</h2>
                  <div className="mt-3 space-y-2 text-sm leading-6 text-zinc-400">
                    <p>• Een nieuwe pool met type {selectedType.label}</p>
                    <p>• Jij wordt automatisch owner van die pool</p>
                    <p>• Er wordt een unieke invite code gegenereerd</p>
                    <p>• Daarna sturen we je direct door naar de poolpagina</p>
                  </div>
                </div>

                {error && (
                  <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl bg-white px-5 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? "Pool wordt aangemaakt..." : "Pool aanmaken"}
                </button>
              </form>
            </div>
          </div>
        </Container>
      </section>
    </main>
  );
}