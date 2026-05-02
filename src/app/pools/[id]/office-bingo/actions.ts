"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase";
import {
  getFreeOfficeBingoLabels,
  getOfficeBingoExpiryDate,
  type OfficeBingoPlan,
} from "@/lib/office-bingo";
import {
  checkOfficeBingoWin,
  generateOfficeBingoCard,
  type OfficeBingoCardCell,
} from "@/lib/office-bingo-cards";
import { getLanguageFromCookieValue } from "@/lib/i18n";

type PoolMemberRow = {
  user_id: string;
  role: string;
};

type OfficeBingoEventRow = {
  id: string;
  pool_id: string;
  plan: OfficeBingoPlan;
  target_name: string | null;
};

type OfficeBingoRoundRow = {
  id: string;
  event_id: string;
  pool_id: string;
  grid_size: number;
  diagonal_enabled: boolean;
};

type OfficeBingoItemRow = {
  id: string;
  label: string;
};

type OfficeBingoCardRow = {
  id: string;
  user_id: string;
  fingerprint: string;
};

type OfficeBingoCardCellRow = {
  card_id: string;
  item_id: string;
  position_index: number;
};

async function getCurrentUserOrRedirect() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth");
  }

  return {
    supabase,
    user,
  };
}

async function assertPoolAdmin(poolId: string) {
  const { supabase, user } = await getCurrentUserOrRedirect();

  const { data: membership } = await supabase
    .from("pool_members")
    .select("role")
    .eq("pool_id", poolId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!membership || !["owner", "admin"].includes(String(membership.role))) {
    throw new Error("You are not allowed to manage this Office Bingo.");
  }

  return {
    supabase,
    user,
  };
}

async function getLanguage() {
  const cookieStore = await cookies();

  return getLanguageFromCookieValue(cookieStore.get("poolr-language")?.value);
}

function getFormString(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value.trim() : "";
}

async function getFirstRound(poolId: string) {
  const { supabase } = await getCurrentUserOrRedirect();

  const { data: event } = await supabase
    .from("office_bingo_events")
    .select("id, pool_id, plan, target_name")
    .eq("pool_id", poolId)
    .maybeSingle();

  if (!event) {
    return {
      event: null,
      round: null,
    };
  }

  const { data: round } = await supabase
    .from("office_bingo_rounds")
    .select("id, event_id, pool_id, grid_size, diagonal_enabled")
    .eq("event_id", event.id)
    .eq("round_number", 1)
    .maybeSingle();

  return {
    event: event as OfficeBingoEventRow,
    round: (round ?? null) as OfficeBingoRoundRow | null,
  };
}

export async function createFreeOfficeBingoAction(
  poolId: string,
  formData: FormData
) {
  const { supabase, user } = await assertPoolAdmin(poolId);
  const language = await getLanguage();

  const targetName = getFormString(formData, "targetName");

  if (!targetName) {
    throw new Error("Vul een naam in voor deze Office Bingo.");
  }

  const { data: existingEvent } = await supabase
    .from("office_bingo_events")
    .select("id")
    .eq("pool_id", poolId)
    .maybeSingle();

  if (existingEvent) {
    redirect(`/pools/${poolId}/office-bingo`);
  }

  const plan: OfficeBingoPlan = "free";
  const expiresAt = getOfficeBingoExpiryDate(plan);

  const { data: event, error: eventError } = await supabase
    .from("office_bingo_events")
    .insert({
      pool_id: poolId,
      plan,
      status: "active",
      target_name: targetName,
      template_key: "colleague_free",
      starts_at: new Date().toISOString(),
      expires_at: expiresAt.toISOString(),
      created_by: user.id,
    })
    .select("id")
    .single();

  if (eventError || !event) {
    throw new Error(eventError?.message ?? "Office Bingo event aanmaken mislukt.");
  }

  const { data: round, error: roundError } = await supabase
    .from("office_bingo_rounds")
    .insert({
      event_id: event.id,
      pool_id: poolId,
      round_number: 1,
      title: language === "nl" ? "Ronde 1" : "Round 1",
      status: "draft",
      grid_size: 3,
      win_line_enabled: true,
      win_full_card_enabled: true,
      continue_after_line: true,
      diagonal_enabled: false,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (roundError || !round) {
    throw new Error(roundError?.message ?? "Office Bingo ronde aanmaken mislukt.");
  }

  const labels = getFreeOfficeBingoLabels(language, targetName);

  const { error: itemsError } = await supabase.from("office_bingo_items").insert(
    labels.map((label, index) => ({
      round_id: round.id,
      pool_id: poolId,
      label,
      sort_order: index + 1,
      is_template_item: true,
      is_custom_item: false,
      created_by: user.id,
    }))
  );

  if (itemsError) {
    throw new Error(itemsError.message);
  }

  revalidatePath(`/pools/${poolId}`);
  revalidatePath(`/pools/${poolId}/office-bingo`);

  redirect(`/pools/${poolId}/office-bingo`);
}

export async function generateOfficeBingoCardsAction(poolId: string) {
  const { supabase } = await assertPoolAdmin(poolId);

  const { event, round } = await getFirstRound(poolId);

  if (!event || !round) {
    throw new Error("Office Bingo is nog niet ingesteld.");
  }

  const { data: members } = await supabase
    .from("pool_members")
    .select("user_id, role")
    .eq("pool_id", poolId)
    .order("joined_at", { ascending: true });

  const typedMembers = (members ?? []) as PoolMemberRow[];

  if (typedMembers.length === 0) {
    throw new Error("Er zijn nog geen deelnemers in deze poule.");
  }

  const { data: items } = await supabase
    .from("office_bingo_items")
    .select("id, label")
    .eq("round_id", round.id)
    .order("sort_order", { ascending: true });

  const typedItems = (items ?? []) as OfficeBingoItemRow[];
  const itemIds = typedItems.map((item) => item.id);

  const { data: existingCards } = await supabase
    .from("office_bingo_cards")
    .select("id, user_id, fingerprint")
    .eq("round_id", round.id);

  const existingCardRows = (existingCards ?? []) as OfficeBingoCardRow[];
  const existingUserIds = new Set(existingCardRows.map((card) => card.user_id));
  const existingFingerprints = new Set(
    existingCardRows.map((card) => card.fingerprint)
  );

  const membersWithoutCard = typedMembers.filter(
    (member) => !existingUserIds.has(member.user_id)
  );

  for (const member of membersWithoutCard) {
    const generatedCard = generateOfficeBingoCard(
      itemIds,
      round.grid_size,
      existingFingerprints
    );

    const { data: card, error: cardError } = await supabase
      .from("office_bingo_cards")
      .insert({
        round_id: round.id,
        pool_id: poolId,
        user_id: member.user_id,
        fingerprint: generatedCard.fingerprint,
      })
      .select("id")
      .single();

    if (cardError || !card) {
      throw new Error(cardError?.message ?? "Bingo kaart aanmaken mislukt.");
    }

    const { error: cellsError } = await supabase
      .from("office_bingo_card_cells")
      .insert(
        generatedCard.cells.map((cell) => ({
          card_id: card.id,
          round_id: round.id,
          item_id: cell.itemId,
          position_index: cell.positionIndex,
        }))
      );

    if (cellsError) {
      throw new Error(cellsError.message);
    }

    existingFingerprints.add(generatedCard.fingerprint);
  }

  await supabase
    .from("office_bingo_rounds")
    .update({
      status: "active",
      published_at: new Date().toISOString(),
    })
    .eq("id", round.id);

  revalidatePath(`/pools/${poolId}`);
  revalidatePath(`/pools/${poolId}/office-bingo`);
}

export async function callOfficeBingoItemAction(
  poolId: string,
  formData: FormData
) {
  const { supabase, user } = await assertPoolAdmin(poolId);

  const itemId = getFormString(formData, "itemId");

  if (!itemId) {
    throw new Error("Geen bingo item gekozen.");
  }

  const { event, round } = await getFirstRound(poolId);

  if (!event || !round) {
    throw new Error("Office Bingo is nog niet ingesteld.");
  }

  const { data: existingCalledItem } = await supabase
    .from("office_bingo_called_items")
    .select("id")
    .eq("round_id", round.id)
    .eq("item_id", itemId)
    .maybeSingle();

  if (!existingCalledItem) {
    const { error: calledError } = await supabase
      .from("office_bingo_called_items")
      .insert({
        round_id: round.id,
        pool_id: poolId,
        item_id: itemId,
        called_by: user.id,
      });

    if (calledError) {
      throw new Error(calledError.message);
    }
  }

  await recalculateOfficeBingoWinners(poolId, round);

  revalidatePath(`/pools/${poolId}`);
  revalidatePath(`/pools/${poolId}/office-bingo`);
}

export async function uncallOfficeBingoItemAction(
  poolId: string,
  formData: FormData
) {
  const { supabase } = await assertPoolAdmin(poolId);

  const itemId = getFormString(formData, "itemId");

  if (!itemId) {
    throw new Error("Geen bingo item gekozen.");
  }

  const { round } = await getFirstRound(poolId);

  if (!round) {
    throw new Error("Office Bingo is nog niet ingesteld.");
  }

  const { error } = await supabase
    .from("office_bingo_called_items")
    .delete()
    .eq("round_id", round.id)
    .eq("item_id", itemId);

  if (error) {
    throw new Error(error.message);
  }

  await supabase
    .from("office_bingo_winners")
    .delete()
    .eq("round_id", round.id);

  await recalculateOfficeBingoWinners(poolId, round);

  revalidatePath(`/pools/${poolId}`);
  revalidatePath(`/pools/${poolId}/office-bingo`);
}

async function recalculateOfficeBingoWinners(
  poolId: string,
  round: OfficeBingoRoundRow
) {
  const { supabase } = await getCurrentUserOrRedirect();

  const { data: calledItems } = await supabase
    .from("office_bingo_called_items")
    .select("item_id")
    .eq("round_id", round.id);

  const calledItemIds = new Set(
    ((calledItems ?? []) as { item_id: string }[]).map((item) => item.item_id)
  );

  const { data: cards } = await supabase
    .from("office_bingo_cards")
    .select("id, user_id, fingerprint")
    .eq("round_id", round.id);

  const typedCards = (cards ?? []) as OfficeBingoCardRow[];

  for (const card of typedCards) {
    const { data: cells } = await supabase
      .from("office_bingo_card_cells")
      .select("card_id, item_id, position_index")
      .eq("card_id", card.id);

    const typedCells = (cells ?? []) as OfficeBingoCardCellRow[];

    const winResult = checkOfficeBingoWin({
      gridSize: round.grid_size,
      diagonalEnabled: round.diagonal_enabled,
      cardCells: typedCells.map(
        (cell): OfficeBingoCardCell => ({
          itemId: cell.item_id,
          positionIndex: cell.position_index,
        })
      ),
      calledItemIds,
    });

    if (winResult.hasLine) {
      await supabase.from("office_bingo_winners").upsert(
        {
          round_id: round.id,
          pool_id: poolId,
          user_id: card.user_id,
          win_type: "line",
          winning_positions: winResult.linePositions,
        },
        {
          onConflict: "round_id,user_id,win_type",
        }
      );
    }

    if (winResult.hasFullCard) {
      await supabase.from("office_bingo_winners").upsert(
        {
          round_id: round.id,
          pool_id: poolId,
          user_id: card.user_id,
          win_type: "full_card",
          winning_positions: typedCells
            .map((cell) => cell.position_index)
            .sort((a, b) => a - b),
        },
        {
          onConflict: "round_id,user_id,win_type",
        }
      );
    }
  }
}

export async function sendOfficeBingoMessageAction(
  poolId: string,
  formData: FormData
) {
  const { supabase, user } = await getCurrentUserOrRedirect();

  const message = getFormString(formData, "message");

  if (!message) {
    return;
  }

  if (message.length > 500) {
    throw new Error("Bericht mag maximaal 500 tekens zijn.");
  }

  const { data: membership } = await supabase
    .from("pool_members")
    .select("user_id")
    .eq("pool_id", poolId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!membership) {
    throw new Error("Je bent geen lid van deze poule.");
  }

  const { event, round } = await getFirstRound(poolId);

  const { error } = await supabase.from("office_bingo_messages").insert({
    pool_id: poolId,
    event_id: event?.id ?? null,
    round_id: round?.id ?? null,
    user_id: user.id,
    message,
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(`/pools/${poolId}`);
  revalidatePath(`/pools/${poolId}/office-bingo`);
}