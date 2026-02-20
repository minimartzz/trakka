import { groupTable, SelectGroup } from "@/db/schema/group";
import { profileTable, SelectProfile } from "@/db/schema/profile";
import { profileGroupTable } from "@/db/schema/profileGroup";
import { compGameLogTable } from "@/db/schema/compGameLog";
import fetchUser from "@/utils/fetchServerUser";
import { format } from "date-fns";
import TribePageClient from "@/components/tribes/TribePageClient";
import { GameSession } from "@/components/tribes/TribeHomeTab";
import { TribeMember } from "@/components/tribes/TribePlayersTab";
import {
  processGameSessions,
  processMembersWithStats,
  TribeMemberInterface,
} from "@/utils/tribesProcessing";
import {
  getTribeDetails,
  getTribeGameSessions,
  getTribeMembers,
} from "@/app/(account)/tribe/[id]/action";
import { notFound } from "next/navigation";

// Revalidate page every 60 seconds for ISR caching
export const revalidate = 60;

// Interfaces & Types
interface TribeDetailsInterface {
  group: SelectGroup;
  profile: SelectProfile | null;
}

// Formatting functions
const formatDate = (dateStr: string): string => {
  return format(new Date(dateStr), "dd MMM yyyy");
};

const Page = async ({ params }: { params: Promise<{ id: string }> }) => {
  const tribeId = (await params).id;

  // Fetch user and tribe data in parallel for better performance
  const [user, tribeMembers, tribeDetailsArray, gameLogsRaw] = await Promise.all([
    fetchUser(),
    getTribeMembers(tribeId),
    getTribeDetails(tribeId),
    getTribeGameSessions(tribeId),
  ]);

  const tribeDetails: TribeDetailsInterface = tribeDetailsArray[0];
  if (!tribeDetails) {
    notFound();
  }

  // Process game sessions
  const sessions = processGameSessions(gameLogsRaw);

  // User role
  const userMembership = tribeMembers.find(
    (tribeMember) => tribeMember.profileGroup.profileId === user.id,
  );
  const roleId = userMembership?.profileGroup.roleId || 0;
  const isSuperAdmin = roleId === 1;
  const isAdmin = roleId === 2;

  // Get tribe admins
  const tribeAdmins = tribeMembers
    .filter((tribeMember) => tribeMember.profileGroup.roleId === 1)
    .map((admin) => ({
      profileGroup: {
        id: admin.profileGroup.id,
        profileId: admin.profileGroup.profileId,
        groupId: admin.profileGroup.groupId,
        roleId: admin.profileGroup.roleId,
      },
      profile: admin.profile
        ? {
            id: admin.profile.id,
            username: admin.profile.username,
            firstName: admin.profile.firstName,
            lastName: admin.profile.lastName,
            image: admin.profile.image,
          }
        : null,
    }));

  // Process members with stats
  const membersWithStats = processMembersWithStats(tribeMembers, sessions);

  return (
    <TribePageClient
      tribeId={tribeId}
      tribeName={tribeDetails.group.name}
      tribeImage={tribeDetails.group.image!}
      tribeDescription={tribeDetails.group.description || "No description"}
      dateFormed={formatDate(tribeDetails.group.dateCreated)}
      memberCount={tribeMembers.length}
      gamesPlayed={sessions.length}
      creatorUsername={tribeDetails.profile?.username || "Unknown"}
      admins={tribeAdmins}
      isSuperAdmin={isSuperAdmin}
      isAdmin={isAdmin}
      userId={user.id}
      members={membersWithStats}
      sessions={sessions}
    />
  );
};

export default Page;
