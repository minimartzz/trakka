import { profileTable } from "@/db/schema/profile";
import { db } from "@/utils/db";
import { getCallerProfileRow } from "@/utils/fetchServerUser";
import { eq } from "drizzle-orm";

// A player's stats are readable by the player themselves, or by anyone while
// their profile is public. Guards actions that take a profile id from the
// browser, so a private profile's sessions can't be fetched by id.
export async function canViewProfileStats(profileId: number) {
  const caller = await getCallerProfileRow();
  if (caller?.id === profileId) return true;

  const [profile] = await db
    .select({
      isPublic: profileTable.isPublic,
      isAnonymous: profileTable.isAnonymous,
    })
    .from(profileTable)
    .where(eq(profileTable.id, profileId));

  return Boolean(profile?.isPublic && !profile.isAnonymous);
}
