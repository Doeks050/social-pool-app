"use client";

import Image from "next/image";
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
          "Account created. If email confirmation is disabled, you can log in right away."
        );
        setMode("login");
        setPassword("");
        setLoading(false);
        return;
      }

      const { data: signInData, error } =
        await supabase.auth.signInWithPassword({
          email,
          password,
        });

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
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#030706] text-white">
      <section className="relative min-h-screen">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_18%,rgba(34,255,160,0.16),transparent_34%),radial-gradient(circle_at_80%_65%,rgba(20,184,166,0.1),transparent_28%),linear-gradient(180deg,#04100c_0%,#030706_58%,#020403_100%)]" />
        <div className="absolute inset-0 opacity-[0.13] [background-image:linear-gradient(rgba(255,255,255,0.16)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.16)_1px,transparent_1px)] [background-size:64px_64px]" />
        <div className="absolute left-1/2 top-16 h-72 w-72 -translate-x-1/2 rounded-full bg-emerald-400/20 blur-3xl" />

        <Container>
          <div className="relative z-10 flex min-h-screen flex-col">
            <header className="flex items-center justify-between pt-3 pb-0 sm:pt-4">
              <Link href="/" className="flex items-center">
                <Image
                  src="/brand/poolr-logo-dark.png"
                  alt="Poolr"
                  width={420}
                  height={123}
                  priority
                  className="h-24 w-auto sm:h-28 lg:h-32"
                />
              </Link>

              <Link
                href="/"
                className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white/90 backdrop-blur transition hover:bg-white/10"
              >
                Home
              </Link>
            </header>

            <div className="grid flex-1 items-start gap-10 pt-8 pb-12 lg:grid-cols-[0.95fr_1.05fr] lg:items-center lg:pt-6 lg:pb-16">
              <div className="max-w-2xl">
                <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-4 py-2 text-sm font-semibold text-emerald-200">
                  <span className="h-2 w-2 rounded-full bg-emerald-300 shadow-[0_0_18px_rgba(110,231,183,0.9)]" />
                  Private pools. Real competition.
                </div>

                <h1 className="text-5xl font-black tracking-tight text-white sm:text-6xl lg:text-7xl">
                  Welcome to
                  <br />
                  your pool hub.
                </h1>

                <p className="mt-6 max-w-xl text-lg leading-8 text-zinc-300">
                  Log in to manage your pools, make predictions and follow the
                  leaderboard with friends or colleagues.
                </p>

                <div className="mt-7 hidden grid-cols-3 gap-3 text-sm text-zinc-400 sm:grid">
                  <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                    <p className="font-bold text-white">Football</p>
                    <p className="mt-1 text-xs">World Cup pools</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                    <p className="font-bold text-white">Bingo</p>
                    <p className="mt-1 text-xs">Coming soon</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                    <p className="font-bold text-white">F1</p>
                    <p className="mt-1 text-xs">Coming soon</p>
                  </div>
                </div>
              </div>

              <div className="mx-auto w-full max-w-md">
                <div className="rounded-[2rem] border border-white/15 bg-white/[0.06] p-3 shadow-2xl backdrop-blur-xl">
                  <div className="rounded-[1.55rem] border border-white/10 bg-[#06110d]/95 p-6 sm:p-8">
                    <p className="mb-2 text-xs font-bold uppercase tracking-[0.22em] text-emerald-300">
                      Poolr account
                    </p>

                    <h2 className="text-3xl font-black tracking-tight">
                      {mode === "login" ? "Log in" : "Create account"}
                    </h2>

                    <p className="mt-3 text-sm leading-6 text-zinc-400">
                      {mode === "login"
                        ? "Continue to your dashboard and pick up where you left off."
                        : "Create your account and start building your first private pool."}
                    </p>

                    <div className="mt-6 grid grid-cols-2 rounded-2xl border border-white/10 bg-black/25 p-1">
                      <button
                        type="button"
                        onClick={() => {
                          setMode("login");
                          setError(null);
                          setMessage(null);
                        }}
                        className={`rounded-xl px-4 py-2 text-sm font-black transition ${
                          mode === "login"
                            ? "bg-emerald-300 text-zinc-950"
                            : "text-zinc-400 hover:text-white"
                        }`}
                      >
                        Log in
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setMode("register");
                          setError(null);
                          setMessage(null);
                        }}
                        className={`rounded-xl px-4 py-2 text-sm font-black transition ${
                          mode === "register"
                            ? "bg-emerald-300 text-zinc-950"
                            : "text-zinc-400 hover:text-white"
                        }`}
                      >
                        Sign up
                      </button>
                    </div>

                    <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                      {mode === "register" && (
                        <div>
                          <label
                            htmlFor="displayName"
                            className="mb-2 block text-sm font-semibold text-zinc-200"
                          >
                            Display name
                          </label>
                          <input
                            id="displayName"
                            type="text"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            placeholder="For example: Alex"
                            className="w-full rounded-xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none transition placeholder:text-zinc-500 focus:border-emerald-300/70"
                          />
                        </div>
                      )}

                      <div>
                        <label
                          htmlFor="email"
                          className="mb-2 block text-sm font-semibold text-zinc-200"
                        >
                          Email
                        </label>
                        <input
                          id="email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="you@email.com"
                          required
                          className="w-full rounded-xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none transition placeholder:text-zinc-500 focus:border-emerald-300/70"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="password"
                          className="mb-2 block text-sm font-semibold text-zinc-200"
                        >
                          Password
                        </label>
                        <input
                          id="password"
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="At least 6 characters"
                          required
                          className="w-full rounded-xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none transition placeholder:text-zinc-500 focus:border-emerald-300/70"
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
                        className="w-full rounded-xl bg-emerald-300 px-5 py-3 text-sm font-black text-zinc-950 transition hover:bg-emerald-200 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {loading
                          ? "Please wait..."
                          : mode === "login"
                          ? "Log in"
                          : "Create account"}
                      </button>
                    </form>
                  </div>
                </div>

                <p className="mt-5 text-center text-xs leading-5 text-zinc-500">
                  Poolr is built for private competitions with friends,
                  colleagues and communities.
                </p>
              </div>
            </div>
          </div>
        </Container>
      </section>
    </main>
  );
}