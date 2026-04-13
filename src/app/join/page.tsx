"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Container from "@/components/Container";
import { createClient } from "@/lib/supabase-browser";

export default function JoinPoolPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [inviteCode, setInviteCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const cleanedCode = inviteCode.trim().toUpperCase();

    if (!cleanedCode) {
      setError("Vul een invite code in.");
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

    const { data: pool, error: poolError } = await supabase
      .from("pools")
      .select("id, name, invite_code")
      .eq("invite_code", cleanedCode)
      .maybeSingle();

    if (poolError) {
      setError(poolError.message);
      setLoading(false);
      return;
    }

    if (!pool) {
      setError("Geen pool gevonden met deze invite code.");
      setLoading(false);
      return;
    }

    const { data: existingMembership, error: membershipCheckError } =
      await supabase
        .from("pool_members")
        .select("pool_id")
        .eq("pool_id", pool.id)
        .eq("user_id", user.id)
        .maybeSingle();

    if (membershipCheckError) {
      setError(membershipCheckError.message);
      setLoading(false);
      return;
    }

    if (existingMembership) {
      router.push(`/pools/${pool.id}`);
      router.refresh();
      return;
    }

    const { error: insertError } = await supabase.from("pool_members").insert({
      pool_id: pool.id,
      user_id: user.id,
      role: "member",
    });

    if (insertError) {
      setError(insertError.message);
      setLoading(false);
      return;
    }

    router.push(`/pools/${pool.id}`);
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
                Join pool
              </p>

              <h1 className="text-3xl font-bold tracking-tight">
                Join een pool via invite code
              </h1>

              <p className="mt-3 text-sm leading-6 text-zinc-400">
                Vul de code in die je van de pool owner hebt gekregen. Als de
                pool bestaat, word je direct toegevoegd als lid.
              </p>

              <form onSubmit={handleSubmit} className="mt-8 space-y-6">
                <div>
                  <label
                    htmlFor="inviteCode"
                    className="mb-2 block text-sm font-medium text-zinc-200"
                  >
                    Invite code
                  </label>
                  <input
                    id="inviteCode"
                    name="inviteCode"
                    type="text"
                    required
                    value={inviteCode}
                    onChange={(event) => setInviteCode(event.target.value)}
                    placeholder="Bijv. A1B2C3D4"
                    className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm uppercase tracking-[0.2em] text-white outline-none transition placeholder:text-zinc-500 focus:border-white"
                  />
                </div>

                <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-5">
                  <h2 className="text-lg font-semibold">Wat gebeurt er daarna</h2>
                  <div className="mt-3 space-y-2 text-sm leading-6 text-zinc-400">
                    <p>• We zoeken de pool op via de invite code</p>
                    <p>• Je wordt toegevoegd als member</p>
                    <p>• Daarna ga je direct naar de poolpagina</p>
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
                  {loading ? "Pool wordt gezocht..." : "Join pool"}
                </button>
              </form>
            </div>
          </div>
        </Container>
      </section>
    </main>
  );
}