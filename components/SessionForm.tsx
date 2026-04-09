"use client";
import { getSelectablePlayers } from "@/app/(generic)/session/create/action";
import BGGSearchBar from "@/components/BGGSearchBar";
import GroupSearchBar, { SessionTribe } from "@/components/GroupSearchBar";
import PlayerSessionSelection from "@/components/PlayerSessionSelection";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { BGGDetailsInterface } from "@/utils/fetchBgg";
import { format } from "date-fns";
import { ArrowLeft, CalendarIcon } from "lucide-react";
import Form from "next/form";
import { useRouter } from "nextjs-toploader/app";
import React, { useEffect, useRef, useState } from "react";

type selectablePlayersType = Awaited<
  ReturnType<typeof getSelectablePlayers>
>[number];

export interface Player extends selectablePlayersType {
  id: string;
  score: number | null;
  isWinner: boolean;
  isTie: boolean;
}

export interface SessionFormInitialData {
  date?: Date;
  gameDetails?: BGGDetailsInterface | null;
  tribe?: SessionTribe | null;
  players?: Player[];
}

interface SessionFormProps {
  userId: number;
  title: string;
  cardTitle: string;
  cardDescription: string;
  initialData?: SessionFormInitialData;
  onSubmit: (data: {
    date: Date;
    gameDetails: BGGDetailsInterface;
    tribe: SessionTribe;
    players: Player[];
  }) => Promise<void>;
}

const SessionForm: React.FC<SessionFormProps> = ({
  userId,
  title,
  cardTitle,
  cardDescription,
  initialData,
  onSubmit,
}) => {
  const firstUpdate = useRef(!initialData?.tribe);
  const router = useRouter();

  // Calendar controls
  const [date, setDate] = useState<Date | undefined>(
    initialData?.date ?? new Date(),
  );
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  // Game details
  const [gameDetails, setGameDetails] = useState<BGGDetailsInterface | null>(
    initialData?.gameDetails ?? null,
  );

  // Tribe details
  const [tribe, setTribe] = useState<SessionTribe | null>(
    initialData?.tribe ?? null,
  );

  // Player details
  const [selectablePlayers, setSelectablePlayers] = useState<
    selectablePlayersType[]
  >([]);
  const [submittingPlayers, setSubmittingPlayers] = useState<Player[]>(
    initialData?.players ?? [
      {
        id: "1",
        profileId: 0,
        firstName: "",
        lastName: "",
        username: "",
        profilePic: "",
        groupId: "",
        score: null,
        isWinner: false,
        isTie: false,
      },
      {
        id: "2",
        profileId: 0,
        firstName: "",
        lastName: "",
        username: "",
        profilePic: "",
        groupId: "",
        score: null,
        isWinner: false,
        isTie: false,
      },
    ],
  );

  useEffect(() => {
    const fetchPlayerDetails = async (tribeId: string) => {
      try {
        const response = await getSelectablePlayers(tribeId);
        setSelectablePlayers(response);
      } catch (error) {
        console.error("Failed to retrieve selectable players:", error);
      }
    };

    // Prevents running function on mount for create mode
    if (firstUpdate.current) {
      firstUpdate.current = false;
      return;
    }

    if (tribe?.id) {
      fetchPlayerDetails(tribe.id);
    } else {
      setSelectablePlayers([]);
    }
  }, [tribe]);

  // For edit mode: fetch selectable players on mount if tribe is pre-set
  useEffect(() => {
    if (initialData?.tribe?.id) {
      getSelectablePlayers(initialData.tribe.id).then(setSelectablePlayers);
    }
  }, []);

  const handleCalendarSelect = (selectedDate: Date | undefined) => {
    setDate(selectedDate);
    if (selectedDate) {
      setIsCalendarOpen(false);
    }
  };

  const handleFormSubmit = async () => {
    if (!gameDetails || !date || !tribe) return;
    await onSubmit({
      date,
      gameDetails,
      tribe,
      players: submittingPlayers,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header bar */}
      <header className="flex flex-row items-center w-full gap-4 p-5 border-b">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-2xl font-bold">{title}</h1>
      </header>
      <div className="container mx-auto px-4 py-20">
        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle className="text-2xl">{cardTitle}</CardTitle>
            <CardDescription>{cardDescription}</CardDescription>
          </CardHeader>
          <CardContent>
            <Form action={handleFormSubmit} className="space-y-6">
              {/* Calendar Date Selection */}
              <div className="space-y-2">
                <Label className="pb-1">Date Played</Label>
                <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !date && "text-muted-foreground",
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, "PPP") : "Please select a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="bg-background rounded-2xl border w-auto p-2 mt-2 z-10"
                    align="start"
                  >
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={handleCalendarSelect}
                      className="rounded-md bg-background"
                      captionLayout="dropdown"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Game Selection */}
              <div className="space-y-2">
                <Label>Game Title</Label>
                <BGGSearchBar
                  onSelect={setGameDetails}
                  initialGame={initialData?.gameDetails}
                />
              </div>

              {/* Tribe Selection */}
              <div className="space-y-2">
                <Label htmlFor="tribe">Tribe</Label>
                <GroupSearchBar
                  profileId={userId}
                  onSelect={setTribe}
                  initialTribeId={initialData?.tribe?.id}
                />
              </div>

              {/* Player Selection */}
              <div className="space-y-2">
                <Label>Players</Label>
                <div className="text-xs text-muted-foreground">
                  Select player from the dropdown if they have an account.
                  Position follows order.
                </div>
                <PlayerSessionSelection
                  selectablePlayers={selectablePlayers}
                  players={submittingPlayers}
                  setPlayers={setSubmittingPlayers}
                />
              </div>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SessionForm;