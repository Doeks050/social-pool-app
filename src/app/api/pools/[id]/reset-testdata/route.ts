import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(_request: Request, context: RouteContext) {
  const { id } = await context.params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/auth", _request.url));
  }

  const { data: membership } = await supabase
    .from("pool_members")
    .select("role")
    .eq("pool_id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!membership) {
    return NextResponse.redirect(new URL(`/pools/${id}`, _request.url));
  }

  const canManage =
    membership.role === "owner" || membership.role === "admin";

  if (!canManage) {
    return NextResponse.redirect(new URL(`/pools/${id}`, _request.url));
  }

  await supabase.from("predictions").delete().eq("pool_id", id);
  await supabase.from("bonus_question_answers").delete().eq("pool_id", id);

  revalidatePath(`/pools/${id}`);
  revalidatePath(`/pools/${id}/matches`);
  revalidatePath(`/pools/${id}/bonus`);
  revalidatePath(`/pools/${id}/leaderboard`);

  return NextResponse.redirect(new URL(`/pools/${id}`, _request.url), 303);
}