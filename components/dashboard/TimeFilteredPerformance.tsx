"use client";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import React, { useState } from "react";
import DateRangePicker from "./DateRangePicker";
import { DateRange } from "react-day-picker";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import MeepleIcon from "../icons/MeepleIcon";
import { Trophy, Users } from "lucide-react";
import { Top5OpponentsCount } from "@/utils/dashboardProcessing";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { CombinedRecentGames } from "@/lib/interfaces";
import { format } from "date-fns";

interface TimeFilteredPerformanceProps {
  gamesPlayed: number;
  top5Players: Top5OpponentsCount[];
  recentActivity: CombinedRecentGames[];
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
  players: { username: string; profilePic: string; isWinner: boolean | null }[];
  date: string;
  isWinner: boolean;
  isTied: boolean;
}
const RecentActivityCard: React.FC<RecentActivityCardProps> = ({
  title,
  players,
  date,
  isWinner,
  isTied,
}) => {
  const dateObject = new Date(date);
  const formattedDate = format(dateObject, "dd MMM yyyy");

  return (
    <div className="flex justify-between items-center mb-4">
      <div className="flex-col">
        <h4 className="text-md font-semibold">{title}</h4>
        <div className="flex -space-x-1 mt-2">
          {players.map((player) => (
            <Tooltip>
              <TooltipTrigger asChild>
                <Avatar
                  className={cn(
                    "w-6 h-6",
                    player.isWinner &&
                      "ring-2 ring-offset-2 ring-chart-2 transition-all duration-300"
                  )}
                >
                  <AvatarImage
                    src={player.profilePic}
                    className={cn(
                      "object-cover w-full h-full",
                      !player.isWinner && "grayscale"
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
      {isWinner ? (
        <Badge variant="default" className="bg-green-600 font-bold">
          Won
        </Badge>
      ) : isTied ? (
        <Badge
          variant="secondary"
          className="bg-orange-400 font-bold text-white"
        >
          Tied
        </Badge>
      ) : (
        <Badge variant="destructive" className="font-bold">
          Lost
        </Badge>
      )}
    </div>
  );
};

const TimeFilteredPerformance: React.FC<TimeFilteredPerformanceProps> = ({
  gamesPlayed,
  top5Players,
  recentActivity,
}) => {
  const [timeframe, setTimeframe] = useState<string>("1year");
  const [date, setDate] = useState<DateRange | undefined>({
    from: undefined,
    to: undefined,
  });

  return (
    <div>
      {/* Timeframe selection */}
      <div className="flex items-center justify-start gap-x-3 text-muted-foreground">
        <p>Timeframe:</p>
        <Select
          value={timeframe}
          onValueChange={(value) => {
            setTimeframe(value);
          }}
        >
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
        <span>or</span>
        <DateRangePicker date={date} setDate={setDate} />
      </div>

      {/* General Metrics */}
      <div className="flex justify-between items-stretch gap-x-5 my-8">
        <MetricCard
          title="Games Played"
          Icon={MeepleIcon}
          value={String(gamesPlayed)}
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
      <div className="flex justify-between items-stretch my-8 gap-x-5">
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Your last 5 gaming sessions</CardDescription>
          </CardHeader>
          <CardContent>
            {recentActivity.map((session) => (
              <RecentActivityCard
                key={session.sessionId}
                title={session.gameTitle}
                players={session.players}
                date={session.datePlayed}
                isTied={session.isTied}
                isWinner={session.isWinner}
              />
            ))}
          </CardContent>
        </Card>
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Game Performance</CardTitle>
            <CardDescription>
              Performance of your most played games
            </CardDescription>
          </CardHeader>
          <CardContent></CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TimeFilteredPerformance;
