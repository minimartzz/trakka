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
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import MeepleIcon from "../icons/MeepleIcon";
import { Trophy, Users } from "lucide-react";

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

// Placeholder data
const users = [
  {
    id: 1,
    name: "John",
    username: "jlee",
    numGames: 6,
  },
  {
    id: 2,
    name: "Kang Tze",
    username: "ktt",
    numGames: 4,
  },
  {
    id: 3,
    name: "Rachel",
    username: "rchee",
    numGames: 3,
  },
  {
    id: 4,
    name: "Damien",
    username: "damedolla",
    numGames: 2,
  },
  {
    id: 5,
    name: "Amelia",
    username: "watson",
    numGames: 1,
  },
];

const TimeFilteredPerformance = () => {
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
        <MetricCard title="Games Played" Icon={MeepleIcon} value={String(5)} />
        <MetricCard title="Win Rate" Icon={Trophy} value="10%" />
        <Card className="w-full">
          <CardHeader className="flex justify-between items-center">
            <CardTitle>Top 5 Opponents</CardTitle>
            <Users className="w-6 h-6 stroke-black dark:stroke-white" />
          </CardHeader>
          <CardContent>
            <ul>
              {users ? (
                users.map((user, idx) => (
                  <li
                    key={user.id}
                    className="flex justify-between items-center mb-1"
                  >
                    <p className="text-sm">
                      {`${idx + 1}. ${user.name}`}{" "}
                      <span className="text-muted-foreground text-sm">{`(${user.username})`}</span>
                    </p>
                    <p className="text-sm">{`${user.numGames} games`}</p>
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
    </div>
  );
};

export default TimeFilteredPerformance;
