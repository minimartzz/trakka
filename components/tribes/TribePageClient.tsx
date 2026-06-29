"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import TribeHeader from "./TribeHeader";
import TribeTabs from "./TribeTabs";
import TribeHomeTab from "./TribeHomeTab";
import TabSkeleton from "./TabSkeleton";
import { buildGameList, getDefaultGame } from "./games/utils";
import {
  type GameSession,
  type TribeMember,
  type TribeAdmin,
  type HistStatsInterface,
} from "@/types/tribes";

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
  /**
   * Read-only mode for the public landing demo: forces all admin/edit
   * affordances off so the only interaction is switching between the 3 tabs.
   */
  readOnly?: boolean;
}

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
  readOnly = false,
}) => {
  // In read-only demo mode, suppress every admin affordance regardless of role.
  const showSuperAdmin = isSuperAdmin && !readOnly;
  const showAdmin = isAdmin && !readOnly;
  const [activeTab, setActiveTab] = useState("home");
  const [selectedGameId, setSelectedGameId] = useState<number | null>(() => {
    const gameList = buildGameList(sessions);
    return getDefaultGame(gameList)?.gameId ?? null;
  });

  const handleGameCardClick = (gameId: number) => {
    setSelectedGameId(gameId);
    setActiveTab("games");
  };

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
        isSuperAdmin={showSuperAdmin}
        isAdmin={showAdmin}
        userId={userId}
      />

      {/* Tabbed Content */}
      <TribeTabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
        homeContent={
          <TribeHomeTab
            sessions={sessions}
            memberCount={memberCount}
            currentUserId={userId}
            histStats={histStats}
            onGameCardClick={handleGameCardClick}
            canEditSessions={showSuperAdmin || showAdmin}
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
        gamesContent={
          <TribeGamesTab
            sessions={sessions}
            members={members}
            groupId={tribeId}
            currentUserId={userId}
            selectedGameId={selectedGameId}
            onSelectGame={setSelectedGameId}
            readOnly={readOnly}
          />
        }
      />
    </div>
  );
};

export default TribePageClient;