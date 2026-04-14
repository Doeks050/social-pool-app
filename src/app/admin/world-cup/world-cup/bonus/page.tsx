import { redirect } from "next/navigation";
import Link from "next/link";
import Container from "@/components/Container";
import { createClient } from "@/lib/supabase";
import AdminBonusResultsForm from "@/components/world-cup/AdminBonusResultsForm";

type BonusQuestionTemplateRow = {
  id: string;
  question_key: string;
  label: string;
  description: string | null;
  answer_type: string;
  options: string[];
  points_value: number;
  sort_order: number;
  is_active: boolean;
  correct_answer: string | null;
};

export default async function AdminWorldCupBonusPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth");
  }

  const { data: adminRow } = await supabase
    .from("app_admins")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!adminRow) {
    redirect("/dashboard");
  }

  const { data: templates } = await supabase
    .from("bonus_question_templates")
    .select(
      "id, question_key, label, description, answer_type, options, points_value, sort_order, is_active, correct_answer"
    )
    .eq("game_type", "world_cup")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  const questions = (templates ?? []) as BonusQuestionTemplateRow[];

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <section className="py-16">
        <Container>
          <div className="flex flex-col gap-6">
            <div>
              <Link
                href="/admin"
                className="inline-flex text-sm text-zinc-400 transition hover:text-white"
              >
                ← Terug naar admin
              </Link>
            </div>

            <div className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-6">
              <p className="text-sm uppercase tracking-[0.2em] text-zinc-400">
                Admin
              </p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight">
                WK bonusresultaten
              </h1>
              <p className="mt-3 text-sm leading-6 text-zinc-400">
                Vul hier per bonusvraag het juiste eindantwoord in. Dit wordt
                later gebruikt om bonuspunten mee te rekenen in de ranglijst.
              </p>
            </div>

            {questions.length > 0 ? (
              <AdminBonusResultsForm
                questions={questions.map((question) => ({
                  id: question.id,
                  questionKey: question.question_key,
                  label: question.label,
                  description: question.description,
                  options: question.options ?? [],
                  pointsValue: question.points_value,
                  correctAnswer: question.correct_answer ?? "",
                }))}
              />
            ) : (
              <div className="rounded-3xl border border-dashed border-zinc-700 bg-zinc-900/40 p-6">
                <h2 className="text-xl font-semibold">
                  Geen actieve bonusvragen gevonden
                </h2>
                <p className="mt-3 text-sm leading-6 text-zinc-400">
                  Voeg eerst actieve WK bonusvragen toe in{" "}
                  <span className="text-white">bonus_question_templates</span>.
                </p>
              </div>
            )}
          </div>
        </Container>
      </section>
    </main>
  );
}