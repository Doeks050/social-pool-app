"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createImplicitClient } from "@/lib/supabase-implicit-browser";

export default function ResetPasswordPage() {
  const supabase = useMemo(() => createImplicitClient(), []);

  const [password, setPassword] = useState("");
  const [passwordRepeat, setPasswordRepeat] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function prepareRecoverySession() {
      setCheckingSession(true);
      setErrorMessage("");

      const hashParams = new URLSearchParams(
        window.location.hash.startsWith("#")
          ? window.location.hash.slice(1)
          : window.location.hash
      );

      const accessToken = hashParams.get("access_token");
      const refreshToken = hashParams.get("refresh_token");

      if (accessToken && refreshToken) {
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        if (error) {
          setErrorMessage(error.message);
          setCheckingSession(false);
          return;
        }

        window.history.replaceState({}, document.title, "/reset-password");
      }

      const { data, error } = await supabase.auth.getSession();

      if (error) {
        setErrorMessage(error.message);
        setCheckingSession(false);
        return;
      }

      if (!data.session) {
        setErrorMessage(
          "No recovery session found. Please request a new password reset email from the login page and use the newest email."
        );
        setCheckingSession(false);
        return;
      }

      setSessionReady(true);
      setCheckingSession(false);
    }

    prepareRecoverySession();
  }, [supabase]);

  async function handleResetPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setMessage("");
    setErrorMessage("");

    if (!password || !passwordRepeat) {
      setErrorMessage("Fill in both password fields.");
      return;
    }

    if (password.length < 6) {
      setErrorMessage("Password must be at least 6 characters.");
      return;
    }

    if (password !== passwordRepeat) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.updateUser({
      password,
    });

    setLoading(false);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    setMessage("Your password has been updated. You can now log in.");
    setPassword("");
    setPasswordRepeat("");

    await supabase.auth.signOut();
  }

  return (
    <main className="min-h-screen bg-[#030706] px-4 py-10 text-white">
      <section className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-md items-center">
        <div className="w-full rounded-[2rem] border border-white/15 bg-white/[0.06] p-3 shadow-2xl backdrop-blur-xl">
          <div className="rounded-[1.55rem] border border-white/10 bg-[#06110d]/95 p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] sm:p-8">
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.22em] text-emerald-300">
              Poolr account
            </p>

            <h1 className="text-3xl font-black tracking-tight">
              Reset password
            </h1>

            <p className="mt-3 text-sm leading-6 text-zinc-400">
              Enter your new password below.
            </p>

            {errorMessage && (
              <div className="mt-6 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {errorMessage}
              </div>
            )}

            {message && (
              <div className="mt-6 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
                {message}
              </div>
            )}

            {checkingSession ? (
              <p className="mt-6 text-sm text-zinc-400">
                Checking recovery session...
              </p>
            ) : !sessionReady && !message ? (
              <div className="mt-6">
                <Link
                  href="/auth"
                  className="inline-flex w-full justify-center rounded-xl bg-emerald-300 px-5 py-3 text-sm font-black text-zinc-950 transition hover:bg-emerald-200"
                >
                  Back to login
                </Link>
              </div>
            ) : message ? (
              <Link
                href="/auth"
                className="mt-6 inline-flex w-full justify-center rounded-xl bg-emerald-300 px-5 py-3 text-sm font-black text-zinc-950 transition hover:bg-emerald-200"
              >
                Go to login
              </Link>
            ) : (
              <form onSubmit={handleResetPassword} className="mt-6 space-y-4">
                <div>
                  <label
                    htmlFor="password"
                    className="mb-2 block text-sm font-semibold text-zinc-200"
                  >
                    New password
                  </label>

                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="New password"
                    autoComplete="new-password"
                    required
                    className="w-full rounded-xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none transition placeholder:text-zinc-500 focus:border-emerald-300/70"
                  />
                </div>

                <div>
                  <label
                    htmlFor="passwordRepeat"
                    className="mb-2 block text-sm font-semibold text-zinc-200"
                  >
                    Repeat new password
                  </label>

                  <input
                    id="passwordRepeat"
                    type="password"
                    value={passwordRepeat}
                    onChange={(event) => setPasswordRepeat(event.target.value)}
                    placeholder="Repeat new password"
                    autoComplete="new-password"
                    required
                    className="w-full rounded-xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none transition placeholder:text-zinc-500 focus:border-emerald-300/70"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl bg-emerald-300 px-5 py-3 text-sm font-black text-zinc-950 transition hover:bg-emerald-200 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? "Updating..." : "Update password"}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}