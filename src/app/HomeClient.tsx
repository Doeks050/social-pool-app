"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Container from "@/components/Container";
import {
  LANGUAGE_COOKIE_KEY,
  LANGUAGE_STORAGE_KEY,
  detectBrowserLanguage,
} from "@/lib/i18n";
import { createClient } from "@/lib/supabase-browser";
import { createImplicitClient } from "@/lib/supabase-implicit-browser";

type Language = "en" | "nl";
type Mode = "login" | "register";

type HomeClientProps = {
  isLoggedIn: boolean;
};

const copy = {
  en: {
    login: "Login",
    dashboard: "Open dashboard",
    createPool: "Create a pool",
    eyebrow: "World Cup 2026 pools",
    title: "Your pool starts here.",
    text: "Create or manage a private prediction pool for friends, colleagues or your office team.",
    smallInfo: "Private invite code · Match predictions · Leaderboard",
    helpTitle: "New to Poolr?",
    helpText:
      "Create a pool, share the invite code and let your group fill in their predictions before the match deadline.",
    accountKicker: "Poolr account",
    createAccountTitle: "Create account",
    loginTitle: "Log in",
    createAccountIntro:
      "Create your account and start building or joining private pools.",
    loginAccountIntro: "Continue to your dashboard and pick up where you left off.",
    loginTab: "Log in",
    signupTab: "Sign up",
    displayName: "Display name",
    displayNamePlaceholder: "For example: Alex",
    email: "Email",
    emailPlaceholder: "you@email.com",
    password: "Password",
    passwordPlaceholder: "At least 6 characters",
    pleaseWait: "Please wait...",
    createAccountButton: "Create account",
    loginButton: "Log in",
    forgotPassword: "Forgot password?",
    forgotPasswordNoEmail: "Enter your email address first.",
    forgotPasswordSent:
      "Password reset email sent. Check your inbox and follow the link.",
    accountCreated:
      "Account created. You can now log in and start your first pool.",
    genericError: "Something went wrong. Please try again.",
    alreadyHaveAccount: "Already have an account?",
    newToPoolr: "New to Poolr?",
    createAccountLink: "Create an account",
    close: "Close",
    footer:
      "Poolr is independent and is not affiliated with FIFA, UEFA, Formula 1, FIA or other rights holders.",
    footerLinks: [
      { label: "How it works", href: "/how-it-works" },
      { label: "World Cup rules", href: "/wk-poule/spelregels" },
      { label: "Privacy", href: "/privacy" },
      { label: "Terms", href: "/terms" },
      { label: "Contact", href: "/contact" },
    ],
  },
  nl: {
    login: "Inloggen",
    dashboard: "Open dashboard",
    createPool: "Poule maken",
    eyebrow: "WK 2026-poules",
    title: "Je poule start hier.",
    text: "Maak of beheer een privé voorspellingpoule voor vrienden, collega’s of je kantoor.",
    smallInfo: "Privé invite code · Wedstrijden voorspellen · Ranglijst",
    helpTitle: "Nieuw bij Poolr?",
    helpText:
      "Maak een poule, deel de invite code en laat je groep voorspellingen invullen voor de wedstrijddeadline.",
    accountKicker: "Poolr-account",
    createAccountTitle: "Account maken",
    loginTitle: "Inloggen",
    createAccountIntro: "Maak je account en start of join privé-poules.",
    loginAccountIntro:
      "Ga verder naar je dashboard en pak op waar je gebleven was.",
    loginTab: "Inloggen",
    signupTab: "Registreren",
    displayName: "Weergavenaam",
    displayNamePlaceholder: "Bijvoorbeeld: Alex",
    email: "E-mail",
    emailPlaceholder: "jij@email.com",
    password: "Wachtwoord",
    passwordPlaceholder: "Minimaal 6 tekens",
    pleaseWait: "Even wachten...",
    createAccountButton: "Account maken",
    loginButton: "Inloggen",
    forgotPassword: "Wachtwoord vergeten?",
    forgotPasswordNoEmail: "Vul eerst je e-mailadres in.",
    forgotPasswordSent:
      "Wachtwoord-resetmail verstuurd. Check je inbox en volg de link.",
    accountCreated:
      "Account aangemaakt. Je kunt nu inloggen en je eerste poule starten.",
    genericError: "Er ging iets mis. Probeer het opnieuw.",
    alreadyHaveAccount: "Heb je al een account?",
    newToPoolr: "Nieuw bij Poolr?",
    createAccountLink: "Maak een account",
    close: "Sluiten",
    footer:
      "Poolr is onafhankelijk en is niet verbonden aan FIFA, UEFA, Formula 1, FIA of andere rechthebbenden.",
    footerLinks: [
      { label: "Hoe werkt het", href: "/how-it-works" },
      { label: "WK-spelregels", href: "/wk-poule/spelregels" },
      { label: "Privacy", href: "/privacy" },
      { label: "Voorwaarden", href: "/terms" },
      { label: "Contact", href: "/contact" },
    ],
  },
};

type HomeCopy = typeof copy.en;

function setLanguageCookie(language: Language) {
  document.cookie = `${LANGUAGE_COOKIE_KEY}=${language}; path=/; max-age=31536000; SameSite=Lax`;
}

function AuthCard({
  mode,
  setMode,
  t,
}: {
  mode: Mode;
  setMode: (mode: Mode) => void;
  t: HomeCopy;
}) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const implicitSupabase = useMemo(() => createImplicitClient(), []);

  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isRegister = mode === "register";

  function switchMode(nextMode: Mode) {
    setMode(nextMode);
    setError(null);
    setMessage(null);
  }

  async function handleForgotPassword() {
    setMessage(null);
    setError(null);

    if (!email.trim()) {
      setError(t.forgotPasswordNoEmail);
      return;
    }

    setLoading(true);

    const { error } = await implicitSupabase.auth.resetPasswordForEmail(
      email.trim(),
      {
        redirectTo: `${window.location.origin}/reset-password`,
      }
    );

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setMessage(t.forgotPasswordSent);
    setLoading(false);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage(null);
    setError(null);

    try {
      if (isRegister) {
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

        setMessage(t.accountCreated);
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
      setError(t.genericError);
      setLoading(false);
    }
  }

  return (
    <div className="rounded-[2rem] border border-white/10 bg-white/[0.05] p-2 shadow-2xl shadow-black/30 backdrop-blur-xl">
      <div className="rounded-[1.55rem] border border-white/10 bg-[#06110d]/95 p-6 sm:p-8">
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.22em] text-emerald-300">
          {t.accountKicker}
        </p>

        <h2 className="text-3xl font-black tracking-tight sm:text-4xl">
          {isRegister ? t.createAccountTitle : t.loginTitle}
        </h2>

        <p className="mt-3 text-sm leading-6 text-zinc-400">
          {isRegister ? t.createAccountIntro : t.loginAccountIntro}
        </p>

        <div className="mt-6 grid grid-cols-2 rounded-2xl border border-white/10 bg-black/25 p-1">
          <button
            type="button"
            onClick={() => switchMode("login")}
            className={`rounded-xl px-4 py-2 text-sm font-black transition ${
              mode === "login"
                ? "bg-emerald-300 text-zinc-950"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            {t.loginTab}
          </button>

          <button
            type="button"
            onClick={() => switchMode("register")}
            className={`rounded-xl px-4 py-2 text-sm font-black transition ${
              mode === "register"
                ? "bg-emerald-300 text-zinc-950"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            {t.signupTab}
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {isRegister && (
            <div>
              <label
                htmlFor="home-display-name"
                className="mb-2 block text-sm font-semibold text-zinc-200"
              >
                {t.displayName}
              </label>

              <input
                id="home-display-name"
                type="text"
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                placeholder={t.displayNamePlaceholder}
                className="w-full rounded-xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none transition placeholder:text-zinc-500 focus:border-emerald-300/70"
              />
            </div>
          )}

          <div>
            <label
              htmlFor="home-email"
              className="mb-2 block text-sm font-semibold text-zinc-200"
            >
              {t.email}
            </label>

            <input
              id="home-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder={t.emailPlaceholder}
              required
              className="w-full rounded-xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none transition placeholder:text-zinc-500 focus:border-emerald-300/70"
            />
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between gap-3">
              <label
                htmlFor="home-password"
                className="block text-sm font-semibold text-zinc-200"
              >
                {t.password}
              </label>

              {!isRegister && (
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  disabled={loading}
                  className="text-xs font-black text-emerald-300 transition hover:text-emerald-200 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {t.forgotPassword}
                </button>
              )}
            </div>

            <input
              id="home-password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder={t.passwordPlaceholder}
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
              ? t.pleaseWait
              : isRegister
                ? t.createAccountButton
                : t.loginButton}
          </button>
        </form>

        <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.035] p-4 text-center">
          <p className="text-xs leading-5 text-zinc-400">
            {isRegister ? t.alreadyHaveAccount : t.newToPoolr} {" "}
            <button
              type="button"
              onClick={() => switchMode(isRegister ? "login" : "register")}
              className="font-black text-emerald-300 transition hover:text-emerald-200"
            >
              {isRegister ? t.loginButton : t.createAccountLink}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function HomeClient({ isLoggedIn }: HomeClientProps) {
  const [language, setLanguage] = useState<Language>("en");
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<Mode>("login");

  useEffect(() => {
    const savedLanguage = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);

    if (savedLanguage === "nl" || savedLanguage === "en") {
      setLanguage(savedLanguage);
      setLanguageCookie(savedLanguage);
      return;
    }

    const detectedLanguage = detectBrowserLanguage();
    setLanguage(detectedLanguage);
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, detectedLanguage);
    setLanguageCookie(detectedLanguage);
  }, []);

  useEffect(() => {
    if (!authOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setAuthOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [authOpen]);

  function changeLanguage(nextLanguage: Language) {
    setLanguage(nextLanguage);
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, nextLanguage);
    setLanguageCookie(nextLanguage);
  }

  function openAuth(mode: Mode) {
    setAuthMode(mode);
    setAuthOpen(true);
  }

  const t = copy[language];

  return (
    <main className="flex min-h-screen flex-col bg-[#030706] text-white">
      <section className="flex flex-1 flex-col border-b border-white/10 bg-[radial-gradient(circle_at_50%_0%,rgba(16,185,129,0.12),transparent_38%),linear-gradient(180deg,#06110d_0%,#030706_72%)]">
        <Container>
          <header className="flex items-center justify-between gap-3 py-4 sm:py-5">
            <Link href="/" className="flex min-w-0 items-center">
              <Image
                src="/brand/poolr-logo-dark.png"
                alt="Poolr"
                width={260}
                height={76}
                priority
                className="h-11 w-auto sm:h-14"
              />
            </Link>

            <div className="flex shrink-0 items-center gap-2">
              <div className="flex rounded-full border border-white/10 bg-white/[0.04] p-1">
                <button
                  type="button"
                  onClick={() => changeLanguage("en")}
                  className={`rounded-full px-2.5 py-1 text-[10px] font-black transition sm:px-3 sm:py-1.5 sm:text-xs ${
                    language === "en"
                      ? "bg-emerald-300 text-zinc-950"
                      : "text-white/60 hover:text-white"
                  }`}
                  aria-pressed={language === "en"}
                >
                  EN
                </button>

                <button
                  type="button"
                  onClick={() => changeLanguage("nl")}
                  className={`rounded-full px-2.5 py-1 text-[10px] font-black transition sm:px-3 sm:py-1.5 sm:text-xs ${
                    language === "nl"
                      ? "bg-emerald-300 text-zinc-950"
                      : "text-white/60 hover:text-white"
                  }`}
                  aria-pressed={language === "nl"}
                >
                  NL
                </button>
              </div>
            </div>
          </header>

          <div className="mx-auto flex min-h-[calc(100vh-8rem)] max-w-2xl flex-col items-center justify-center py-14 text-center sm:py-20">
            <p className="rounded-full border border-emerald-300/15 bg-emerald-300/10 px-4 py-2 text-[11px] font-black uppercase tracking-[0.16em] text-emerald-200 sm:text-xs">
              {t.eyebrow}
            </p>

            <h1 className="mt-6 text-4xl font-black leading-[1.04] tracking-[-0.04em] text-white sm:text-6xl">
              {t.title}
            </h1>

            <p className="mt-5 max-w-xl text-base leading-7 text-zinc-300 sm:text-lg sm:leading-8">
              {t.text}
            </p>

            <div className="mt-8 w-full max-w-sm rounded-[1.75rem] border border-white/10 bg-white/[0.045] p-4 shadow-2xl shadow-black/25 sm:p-5">
              {isLoggedIn ? (
                <Link
                  href="/dashboard"
                  className="flex min-h-12 w-full items-center justify-center rounded-2xl bg-emerald-300 px-7 text-sm font-black text-zinc-950 transition hover:bg-emerald-200"
                >
                  {t.dashboard}
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={() => openAuth("login")}
                  className="flex min-h-12 w-full items-center justify-center rounded-2xl bg-emerald-300 px-7 text-sm font-black text-zinc-950 transition hover:bg-emerald-200"
                >
                  {t.login}
                </button>
              )}

              <button
                type="button"
                onClick={() => openAuth("register")}
                className="mt-3 flex min-h-12 w-full items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05] px-7 text-sm font-black text-white transition hover:bg-white/[0.08]"
              >
                {t.createPool}
              </button>
            </div>

            <p className="mt-5 text-sm font-medium text-zinc-500">{t.smallInfo}</p>
          </div>
        </Container>
      </section>

      <section className="py-12 sm:py-14">
        <Container>
          <div className="mx-auto max-w-2xl rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-6 text-center sm:p-8">
            <h2 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
              {t.helpTitle}
            </h2>
            <p className="mt-3 text-sm leading-7 text-zinc-400 sm:text-base">
              {t.helpText}
            </p>
          </div>
        </Container>
      </section>

      <footer className="mt-auto border-t border-white/10 bg-[#020403] py-6">
        <Container>
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <Link href="/" className="inline-flex items-center">
                <Image
                  src="/brand/poolr-logo-dark.png"
                  alt="Poolr"
                  width={220}
                  height={64}
                  className="h-10 w-auto sm:h-11"
                />
              </Link>

              <nav
                aria-label="Footer navigation"
                className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm font-bold text-zinc-400 sm:justify-end"
              >
                {t.footerLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="transition hover:text-emerald-300"
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
            </div>

            <div className="flex flex-col gap-2 border-t border-white/10 pt-4 text-xs leading-5 text-zinc-600 sm:flex-row sm:items-center sm:justify-between">
              <p>© {new Date().getFullYear()} Poolr. All rights reserved.</p>
              <p className="max-w-2xl sm:text-right">{t.footer}</p>
            </div>
          </div>
        </Container>
      </footer>

      {authOpen && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/75 px-4 py-6 backdrop-blur-sm sm:items-center sm:py-10"
          role="dialog"
          aria-modal="true"
        >
          <button
            type="button"
            aria-label={t.close}
            className="absolute inset-0 cursor-default"
            onClick={() => setAuthOpen(false)}
          />

          <div className="relative z-10 w-full max-w-md">
            <button
              type="button"
              onClick={() => setAuthOpen(false)}
              className="mb-3 ml-auto flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] text-lg font-black text-white/80 transition hover:bg-white/[0.1] hover:text-white"
              aria-label={t.close}
            >
              ×
            </button>

            <AuthCard mode={authMode} setMode={setAuthMode} t={t} />
          </div>
        </div>
      )}
    </main>
  );
}
