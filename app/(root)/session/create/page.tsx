"use client";
import BGGSearchBar from "@/components/BGGSearchBar";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Popover, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { BGGDetailsInterface } from "@/utils/fetchBgg";
import { PopoverContent } from "@radix-ui/react-popover";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import React, { useState } from "react";

const page = () => {
  const [date, setDate] = useState<Date>(new Date());
  const [gameDetails, setGameDetails] = useState<BGGDetailsInterface | null>(
    null
  );

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-30">
        <Card className="max-w-2xl mx-auto">
          {/* Session Record Header */}
          <CardHeader>
            <CardTitle className="text-2xl">Record Game Session</CardTitle>
            <CardDescription>
              Add details about your board game session
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* TODO: Wrap Form Component */}

            {/* Date Selection */}
            <div className="space-y-2">
              <Label className="pb-1">Date Played</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP") : "Please select a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="bg-white rounded-2xl border w-auto p-2 mt-2"
                  align="start"
                >
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={(date) => date && setDate(date)}
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>

              {/* Game Selection */}
              <div className="space-y-2 pt-5">
                <Label>Game Title</Label>
                <BGGSearchBar onSelect={setGameDetails} />
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default page;
