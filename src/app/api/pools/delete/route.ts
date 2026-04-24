import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase";

export async function POST(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });
  }

  // check app admin
  const { data: admin } = await supabase
    .from("app_admins")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!admin) {
    return NextResponse.json(
      { error: "Geen toegang" },
      { status: 403 }
    );
  }

  const { poolId } = await request.json();

  if (!poolId) {
    return NextResponse.json(
      { error: "Geen poolId" },
      { status: 400 }
    );
  }

  // 🔥 eerst children deleten (anders FK errors)
  await supabase.from("predictions").delete().eq("pool_id", poolId);
  await supabase.from("bonus_question_answers").delete().eq("pool_id", poolId);
  await supabase.from("pool_members").delete().eq("pool_id", poolId);

  // 🔥 dan pool
  const { error } = await supabase
    .from("pools")
    .delete()
    .eq("id", poolId);

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  revalidatePath("/admin");

  return NextResponse.json({ ok: true });
}