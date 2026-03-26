"use client";

import PlayerSubTabs from "@/components/tribes/players/PlayerSubTabs";
import { type GameSession, type TribeMember, type HistStatsInterface } from "@/types/tribes";

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
