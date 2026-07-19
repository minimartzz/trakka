"use server";

import { compGameLogTable } from "@/db/schema/compGameLog";
import { gameTable } from "@/db/schema/game";
import { groupTable } from "@/db/schema/group";
import { histDailyPlayerStatsTable } from "@/db/schema/histDailyPlayerStats";
import { notificationsTable } from "@/db/schema/notifications";
import { profileTable } from "@/db/schema/profile";
import { profileGroupTable } from "@/db/schema/profileGroup";
import { rollingPlayerStatsTable } from "@/db/schema/rollingPlayerStats";
import { db } from "@/utils/db";
import { createClient } from "@/utils/supabase/server";
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { revalidatePath, updateTag } from "next/cache";

// Resolve the caller's profile id from their Supabase session. Never trust a
// client-supplied id — matches the inline auth pattern used elsewhere in the
// repo (account/action.ts, tribeRequests.ts).
async function getCallerProfileId() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [profile] = await db
    .select({ id: profileTable.id })
    .from(profileTable)
    .where(eq(profileTable.uuid, user.id));

  return profile?.id ?? null;
}

/**
 * Step 2-3 of the claim flow: look up an anonymous profile by its claim code
 * and, if it's available, return its identity + 3 most recent games so the
 * claimer can confirm before requesting. Read-only — does not lock anything.
 */
export async function verifyClaimCode(code: string) {
  try {
    const callerId = await getCallerProfileId();
    if (!callerId) return { success: false, message: "Unauthorized" };

    const trimmed = code.trim();
    if (!trimmed) return { success: false, message: "code_not_found" };

    const [anon] = await db
      .select({
        id: profileTable.id,
        firstName: profileTable.firstName,
        lastName: profileTable.lastName,
        username: profileTable.username,
        claimRequestedBy: profileTable.claimRequestedBy,
      })
      .from(profileTable)
      .where(
        and(
          eq(profileTable.claimCode, trimmed),
          eq(profileTable.isAnonymous, true),
        ),
      );

    if (!anon) return { success: false, message: "code_not_found" };

    // Only one claim can be pending per anonymous user, regardless of who
    // requested it (including this same caller) — no second request allowed.
    if (anon.claimRequestedBy) {
      return { success: false, message: "already_claiming" };
    }

    // The anonymous player belongs to exactly one tribe (Member role added at
    // session-create time). Grab it for display + downstream request routing.
    const [membership] = await db
      .select({
        groupId: profileGroupTable.groupId,
        tribeName: groupTable.name,
      })
      .from(profileGroupTable)
      .innerJoin(groupTable, eq(profileGroupTable.groupId, groupTable.id))
      .where(eq(profileGroupTable.profileId, anon.id));

    // The anonymous player's own game-log rows, most recent first.
    const recentGames = await db
      .select({
        gameTitle: compGameLogTable.gameTitle,
        datePlayed: compGameLogTable.datePlayed,
        gameImage: gameTable.imageUrl,
        gameThumbnail: gameTable.thumbnail,
        victoryPoints: compGameLogTable.victoryPoints,
        isWinner: compGameLogTable.isWinner,
      })
      .from(compGameLogTable)
      .leftJoin(gameTable, eq(compGameLogTable.gameId, gameTable.id))
      .where(eq(compGameLogTable.profileId, anon.id))
      .orderBy(desc(compGameLogTable.datePlayed))
      .limit(3);

    return {
      success: true,
      data: {
        anonProfileId: anon.id,
        firstName: anon.firstName,
        lastName: anon.lastName,
        username: anon.username,
        groupId: membership?.groupId ?? null,
        tribeName: membership?.tribeName ?? null,
        recentGames: recentGames.map(({ gameThumbnail, ...g }) => ({
          ...g,
          gameImage: gameThumbnail ?? g.gameImage,
        })),
      },
    };
  } catch (error) {
    console.error("Failed to verify claim code:", error);
    return { success: false, message: "Failed to verify claim code" };
  }
}

/**
 * Step 5: lock the anonymous profile to the caller and notify the tribe's
 * SuperAdmin(s) via a claim_request notification for the Inbox.
 */
export async function requestClaim(anonProfileId: number) {
  try {
    const callerId = await getCallerProfileId();
    if (!callerId) return { success: false, message: "Unauthorized" };

    return await db.transaction(async (tx) => {
      // Serialize concurrent requests on this anon profile.
      const [anon] = await tx
        .select({
          id: profileTable.id,
          firstName: profileTable.firstName,
          lastName: profileTable.lastName,
          username: profileTable.username,
          isAnonymous: profileTable.isAnonymous,
          claimRequestedBy: profileTable.claimRequestedBy,
        })
        .from(profileTable)
        .where(eq(profileTable.id, anonProfileId))
        .for("update");

      if (!anon || !anon.isAnonymous) {
        return { success: false, message: "code_not_found" };
      }
      // Only one claim can be pending per anonymous user, regardless of who
      // requested it — including the same user re-submitting.
      if (anon.claimRequestedBy) {
        return { success: false, message: "already_claiming" };
      }

      const [membership] = await tx
        .select({
          groupId: profileGroupTable.groupId,
          tribeName: groupTable.name,
        })
        .from(profileGroupTable)
        .innerJoin(groupTable, eq(profileGroupTable.groupId, groupTable.id))
        .where(eq(profileGroupTable.profileId, anon.id));

      if (!membership) {
        return { success: false, message: "code_not_found" };
      }

      // The claimer's display info for the notification payload.
      const [claimer] = await tx
        .select({
          firstName: profileTable.firstName,
          lastName: profileTable.lastName,
          username: profileTable.username,
          image: profileTable.image,
        })
        .from(profileTable)
        .where(eq(profileTable.id, callerId));

      // Set the pending-claim lock.
      await tx
        .update(profileTable)
        .set({ claimRequestedBy: callerId, claimRequestedAt: new Date() })
        .where(eq(profileTable.id, anon.id));

      // Route the request to every SuperAdmin (roleId 1) of the tribe.
      const superAdmins = await tx
        .select({ profileId: profileGroupTable.profileId })
        .from(profileGroupTable)
        .where(
          and(
            eq(profileGroupTable.groupId, membership.groupId),
            eq(profileGroupTable.roleId, 1),
          ),
        );

      if (superAdmins.length > 0) {
        await tx.insert(notificationsTable).values(
          superAdmins.map((admin) => ({
            type: "claim_request",
            isRead: false,
            profileId: admin.profileId,
            data: {
              group_id: membership.groupId,
              group_name: membership.tribeName,
              anon_profile_id: anon.id,
              anon: {
                first_name: anon.firstName,
                last_name: anon.lastName,
                username: anon.username,
              },
              claimer_id: callerId,
              claimer: {
                first_name: claimer?.firstName ?? "",
                last_name: claimer?.lastName ?? "",
                username: claimer?.username ?? "",
                image: claimer?.image ?? "",
              },
            },
          })),
        );
      }

      return { success: true, message: "Request sent" };
    });
  } catch (error) {
    console.error("Failed to request claim:", error);
    return { success: false, message: "Failed to send claim request" };
  }
}

/**
 * Step 6-10: a tribe SuperAdmin accepts or rejects a pending claim. On accept,
 * repoint all of the anonymous profile's FKs to the claimer and remove the
 * anonymous profile. On reject, unlock the anonymous profile. Either way, the
 * claimer is notified via a claim_result notification.
 */
export async function respondToClaim(
  anonProfileId: number,
  groupId: string,
  claimerId: number,
  decision: "accept" | "reject",
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { success: false, message: "Unauthorized" };

    const [callerProfile] = await db
      .select({ id: profileTable.id })
      .from(profileTable)
      .where(eq(profileTable.uuid, user.id));
    if (!callerProfile) return { success: false, message: "Unauthorized" };

    // Only a SuperAdmin (roleId 1) of this tribe may respond.
    const [membership] = await db
      .select({ roleId: profileGroupTable.roleId })
      .from(profileGroupTable)
      .where(
        and(
          eq(profileGroupTable.groupId, groupId),
          eq(profileGroupTable.profileId, callerProfile.id),
          eq(profileGroupTable.roleId, 1),
        ),
      );
    if (!membership) return { success: false, message: "Unauthorized" };

    const result = await db.transaction(async (tx) => {
      // Re-read under lock; guard against a claim already handled by another
      // admin or from the settings row (optimistic-concurrency check).
      const [anon] = await tx
        .select({
          id: profileTable.id,
          firstName: profileTable.firstName,
          lastName: profileTable.lastName,
          username: profileTable.username,
          isAnonymous: profileTable.isAnonymous,
          claimRequestedBy: profileTable.claimRequestedBy,
        })
        .from(profileTable)
        .where(eq(profileTable.id, anonProfileId))
        .for("update");

      if (
        !anon ||
        !anon.isAnonymous ||
        anon.claimRequestedBy !== claimerId
      ) {
        return {
          success: false as const,
          message: "This claim has already been handled.",
        };
      }

      const [tribe] = await tx
        .select({ name: groupTable.name, image: groupTable.image })
        .from(groupTable)
        .where(eq(groupTable.id, groupId));

      if (decision === "reject") {
        // Unlock — the anonymous profile stays as-is.
        await tx
          .update(profileTable)
          .set({ claimRequestedBy: null, claimRequestedAt: null })
          .where(eq(profileTable.id, anon.id));
      } else {
        // ACCEPT: repoint every FK from anonProfileId -> claimerId, merging
        // where the claimer already has a row for this tribe, then delete the
        // anonymous profile.

        // 1. comp_game_log: repoint participation and (defensively) authorship.
        await tx
          .update(compGameLogTable)
          .set({ profileId: claimerId })
          .where(eq(compGameLogTable.profileId, anon.id));
        await tx
          .update(compGameLogTable)
          .set({ createdBy: claimerId })
          .where(eq(compGameLogTable.createdBy, anon.id));

        // 2. hist_daily_player_stats (histDaily + histMonthly Drizzle consts
        // both map to this one physical table — repoint once). For (profile,
        // group) collisions keep the claimer's own snapshot and drop the
        // anon's; repoint the rest.
        await tx
          .delete(histDailyPlayerStatsTable)
          .where(
            and(
              eq(histDailyPlayerStatsTable.profileId, anon.id),
              inArray(
                histDailyPlayerStatsTable.groupId,
                tx
                  .select({ groupId: histDailyPlayerStatsTable.groupId })
                  .from(histDailyPlayerStatsTable)
                  .where(eq(histDailyPlayerStatsTable.profileId, claimerId)),
              ),
            ),
          );
        await tx
          .update(histDailyPlayerStatsTable)
          .set({ profileId: claimerId })
          .where(eq(histDailyPlayerStatsTable.profileId, anon.id));

        // 3. rolling_player_stats (unique on (profile, group)). Merge into the
        // claimer's row per group if one exists, else repoint.
        const anonRolling = await tx
          .select()
          .from(rollingPlayerStatsTable)
          .where(eq(rollingPlayerStatsTable.profileId, anon.id));

        for (const row of anonRolling) {
          const [claimerRow] = await tx
            .select()
            .from(rollingPlayerStatsTable)
            .where(
              and(
                eq(rollingPlayerStatsTable.profileId, claimerId),
                eq(rollingPlayerStatsTable.groupId, row.groupId),
              ),
            );

          if (claimerRow) {
            await tx
              .update(rollingPlayerStatsTable)
              .set({
                sessionsPlayed: claimerRow.sessionsPlayed + row.sessionsPlayed,
                sessionsWon: claimerRow.sessionsWon + row.sessionsWon,
                rollingScore: claimerRow.rollingScore + row.rollingScore,
                latestSession:
                  row.latestSession > claimerRow.latestSession
                    ? row.latestSession
                    : claimerRow.latestSession,
              })
              .where(eq(rollingPlayerStatsTable.id, claimerRow.id));
            await tx
              .delete(rollingPlayerStatsTable)
              .where(eq(rollingPlayerStatsTable.id, row.id));
          } else {
            await tx
              .update(rollingPlayerStatsTable)
              .set({ profileId: claimerId })
              .where(eq(rollingPlayerStatsTable.id, row.id));
          }
        }

        // 4. profile_group (composite PK (profile, group)). If the claimer is
        // already a member of this tribe, drop the anon membership; otherwise
        // repoint it (this adds the claimer to the tribe, keeping Member role).
        const [claimerMembership] = await tx
          .select({ profileId: profileGroupTable.profileId })
          .from(profileGroupTable)
          .where(
            and(
              eq(profileGroupTable.groupId, groupId),
              eq(profileGroupTable.profileId, claimerId),
            ),
          );

        if (claimerMembership) {
          await tx
            .delete(profileGroupTable)
            .where(
              and(
                eq(profileGroupTable.groupId, groupId),
                eq(profileGroupTable.profileId, anon.id),
              ),
            );
        } else {
          await tx
            .update(profileGroupTable)
            .set({ profileId: claimerId })
            .where(eq(profileGroupTable.profileId, anon.id));
        }

        // 5. Notifications previously addressed to the anon profile (none are
        // expected in practice, but satisfy the FK before deleting).
        await tx
          .update(notificationsTable)
          .set({ profileId: claimerId })
          .where(eq(notificationsTable.profileId, anon.id));

        // 6. Remove the anonymous profile.
        await tx
          .delete(profileTable)
          .where(
            and(
              eq(profileTable.id, anon.id),
              eq(profileTable.isAnonymous, true),
            ),
          );
      }

      // Resolve the request across every SuperAdmin's Inbox: mark all pending
      // claim_request notifications for this anon profile as read. This is the
      // single source of truth regardless of whether the response came from the
      // Inbox popover or the Settings row; the realtime channel propagates the
      // UPDATE to all open surfaces.
      await tx
        .update(notificationsTable)
        .set({ isRead: true })
        .where(
          and(
            eq(notificationsTable.type, "claim_request"),
            eq(notificationsTable.isRead, false),
            sql`${notificationsTable.data}->>'anon_profile_id' = ${anonProfileId}::text`,
          ),
        );

      // Notify the claimer of the outcome.
      await tx.insert(notificationsTable).values({
        type: "claim_result",
        isRead: false,
        profileId: claimerId,
        data: {
          tribeName: tribe?.name ?? "",
          tribeImageUrl: tribe?.image ?? "",
          groupId,
          outcome: decision,
          anon: {
            first_name: anon.firstName,
            last_name: anon.lastName,
            username: anon.username,
          },
        },
      });

      return {
        success: true as const,
        message: decision === "accept" ? "Claim approved" : "Claim rejected",
      };
    });

    if (result.success && decision === "accept") {
      updateTag(`tribe:${groupId}`);
      updateTag(`recent-games:${anonProfileId}`);
      updateTag(`recent-games:${claimerId}`);
      revalidatePath("/account");
    }

    return result;
  } catch (error) {
    console.error("Failed to respond to claim:", error);
    return { success: false, message: "Failed to process claim response" };
  }
}
