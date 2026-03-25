"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { motion } from "motion/react";
import {
  Crown,
  Users,
  Trophy,
  Dices,
  TrendingUp,
  Shield,
  Search,
  X,
} from "lucide-react";
import {
  type GameSession,
  type TribeMember,
  type HistStatsInterface,
} from "@/types/tribes";
import { calculateBadges, BadgeInfo } from "@/utils/playerStatsCalculations";
import PlayerBadge from "./PlayerBadge";

interface AllPlayersViewProps {
  members: TribeMember[];
  sessions: GameSession[];
  histStats: HistStatsInterface;
  onPlayerSelect: (profileId: number) => void;
}

const getRoleBadge = (roleId: number) => {
  if (roleId === 1) {
    return (
      <Badge
        variant="default"
        className="bg-accent-5 hover:bg-accent-5/90 text-white"
      >
        <Crown className="w-3 h-3 mr-1 fill-white" />
        SuperAdmin
      </Badge>
    );
  }
  if (roleId === 2) {
    return (
      <Badge
        variant="default"
        className="bg-accent-2 hover:bg-accent-2/90 text-white"
      >
        <Shield className="w-3 h-3 mr-1 fill-white" />
        Admin
      </Badge>
    );
  }
  return (
    <Badge variant="secondary">
      <Users className="w-3 h-3 mr-1" />
      Member
    </Badge>
  );
};

const AllPlayersView: React.FC<AllPlayersViewProps> = ({
  members,
  sessions,
  histStats,
  onPlayerSelect,
}) => {
  const [searchQuery, setSearchQuery] = useState("");

  // Calculate badges
  const badgeMap = useMemo(
    () => calculateBadges(sessions, members, histStats.rollingStats),
    [sessions, members, histStats.rollingStats],
  );

  // Filter members by search query
  const filteredMembers = useMemo(() => {
    const sorted = [...members].sort((a, b) => b.gamesPlayed - a.gamesPlayed);
    if (!searchQuery) return sorted;

    const q = searchQuery.toLowerCase();
    return sorted.filter(
      (m) =>
        m.username.toLowerCase().includes(q) ||
        m.firstName.toLowerCase().includes(q) ||
        m.lastName.toLowerCase().includes(q),
    );
  }, [members, searchQuery]);

  // Get all badges for a member
  const getMemberBadges = (profileId: number): BadgeInfo[] => {
    return badgeMap.get(profileId) || [];
  };

  return (
    <div className="p-4 sm:p-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex items-center justify-between mb-4"
      >
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold">Tribe Members</h2>
          <Badge variant="outline" className="ml-2">
            {members.length} total
          </Badge>
        </div>
      </motion.div>

      {/* Search bar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.05 }}
        className="mb-5"
      >
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name or username..."
            className="w-full pl-9 pr-9 py-2.5 text-sm rounded-lg border bg-background outline-none focus:ring-2 focus:ring-primary/20 transition-shadow placeholder:text-muted-foreground"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              <X className="w-4 h-4 text-muted-foreground hover:text-foreground" />
            </button>
          )}
        </div>
        {searchQuery && (
          <p className="text-xs text-muted-foreground mt-1.5 ml-1">
            {filteredMembers.length} result
            {filteredMembers.length !== 1 ? "s" : ""}
          </p>
        )}
      </motion.div>

      {/* Members Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredMembers.map((member, index) => {
          const badges = getMemberBadges(member.profileId);
          return (
            <motion.div
              key={member.profileId}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <Card
                className="h-full hover:shadow-lg transition-all cursor-pointer hover:border-primary/20 active:scale-[0.98]"
                onClick={() => onPlayerSelect(member.profileId)}
              >
                <CardHeader className="pb-3 relative">
                  {/* Badge icons (top-right) */}
                  {badges.length > 0 && (
                    <div className="absolute top-3 right-3 flex gap-1">
                      {badges.map((badge) => (
                        <PlayerBadge key={badge.type} badge={badge} size="sm" />
                      ))}
                    </div>
                  )}

                  <div className="flex items-start gap-3">
                    <Avatar className="w-14 h-14 ring-2 ring-background shadow-md">
                      <AvatarImage
                        src={member.image || ""}
                        alt={member.username}
                        className="object-cover"
                      />
                      <AvatarFallback className="bg-primary/10 text-primary text-lg font-semibold">
                        {member.firstName[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0 pr-8">
                      <CardTitle className="text-base truncate">
                        {member.firstName} {member.lastName}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground truncate">
                        @{member.username}
                      </p>
                      <div className="mt-1">{getRoleBadge(member.roleId)}</div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  {/* Stats grid */}
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-2 rounded-lg bg-muted-foreground/15 dark:bg-muted/50">
                      <Dices className="w-4 h-4 mx-auto mb-1 text-primary" />
                      <p className="text-lg font-bold">{member.gamesPlayed}</p>
                      <p className="text-xs text-muted-foreground">Games</p>
                    </div>
                    <div className="p-2 rounded-lg bg-muted-foreground/15 dark:bg-muted/50">
                      <Trophy className="w-4 h-4 mx-auto mb-1 text-amber-500" />
                      <p className="text-lg font-bold">{member.wins}</p>
                      <p className="text-xs text-muted-foreground">Wins</p>
                    </div>
                    <div className="p-2 rounded-lg bg-muted-foreground/15 dark:bg-muted/50">
                      <TrendingUp className="w-4 h-4 mx-auto mb-1 text-accent-1" />
                      <p className="text-lg font-bold tabular-nums">
                        {(() => {
                          const rs = histStats.rollingStats.find(
                            (s) => s.profileId === member.profileId,
                          );
                          return rs && rs.sessionsPlayed > 0
                            ? (rs.rollingScore / rs.sessionsPlayed).toFixed(2)
                            : "0.00";
                        })()}
                      </p>
                      <p className="text-xs text-muted-foreground">WPA</p>
                    </div>
                  </div>

                  {/* Win rate bar */}
                  <div className="mt-3">
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden mb-2">
                      <motion.div
                        className={cn(
                          "h-full rounded-full",
                          member.winRate < 33
                            ? "bg-red-500"
                            : member.winRate <= 66
                              ? "bg-yellow-500"
                              : "bg-green-500",
                        )}
                        initial={{ width: 0 }}
                        animate={{ width: `${member.winRate}%` }}
                        transition={{
                          duration: 0.5,
                          delay: index * 0.05 + 0.3,
                        }}
                      />
                    </div>
                    <p
                      className={cn(
                        "text-sm font-bold",
                        member.winRate < 33
                          ? "text-red-500"
                          : member.winRate <= 66
                            ? "text-yellow-500"
                            : "text-green-500",
                      )}
                    >
                      {`${member.winRate}%`}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Empty state */}
      {filteredMembers.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
            {searchQuery ? (
              <Search className="w-8 h-8 text-muted-foreground" />
            ) : (
              <Users className="w-8 h-8 text-muted-foreground" />
            )}
          </div>
          <h3 className="text-lg font-medium mb-2">
            {searchQuery ? "No Results" : "No Members Yet"}
          </h3>
          <p className="text-muted-foreground">
            {searchQuery
              ? "Try a different search term"
              : "Invite friends to join your tribe!"}
          </p>
        </motion.div>
      )}
    </div>
  );
};

export default AllPlayersView;
