"use client";

import React from "react";
import { DateRange } from "react-day-picker";
import { format } from "date-fns";
import { CalendarIcon, ChevronDown } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

export type Timeframe =
  | "1week"
  | "1month"
  | "1quarter"
  | "6months"
  | "1year"
  | "3years"
  | "all"
  | "custom";

export const TIMEFRAME_LABELS: Record<Exclude<Timeframe, "custom">, string> = {
  "1week": "Last week",
  "1month": "Last month",
  "1quarter": "Last quarter",
  "6months": "Last 6 months",
  "1year": "Last year",
  "3years": "Last 3 years",
  all: "All time",
};

interface TimeframeFilterProps {
  timeframe: Timeframe;
  onTimeframeChange: (timeframe: Timeframe) => void;
  dateRange?: DateRange;
  onDateRangeChange: (range: DateRange | undefined) => void;
  /** Resolved window the dashboard is currently showing, or null for all time */
  activeRange: { from: Date; to: Date } | null;
}

const TimeframeFilter: React.FC<TimeframeFilterProps> = ({
  timeframe,
  onTimeframeChange,
  dateRange,
  onDateRangeChange,
  activeRange,
}) => {
  const rangeLabel = activeRange
    ? `${format(activeRange.from, "MMM d, yyyy")} - ${format(
        activeRange.to,
        "MMM d, yyyy",
      )}`
    : "All time";

  const presetLabel =
    timeframe === "custom" ? "Custom" : TIMEFRAME_LABELS[timeframe];

  const segment =
    "flex items-center h-9 px-3.5 text-sm font-medium hover:bg-muted/60 transition-colors";

  return (
    <div className="flex w-full sm:w-auto items-center rounded-full border bg-card shadow-xs overflow-hidden">
      <Popover>
        <PopoverTrigger asChild>
          <button
            id="date-range-picker"
            className={cn(segment, "gap-2 flex-1 sm:flex-none justify-center")}
          >
            <CalendarIcon className="w-4 h-4 shrink-0 text-muted-foreground" />
            <span className="whitespace-nowrap">{rangeLabel}</span>
          </button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-auto p-0">
          <Calendar
            mode="range"
            selected={dateRange}
            onSelect={onDateRangeChange}
            numberOfMonths={2}
            className="rounded-xl pointer-events-auto"
            disabled={(date) => date > new Date()}
          />
        </PopoverContent>
      </Popover>

      <span className="h-5 w-px shrink-0 bg-border" />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className={cn(segment, "gap-1.5 shrink-0")}>
            <span className="whitespace-nowrap">{presetLabel}</span>
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuRadioGroup
            value={timeframe}
            onValueChange={(value) => onTimeframeChange(value as Timeframe)}
          >
            {(
              Object.entries(TIMEFRAME_LABELS) as [
                Exclude<Timeframe, "custom">,
                string,
              ][]
            ).map(([key, label]) => (
              <DropdownMenuRadioItem key={key} value={key}>
                {label}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default TimeframeFilter;
