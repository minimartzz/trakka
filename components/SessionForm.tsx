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
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { BGGDetailsInterface } from "@/utils/fetchBgg";
import { format } from "date-fns";
import { ArrowLeft, CalendarIcon } from "lucide-react";
import Form from "next/form";
import { useRouter } from "nextjs-toploader/app";
import React, { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

type selectablePlayersType = Awaited<
  ReturnType<typeof getSelectablePlayers>
>[number];

export interface Player extends selectablePlayersType {
  id: string;
  score: number | null;
  isWinner: boolean;
  isTie: boolean;
  // UI-only grouping key for team mode; null/undefined means a regular row.
  teamId?: string | null;
}

export interface SessionFormInitialData {
  date?: Date;
  gameDetails?: BGGDetailsInterface | null;
  tribe?: SessionTribe | null;
  players?: Player[];
  teamMode?: boolean;
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
    teamMode: boolean;
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
  const [submitted, setSubmitted] = useState(false);
  const [teamMode, setTeamMode] = useState(initialData?.teamMode ?? false);

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
        isAnonymous: false,
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
        isAnonymous: false,
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

  // Toggling team mode doesn't drop entries in player data. It expands based on the
  // current players position
  const handleTeamModeChange = (enabled: boolean) => {
    setTeamMode(enabled);
    setSubmittingPlayers((prev) =>
      prev.map((player) => ({
        ...player,
        teamId: enabled ? crypto.randomUUID() : null,
      })),
    );
  };

  const handleFormSubmit = async () => {
    setSubmitted(true);

    const hasMissingPlayer = submittingPlayers.some(
      (player) => player.firstName === "",
    );
    if (!gameDetails || !date || !tribe || hasMissingPlayer) {
      toast.error("Please fill in all required fields.");
      return;
    }

    await onSubmit({
      date,
      gameDetails,
      tribe,
      players: submittingPlayers,
      teamMode,
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
                      aria-invalid={submitted && !date}
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
                  invalid={submitted && !gameDetails}
                />
              </div>

              {/* Tribe Selection */}
              <div className="space-y-2">
                <Label htmlFor="tribe">Tribe</Label>
                <GroupSearchBar
                  profileId={userId}
                  onSelect={setTribe}
                  initialTribeId={initialData?.tribe?.id}
                  invalid={submitted && !tribe}
                />
              </div>

              {/* Player Selection */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Players</Label>
                  <div className="flex items-center gap-2">
                    <Label
                      htmlFor="team-mode"
                      className="text-sm font-normal text-muted-foreground cursor-pointer"
                    >
                      Team mode
                    </Label>
                    <Switch
                      id="team-mode"
                      checked={teamMode}
                      onCheckedChange={handleTeamModeChange}
                    />
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">
                  {teamMode
                    ? "Group players into teams. Each team shares one score and position."
                    : "Select player from the dropdown if they have an account. Position follows order."}
                </div>
                <PlayerSessionSelection
                  selectablePlayers={selectablePlayers}
                  players={submittingPlayers}
                  setPlayers={setSubmittingPlayers}
                  submitted={submitted}
                  teamMode={teamMode}
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
