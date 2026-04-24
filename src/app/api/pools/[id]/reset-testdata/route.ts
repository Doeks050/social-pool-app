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
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    return new NextResponse(`Auth error: ${userError.message}`, {
      status: 500,
    });
  }

  if (!user) {
    return redirectTo("/auth");
  }

  const { data: membership, error: membershipError } = await supabase
    .from("pool_members")
    .select("role")
    .eq("pool_id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (membershipError) {
    return new NextResponse(
      `Membership lookup failed: ${membershipError.message}`,
      { status: 500 }
    );
  }

  if (!membership) {
    return redirectTo(`/pools/${id}`);
  }

  const canManage =
    membership.role === "owner" || membership.role === "admin";

  if (!canManage) {
    return redirectTo(`/pools/${id}`);
  }

  const { error: predictionsDeleteError } = await supabase
    .from("predictions")
    .delete()
    .eq("pool_id", id)
    .eq("user_id", user.id);

  if (predictionsDeleteError) {
    return new NextResponse(
      `Predictions reset failed: ${predictionsDeleteError.message}`,
      { status: 500 }
    );
  }

  const { error: bonusDeleteError } = await supabase
    .from("bonus_question_answers")
    .delete()
    .eq("pool_id", id)
    .eq("user_id", user.id);

  if (bonusDeleteError) {
    return new NextResponse(
      `Bonus answers reset failed: ${bonusDeleteError.message}`,
      { status: 500 }
    );
  }

  revalidatePath(`/pools/${id}`);
  revalidatePath(`/pools/${id}/matches`);
  revalidatePath(`/pools/${id}/bonus`);
  revalidatePath(`/pools/${id}/leaderboard`);

  return redirectTo(`/pools/${id}`);
}