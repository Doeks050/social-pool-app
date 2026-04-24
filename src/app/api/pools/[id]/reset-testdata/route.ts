import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

function redirectTo(path: string, status = 303) {
  return new NextResponse(null, {
    status,
    headers: {
      Location: path,
    },
  });
}

export async function POST(_request: Request, context: RouteContext) {
  const { id } = await context.params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirectTo("/auth");
  }

  const { data: membership } = await supabase
    .from("pool_members")
    .select("role")
    .eq("pool_id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!membership) {
    return redirectTo(`/pools/${id}`);
  }

  const canManage =
    membership.role === "owner" || membership.role === "admin";

  if (!canManage) {
    return redirectTo(`/pools/${id}`);
  }

  await supabase.from("predictions").delete().eq("pool_id", id);
  await supabase.from("bonus_question_answers").delete().eq("pool_id", id);

  revalidatePath(`/pools/${id}`);
  revalidatePath(`/pools/${id}/matches`);
  revalidatePath(`/pools/${id}/bonus`);
  revalidatePath(`/pools/${id}/leaderboard`);

  return redirectTo(`/pools/${id}`);
}