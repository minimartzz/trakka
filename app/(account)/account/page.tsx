import AccountPageClient from "@/components/account/AccountPageClient";
import AccountPageSkeleton from "@/components/account/AccountPageSkeleton";
import { groupTable } from "@/db/schema/group";
import { profileGroupTable } from "@/db/schema/profileGroup";
import { rollingPlayerStatsTable } from "@/db/schema/rollingPlayerStats";
import { db } from "@/utils/db";
import fetchUser from "@/utils/fetchServerUser";
import { format } from "date-fns";
import { and, eq } from "drizzle-orm";
import { Suspense } from "react";

const formatDate = (dateStr: string): string => {
  return format(new Date(dateStr), "dd MMM yyyy");
};

const GENERIC_IMAGE_URL = `https://${process.env.NEXT_PUBLIC_SUPABASE_HEADER}/storage/v1/object/public/images/avatars/generic_profile.png`;

const getTribesForAccount = async (profileId: number) => {
  const rows = await db
    .select({
      id: groupTable.id,
      name: groupTable.name,
      image: groupTable.image,
      roleId: profileGroupTable.roleId,
      sessionsPlayed: rollingPlayerStatsTable.sessionsPlayed,
    })
    .from(profileGroupTable)
    .innerJoin(groupTable, eq(profileGroupTable.groupId, groupTable.id))
    .leftJoin(
      rollingPlayerStatsTable,
      and(
        eq(rollingPlayerStatsTable.groupId, groupTable.id),
        eq(rollingPlayerStatsTable.profileId, profileId),
      ),
    )
    .where(eq(profileGroupTable.profileId, profileId));

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    image: row.image,
    roleId: row.roleId,
    sessionsPlayed: row.sessionsPlayed ?? 0,
  }));
};

const AccountContent = async () => {
  const user = await fetchUser();
  const tribes = await getTribesForAccount(user.id);

  return (
    <AccountPageClient
      user={{
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        username: user.username,
        email: user.email,
        gender: user.gender,
        description: user.description,
        image: user.image,
      }}
      memberSince={formatDate(user.confirmed_at)}
      tribes={tribes}
      defaultImageUrl={GENERIC_IMAGE_URL}
    />
  );
};

const Page = () => {
  return (
    <Suspense fallback={<AccountPageSkeleton />}>
      <AccountContent />
    </Suspense>
  );
};

export default Page;
