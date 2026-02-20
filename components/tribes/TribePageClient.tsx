"use client";

import dynamic from "next/dynamic";
import TribeHeader from "./TribeHeader";
import TribeTabs from "./TribeTabs";
import TribeHomeTab, { GameSession } from "./TribeHomeTab";
import { TribeMember } from "./TribePlayersTab";
import TabSkeleton from "./TabSkeleton";

// Lazy load tab components that aren't immediately visible
const TribePlayersTab = dynamic(() => import("./TribePlayersTab"), {
  loading: () => <TabSkeleton />,
});

const TribeGamesTab = dynamic(() => import("./TribeGamesTab"), {
  loading: () => <TabSkeleton />,
});

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
