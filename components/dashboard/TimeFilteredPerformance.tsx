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

const TimeFilteredPerformance = () => {
  const [timeframe, setTimeframe] = useState<string>("1 year");

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
              <SelectItem value="1 month">1 month</SelectItem>
              <SelectItem value="3 months">3 months</SelectItem>
              <SelectItem value="6 months">6 months</SelectItem>
              <SelectItem value="1 year">1 year</SelectItem>
              <SelectItem value="3 years">3 years</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
        <span>or</span>
      </div>
    </div>
  );
};

export default TimeFilteredPerformance;
