import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface EnhancedCalendarProps {
  selected?: Date;
  onSelect?: (date: Date | undefined) => void;
  disabled?: (date: Date) => boolean;
  className?: string;
}

type ViewMode = "days" | "months" | "years";

export function EnhancedCalendar({
  selected,
  onSelect,
  disabled,
  className,
}: EnhancedCalendarProps) {
  const [viewMode, setViewMode] = React.useState<ViewMode>("days");
  const [currentDate, setCurrentDate] = React.useState(selected || new Date());

  const today = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  // Generate years for year selection (only up to current year)
  const years = Array.from(
    {
      length: Math.min(
        21,
        today.getFullYear() - (today.getFullYear() - 10) + 1
      ),
    },
    (_, i) => {
      const year = today.getFullYear() - 10 + i;
      return year <= today.getFullYear() ? year : null;
    }
  ).filter(Boolean) as number[];

  // Month names
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  // Days of week
  const daysOfWeek = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

  // Get days in current month
  const getDaysInMonth = () => {
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay();

    const days = [];

    // Add empty cells for days before month starts
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(null);
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(currentYear, currentMonth, day));
    }

    return days;
  };

  const handleDateSelect = (date: Date) => {
    if (disabled && disabled(date)) return;
    onSelect?.(date);
  };

  const handleMonthSelect = (monthIndex: number) => {
    setCurrentDate(new Date(currentYear, monthIndex, 1));
    setViewMode("days");
  };

  const handleYearSelect = (year: number) => {
    setCurrentDate(new Date(year, currentMonth, 1));
    setViewMode("months");
  };

  const navigateMonth = (direction: "prev" | "next") => {
    const newDate = new Date(currentDate);
    if (direction === "prev") {
      newDate.setMonth(currentMonth - 1);
    } else {
      newDate.setMonth(currentMonth + 1);
    }
    setCurrentDate(newDate);
  };

  const navigateYear = (direction: "prev" | "next") => {
    const newDate = new Date(currentDate);
    if (direction === "prev") {
      newDate.setFullYear(currentYear - 1);
    } else {
      newDate.setFullYear(currentYear + 1);
    }
    setCurrentDate(newDate);
  };

  if (viewMode === "years") {
    return (
      <div className={cn("p-3", className)}>
        <div className="flex items-center justify-between mb-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setViewMode("months")}
            className="text-sm font-medium"
          >
            ← Back to Months
          </Button>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {years.map((year) => (
            <Button
              key={year}
              variant={year === currentYear ? "default" : "ghost"}
              size="sm"
              onClick={() => handleYearSelect(year)}
              className="h-10 text-black"
            >
              {year}
            </Button>
          ))}
        </div>
      </div>
    );
  }

  if (viewMode === "months") {
    return (
      <div className={cn("p-3", className)}>
        <div className="flex items-center justify-between mb-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateYear("prev")}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            onClick={() => setViewMode("years")}
            className="text-sm font-medium"
          >
            {currentYear}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateYear("next")}
            disabled={currentYear >= today.getFullYear()}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {months.map((month, index) => {
            // Disable future months in current year
            const isDisabled =
              currentYear === today.getFullYear() && index > today.getMonth();

            return (
              <Button
                key={month}
                variant={index === currentMonth ? "default" : "ghost"}
                size="sm"
                onClick={() => handleMonthSelect(index)}
                disabled={isDisabled}
                className={cn(
                  "h-10",
                  isDisabled && "opacity-50 cursor-not-allowed"
                )}
              >
                {month.slice(0, 3)}
              </Button>
            );
          })}
        </div>
      </div>
    );
  }

  // Days view
  const days = getDaysInMonth();

  return (
    <div className={cn("p-3", className)}>
      <div className="flex items-center justify-between mb-4">
        <Button
          variant="outline"
          size="sm"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            navigateMonth("prev");
          }}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setViewMode("months");
          }}
          className="text-sm font-medium"
        >
          {format(currentDate, "MMMM yyyy")}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            navigateMonth("next");
          }}
          disabled={
            currentYear === today.getFullYear() &&
            currentMonth >= today.getMonth()
          }
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Days of week header */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {daysOfWeek.map((day) => (
          <div
            key={day}
            className="h-9 w-9 text-center text-sm font-medium text-muted-foreground flex items-center justify-center"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar days */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((day, index) => {
          if (!day) {
            return <div key={index} className="h-9 w-9" />;
          }

          const isSelected =
            selected &&
            day.getDate() === selected.getDate() &&
            day.getMonth() === selected.getMonth() &&
            day.getFullYear() === selected.getFullYear();

          const isToday =
            day.getDate() === new Date().getDate() &&
            day.getMonth() === new Date().getMonth() &&
            day.getFullYear() === new Date().getFullYear();

          const isDisabled = disabled && disabled(day);

          return (
            <Button
              key={index}
              variant={isSelected ? "default" : "ghost"}
              size="sm"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleDateSelect(day);
              }}
              disabled={isDisabled}
              className={cn(
                "h-9 w-9 p-0 font-normal",
                isToday && !isSelected && "bg-accent text-accent-foreground",
                isDisabled && "opacity-50 cursor-not-allowed"
              )}
            >
              {day.getDate()}
            </Button>
          );
        })}
      </div>
    </div>
  );
}
