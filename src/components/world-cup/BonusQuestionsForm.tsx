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
      setError("Bonusvragen zijn gelockt en kunnen niet meer aangepast worden.");
      return;
    }

    const missingQuestion = questions.find(
      (question) => !answers[question.id]?.trim()
    );

    if (missingQuestion) {
      setError("Vul eerst alle bonusvragen in.");
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
      setError("Je sessie kon niet worden geladen. Log opnieuw in.");
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

    setMessage("Bonusvragen opgeslagen.");
    setLoading(false);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {questions.map((question, index) => (
        <div
          key={question.id}
          className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5"
        >
          <div className="flex flex-col gap-2">
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
              Vraag {index + 1}
            </p>

            <h2 className="text-lg font-semibold text-white">
              {question.label}
            </h2>

            {question.description ? (
              <p className="text-sm leading-6 text-zinc-400">
                {question.description}
              </p>
            ) : null}

            <p className="text-sm text-zinc-500">
              Punten: <span className="text-white">{question.pointsValue}</span>
            </p>
          </div>

          <div className="mt-4">
            <label className="mb-2 block text-sm font-medium text-zinc-300">
              Selecteer je antwoord
            </label>

            <select
              value={answers[question.id] ?? ""}
              onChange={(event) => updateAnswer(question.id, event.target.value)}
              disabled={isLocked || loading}
              className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-white outline-none transition focus:border-white disabled:opacity-60"
            >
              <option value="">Kies een land</option>

              {question.options.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        </div>
      ))}

      {isLocked ? (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          Bonusvragen zijn gelockt. Je kunt niets meer aanpassen.
        </div>
      ) : null}

      {error ? (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      {message ? (
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
          {message}
        </div>
      ) : null}

      <div>
        <button
          type="submit"
          disabled={isLocked || loading}
          className="rounded-xl bg-white px-5 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLocked ? "Gelockt" : loading ? "Opslaan..." : "Bonusvragen opslaan"}
        </button>
      </div>
    </form>
  );
}