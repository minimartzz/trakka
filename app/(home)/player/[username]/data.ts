import { profileTable } from "@/db/schema/profile";
import { db } from "@/utils/db";
import { eq } from "drizzle-orm";
import { cache } from "react";

// Who the public player page is about. Uncached on purpose: visibility must
// take effect on the next request after the owner flips it. React's cache()
// shares the one lookup between generateMetadata and the page.
export const getPlayerProfile = cache(async (username: string) => {
  const [row] = await db
    .select({
      id: profileTable.id,
      uuid: profileTable.uuid,
      firstName: profileTable.firstName,
      lastName: profileTable.lastName,
      username: profileTable.username,
      image: profileTable.image,
      isAnonymous: profileTable.isAnonymous,
      isPublic: profileTable.isPublic,
      // Joined Trakka once onboarding was finished
      joinedAt: profileTable.onboardingCompletedAt,
    })
    .from(profileTable)
    .where(eq(profileTable.username, username));

  // Anonymous players are placeholders until claimed: they have no page
  return row && !row.isAnonymous ? row : null;
});

export type PlayerProfile = NonNullable<
  Awaited<ReturnType<typeof getPlayerProfile>>
>;
