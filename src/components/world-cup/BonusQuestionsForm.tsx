"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";

type BonusQuestion = {
  id: string;
  questionKey: string;
  label: string;
  description: string | null;
  answerType: string;
  options: string[];
  pointsValue: number;
  initialAnswer: string;
};

type BonusQuestionsFormProps = {
  poolId: string;
  isLocked: boolean;
  questions: BonusQuestion[];
};

export default function BonusQuestionsForm({
  poolId,
  isLocked,
  questions,
}: BonusQuestionsFormProps) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [answers, setAnswers] = useState<Record<string, string>>(
    Object.fromEntries(
      questions.map((question) => [question.id, question.initialAnswer ?? ""])
    )
  );
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function updateAnswer(questionId: string, value: string) {
    setAnswers((current) => ({
      ...current,
      [questionId]: value,
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isLocked) {
      setError("Bonus questions are locked and can no longer be changed.");
      return;
    }

    const missingQuestion = questions.find(
      (question) => !answers[question.id]?.trim()
    );

    if (missingQuestion) {
      setError("Please answer all bonus questions first.");
      return;
    }

    setLoading(true);
    setError(null);
    setMessage(null);

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setError("Your session could not be loaded. Please log in again.");
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

    setMessage("Bonus answers saved.");
    setLoading(false);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-4 backdrop-blur sm:p-5">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-emerald-300">
              Your answers
            </p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-white">
              Predict the tournament
            </h2>
            <p className="mt-2 text-sm leading-6 text-zinc-400">
              These answers are saved to your personal entry for this pool.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-zinc-400">
            {questions.length} {questions.length === 1 ? "question" : "questions"}
          </div>
        </div>

        <div className="grid gap-3">
          {questions.map((question, index) => (
            <div
              key={question.id}
              className="rounded-[1.5rem] border border-white/10 bg-black/20 p-4 transition hover:border-emerald-300/25 hover:bg-white/[0.04] sm:p-5"
            >
              <div className="mb-4 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[11px] font-black uppercase tracking-[0.2em] text-emerald-300">
                    Question {index + 1}
                  </p>
                  <h3 className="mt-1 text-base font-black text-white sm:text-lg">
                    {question.label}
                  </h3>
                </div>

                <div className="shrink-0 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-xs font-black text-emerald-200">
                  {question.pointsValue}{" "}
                  {question.pointsValue === 1 ? "pt" : "pts"}
                </div>
              </div>

              {question.description ? (
                <p className="mb-4 text-sm leading-6 text-zinc-400">
                  {question.description}
                </p>
              ) : null}

              <select
                value={answers[question.id] ?? ""}
                onChange={(event) =>
                  updateAnswer(question.id, event.target.value)
                }
                disabled={isLocked || loading}
                className="w-full rounded-xl border border-white/10 bg-[#06110d] px-4 py-3 text-sm font-semibold text-white outline-none transition focus:border-emerald-300/70 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">Choose a country</option>

                {question.options.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
      </section>

      {error ? (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      {message ? (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
          {message}
        </div>
      ) : null}

      <div className="sticky bottom-3 z-20 rounded-[1.5rem] border border-white/10 bg-[#030706]/85 p-3 shadow-2xl backdrop-blur sm:static sm:border-0 sm:bg-transparent sm:p-0 sm:shadow-none">
        <button
          type="submit"
          disabled={isLocked || loading}
          className="w-full rounded-xl bg-emerald-300 px-5 py-3 text-sm font-black text-zinc-950 transition hover:bg-emerald-200 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
        >
          {isLocked
            ? "Locked"
            : loading
            ? "Saving..."
            : "Save bonus answers"}
        </button>
      </div>
    </form>
  );
}