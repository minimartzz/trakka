"use server";

import { FavouriteGame, profileTable } from "@/db/schema/profile";
import { db } from "@/utils/db";
import { createClient } from "@/utils/supabase/server";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

const MAX_FAVOURITE_GAMES = 5;

/**
 * Resolve the caller's profile from their Supabase session. Never trust a
 * client-supplied profile id — matches the pattern in account/claim/action.ts.
 */
async function getCallerProfile() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [profile] = await db
    .select({
      id: profileTable.id,
      favouriteGames: profileTable.favouriteGames,
    })
    .from(profileTable)
    .where(eq(profileTable.uuid, user.id));

  return profile ?? null;
}

/**
 * Adds a game to the user's favourite games. Since it's a JSONB, it appends
 * the entry and updates the entry. Capped at 5 entries
 */
export async function addFavouriteGame(game: FavouriteGame) {
  const profile = await getCallerProfile();
  if (!profile) return { success: false, message: "Unauthorized" };

  const current = profile.favouriteGames;
  if (current.some((g) => g.bggId === game.bggId)) {
    return { success: false, message: "Already in your favourites." };
  }
  if (current.length >= MAX_FAVOURITE_GAMES) {
    return { success: false, message: "You can only pick 5 favourite games." };
  }

  try {
    await db
      .update(profileTable)
      .set({ favouriteGames: [...current, game] })
      .where(eq(profileTable.id, profile.id));

    revalidatePath("/account");
    return { success: true };
  } catch (error) {
    console.error("Failed to add favourite game:", error);
    return { success: false, message: "Failed to save your pick." };
  }
}

export async function removeFavouriteGame(bggId: number) {
  const profile = await getCallerProfile();
  if (!profile) return { success: false, message: "Unauthorized" };

  try {
    await db
      .update(profileTable)
      .set({
        favouriteGames: profile.favouriteGames.filter((g) => g.bggId !== bggId),
      })
      .where(eq(profileTable.id, profile.id));

    revalidatePath("/account");
    return { success: true };
  } catch (error) {
    console.error("Failed to remove favourite game:", error);
    return { success: false, message: "Failed to remove that game." };
  }
}
