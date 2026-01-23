"use client";
import {
  getSelectablePlayers,
  submitNewSession,
} from "@/app/(generic)/session/create/action";
import useAuth from "@/app/hooks/useAuth";
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
import {
  generateSessionId,
  getDateInfo,
  getFirstPlay,
  getScore,
  getWinContrib,
} from "@/utils/sessionLog";
import { format } from "date-fns";
import { ArrowLeft, CalendarIcon } from "lucide-react";
import Form from "next/form";
import { useRouter } from "next/navigation";
import React, { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

type selectablePlayersType = Awaited<
  ReturnType<typeof getSelectablePlayers>
>[number];

export interface Player {
  id: string;
  userId: number;
  name: string;
  score: number | null;
  isWinner: boolean;
  isTie: boolean;
}

const Page = () => {
  const firstUpdate = useRef(true);
  // Calendar controls
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  // Game details
  const [gameDetails, setGameDetails] = useState<BGGDetailsInterface | null>(
    null
  );

  // Tribe details
  const [tribe, setTribe] = useState<SessionTribe | null>(null);

  // Player details
  const [selectablePlayers, setSelectablePlayers] = useState<
    selectablePlayersType[]
  >([]);
  const [submittingPlayers, setSubmittingPlayers] = useState<Player[]>([
    {
      id: "1",
      userId: 0,
      name: "",
      score: null,
      isWinner: false,
      isTie: false,
    },
    {
      id: "2",
      userId: 0,
      name: "",
      score: null,
      isWinner: false,
      isTie: false,
    },
  ]);

  // Form control
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (formData: FormData) => {
    setIsSubmitting(true);
    // Initial Checks
    // Check 1: If no game was selected
    if (!gameDetails) {
      toast.error("No game selected.");
      setIsSubmitting(false);
      return;
    }
    // Check 2: If no date was selected
    if (!date) {
      toast.error("No date was selected.");
      setIsSubmitting(false);
      return;
    }
    // Check 3: No tribe was selected
    if (!tribe) {
      toast.error("No tribe was selected.");
      setIsSubmitting(false);
      return;
    }
    // Check 4: No player names
    const missingPlayers = submittingPlayers
      .map((player, idx) => (player.name === "" ? idx + 1 : null))
      .filter((idx): idx is number => idx !== null);
    if (missingPlayers.length > 0) {
      console.log(missingPlayers);
      const missingPositions = missingPlayers.join(", ");
      toast.error(`Missing player info at position ${missingPositions}.`);
      setIsSubmitting(false);
      return;
    }
    // Check 5: Ensure at least 1 winner
    const containWinner = submittingPlayers.some((player) => player.isWinner);
    if (!containWinner) {
      toast.error("At least one winner must be selected.");
      setIsSubmitting(false);
      return;
    }

    // Get all the additional info
    const sessionId = generateSessionId();
    const datePlayed = format(date, "yyyy-MM-dd");
    const bgg = {
      gameId: gameDetails.id,
      gameTitle: gameDetails.title,
      gameWeight: gameDetails.weight,
      gameLength: parseInt(gameDetails.playingtime),
    };
    const numPlayers = submittingPlayers.length;
    const groupId = tribe.id;
    const isVp = true; // TODO: This needs to change eventually for non-VP games
    const dateInfo = getDateInfo(date);

    // Create the payload
    let payload = null;
    try {
      const promises = submittingPlayers.map(async (player, idx) => {
        const position = idx + 1;
        const victoryPoints = player.score;
        const score = getScore(
          position,
          numPlayers,
          bgg.gameLength,
          parseFloat(bgg.gameWeight)
        );

        return {
          sessionId,
          datePlayed,
          ...bgg,
          numPlayers,
          profileId: player.userId,
          groupId,
          isVp,
          victoryPoints: victoryPoints,
          isWinner: player.isWinner,
          position: position,
          winContrib: getWinContrib(numPlayers, player.isWinner),
          score: score,
          highScore: false, // TODO: Need to think of a new way to handle this
          ...dateInfo,
          isFirstPlay: await getFirstPlay(bgg.gameId, player.userId),
          isTie: player.isTie,
          createdBy: user!.id,
        };
      });
      payload = await Promise.all(promises);
    } catch (error) {
      console.error("Failed to gather necessary info for session");
      toast.error(
        "Error in submitting. Please check your fields and try again"
      );
      setIsSubmitting(false);
      return;
    }

    if (payload) {
      try {
        const response = await submitNewSession(payload);
        if (!response.success) {
          toast.error(
            "Failed to submit new session. Please check fields and try again."
          );
        } else {
          toast.success(
            `Successfully saved session ${gameDetails.title} on ${datePlayed}! 🎉`
          );
          router.push("/recent-games");
        }
      } catch (error) {
        console.error("Client side failed to submit");
        toast.error(
          "Failed to submit new session. Please check fields and try again."
        );
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  useEffect(() => {
    const fetchPlayerDetails = async (tribeId: string) => {
      try {
        const response = await getSelectablePlayers(tribeId);

        if (response.length > 0) {
          setSelectablePlayers(response);
        }
      } catch (error) {
        console.error("Failed to retrieve selectable players:", error);
      }
    };

    // Prevents running function on mount
    if (firstUpdate.current) {
      firstUpdate.current = false;
      return;
    }

    fetchPlayerDetails(tribe!.id);
  }, [tribe]);

  const router = useRouter();

  // Get current user details
  const { user, authLoading } = useAuth();
  if (authLoading || !user) {
    return;
  }

  const handleCalendarSelect = (selectedDate: Date | undefined) => {
    setDate(selectedDate);
    if (selectedDate) {
      setIsCalendarOpen(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header bar */}
      <header className="flex flex-row items-center w-full gap-4 p-5 border-b">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-2xl font-bold">New Game Session</h1>
      </header>
      <div className="container mx-auto px-4 py-20">
        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle className="text-2xl">Record Game Session</CardTitle>
            <CardDescription>Track a new board game session</CardDescription>
          </CardHeader>
          <CardContent>
            <Form action={handleSubmit} className="space-y-6">
              {/* Calendar Date Selection */}
              <div className="space-y-2">
                <Label className="pb-1">Date Played</Label>
                <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
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
                <BGGSearchBar onSelect={setGameDetails} />
              </div>

              {/* Tribe Selection */}
              <div className="space-y-2">
                <Label htmlFor="tribe">Tribe</Label>
                <GroupSearchBar profileId={user.id} onSelect={setTribe} />
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
                  submitting={isSubmitting}
                />
              </div>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Page;
