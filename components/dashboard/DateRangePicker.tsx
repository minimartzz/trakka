import { cn } from "@/lib/utils";
import React from "react";
import { DateRange } from "react-day-picker";
import { Popover, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { PopoverContent } from "@radix-ui/react-popover";
import { Calendar } from "@/components/ui/calendar";

interface DateRangePickerProps extends React.HTMLAttributes<HTMLDivElement> {
  date?: DateRange;
  setDate: React.Dispatch<React.SetStateAction<DateRange | undefined>>;
}

const DateRangePicker = ({
  className,
  date,
  setDate,
}: DateRangePickerProps) => {
  return (
    <div className={cn("grid gap-2", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date-range-picker"
            variant="outline"
            className={cn(
              "w-[300px] justify-start text-left font-nromal",
              !date && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date?.from ? (
              date?.to ? (
                `${format(date.from, "dd LLL y")} - ${format(
                  date.to,
                  "dd LLL y"
                )}`
              ) : (
                format(date.from, "dd LLL y")
              )
            ) : (
              <span>Pick a date or range</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          className="w-auto p-0 z-50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2"
        >
          <Calendar
            mode="range"
            selected={date}
            onSelect={setDate}
            numberOfMonths={2}
            className="rounded-xl border mt-1 pointer-events-auto"
            disabled={(date) => date > new Date()}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default DateRangePicker;
