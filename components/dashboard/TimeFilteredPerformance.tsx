"use client";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import React, { useEffect, useMemo, useState } from "react";
import DateRangePicker from "./DateRangePicker";
import { DateRange } from "react-day-picker";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import MeepleIcon from "../icons/MeepleIcon";
import { Medal, Trophy, Users, Weight } from "lucide-react";
import { topGames, topOpponents } from "@/utils/dashboardProcessing";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { GroupedSession, SessionDataInterface } from "@/lib/interfaces";
import {
  format,
  isWithinInterval,
  endOfDay,
  subMonths,
  subYears,
} from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { positionOrdinalSuffix } from "@/utils/recordsProcessing";

interface TimeFilteredPerformanceProps {
  userId: number;
  recentActivity: GroupedSession[];
  sessions: SessionDataInterface[];
}

interface MetricCardProps {
  title: string;
  Icon: React.ComponentType<any>;
  value: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ title, Icon, value }) => {
  return (
    <Card className="w-full">
      <CardHeader className="flex justify-between items-center">
        <CardTitle>{title}</CardTitle>
        <Icon className="w-6 h-6 stroke-black dark:stroke-white" />
      </CardHeader>
      <CardContent className="text-3xl font-bold">{value}</CardContent>
    </Card>
  );
};

interface RecentActivityCardProps {
  title: string;
  userId: number;
  players: {
    username: string;
    profilePic: string;
    isWinner: boolean | null;
    profileId: number;
    position: number | null;
  }[];
  date: string;
  isWinner: boolean;
  isLoser: boolean;
  isTied: boolean;
}
const RecentActivityCard: React.FC<RecentActivityCardProps> = ({
  title,
  userId,
  players,
  date,
  isWinner,
  isTied,
  isLoser,
}) => {
  const dateObject = new Date(date);
  const formattedDate = format(dateObject, "dd MMM yyyy");

  // Get players position
  const playerDetails = players.find((player) => player.profileId === userId);
  const position = playerDetails?.position;
  const positionWithSuffix = positionOrdinalSuffix(position!);

  return (
    <div className="flex justify-between items-center mb-4">
      <div className="flex-col">
        <h4 className="text-md font-semibold">{title}</h4>
        <div className="flex -space-x-1 mt-2">
          {players.map((player) => (
            <Tooltip key={player.username}>
              <TooltipTrigger asChild>
                <Avatar
                  className={cn(
                    "w-6 h-6",
                    player.isWinner &&
                      "ring-2 ring-offset-2 ring-chart-2 transition-all duration-300",
                  )}
                >
                  <AvatarImage
                    src={player.profilePic}
                    className={cn(
                      "object-cover w-full h-full",
                      !player.isWinner && "grayscale",
                    )}
                  />
                  <AvatarFallback>P</AvatarFallback>
                </Avatar>
              </TooltipTrigger>
              <TooltipContent>{player.username}</TooltipContent>
            </Tooltip>
          ))}
        </div>
        <p className="mt-2 text-sm text-muted-foreground">{formattedDate}</p>
      </div>
      <div className="flex items-center gap-x-3">
        {isTied && (
          <span className="flex items-center text-base leading-none">🤝</span>
        )}
        {isWinner ? (
          <Badge
            variant="default"
            className="bg-green-600 font-bold text-white"
          >
            <Trophy className="h-3 w-3 mr-1" />
            {positionWithSuffix}
          </Badge>
        ) : isLoser ? (
          <Badge variant="destructive" className="font-bold">
            <Weight className="h-3 w-3 mr-1" />
            {positionWithSuffix}
          </Badge>
        ) : (
          <Badge
            variant="default"
            className="bg-orange-400 font-bold text-white"
          >
            <Medal className="h-3 w-3 mr-1" />
            {positionWithSuffix}
          </Badge>
        )}
      </div>
    </div>
  );
};

// Helper functions
const calculateStartDate = (timeframe: string): Date => {
  const today = endOfDay(new Date());

  switch (timeframe) {
    case "1month":
      return subMonths(today, 1);
    case "3months":
      return subMonths(today, 3);
    case "6months":
      return subMonths(today, 6);
    case "1year":
      return subYears(today, 1);
    case "3years":
      return subYears(today, 3);
    default:
      return subYears(today, 1); // Default to 1 year
  }
};

const TimeFilteredPerformance: React.FC<TimeFilteredPerformanceProps> = ({
  userId,
  recentActivity,
  sessions,
}) => {
  const [timeframe, setTimeframe] = useState<string>("1year");
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: undefined,
    to: undefined,
  });

  // Prevents the timeframe from being active when date range is selected
  useEffect(() => {
    if (dateRange?.from && dateRange.to) {
      setTimeframe("custom");
    }
  }, [dateRange]);

  const filteredActivities = useMemo(() => {
    const activitiesWithDates = recentActivity.map((activity) => ({
      ...activity,
      parsedDate: new Date(activity.datePlayed),
    }));

    let finalFromDate: Date | undefined;
    let finalToDate: Date | undefined;

    // Date Range priority 1
    if (dateRange?.from && dateRange.to) {
      finalFromDate = dateRange.from;
      finalToDate = endOfDay(dateRange.to);
    }

    // Timeframe priority 2
    else if (timeframe !== "custom" && timeframe !== "all") {
      finalFromDate = calculateStartDate(timeframe);
      finalToDate = endOfDay(new Date());
    } else {
      return activitiesWithDates;
    }

    if (finalFromDate && finalToDate) {
      return activitiesWithDates.filter((activity) =>
        isWithinInterval(activity.parsedDate, {
          start: finalFromDate!,
          end: finalToDate!,
        }),
      );
    }

    const activitiesWithDatesTop = activitiesWithDates.slice(0, 5);

    return activitiesWithDatesTop;
  }, [recentActivity, timeframe, dateRange]);

  const { top5Players, topGamesStats } = useMemo(() => {
    const sessionsWithDates = sessions.map((session) => ({
      ...session,
      parsedDate: new Date(session.datePlayed),
    }));

    let finalFromDate: Date | undefined;
    let finalToDate: Date | undefined;

    // Date Range priority 1
    if (dateRange?.from && dateRange.to) {
      finalFromDate = dateRange.from;
      finalToDate = endOfDay(dateRange.to);
    }

    // Timeframe priority 2
    else if (timeframe !== "custom" && timeframe !== "all") {
      finalFromDate = calculateStartDate(timeframe);
      finalToDate = endOfDay(new Date());
    } else {
      const topPlayers = topOpponents(userId, sessionsWithDates);
      const topGamesStats = topGames(userId, sessionsWithDates);
      const top5Players = topPlayers.slice(0, 5);
      return { top5Players, topGamesStats };
    }

    const filteredSessions = sessionsWithDates.filter((session) =>
      isWithinInterval(session.parsedDate, {
        start: finalFromDate!,
        end: finalToDate!,
      }),
    );

    const topPlayers = topOpponents(userId, filteredSessions);
    const topGamesStats = topGames(userId, filteredSessions);
    const top5Players = topPlayers.slice(0, 5);

    return { top5Players, topGamesStats };
  }, [sessions, timeframe, dateRange]);

  const handleTimeframeChange = (value: string) => {
    setTimeframe(value);

    if (value !== "custom") {
      setDateRange({ from: undefined, to: undefined });
    }
  };

  const handleDateRangeChange = (range: DateRange | undefined) => {
    setDateRange(range);

    if (range?.from && range?.to) {
      setTimeframe("custom");
    }
  };

  return (
    <div>
      {/* Timeframe selection */}
      <div className="flex flex-col sm:flex-row gap-y-3 sm:gap-x-3 items-start sm:items-center justify-start text-muted-foreground">
        <div className="flex items-center gap-x-3">
          <p>Timeframe:</p>
          <Select value={timeframe} onValueChange={handleTimeframeChange}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="1month">1 month</SelectItem>
                <SelectItem value="3months">3 months</SelectItem>
                <SelectItem value="6months">6 months</SelectItem>
                <SelectItem value="1year">1 year</SelectItem>
                <SelectItem value="3years">3 years</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-x-3 mt-3 sm:pl-0 sm:mt-0">
          <span>or</span>
          <DateRangePicker date={dateRange} setDate={handleDateRangeChange} />
        </div>
      </div>

      {/* General Metrics */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:gap-x-4 gap-y-5 my-8">
        <MetricCard
          title="Games Played"
          Icon={MeepleIcon}
          value={String(filteredActivities.length)}
        />
        <MetricCard title="Win Rate" Icon={Trophy} value="-" />
        <Card className="w-full">
          <CardHeader className="flex justify-between items-center">
            <CardTitle>Top 5 Opponents</CardTitle>
            <Users className="w-6 h-6 stroke-black dark:stroke-white" />
          </CardHeader>
          <CardContent>
            <ul>
              {top5Players ? (
                top5Players.map((user, idx) => (
                  <li
                    key={user.player.id}
                    className="flex justify-between items-center mb-1"
                  >
                    <p className="text-sm">
                      {`${idx + 1}. ${user.player.firstName}`}{" "}
                      <span className="text-muted-foreground text-sm">{`(${user.player.username})`}</span>
                    </p>
                    <p className="text-sm">{`${user.count} games`}</p>
                  </li>
                ))
              ) : (
                <p>No games found</p>
              )}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity & Game Performance */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch my-8 sm:gap-x-4 gap-y-5">
        <Card className="w-full mb-3">
          <CardHeader>
            <CardTitle className="text-2xl">Recent Activity</CardTitle>
            <CardDescription>Your last 5 gaming sessions</CardDescription>
          </CardHeader>
          <CardContent>
            {filteredActivities.slice(0, 5).map((session) => (
              <RecentActivityCard
                userId={userId}
                key={session.sessionId}
                title={session.gameTitle}
                players={session.players}
                date={session.datePlayed}
                isTied={session.isTied}
                isWinner={session.isWinner}
                isLoser={session.isLoser}
              />
            ))}
          </CardContent>
        </Card>
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="text-2xl">Game Performance</CardTitle>
            <CardDescription>
              Performance of your top 10 most played games
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[300px]">Game</TableHead>
                  <TableHead>No. of Plays</TableHead>
                  <TableHead className="text-right">Win %</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topGamesStats.slice(0, 10).map((game) => (
                  <TableRow key={game.game.gameId}>
                    <TableCell className="font-medium">
                      {game.game.gameTitle}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex h-2 w-full overflow-hidden rounded-full bg-red-500 shadow-inner">
                        <div
                          className="bg-green-600 transition-all duration-500 ease-out"
                          style={{ width: `${game.winRate}%` }}
                          title={`Wins: ${game.wins}`}
                        ></div>
                      </div>
                      <div className="hidden sm:flex justify-between text-xs pt-1 text-muted-foreground">
                        <span className="text-[10px]">Wins: {game.wins}</span>
                        <span className="text-[10px]">
                          Losses: {game.count - game.wins}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell
                      className={cn(
                        "text-right font-semibold",
                        game.winRate <= 50 ? "text-red-500" : "text-green-600",
                      )}
                    >{`${game.winRate}%`}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TimeFilteredPerformance;
