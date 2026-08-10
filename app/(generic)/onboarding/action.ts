"use server";

import { groupTable } from "@/db/schema/group";
import { groupJoinRequestTable } from "@/db/schema/groupJoinRequests";
import {
  DraftTribe,
  FavouriteGame,
  OnboardingDraft,
  profileTable,
} from "@/db/schema/profile";
import { profileGroupTable } from "@/db/schema/profileGroup";
import { db } from "@/utils/db";
import { createClient } from "@/utils/supabase/server";
import { and, eq, inArray, sql } from "drizzle-orm";

type Gender = "Male" | "Female" | "Others";

export interface TribeSearchResult {
  id: string;
  name: string;
  image: string;
  memberCount: number;
}

export interface TribeSuperAdmin {
  firstName: string;
  lastName: string;
  username: string;
  image: string;
}

export type SaveProfileResult =
  | { success: true; profileId: number }
  | { success: false; message: string; field?: "username" };

const SUPER_ADMIN_ROLE_ID = 1;

/**
 * Checks if the user exists from their Supabase sesssion - Auth UUID
 * Retrieves the users profile if it exists
 */
async function getCaller() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [profile] = await db
    .select({
      id: profileTable.id,
      onboardingCompletedAt: profileTable.onboardingCompletedAt,
    })
    .from(profileTable)
    .where(eq(profileTable.uuid, user.id));

  return { user, profile: profile ?? null };
}

/**
 * Slide 1. Writes the profile row, updating it in place when the user
 * re-enters the flow (a refresh, a second device, a resumed session) instead of
 * failing on a duplicate. The row has to exist this early because the claim
 * step on slide 4 needs a real profile id to request against.
 *
 * Deliberately an explicit read-then-write rather than ON CONFLICT: `uuid` has
 * no unique constraint of its own, so there is nothing for conflict inference
 * to match. The unique index on it is a race guard, not a correctness
 * dependency — if two submits land at once the loser gets 23505 and is told to
 * retry, rather than silently creating a second profile.
 */
export async function saveProfileStep(
  formData: FormData,
): Promise<SaveProfileResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, message: "Unauthorized" };

  const firstName = (formData.get("firstName") as string)?.trim();
  const lastName = (formData.get("lastName") as string)?.trim();
  const username = (formData.get("username") as string)?.trim();
  const description = ((formData.get("description") as string) ?? "").trim();
  const gender = formData.get("gender") as Gender;
  const image = formData.get("profilePicture") as string;

  if (!firstName || !lastName || !username || !gender || !image) {
    return { success: false, message: "Please fill in every required field." };
  }

  try {
    const [existing] = await db
      .select({ id: profileTable.id })
      .from(profileTable)
      .where(eq(profileTable.uuid, user.id));

    const [saved] = existing
      ? await db
          .update(profileTable)
          .set({
            firstName,
            lastName,
            username,
            description,
            gender,
            image,
            onboardingStep: sql`greatest(${profileTable.onboardingStep}, 1)`,
          })
          .where(eq(profileTable.id, existing.id))
          .returning({ id: profileTable.id })
      : await db
          .insert(profileTable)
          .values({
            uuid: user.id,
            firstName,
            lastName,
            email: user.email!,
            username,
            description,
            gender,
            image,
            onboardingStep: 1,
          })
          .returning({ id: profileTable.id });

    return { success: true, profileId: saved.id };
  } catch (error) {
    // 23505 = unique violation. Two columns can raise it: `username` (the user
    // picked one that's taken) and `uuid` (a concurrent submit already created
    // their profile). Only the first is worth pinning to a field.
    const pgError = error as { code?: string; constraint_name?: string };
    if (pgError.code === "23505") {
      if (pgError.constraint_name?.includes("username")) {
        return {
          success: false,
          field: "username",
          message: "That username is already taken.",
        };
      }
      return {
        success: false,
        message: "Your profile was just saved elsewhere — try again.",
      };
    }
    console.error("Failed to save onboarding profile:", error);
    return { success: false, message: "Failed to save your profile." };
  }
}

/**
 * Saves progress after every Continue / Skip. The draft is *merged* rather
 * than replaced and the step only ever moves forward, so two devices resuming
 * the same unfinished flow add to each other's picks instead of wiping them.
 */
export async function saveDraft(step: number, patch: OnboardingDraft) {
  const caller = await getCaller();
  if (!caller?.profile) return { success: false, message: "Unauthorized" };

  try {
    await db
      .update(profileTable)
      .set({
        onboardingStep: sql`greatest(${profileTable.onboardingStep}, ${step})`,
        onboardingDraft: sql`${profileTable.onboardingDraft} || ${JSON.stringify(patch)}::jsonb`,
      })
      .where(eq(profileTable.id, caller.profile.id));

    return { success: true };
  } catch (error) {
    console.error("Failed to save onboarding draft:", error);
    return { success: false, message: "Failed to save your progress." };
  }
}

/**
 * Slide 3. Trigram search over tribe names (plus a prefix match on the tribe's
 * UUID), ranked by similarity so near-misses and typos still surface. Returns
 * the top 5 only, and never a tribe the caller already belongs to or has a
 * pending request for.
 */
export async function searchTribes(
  query: string,
): Promise<TribeSearchResult[]> {
  const caller = await getCaller();
  if (!caller?.profile) return [];

  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  try {
    const rows = await db.execute<{
      id: string;
      name: string;
      image: string;
      member_count: number;
    }>(sql`
      select g.id,
             g.name,
             g.image,
             count(pg.profile_id)::int as member_count
        from "group" g
        left join profile_group pg on pg.group_id = g.id
       where (g.name % ${trimmed}
              or g.name ilike ${"%" + trimmed + "%"}
              or g.id::text like ${trimmed + "%"})
         and not exists (
           select 1 from profile_group m
            where m.group_id = g.id and m.profile_id = ${caller.profile.id}
         )
         and not exists (
           select 1 from group_join_requests r
            where r.group_id = g.id
              and r.profile_id = ${caller.profile.id}
              and r.status = 'pending'
         )
       group by g.id
       order by similarity(g.name, ${trimmed}) desc, count(pg.profile_id) desc
       limit 5
    `);

    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      image: row.image,
      memberCount: Number(row.member_count),
    }));
  } catch (error) {
    console.error("Failed to search tribes:", error);
    throw new Error("search_failed");
  }
}

/**
 * The people who will actually receive the join request. Shown while the user
 * is confirming they picked the right tribe.
 */
export async function getTribeSuperAdmins(
  groupId: string,
): Promise<TribeSuperAdmin[]> {
  const caller = await getCaller();
  if (!caller?.profile) return [];

  try {
    return await db
      .select({
        firstName: profileTable.firstName,
        lastName: profileTable.lastName,
        username: profileTable.username,
        image: profileTable.image,
      })
      .from(profileGroupTable)
      .innerJoin(profileTable, eq(profileTable.id, profileGroupTable.profileId))
      .where(
        and(
          eq(profileGroupTable.groupId, groupId),
          eq(profileGroupTable.roleId, SUPER_ADMIN_ROLE_ID),
        ),
      );
  } catch (error) {
    console.error("Failed to fetch tribe SuperAdmins:", error);
    return [];
  }
}

/**
 * Resolves the tribe behind an invite link so slide 3 can open with it already
 * added to the user's list.
 */
export async function getTribeById(
  groupId: string,
): Promise<TribeSearchResult | null> {
  try {
    const [tribe] = await db
      .select({
        id: groupTable.id,
        name: groupTable.name,
        image: groupTable.image,
      })
      .from(groupTable)
      .where(eq(groupTable.id, groupId));

    if (!tribe) return null;

    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(profileGroupTable)
      .where(eq(profileGroupTable.groupId, groupId));

    return { ...tribe, memberCount: Number(count) };
  } catch (error) {
    console.error("Failed to fetch tribe:", error);
    return null;
  }
}

/**
 *
 * The end of the flow. Writes the collected content, marks onboarding done and
 * only now sends the queued join requests — inserting a group_join_requests row
 * is what puts the request in front of every SuperAdmin of that tribe.
 *
 * Idempotent: if another device already completed the flow the profile write is
 * skipped and the join requests still de-duplicate, so this can be retried.
 */
export async function completeOnboarding(payload: {
  tribes: DraftTribe[];
  favouriteGames: FavouriteGame[];
}) {
  const caller = await getCaller();
  if (!caller?.profile) return { success: false, message: "Unauthorized" };

  const profileId = caller.profile.id;
  const alreadyCompleted = !!caller.profile.onboardingCompletedAt;

  try {
    await db.transaction(async (tx) => {
      if (!alreadyCompleted) {
        await tx
          .update(profileTable)
          .set({
            favouriteGames: payload.favouriteGames.slice(0, 5),
            onboardingStep: 6,
            onboardingCompletedAt: new Date(),
            onboardingDraft: {},
          })
          .where(eq(profileTable.id, profileId));
      }

      const tribeIds = [...new Set(payload.tribes.map((t) => t.id))];
      if (tribeIds.length === 0) return;

      // Skip tribes the user is already in or already has a request for
      const memberships = await tx
        .select({ groupId: profileGroupTable.groupId })
        .from(profileGroupTable)
        .where(
          and(
            eq(profileGroupTable.profileId, profileId),
            inArray(profileGroupTable.groupId, tribeIds),
          ),
        );

      const pending = await tx
        .select({ groupId: groupJoinRequestTable.groupId })
        .from(groupJoinRequestTable)
        .where(
          and(
            eq(groupJoinRequestTable.profileId, profileId),
            eq(groupJoinRequestTable.status, "pending"),
            inArray(groupJoinRequestTable.groupId, tribeIds),
          ),
        );

      const blocked = new Set([
        ...memberships.map((m) => m.groupId),
        ...pending.map((p) => p.groupId),
      ]);

      const toRequest = tribeIds.filter((id) => !blocked.has(id));
      if (toRequest.length > 0) {
        await tx
          .insert(groupJoinRequestTable)
          .values(toRequest.map((groupId) => ({ groupId, profileId })));
      }
    });

    // The invite has been acted on (or deliberately dropped) — clear it so the
    // same link can't queue a second request on a later visit.
    if (caller.user.user_metadata?.inviteCode) {
      const supabase = await createClient();
      await supabase.auth.updateUser({ data: { inviteCode: null } });
    }

    return { success: true };
  } catch (error) {
    console.error("Failed to complete onboarding:", error);
    return { success: false, message: "Failed to finish setting up." };
  }
}
