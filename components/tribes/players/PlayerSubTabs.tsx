"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { Users, User, Swords } from "lucide-react";
import { GameSession } from "@/components/tribes/TribeHomeTab";
import { TribeMember } from "@/components/tribes/TribePlayersTab";
import { HistStatsInterface } from "@/components/tribes/TribePageClient";
import AllPlayersView from "./AllPlayersView";
import IndividualPlayerView from "./IndividualPlayerView";
import HeadToHeadView from "./HeadToHeadView";

type SubView = "all" | "individual" | "h2h";

interface PlayerSubTabsProps {
  members: TribeMember[];
  sessions: GameSession[];
  histStats: HistStatsInterface;
  userId: number;
  groupId: string;
}

const TABS: {
  key: SubView;
  label: string;
  shortLabel: string;
  icon: React.ElementType;
}[] = [
  { key: "individual", label: "Player Stats", shortLabel: "Stats", icon: User },
  { key: "h2h", label: "Head to Head", shortLabel: "H2H", icon: Swords },
  { key: "all", label: "All Players", shortLabel: "All", icon: Users },
];

const PlayerSubTabs: React.FC<PlayerSubTabsProps> = ({
  members,
  sessions,
  histStats,
  userId,
  groupId,
}) => {
  const [activeView, setActiveView] = useState<SubView>("individual");
  const [selectedPlayerId, setSelectedPlayerId] = useState<number | null>(null);

  const handlePlayerSelect = (profileId: number) => {
    setSelectedPlayerId(profileId);
    setActiveView("individual");
  };

  return (
    <div>
      {/* Segmented Control */}
      <div className="px-4 sm:px-6 pt-4 pb-2">
        <div className="flex bg-muted/50 rounded-xl p-1 gap-1">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeView === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveView(tab.key)}
                className={cn(
                  "flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-sm font-medium transition-all relative",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="playerSubTab"
                    className="absolute inset-0 bg-background rounded-lg shadow-sm"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <span className="relative flex items-center gap-1.5">
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                  <span className="sm:hidden">{tab.shortLabel}</span>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active View Content */}
      <motion.div
        key={activeView}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        {activeView === "all" && (
          <AllPlayersView
            members={members}
            sessions={sessions}
            histStats={histStats}
            onPlayerSelect={handlePlayerSelect}
          />
        )}
        {activeView === "individual" && (
          <IndividualPlayerView
            members={members}
            sessions={sessions}
            histStats={histStats}
            userId={userId}
            groupId={groupId}
            selectedPlayerId={selectedPlayerId}
            onPlayerChange={setSelectedPlayerId}
          />
        )}
        {activeView === "h2h" && (
          <HeadToHeadView
            members={members}
            sessions={sessions}
            histStats={histStats}
            userId={userId}
            groupId={groupId}
          />
        )}
      </motion.div>
    </div>
  );
};

export default PlayerSubTabs;
