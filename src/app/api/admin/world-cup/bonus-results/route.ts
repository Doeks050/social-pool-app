import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase";

type BonusResultPayload = {
  answers?: Record<string, string>;
};

export async function POST(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    return NextResponse.json(
      { error: `Auth error: ${userError.message}` },
      { status: 500 }
    );
  }

  if (!user) {
    return NextResponse.json({ error: "Niet ingelogd." }, { status: 401 });
  }

  const { data: appAdmin, error: adminError } = await supabase
    .from("app_admins")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (adminError) {
    return NextResponse.json(
      { error: `Admin check failed: ${adminError.message}` },
      { status: 500 }
    );
  }

  if (!appAdmin) {
    return NextResponse.json(
      { error: "Je bent geen app admin." },
      { status: 403 }
    );
  }

  let payload: BonusResultPayload;

  try {
    payload = (await request.json()) as BonusResultPayload;
  } catch {
    return NextResponse.json(
      { error: "Ongeldige request body." },
      { status: 400 }
    );
  }

  const answers = payload.answers ?? {};
  const entries = Object.entries(answers);

  if (entries.length === 0) {
    return NextResponse.json(
      { error: "Geen bonusantwoorden ontvangen." },
      { status: 400 }
    );
  }

  let savedCount = 0;

  for (const [questionId, rawAnswer] of entries) {
    const answer = rawAnswer.trim();

    const { data: updatedRows, error: updateError } = await supabase
      .from("bonus_question_templates")
      .update({
        correct_answer: answer.length > 0 ? answer : null,
      })
      .eq("id", questionId)
      .select("id, label, correct_answer");

    if (updateError) {
      return NextResponse.json(
        { error: `Opslaan mislukt: ${updateError.message}` },
        { status: 500 }
      );
    }

    if (!updatedRows || updatedRows.length === 0) {
      return NextResponse.json(
        {
          error: `Geen bonusvraag gevonden of geen update toegestaan voor questionId: ${questionId}`,
        },
        { status: 404 }
      );
    }

    savedCount += updatedRows.length;

    console.log("bonus result saved:", {
      questionId,
      savedAnswer: updatedRows[0]?.correct_answer,
    });
  }

  revalidatePath("/admin/world-cup/bonus");
  revalidatePath("/pools/[id]/leaderboard", "page");
  revalidatePath("/pools/[id]", "page");

  return NextResponse.json({
    ok: true,
    saved: savedCount,
  });
}