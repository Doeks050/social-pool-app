"use client";

import { FormEvent, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase-browser";

export default function AuthPage() {
  const supabase = createClient();

  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function loadUser() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    setUserEmail(user?.email ?? null);
  }

  useEffect(() => {
    loadUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      loadUser();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    if (mode === "signup") {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        setMessage(error.message);
      } else {
        setMessage("Account aangemaakt. Je kunt nu inloggen.");
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setMessage(error.message);
      } else {
        setMessage("Succesvol ingelogd.");
      }
    }

    setLoading(false);
  }

  async function handleLogout() {
    setLoading(true);
    setMessage("");

    const { error } = await supabase.auth.signOut();

    if (error) {
      setMessage(error.message);
    } else {
      setMessage("Je bent uitgelogd.");
    }

    setLoading(false);
  }

  return (
    <main className="min-h-screen bg-zinc-950 px-6 py-16 text-white">
      <div className="mx-auto w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-xl">
        <p className="mb-2 text-sm uppercase tracking-[0.2em] text-zinc-400">
          Social Pool App
        </p>

        <h1 className="text-3xl font-bold">
          {mode === "login" ? "Inloggen" : "Account aanmaken"}
        </h1>

        <p className="mt-3 text-sm text-zinc-400">
          {userEmail
            ? `Ingelogd als ${userEmail}`
            : "Nog niet ingelogd. Maak een account aan of log in."}
        </p>

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={() => setMode("login")}
            className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
              mode === "login"
                ? "bg-white text-zinc-950"
                : "border border-zinc-700 text-white hover:bg-zinc-800"
            }`}
          >
            Inloggen
          </button>

          <button
            type="button"
            onClick={() => setMode("signup")}
            className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
              mode === "signup"
                ? "bg-white text-zinc-950"
                : "border border-zinc-700 text-white hover:bg-zinc-800"
            }`}
          >
            Registreren
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-zinc-300">
              E-mailadres
            </label>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm outline-none transition focus:border-white"
              placeholder="jij@example.com"
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-zinc-300">
              Wachtwoord
            </label>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm outline-none transition focus:border-white"
              placeholder="Minimaal 6 tekens"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-white px-4 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading
              ? "Bezig..."
              : mode === "login"
              ? "Inloggen"
              : "Account aanmaken"}
          </button>
        </form>

        <button
          type="button"
          onClick={handleLogout}
          disabled={loading || !userEmail}
          className="mt-4 w-full rounded-xl border border-zinc-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Uitloggen
        </button>

        {message ? (
          <div className="mt-4 rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-zinc-300">
            {message}
          </div>
        ) : null}
      </div>
    </main>
  );
}