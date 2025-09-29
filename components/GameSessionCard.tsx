import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { CombinedRecentGames } from "@/lib/interfaces";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Trophy, User } from "lucide-react";
import Image from "next/image";
import React from "react";

interface GameSessionsCardProps {
  userId: number;
  session: CombinedRecentGames;
}

const GameSessionCard: React.FC<GameSessionsCardProps> = ({
  userId,
  session: {
    sessionId,
    gameTitle,
    isPlayer,
    isWinner,
    isLoser,
    isTied,
    players,
  },
}) => {
  const getResultsBadge = () => {
    // Results badge
    const getVariantAndColour = () => {
      if (isPlayer && !isTied && isWinner) {
        return {
          variant: "default" as const,
          className:
            "bg-green-600 hover:bg-green-700 text-white rounded-full font-semibold",
          result: "Won",
        };
      } else if (isPlayer && isTied && isWinner) {
        return {
          variant: "secondary" as const,
          className:
            "bg-orange-500 hover:bg-orange-600 text-white rounded-full font-semibold",
          result: "Tied",
        };
      } else if (isPlayer && isLoser) {
        return {
          variant: "destructive" as const,
          className: "rounded-full font-semibold",
          result: "Lost",
        };
      } else {
        return {
          variant: "secondary" as const,
          className:
            "bg-gray-500 hover:bg-gray-600 text-white rounded-full font-semibold",
          result: "Not Involved",
        };
      }
    };

    const { variant, className, result } = getVariantAndColour();
    return (
      <Badge variant={variant} className={className}>
        <Trophy className="h-3 w-3 mr-1" />
        {result}
      </Badge>
    );
  };

  // Formatting date
  const formatGameDate = (dateString: string) => {
    return format(new Date(dateString), "dd MMM yyyy");
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="px-6">
        {/* Header */}
        <div className="flex item-start justify-between mb-4">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold truncate mb-1">{gameTitle}</h3>
            <div className="text-sm text-muted-foreground">
              {formatGameDate(players[0].datePlayed)}
            </div>
          </div>
          <div className="ml-4 flex-shrink-0">{getResultsBadge()}</div>
        </div>

        {/* Standings Table */}
        <div className="w-full">
          <ul className="divide-y divide-border/50">
            {players.map((player, index) => (
              <li
                key={player.id}
                className={cn(
                  "flex items-center justify-between py-2.5 px-1 text-sm",
                  player.profileId === userId && "bg-accent/20 rounded-sm",
                  index % 2 === 0 ? "bg-muted/20" : "bg-background"
                )}
              >
                {/* Rank column - fixed Width */}
                <div className="w-10 text-center">
                  <span className="text-sm font-medium text-muted-foreground">
                    {player.position}
                  </span>
                </div>

                {/* Player icon column - fixed width */}
                <div className="hidden sm:flex justify-center w-[20px] h-[20px] overflow-hidden">
                  {player.profilePic ? (
                    <Image
                      src={player.profilePic}
                      alt="player profile pic"
                      height={20}
                      width={20}
                      className="rounded-full"
                    />
                  ) : (
                    <User
                      className={cn(
                        "h-3 w-3 flex-shrink-0",
                        player.profileId === userId
                          ? "text-blue-600"
                          : "text-gray-400"
                      )}
                    />
                  )}
                </div>

                {/* Player names */}
                <div className="flex-1 min-w-0 text-left ml-2 items-center">
                  <span
                    className={cn(
                      "text-sm font-medium text-foreground truncate block",
                      player.profileId === userId &&
                        "font-semibold text-blue-600"
                    )}
                  >
                    {player.firstName}
                    <span className="hidden sm:inline ml-2 text-gray-400">{`(${player.username})`}</span>
                  </span>
                </div>

                {/* Status for high score */}

                {/* Status for winners and ties */}
                <div className="hidden sm:flex items-center justify-center min-w-0 w-20 gap-2">
                  {player.isWinner && (
                    <div>
                      <Badge
                        variant="outline"
                        className="text-xs font-semibold px-2 py-0.5 border-green-200 text-green-700 bg-green-50"
                      >
                        Winner
                      </Badge>
                    </div>
                  )}
                  {player.isTie && (
                    <Badge
                      variant="outline"
                      className="text-xs font-semibold px-2 py-0.5 border-orange-200 text-orange-700 bg-orange-50"
                    >
                      Tied
                    </Badge>
                  )}
                </div>
                {/* Mobile: Display */}
                <div className="sm:hidden flex items-center justify-center min-w-0">
                  {player.isWinner && <p>🏆</p>}
                  {player.isTie && <p>🪢</p>}
                </div>

                {/* Score aligned right */}
                <div className="text-sm font-medium text-right flex-shrink-0 w-16 mr-4">
                  {player.victoryPoints !== null ? player.victoryPoints : "—"}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default GameSessionCard;
