import { getAllPlayers } from "@/components/actions/fetchPlayers";
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

interface SelectablePlayers {
  profileId: number;
  firstName: string;
  lastName: string;
  username: string;
  profilePic?: string;
}

interface Player extends SelectablePlayers {
  id: string;
  roleId: number;
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
    profileId: member.profile!.id,
    firstName: member.profile!.firstName,
    lastName: member.profile!.lastName,
    username: member.profile!.username,
    roleId: member.profile_group.roleId,
  }));

  // Get selectable players
  const response = await getAllPlayers();
  const selectablePlayers: SelectablePlayers[] = response.data!;

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
        selectablePlayers={selectablePlayers}
        playersDetails={players}
      />
    </div>
  );
};

export default Page;
