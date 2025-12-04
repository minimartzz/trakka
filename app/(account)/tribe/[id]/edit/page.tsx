import EditTribes from "@/components/tribes/EditTribes";
import { groupTable } from "@/db/schema/group";
import { profileTable } from "@/db/schema/profile";
import { profileGroupTable } from "@/db/schema/profileGroup";
import { db } from "@/utils/db";
import fetchUser from "@/utils/fetchServerUser";
import { eq } from "drizzle-orm";
import React from "react";

// Interfaces & Types
interface TribeDetailsInterface {
  group: typeof groupTable.$inferSelect;
  profile: typeof profileTable.$inferSelect | null;
}

interface TribeMemberInterface {
  profile_group: typeof profileGroupTable.$inferSelect;
  profile: typeof profileTable.$inferSelect | null;
}

interface Player {
  id: string;
  userId: number;
  name: string;
  username: string;
  role: number;
}

// Static DB calls
const getTribeMembers = async (groupId: string) => {
  const members = await db
    .select()
    .from(profileGroupTable)
    .leftJoin(profileTable, eq(profileGroupTable.profileId, profileTable.id))
    .where(eq(profileGroupTable.groupId, groupId));

  return members;
};

const getTribeDetails = async (groupId: string) => {
  const tribeDetails = await db
    .select()
    .from(groupTable)
    .leftJoin(profileTable, eq(groupTable.createdBy, profileTable.id))
    .where(eq(groupTable.id, groupId));

  return tribeDetails;
};

const Page = async ({ params }: { params: Promise<{ id: string }> }) => {
  const tribeId = (await params).id;
  const user = await fetchUser();

  // Get current players
  const tribeMembers: TribeMemberInterface[] = await getTribeMembers(tribeId);
  const players: Player[] = tribeMembers.map((member, idx) => ({
    id: idx.toString(),
    userId: member.profile!.id,
    name: `${member.profile!.firstName} (${member.profile!.username})`,
    username: member.profile!.username,
    role: member.profile_group.roleId,
  }));

  const tribeDetails: TribeDetailsInterface = (
    await getTribeDetails(tribeId)
  )[0];

  return (
    <div className="flex mt-8 justify-center w-full p-12">
      <EditTribes
        tribeId={tribeId}
        profilePic={tribeDetails.group.image!}
        groupName={tribeDetails.group.name}
        description={tribeDetails.group.description}
        playersDetails={players}
      />
    </div>
  );
};

export default Page;
