"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";
import type { Language } from "@/lib/i18n";

type BonusQuestion = {
  id: string;
  questionKey: string;
  label: string;
  answerType: string;
  options: string[];
  pointsValue: number;
  initialAnswer: string;
};

type BonusQuestionsFormProps = {
  poolId: string;
  isLocked: boolean;
  language: Language;
  questions: BonusQuestion[];
};

const copy = {
  en: {
    bonusPredictions: "Bonus predictions",
    chooseCountry: "Choose a country",
    open: "Open",
    locked: "Locked",
    saving: "Saving...",
    saveBonusAnswers: "Save bonus answers",
    completeAllAnswers: "Complete all answers",
    lockedError: "Bonus answers are locked because the first World Cup match has started.",
    missingError: "Please answer all bonus questions before saving.",
    sessionError: "Your session could not be loaded. Please log in again.",
    savedMessage: "Bonus answers saved.",
    pt: "pt",
    pts: "pts",
  },
  nl: {
    bonusPredictions: "Bonusvragen",
    chooseCountry: "Kies een land",
    open: "Open",
    locked: "Gesloten",
    saving: "Opslaan...",
    saveBonusAnswers: "Bonusantwoorden opslaan",
    completeAllAnswers: "Vul alle antwoorden in",
    lockedError: "Bonusantwoorden zijn gesloten omdat de eerste WK-wedstrijd is begonnen.",
    missingError: "Beantwoord eerst alle bonusvragen voordat je opslaat.",
    sessionError: "Je sessie kon niet worden geladen. Log opnieuw in.",
    savedMessage: "Bonusantwoorden opgeslagen.",
    pt: "pt",
    pts: "ptn",
  },
} satisfies Record<Language, Record<string, string>>;

export default function BonusQuestionsForm({
  poolId,
  isLocked,
  language,
  questions,
}: BonusQuestionsFormProps) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const t = copy[language];

  const [answers, setAnswers] = useState<Record<string, string>>(
    Object.fromEntries(
      questions.map((question) => [question.id, question.initialAnswer ?? ""])
    )
  );

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const allAnswered = questions.every((q) => answers[q.id]?.trim());

  function updateAnswer(questionId: string, value: string) {
    setAnswers((current) => ({
      ...current,
      [questionId]: value,
    }));
    setMessage(null);
    setError(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isLocked) {
      setError(t.lockedError);
      return;
    }

    if (!allAnswered) {
      setError(t.missingError);
      return;
    }

    setLoading(true);
    setError(null);
    setMessage(null);

    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      setError(t.sessionError);
      setLoading(false);
      router.push("/auth");
      return;
    }

    const payload = questions.map((question) => ({
      pool_id: poolId,
      user_id: user.id,
      question_id: question.id,
      answer_value: answers[question.id],
    }));

    const { error: upsertError } = await supabase
      .from("bonus_question_answers")
      .upsert(payload, {
        onConflict: "pool_id,user_id,question_id",
      });

    if (upsertError) {
      setError(upsertError.message);
      setLoading(false);
      return;
    }

    setMessage(t.savedMessage);
    setLoading(false);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <section className="rounded-3xl border border-white/10 bg-white/4 p-4 backdrop-blur-xl sm:p-5">
        <h2 className="text-xl font-black tracking-tight text-emerald-300 sm:text-2xl mb-4">
          {t.bonusPredictions}
        </h2>

        <div className="grid gap-3">
          {questions.map((question) => {
            const hasAnswer = Boolean(answers[question.id]?.trim());
            return (
              <div
                key={question.id}
                className={`relative overflow-hidden rounded-2xl border p-4 transition sm:p-5 ${
                  hasAnswer
                    ? "border-emerald-300/25 bg-emerald-300/6"
                    : "border-white/10 bg-black/20 hover:border-emerald-300/25 hover:bg-white/4"
                }`}
              >
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-base font-black text-white sm:text-lg">
                    {question.label}
                  </h3>
                  <div className="shrink-0 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-xs font-black text-emerald-200">
                    {question.pointsValue} {question.pointsValue === 1 ? t.pt : t.pts}
                  </div>
                </div>

                <select
                  value={answers[question.id] ?? ""}
                  onChange={(e) => updateAnswer(question.id, e.target.value)}
                  disabled={isLocked || loading}
                  className="h-12 w-full rounded-xl border border-white/10 bg-[#06110d] px-4 text-sm font-bold text-white outline-none transition focus:border-emerald-300/70 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="">{t.chooseCountry}</option>
                  {question.options.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
            );
          })}
        </div>
      </section>

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-center text-sm font-semibold text-red-200">
          {error}
        </div>
      )}

      {message && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-center text-sm font-semibold text-emerald-200">
          {message}
        </div>
      )}

      <div className="sticky bottom-3 z-20 rounded-3xl border border-white/10 bg-[#030706]/90 p-3 shadow-2xl backdrop-blur-xl sm:static sm:flex sm:justify-center sm:border-0 sm:bg-transparent sm:p-0 sm:shadow-none">
        <button
          type="submit"
          disabled={isLocked || loading}
          className="w-full rounded-xl bg-emerald-300 px-5 py-3 text-sm font-black text-zinc-950 transition hover:bg-emerald-200 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:min-w-56"
        >
          {isLocked
            ? t.locked
            : loading
            ? t.saving
            : allAnswered
            ? t.saveBonusAnswers
            : t.completeAllAnswers}
        </button>
      </div>
    </form>
  );
}