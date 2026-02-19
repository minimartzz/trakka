"use client";

import TribeHeader from "./TribeHeader";
import TribeTabs from "./TribeTabs";
import TribeHomeTab, { GameSession } from "./TribeHomeTab";
import TribePlayersTab, { TribeMember } from "./TribePlayersTab";
import TribeGamesTab from "./TribeGamesTab";

interface TribeAdmin {
  profileGroup: {
    id: number;
    profileId: number;
    groupId: string;
    roleId: number;
  };
  profile: {
    id: number;
    username: string;
    firstName: string;
    lastName: string;
    image: string | null;
  } | null;
}

interface TribePageClientProps {
  tribeId: string;
  tribeName: string;
  tribeImage: string;
  tribeDescription: string;
  dateFormed: string;
  memberCount: number;
  gamesPlayed: number;
  creatorUsername: string;
  admins: TribeAdmin[];
  isSuperAdmin: boolean;
  isAdmin: boolean;
  userId: number;
  members: TribeMember[];
  sessions: GameSession[];
}

/**
 * TribePageClient - Renders tribe information
 *
 * This component orchestrates all the tribe page sections:
 * - TribeHeader: Modern header with tribe info and admin controls
 * - TribeTabs: Tab navigation for Home/Players/Games
 * - TribeHomeTab: Dashboard with stats and leaderboards
 * - TribePlayersTab: Member cards with statistics
 * - TribeGamesTab: Game history timeline
 */
const TribePageClient: React.FC<TribePageClientProps> = ({
  tribeId,
  tribeName,
  tribeImage,
  tribeDescription,
  dateFormed,
  memberCount,
  gamesPlayed,
  creatorUsername,
  admins,
  isSuperAdmin,
  isAdmin,
  userId,
  members,
  sessions,
}) => {
  return (
    <div className="min-h-screen">
      {/* Tribe Header */}
      <TribeHeader
        tribeId={tribeId}
        tribeName={tribeName}
        tribeImage={tribeImage}
        tribeDescription={tribeDescription}
        dateFormed={dateFormed}
        memberCount={memberCount}
        gamesPlayed={gamesPlayed}
        creatorUsername={creatorUsername}
        admins={admins}
        isSuperAdmin={isSuperAdmin}
        isAdmin={isAdmin}
        userId={userId}
      />

      {/* Tabbed Content */}
      <TribeTabs
        homeContent={
          <TribeHomeTab
            sessions={sessions}
            memberCount={memberCount}
            currentUserId={userId}
          />
        }
        playersContent={<TribePlayersTab members={members} />}
        gamesContent={<TribeGamesTab sessions={sessions} />}
      />
    </div>
  );
};

export default TribePageClient;
