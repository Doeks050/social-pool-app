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

  const { data: appAdmin, error: appAdminError } = await supabase
    .from("app_admins")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (appAdminError) {
    return new NextResponse(`App admin check failed: ${appAdminError.message}`, {
      status: 500,
    });
  }

  if (!appAdmin) {
    return new NextResponse("Alleen app admins mogen alle testdata resetten.", {
      status: 403,
    });
  }

  const { data: pool, error: poolError } = await supabase
    .from("pools")
    .select("id, game_type")
    .eq("id", id)
    .maybeSingle();

  if (poolError) {
    return new NextResponse(`Pool lookup failed: ${poolError.message}`, {
      status: 500,
    });
  }

  if (!pool || pool.game_type !== "world_cup") {
    return redirectTo(`/pools/${id}`);
  }

  const { error: predictionsDeleteError } = await supabase
    .from("predictions")
    .delete()
    .eq("pool_id", id);

  if (predictionsDeleteError) {
    return new NextResponse(
      `Predictions reset failed: ${predictionsDeleteError.message}`,
      { status: 500 }
    );
  }

  const { error: bonusDeleteError } = await supabase
    .from("bonus_question_answers")
    .delete()
    .eq("pool_id", id);

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