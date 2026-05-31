"use client";

import { useEffect, useMemo, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";

export default function ResetPasswordPage() {
  const supabase = useMemo(() => {
    return createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }, []);

  const [password, setPassword] = useState("");
  const [passwordRepeat, setPasswordRepeat] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function prepareRecoverySession() {
      setErrorMessage("");

      const currentUrl = new URL(window.location.href);
      const code = currentUrl.searchParams.get("code");

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);

        if (error) {
          setErrorMessage(error.message);
          return;
        }

        window.history.replaceState({}, document.title, "/reset-password");
      }

      const { data } = await supabase.auth.getSession();

      if (!data.session) {
        setErrorMessage(
          "No recovery session found. Please request a new password reset email."
        );
        return;
      }

      setSessionReady(true);
    }

    prepareRecoverySession();
  }, [supabase]);

  async function handleResetPassword(event: React.FormEvent<HTMLFormElement>) {
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
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-4 py-10">
      <section className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl">
        <h1 className="text-2xl font-bold mb-2">Reset password</h1>

        <p className="text-sm text-slate-300 mb-6">
          Enter your new password below.
        </p>

        {errorMessage && (
          <p className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {errorMessage}
          </p>
        )}

        {message && (
          <p className="mb-4 rounded-xl border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-200">
            {message}
          </p>
        )}

        {!sessionReady ? (
          <p className="text-sm text-slate-300">
            Checking recovery session...
          </p>
        ) : (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <label className="mb-2 block text-sm text-slate-200">
                New password
              </label>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="New password"
                autoComplete="new-password"
                className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-slate-200">
                Repeat new password
              </label>
              <input
                type="password"
                value={passwordRepeat}
                onChange={(event) => setPasswordRepeat(event.target.value)}
                placeholder="Repeat new password"
                autoComplete="new-password"
                className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-blue-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-blue-600 px-4 py-3 font-bold text-white disabled:cursor-not-allowed disabled:bg-slate-600"
            >
              {loading ? "Updating..." : "Update password"}
            </button>
          </form>
        )}
      </section>
    </main>
  );
}