import { SelectGroup } from "@/db/schema/group";
import { SelectProfile } from "@/db/schema/profile";
import { format } from "date-fns";
import TribePageClient from "@/components/tribes/TribePageClient";
import {
  processGameSessions,
  processMembersWithStats,
} from "@/utils/tribesProcessing";
import {
  getTribeMembersCached,
  getTribeDetailsCached,
  getTribeGameSessionsCached,
  getRollingPlayerStatsByGroupCached,
  getDailyPlayerStatsByGroupCached,
  getMonthlyPlayerStatsByGroupCached,
} from "@/app/(account)/tribe/[id]/data";

interface TribeDetailsInterface {
  group: SelectGroup;
  profile: SelectProfile | null;
}

const formatDate = (dateStr: string): string =>
  format(new Date(dateStr), "dd MMM yyyy");

/**
 * Read-only, unauthenticated render of a tribe page for the landing demo.
 * Mirrors the processing in app/(account)/tribe/[id]/page.tsx but calls the
 * cached (auth-free) data functions directly and forces readOnly so the only
 * interaction is switching between the Home / Players / Games tabs.
 */
const TribeDemo = async ({
  tribeId,
  name,
}: {
  tribeId: string;
  name: string;
}) => {
  let content: React.ReactNode = null;

  try {
    const [
      tribeMembers,
      tribeDetailsArray,
      gameLogsRaw,
      rollingStats,
      dailyPlayerStats,
      monthlyPlayerStats,
    ] = await Promise.all([
      getTribeMembersCached(tribeId),
      getTribeDetailsCached(tribeId),
      getTribeGameSessionsCached(tribeId),
      getRollingPlayerStatsByGroupCached(tribeId),
      getDailyPlayerStatsByGroupCached(tribeId),
      getMonthlyPlayerStatsByGroupCached(tribeId),
    ]);

    const tribeDetails = tribeDetailsArray[0] as
      | TribeDetailsInterface
      | undefined;
    if (!tribeDetails) return null;

    const histStats = { rollingStats, dailyPlayerStats, monthlyPlayerStats };
    const sessions = processGameSessions(gameLogsRaw);
    const membersWithStats = processMembersWithStats(tribeMembers, sessions);

    // Demo viewer is a neutral observer — no membership, no admin rights.
    const tribeAdmins = tribeMembers
      .filter((m) => m.profileGroup.roleId === 1)
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

    content = (
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
        isSuperAdmin={false}
        isAdmin={false}
        userId={-1}
        members={membersWithStats}
        sessions={sessions}
        histStats={histStats}
        readOnly
      />
    );
  } catch (error) {
    console.error(`Failed to load tribe demo ${tribeId}`, error);
    return null;
  }

  return content;
};

export default TribeDemo;
