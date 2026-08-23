import { cache } from "react";
import { and, eq } from "drizzle-orm";
import { db } from "@/utils/db";
import { profileGroupTable } from "@/db/schema/profileGroup";
import { getCallerProfileRow } from "@/utils/fetchServerUser";
import { getAuthUser } from "@/utils/supabase/server";

export const requireAuth = cache(async () => {
  const user = await getAuthUser();
  if (!user) throw new Error("Unauthorized");
  return user;
});

export const requireTribeMembership = cache(async (groupId: string) => {
  const user = await requireAuth();

  const callerProfile = await getCallerProfileRow();
  if (!callerProfile) throw new Error("Unauthorized");

  const [membership] = await db
    .select({ roleId: profileGroupTable.roleId })
    .from(profileGroupTable)
    .where(
      and(
        eq(profileGroupTable.groupId, groupId),
        eq(profileGroupTable.profileId, callerProfile.id),
      ),
    );
  if (!membership) throw new Error("Forbidden");

  return { user, profileId: callerProfile.id, roleId: membership.roleId };
});

export const requireTribeAdmin = cache(async (groupId: string) => {
  const membership = await requireTribeMembership(groupId);
  if (![1, 2].includes(membership.roleId)) throw new Error("Forbidden");
  return membership;
});

export const requireTribeSuperAdmin = cache(async (groupId: string) => {
  const membership = await requireTribeMembership(groupId);
  if (membership.roleId !== 1) throw new Error("Forbidden");
  return membership;
});
