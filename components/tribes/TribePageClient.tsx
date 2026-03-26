"use client";

import dynamic from "next/dynamic";
import TribeHeader from "./TribeHeader";
import TribeTabs from "./TribeTabs";
import TribeHomeTab from "./TribeHomeTab";
import TabSkeleton from "./TabSkeleton";
import { type GameSession, type TribeMember, type TribeAdmin, type HistStatsInterface } from "@/types/tribes";

// Lazy load tab components that aren't immediately visible
const TribePlayersTab = dynamic(() => import("./TribePlayersTab"), {
  loading: () => <TabSkeleton />,
});

const TribeGamesTab = dynamic(() => import("./TribeGamesTab"), {
  loading: () => <TabSkeleton />,
});

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
  histStats: HistStatsInterface;
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
  histStats,
}) => {
  return (
    <div className="min-h-screen mb-20">
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
            histStats={histStats}
          />
        }
        playersContent={
          <TribePlayersTab
            members={members}
            sessions={sessions}
            histStats={histStats}
            userId={userId}
            groupId={tribeId}
          />
        }
        gamesContent={<TribeGamesTab sessions={sessions} />}
      />
    </div>
  );
};

export default TribePageClient;
