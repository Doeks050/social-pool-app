"use client";

import { FormEvent, useState } from "react";

type AdminBonusQuestion = {
  id: string;
  questionKey: string;
  label: string;
  description: string | null;
  options: string[];
  pointsValue: number;
  correctAnswer: string;
};

type AdminBonusResultsFormProps = {
  questions: AdminBonusQuestion[];
};

export default function AdminBonusResultsForm({
  questions,
}: AdminBonusResultsFormProps) {
  const [values, setValues] = useState<Record<string, string>>(
    Object.fromEntries(
      questions.map((question) => [question.id, question.correctAnswer ?? ""])
    )
  );

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function updateValue(questionId: string, value: string) {
    setValues((current) => ({
      ...current,
      [questionId]: value,
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setMessage(null);
    setError(null);

    try {
      const response = await fetch("/api/admin/world-cup/bonus-results", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          answers: values,
        }),
      });

      const result = (await response.json()) as {
        ok?: boolean;
        saved?: number;
        error?: string;
      };

      if (!response.ok || !result.ok) {
        setError(result.error ?? "Bonusresultaten opslaan is mislukt.");
        setLoading(false);
        return;
      }

      setMessage(`Bonusresultaten opgeslagen (${result.saved ?? 0}).`);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Onbekende fout tijdens opslaan."
      );
    }

    setLoading(false);
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
              Juiste antwoord
            </label>

            <select
              value={values[question.id] ?? ""}
              onChange={(event) => updateValue(question.id, event.target.value)}
              disabled={loading}
              className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-white outline-none transition focus:border-white disabled:opacity-60"
            >
              <option value="">Nog geen antwoord ingesteld</option>

              {question.options.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        </div>
      ))}

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
          disabled={loading}
          className="rounded-xl bg-white px-5 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Opslaan..." : "Bonusresultaten opslaan"}
        </button>
      </div>
    </form>
  );
}