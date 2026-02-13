"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { motion } from "motion/react";
import { Crown, Users, Trophy, Dices, TrendingUp } from "lucide-react";

export interface TribeMember {
  profileId: number;
  username: string;
  firstName: string;
  lastName: string;
  image: string | null;
  roleId: number;
  gamesPlayed: number;
  wins: number;
  winRate: number;
}

interface TribePlayersTabProps {
  members: TribeMember[];
}

/**
 * TribePlayersTab - Displays all tribe members with their statistics
 *
 * Design decisions:
 * - Card grid layout for visual appeal and easy scanning
 * - Role badges (Admin/Member) for clear hierarchy
 * - Mini stat bars show performance at a glance
 * - Sorted by games played to highlight active members
 * - Avatar with name creates personal connection
 * - Staggered animations create engaging load experience
 * - Responsive grid adapts to screen size
 */
const TribePlayersTab: React.FC<TribePlayersTabProps> = ({ members }) => {
  // Sort by games played descending
  const sortedMembers = [...members].sort(
    (a, b) => b.gamesPlayed - a.gamesPlayed,
  );

  const getRoleBadge = (roleId: number) => {
    if (roleId === 1) {
      return (
        <Badge
          variant="default"
          className="bg-amber-500 hover:bg-amber-600 text-white"
        >
          <Crown className="w-3 h-3 mr-1" />
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

  return (
    <div className="p-4 sm:p-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex items-center justify-between mb-6"
      >
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold">Tribe Members</h2>
          <Badge variant="outline" className="ml-2">
            {members.length} total
          </Badge>
        </div>
      </motion.div>

      {/* Members Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {sortedMembers.map((member, index) => (
          <motion.div
            key={member.profileId}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
          >
            <Card className="h-full hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
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
                  <div className="flex-1 min-w-0">
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
                  <div className="p-2 rounded-lg bg-muted/50">
                    <Dices className="w-4 h-4 mx-auto mb-1 text-primary" />
                    <p className="text-lg font-bold">{member.gamesPlayed}</p>
                    <p className="text-xs text-muted-foreground">Games</p>
                  </div>
                  <div className="p-2 rounded-lg bg-muted/50">
                    <Trophy className="w-4 h-4 mx-auto mb-1 text-amber-500" />
                    <p className="text-lg font-bold">{member.wins}</p>
                    <p className="text-xs text-muted-foreground">Wins</p>
                  </div>
                  <div className="p-2 rounded-lg bg-muted/50">
                    <TrendingUp className="w-4 h-4 mx-auto mb-1 text-accent-1" />
                    <p
                      className={cn(
                        "text-lg font-bold",
                        member.winRate >= 50
                          ? "text-accent-1"
                          : "text-destructive",
                      )}
                    >
                      {member.winRate}%
                    </p>
                    <p className="text-xs text-muted-foreground">Win %</p>
                  </div>
                </div>

                {/* Win rate progress bar */}
                <div className="mt-3">
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <motion.div
                      className={cn(
                        "h-full rounded-full",
                        member.winRate >= 50
                          ? "bg-gradient-to-r from-accent-1 to-accent-2"
                          : "bg-gradient-to-r from-destructive/80 to-destructive",
                      )}
                      initial={{ width: 0 }}
                      animate={{ width: `${member.winRate}%` }}
                      transition={{ duration: 0.5, delay: index * 0.05 + 0.3 }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Empty state */}
      {members.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
            <Users className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium mb-2">No Members Yet</h3>
          <p className="text-muted-foreground">
            Invite friends to join your tribe!
          </p>
        </motion.div>
      )}
    </div>
  );
};

export default TribePlayersTab;
