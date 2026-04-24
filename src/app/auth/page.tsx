"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Container from "@/components/Container";
import { createClient } from "@/lib/supabase-browser";

type Mode = "login" | "register";

export default function AuthPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [mode, setMode] = useState<Mode>("login");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage(null);
    setError(null);

    try {
      if (mode === "register") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              display_name: displayName,
            },
          },
        });

        if (error) {
          setError(error.message);
          setLoading(false);
          return;
        }

        setMessage(
          "Account aangemaakt. Als e-mailbevestiging uitstaat, kun je direct inloggen."
        );
        setMode("login");
        setPassword("");
        setLoading(false);
        return;
      }

      const { data: signInData, error } = await supabase.auth.signInWithPassword(
        {
          email,
          password,
        }
      );

      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }

      const userId = signInData.user?.id;

      if (!userId) {
        router.push("/dashboard");
        router.refresh();
        return;
      }

      const { data: appAdmin } = await supabase
        .from("app_admins")
        .select("user_id")
        .eq("user_id", userId)
        .maybeSingle();

      router.push(appAdmin ? "/admin" : "/dashboard");
      router.refresh();
    } catch {
      setError("Er ging iets mis. Probeer het opnieuw.");
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <section className="py-16">
        <Container>
          <div className="mx-auto max-w-md">
            <Link
              href="/"
              className="mb-8 inline-flex text-sm text-zinc-400 transition hover:text-white"
            >
              ← Terug naar home
            </Link>

            <div className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-6 sm:p-8">
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-400">
                Social Pool App
              </p>

              <h1 className="text-3xl font-bold tracking-tight">
                {mode === "login" ? "Inloggen" : "Account aanmaken"}
              </h1>

              <p className="mt-3 text-sm leading-6 text-zinc-400">
                {mode === "login"
                  ? "Log in om je pools te beheren, voorspellingen in te vullen en je ranglijst te bekijken."
                  : "Maak een account aan en start direct je eerste pool met vrienden, familie of collega’s."}
              </p>

              <div className="mt-6 grid grid-cols-2 rounded-2xl border border-zinc-800 bg-zinc-950 p-1">
                <button
                  type="button"
                  onClick={() => {
                    setMode("login");
                    setError(null);
                    setMessage(null);
                  }}
                  className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
                    mode === "login"
                      ? "bg-white text-zinc-950"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  Inloggen
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMode("register");
                    setError(null);
                    setMessage(null);
                  }}
                  className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
                    mode === "register"
                      ? "bg-white text-zinc-950"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  Registreren
                </button>
              </div>

              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                {mode === "register" && (
                  <div>
                    <label
                      htmlFor="displayName"
                      className="mb-2 block text-sm font-medium text-zinc-200"
                    >
                      Weergavenaam
                    </label>
                    <input
                      id="displayName"
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Bijv. Nick"
                      className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-zinc-500 focus:border-white"
                    />
                  </div>
                )}

                <div>
                  <label
                    htmlFor="email"
                    className="mb-2 block text-sm font-medium text-zinc-200"
                  >
                    E-mailadres
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="jij@email.com"
                    required
                    className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-zinc-500 focus:border-white"
                  />
                </div>

                <div>
                  <label
                    htmlFor="password"
                    className="mb-2 block text-sm font-medium text-zinc-200"
                  >
                    Wachtwoord
                  </label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimaal 6 tekens"
                    required
                    className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-zinc-500 focus:border-white"
                  />
                </div>

                {error && (
                  <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                    {error}
                  </div>
                )}

                {message && (
                  <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
                    {message}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl bg-white px-5 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading
                    ? "Bezig..."
                    : mode === "login"
                    ? "Inloggen"
                    : "Account aanmaken"}
                </button>
              </form>
            </div>
          </div>
        </Container>
      </section>
    </main>
  );
}