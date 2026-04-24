import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase";

export async function POST(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Niet ingelogd." }, { status: 401 });
  }

  const { data: appAdmin } = await supabase
    .from("app_admins")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!appAdmin) {
    return NextResponse.json({ error: "Geen toegang." }, { status: 403 });
  }

  const body = (await request.json()) as { poolId?: string };
  const poolId = String(body.poolId ?? "").trim();

  if (!poolId) {
    return NextResponse.json({ error: "Geen poolId ontvangen." }, { status: 400 });
  }

  await supabase.from("predictions").delete().eq("pool_id", poolId);
  await supabase.from("bonus_question_answers").delete().eq("pool_id", poolId);
  await supabase.from("pool_members").delete().eq("pool_id", poolId);

  const { error } = await supabase.from("pools").delete().eq("id", poolId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  revalidatePath("/admin");
  revalidatePath("/dashboard");

  return NextResponse.json({ ok: true });
}