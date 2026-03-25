"use client";

import { GameSession } from "@/components/tribes/TribeHomeTab";
import { HistStatsInterface } from "@/components/tribes/TribePageClient";
import PlayerSubTabs from "@/components/tribes/players/PlayerSubTabs";

export interface TribeMember {
  profileId: number;
  username: string;
  firstName: string;
  lastName: string;
  image: string | null;
  roleId: number;
  joinedAt: string | null;
  gamesPlayed: number;
  wins: number;
  winRate: number;
}

interface TribePlayersTabProps {
  members: TribeMember[];
  sessions: GameSession[];
  histStats: HistStatsInterface;
  userId: number;
  groupId: string;
}

const TribePlayersTab: React.FC<TribePlayersTabProps> = ({
  members,
  sessions,
  histStats,
  userId,
  groupId,
}) => {
  return (
    <PlayerSubTabs
      members={members}
      sessions={sessions}
      histStats={histStats}
      userId={userId}
      groupId={groupId}
    />
  );
};

export default TribePlayersTab;
