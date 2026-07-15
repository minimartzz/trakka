import { groupTable } from "@/db/schema/group";
import { profileGroupTable } from "@/db/schema/profileGroup";
import { profileTable } from "@/db/schema/profile";
import { rollingPlayerStatsTable } from "@/db/schema/rollingPlayerStats";
import { db } from "@/utils/db";
import { and, asc, eq } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";

// Plain uncached reads: this page is mutation-heavy and refreshes via
// router.refresh(), so freshness beats caching here.

export async function getSettingsTribe(groupId: string) {
  const [tribe] = await db
    .select({
      id: groupTable.id,
      name: groupTable.name,
      description: groupTable.description,
      image: groupTable.image,
    })
    .from(groupTable)
    .where(eq(groupTable.id, groupId));

  return tribe ?? null;
}

export async function getSettingsMembers(groupId: string) {
  return db
    .select({
      profileId: profileTable.id,
      firstName: profileTable.firstName,
      lastName: profileTable.lastName,
      username: profileTable.username,
      profilePic: profileTable.image,
      isAnonymous: profileTable.isAnonymous,
      roleId: profileGroupTable.roleId,
      sessionsPlayed: rollingPlayerStatsTable.sessionsPlayed,
    })
    .from(profileGroupTable)
    .innerJoin(profileTable, eq(profileGroupTable.profileId, profileTable.id))
    .leftJoin(
      rollingPlayerStatsTable,
      and(
        eq(rollingPlayerStatsTable.profileId, profileTable.id),
        eq(rollingPlayerStatsTable.groupId, groupId),
      ),
    )
    .where(eq(profileGroupTable.groupId, groupId))
    .orderBy(asc(profileGroupTable.roleId), asc(profileTable.firstName));
}

// Includes claim codes: only call after requireTribeSuperAdmin has passed.
export async function getAnonymousMembers(groupId: string) {
  // Aliased self-join to the profile of whoever currently has a pending claim
  // on this anonymous player (null when no one is claiming).
  const claimerProfile = alias(profileTable, "claimerProfile");

  return db
    .select({
      profileId: profileTable.id,
      firstName: profileTable.firstName,
      lastName: profileTable.lastName,
      username: profileTable.username,
      profilePic: profileTable.image,
      claimCode: profileTable.claimCode,
      sessionsPlayed: rollingPlayerStatsTable.sessionsPlayed,
      claimerId: claimerProfile.id,
      claimerFirstName: claimerProfile.firstName,
      claimerLastName: claimerProfile.lastName,
      claimerUsername: claimerProfile.username,
    })
    .from(profileGroupTable)
    .innerJoin(profileTable, eq(profileGroupTable.profileId, profileTable.id))
    .leftJoin(
      rollingPlayerStatsTable,
      and(
        eq(rollingPlayerStatsTable.profileId, profileTable.id),
        eq(rollingPlayerStatsTable.groupId, groupId),
      ),
    )
    .leftJoin(
      claimerProfile,
      eq(claimerProfile.id, profileTable.claimRequestedBy),
    )
    .where(
      and(
        eq(profileGroupTable.groupId, groupId),
        eq(profileTable.isAnonymous, true),
      ),
    )
    .orderBy(asc(profileTable.firstName));
}

export type SettingsTribe = NonNullable<
  Awaited<ReturnType<typeof getSettingsTribe>>
>;
export type SettingsMember = Awaited<
  ReturnType<typeof getSettingsMembers>
>[number];
export type AnonymousMember = Awaited<
  ReturnType<typeof getAnonymousMembers>
>[number];
