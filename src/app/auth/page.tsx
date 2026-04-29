"use client";

import Image from "next/image";
import { FormEvent, Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Container from "@/components/Container";
import { createClient } from "@/lib/supabase-browser";
import { useLanguage } from "@/hooks/useLanguage";

type Mode = "login" | "register";

const copy = {
  en: {
    home: "Home",
    createBadge: "Create your Poolr account",
    welcomeBadge: "Welcome back",
    registerHero: (
      <>
        Start your
        <br />
        first pool.
      </>
    ),
    loginHero: (
      <>
        Continue your
        <br />
        competition.
      </>
    ),
    registerIntro:
      "Create your account, join private pools and compete with friends or colleagues in World Cup 2026, Office Bingo and more.",
    loginIntro:
      "Log in to manage your pools, make predictions and follow the leaderboard with friends or colleagues.",
    worldCup: "World Cup 2026",
    launchingFirst: "Launching first",
    officeBingo: "Office Bingo",
    comingSoon: "Coming soon",
    f1Pool: "F1 Pool",
    accountKicker: "Poolr account",
    createAccountTitle: "Create account",
    loginTitle: "Log in",
    createAccountIntro:
      "Create your account and start building or joining private pools.",
    loginAccountIntro:
      "Continue to your dashboard and pick up where you left off.",
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
    accountCreated:
      "Account created. You can now log in and start your first pool.",
    genericError: "Something went wrong. Please try again.",
    alreadyHaveAccount: "Already have an account?",
    newToPoolr: "New to Poolr?",
    createAccountLink: "Create an account",
    footer:
      "Poolr is built for private competitions with friends, colleagues and communities.",
  },
  nl: {
    home: "Home",
    createBadge: "Maak je Poolr-account",
    welcomeBadge: "Welkom terug",
    registerHero: (
      <>
        Start je
        <br />
        eerste poule.
      </>
    ),
    loginHero: (
      <>
        Ga verder met
        <br />
        je competitie.
      </>
    ),
    registerIntro:
      "Maak je account, doe mee met privé-poules en strijd met vrienden of collega’s in WK 2026, Office Bingo en meer.",
    loginIntro:
      "Log in om je poules te beheren, voorspellingen te doen en de ranglijst te volgen met vrienden of collega’s.",
    worldCup: "WK 2026",
    launchingFirst: "Als eerste live",
    officeBingo: "Office Bingo",
    comingSoon: "Binnenkort",
    f1Pool: "F1-poule",
    accountKicker: "Poolr-account",
    createAccountTitle: "Account maken",
    loginTitle: "Inloggen",
    createAccountIntro:
      "Maak je account en start of join privé-poules.",
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
    accountCreated:
      "Account aangemaakt. Je kunt nu inloggen en je eerste poule starten.",
    genericError: "Er ging iets mis. Probeer het opnieuw.",
    alreadyHaveAccount: "Heb je al een account?",
    newToPoolr: "Nieuw bij Poolr?",
    createAccountLink: "Maak een account",
    footer:
      "Poolr is gebouwd voor privécompetities met vrienden, collega’s en communities.",
  },
};

function AuthPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = useMemo(() => createClient(), []);
  const { language, setLanguage } = useLanguage();

  const t = copy[language];

  const initialMode: Mode =
    searchParams.get("mode") === "register" ? "register" : "login";

  const [mode, setMode] = useState<Mode>(initialMode);
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isRegister = mode === "register";

  useEffect(() => {
    if (searchParams.get("mode") === "register") {
      setMode("register");
      setError(null);
      setMessage(null);
    }
  }, [searchParams]);

  function switchMode(nextMode: Mode) {
    setMode(nextMode);
    setError(null);
    setMessage(null);
  }

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

        setMessage(t.accountCreated);
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
      setError(t.genericError);
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

              <div className="flex items-center gap-2">
                <div className="flex rounded-full border border-white/15 bg-white/5 p-1 backdrop-blur">
                  <button
                    type="button"
                    onClick={() => setLanguage("en")}
                    className={`rounded-full px-3 py-1.5 text-xs font-black transition ${
                      language === "en"
                        ? "bg-emerald-300 text-zinc-950"
                        : "text-white/70 hover:text-white"
                    }`}
                  >
                    EN
                  </button>

                  <button
                    type="button"
                    onClick={() => setLanguage("nl")}
                    className={`rounded-full px-3 py-1.5 text-xs font-black transition ${
                      language === "nl"
                        ? "bg-emerald-300 text-zinc-950"
                        : "text-white/70 hover:text-white"
                    }`}
                  >
                    NL
                  </button>
                </div>

                <Link
                  href="/"
                  className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white/90 backdrop-blur transition hover:bg-white/10"
                >
                  {t.home}
                </Link>
              </div>
            </header>

            <div className="grid flex-1 items-start gap-10 pt-8 pb-12 lg:grid-cols-[0.95fr_1.05fr] lg:items-center lg:pt-6 lg:pb-16">
              <div className="max-w-2xl">
                <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-4 py-2 text-sm font-semibold text-emerald-200">
                  <span className="h-2 w-2 rounded-full bg-emerald-300 shadow-[0_0_18px_rgba(110,231,183,0.9)]" />
                  {isRegister ? t.createBadge : t.welcomeBadge}
                </div>

                <h1 className="text-5xl font-black tracking-tight text-white sm:text-6xl lg:text-7xl">
                  {isRegister ? t.registerHero : t.loginHero}
                </h1>

                <p className="mt-6 max-w-xl text-lg leading-8 text-zinc-300">
                  {isRegister ? t.registerIntro : t.loginIntro}
                </p>

                <div className="mt-7 grid gap-3 text-sm text-zinc-400 sm:grid-cols-3">
                  <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                    <p className="font-bold text-white">{t.worldCup}</p>
                    <p className="mt-1 text-xs">{t.launchingFirst}</p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                    <p className="font-bold text-white">{t.officeBingo}</p>
                    <p className="mt-1 text-xs">{t.comingSoon}</p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                    <p className="font-bold text-white">{t.f1Pool}</p>
                    <p className="mt-1 text-xs">{t.comingSoon}</p>
                  </div>
                </div>
              </div>

              <div className="mx-auto w-full max-w-md">
                <div className="rounded-[2rem] border border-white/15 bg-white/[0.06] p-3 shadow-2xl backdrop-blur-xl">
                  <div className="rounded-[1.55rem] border border-white/10 bg-[#06110d]/95 p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] sm:p-8">
                    <p className="mb-2 text-xs font-bold uppercase tracking-[0.22em] text-emerald-300">
                      {t.accountKicker}
                    </p>

                    <h2 className="text-3xl font-black tracking-tight">
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
                            htmlFor="displayName"
                            className="mb-2 block text-sm font-semibold text-zinc-200"
                          >
                            {t.displayName}
                          </label>

                          <input
                            id="displayName"
                            type="text"
                            value={displayName}
                            onChange={(event) =>
                              setDisplayName(event.target.value)
                            }
                            placeholder={t.displayNamePlaceholder}
                            className="w-full rounded-xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none transition placeholder:text-zinc-500 focus:border-emerald-300/70"
                          />
                        </div>
                      )}

                      <div>
                        <label
                          htmlFor="email"
                          className="mb-2 block text-sm font-semibold text-zinc-200"
                        >
                          {t.email}
                        </label>

                        <input
                          id="email"
                          type="email"
                          value={email}
                          onChange={(event) => setEmail(event.target.value)}
                          placeholder={t.emailPlaceholder}
                          required
                          className="w-full rounded-xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none transition placeholder:text-zinc-500 focus:border-emerald-300/70"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="password"
                          className="mb-2 block text-sm font-semibold text-zinc-200"
                        >
                          {t.password}
                        </label>

                        <input
                          id="password"
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
                        {isRegister
                          ? t.alreadyHaveAccount
                          : t.newToPoolr}{" "}
                        <button
                          type="button"
                          onClick={() =>
                            switchMode(isRegister ? "login" : "register")
                          }
                          className="font-black text-emerald-300 transition hover:text-emerald-200"
                        >
                          {isRegister ? t.loginButton : t.createAccountLink}
                        </button>
                      </p>
                    </div>
                  </div>
                </div>

                <p className="mt-5 text-center text-xs leading-5 text-zinc-500">
                  {t.footer}
                </p>
              </div>
            </div>
          </div>
        </Container>
      </section>
    </main>
  );
}

export default function AuthPage() {
  return (
    <Suspense>
      <AuthPageContent />
    </Suspense>
  );
}