"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Container from "@/components/Container";
import { createClient } from "@/lib/supabase-browser";

export default function NewPoolPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        game_type: "world_cup",
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
          <div className="mx-auto max-w-2xl">
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
                Maak je eerste WK pool
              </h1>

              <p className="mt-3 text-sm leading-6 text-zinc-400">
                Geef je pool een naam. In de volgende stappen koppelen we hier
                leden, invite flow, wedstrijden en voorspellingen aan.
              </p>

              <form onSubmit={handleSubmit} className="mt-8 space-y-6">
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
                    placeholder="Bijv. WK 2026 Office Pool"
                    className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-zinc-500 focus:border-white"
                  />
                </div>

                <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-5">
                  <h2 className="text-lg font-semibold">Wat wordt nu aangemaakt</h2>
                  <div className="mt-3 space-y-2 text-sm leading-6 text-zinc-400">
                    <p>• Een nieuwe pool met speltype WK Poule</p>
                    <p>• Jij wordt automatisch owner van die pool</p>
                    <p>• Er wordt een unieke invite code gegenereerd</p>
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