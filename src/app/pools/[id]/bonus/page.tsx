import Image from "next/image";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import Container from "@/components/Container";
import { createClient } from "@/lib/supabase";
import { getLanguageFromCookieValue, type Language } from "@/lib/i18n";
import BonusQuestionsForm from "@/components/world-cup/BonusQuestionsForm";
import BonusDeadlineCountdown from "@/components/world-cup/BonusDeadlineCountdown";

type PoolBonusPageProps = {
  params: Promise<{
    id: string;
  }>;
};

type BonusQuestionTemplateRow = {
  id: string;
  question_key: string;
  label: string;
  description: string | null;
  answer_type: string;
  options: string[];
  lock_mode: string;
  points_value: number;
  sort_order: number;
  is_active: boolean;
};

type BonusQuestionAnswerRow = {
  question_id: string;
  answer_value: string;
};

type FirstMatchRow = {
  starts_at: string;
};

const copy = {
  en: {
    pool: "Pool",
    worldCupPool: "World Cup Pool",
    bonusQuestions: "Bonus questions",
    intro:
      "Answer the extra tournament questions before the first match starts.",
    questions: "Questions",
    deadlineTime: "Deadline",
    notAvailable: "Not available",
    lockedWarning:
      "Bonus answers are locked because the first World Cup match has started.",
    scheduleWarning:
      "The first World Cup match could not be found yet. Check the imported match schedule.",
    noQuestionsTitle: "No bonus questions yet",
    noQuestionsIntro:
      "Add active World Cup bonus questions in the bonus_question_templates table first.",
  },
  nl: {
    pool: "Poule",
    worldCupPool: "WK-poule",
    bonusQuestions: "Bonusvragen",
    intro:
      "Beantwoord de extra toernooivragen voordat de eerste WK-wedstrijd begint.",
    questions: "Vragen",
    deadlineTime: "Deadline",
    notAvailable: "Niet beschikbaar",
    lockedWarning:
      "Bonusantwoorden zijn gesloten omdat de eerste WK-wedstrijd is begonnen.",
    scheduleWarning:
      "De eerste WK-wedstrijd kon nog niet worden gevonden. Controleer de geïmporteerde wedstrijdplanning.",
    noQuestionsTitle: "Nog geen bonusvragen",
    noQuestionsIntro:
      "Voeg eerst actieve WK-bonusvragen toe in de bonus_question_templates tabel.",
  },
} satisfies Record<Language, Record<string, string>>;

function isPoolActiveAndPaid(input: {
  status: string | null;
  paymentStatus: string | null;
}) {
  return (
    input.status === "active" &&
    (input.paymentStatus === "paid" || input.paymentStatus === "waived")
  );
}

function formatDateTime(value: string, language: Language) {
  return new Intl.DateTimeFormat(language === "nl" ? "nl-NL" : "en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Europe/Amsterdam",
  }).format(new Date(value));
}

export default async function PoolBonusPage({ params }: PoolBonusPageProps) {
  const { id } = await params;

  const cookieStore = await cookies();
  const language = getLanguageFromCookieValue(
    cookieStore.get("poolr-language")?.value
  );
  const t = copy[language];

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth");
  }

  const { data: membership } = await supabase
    .from("pool_members")
    .select("role")
    .eq("pool_id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!membership) {
    notFound();
  }

  const { data: pool } = await supabase
    .from("pools")
    .select("id, name, game_type, status, payment_status")
    .eq("id", id)
    .maybeSingle();

  if (!pool || pool.game_type !== "world_cup") {
    notFound();
  }

  if (
    !isPoolActiveAndPaid({
      status: pool.status,
      paymentStatus: pool.payment_status,
    })
  ) {
    redirect(`/pools/${pool.id}/payment`);
  }

  const { data: templates } = await supabase
    .from("bonus_question_templates")
    .select(
      "id, question_key, label, description, answer_type, options, lock_mode, points_value, sort_order, is_active"
    )
    .eq("game_type", "world_cup")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  const { data: answers } = await supabase
    .from("bonus_question_answers")
    .select("question_id, answer_value")
    .eq("pool_id", pool.id)
    .eq("user_id", user.id);

  const { data: firstMatch } = await supabase
    .from("matches")
    .select("starts_at")
    .eq("tournament", "world_cup_2026")
    .order("starts_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  const typedTemplates = (templates ?? []) as BonusQuestionTemplateRow[];
  const typedAnswers = (answers ?? []) as BonusQuestionAnswerRow[];
  const typedFirstMatch = firstMatch as FirstMatchRow | null;

  const answersMap = new Map(
    typedAnswers.map((answer) => [answer.question_id, answer.answer_value])
  );

  const lockAt = typedFirstMatch?.starts_at ?? null;
  const isLocked = lockAt ? new Date(lockAt).getTime() <= Date.now() : false;
  const formattedLockAt = lockAt ? formatDateTime(lockAt, language) : null;

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#030706] text-white">
      <section className="relative min-h-screen">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_10%,rgba(34,255,160,0.13),transparent_32%),radial-gradient(circle_at_85%_45%,rgba(20,184,166,0.08),transparent_30%),linear-gradient(180deg,#04100c_0%,#030706_54%,#020403_100%)]" />
        <div className="absolute inset-0 opacity-[0.11] [background-image:linear-gradient(rgba(255,255,255,0.16)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.16)_1px,transparent_1px)] [background-size:64px_64px]" />

        <Container>
          <div className="relative z-10 py-4 sm:py-5">
            <div className="mx-auto max-w-5xl">
              <header className="flex min-w-0 items-center justify-between gap-3">
                <Link href="/" className="flex min-w-0 items-center">
                  <Image
                    src="/brand/poolr-logo-dark.png"
                    alt="Poolr"
                    width={340}
                    height={100}
                    priority
                    className="h-11 w-auto max-w-[150px] sm:h-16 sm:max-w-none"
                  />
                </Link>

                <Link
                  href={`/pools/${pool.id}`}
                  className="shrink-0 rounded-full border border-white/15 bg-white/5 px-3 py-2 text-xs font-bold text-white/90 backdrop-blur transition hover:bg-white/10 sm:px-3.5 sm:text-sm"
                >
                  {t.pool}
                </Link>
              </header>

              <div className="mt-4 flex flex-col gap-4">
                <section className="rounded-3xl border border-white/10 bg-white/5 p-4 shadow-2xl backdrop-blur-xl sm:p-5">
                  <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_260px] lg:items-center">
                    <div className="min-w-0">
                      <div className="mb-3 flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1.5 text-xs font-bold text-emerald-200">
                          <span className="h-2 w-2 rounded-full bg-emerald-300 shadow-[0_0_14px_rgba(110,231,183,0.9)]" />
                          {t.worldCupPool}
                        </span>

                        <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1.5 text-xs font-bold text-zinc-300">
                          {typedTemplates.length} {t.questions}
                        </span>
                      </div>

                      <h1 className="text-3xl font-black tracking-tight text-emerald-300 sm:text-5xl">
                        {t.bonusQuestions}
                      </h1>

                      <p className="mt-2 break-words text-base font-black text-white sm:text-xl">
                        {pool.name}
                      </p>

                      <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">
                        {t.intro}
                      </p>
                    </div>

                    <div className="grid min-w-0 gap-2">
                      <div className="rounded-2xl border border-emerald-300/20 bg-emerald-300/10 p-3">
                        <BonusDeadlineCountdown
                          lockAt={lockAt}
                          isLocked={isLocked}
                          language={language}
                        />
                      </div>

                      <div className="rounded-2xl border border-white/10 bg-black/20 px-3 py-2 text-center">
                        <p className="text-[9px] font-black uppercase tracking-[0.16em] text-zinc-500">
                          {t.deadlineTime}
                        </p>
                        <p className="mt-1 break-words text-xs font-black text-white sm:text-sm">
                          {formattedLockAt ?? t.notAvailable}
                        </p>
                      </div>
                    </div>
                  </div>

                  {isLocked ? (
                    <div className="mt-4 rounded-2xl border border-orange-300/25 bg-orange-300/10 px-4 py-3 text-center text-sm font-semibold text-orange-100">
                      {t.lockedWarning}
                    </div>
                  ) : null}

                  {!formattedLockAt ? (
                    <div className="mt-4 rounded-2xl border border-orange-300/25 bg-orange-300/10 px-4 py-3 text-center text-sm font-semibold text-orange-100">
                      {t.scheduleWarning}
                    </div>
                  ) : null}
                </section>

                {typedTemplates.length > 0 ? (
                  <BonusQuestionsForm
                    poolId={pool.id}
                    isLocked={isLocked}
                    language={language}
                    questions={typedTemplates.map((question) => ({
                      id: question.id,
                      questionKey: question.question_key,
                      label: question.label,
                      description: question.description,
                      answerType: question.answer_type,
                      options: question.options ?? [],
                      pointsValue: question.points_value,
                      initialAnswer: answersMap.get(question.id) ?? "",
                    }))}
                  />
                ) : (
                  <section className="rounded-3xl border border-dashed border-white/15 bg-white/5 p-5 text-center backdrop-blur sm:p-6">
                    <h2 className="text-xl font-black">
                      {t.noQuestionsTitle}
                    </h2>
                    <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-zinc-400">
                      {t.noQuestionsIntro}
                    </p>
                  </section>
                )}
              </div>
            </div>
          </div>
        </Container>
      </section>
    </main>
  );
}