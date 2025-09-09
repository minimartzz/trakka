"use client";
import BGGSearchBar from "@/components/BGGSearchBar";
import GroupSearchBar, { SessionGroup } from "@/components/GroupSearchBar";
import MyComponent from "@/components/MyComponent";
import PlayerInput from "@/components/PlayerInput";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { BGGDetailsInterface } from "@/utils/fetchBgg";
import { PopoverContent } from "@radix-ui/react-popover";
import { format } from "date-fns";
import { CalendarIcon, Plus } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";

interface Player {
  id: string;
  userId: number;
  name: string;
  score: string;
  isWinner: boolean;
  isTie: boolean;
}

const page = () => {
  const [date, setDate] = useState<Date>(new Date());
  const [gameDetails, setGameDetails] = useState<BGGDetailsInterface | null>(
    null
  );
  const [group, setGroup] = useState<SessionGroup | null>(null);
  const [players, setPlayers] = useState<Player[]>([
    {
      id: "1",
      userId: 0,
      name: "",
      score: "",
      isWinner: false,
      isTie: false,
    },
    {
      id: "2",
      userId: 0,
      name: "",
      score: "",
      isWinner: false,
      isTie: false,
    },
  ]);
  const scoreInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});
  const winnerCheckboxRefs = useRef<{
    [key: string]: HTMLButtonElement | null;
  }>({});
  const tieCheckboxRefs = useRef<{ [key: string]: HTMLButtonElement | null }>(
    {}
  );

  // ALERT: Debugging states
  useEffect(() => {
    // console.log(selectedUser);
    console.log(players);
  }, [players]);

  // Handling Player Section
  const addPlayer = () => {
    const newPlayer: Player = {
      id: Date.now().toString(),
      userId: 0,
      name: "",
      score: "",
      isWinner: false,
      isTie: false,
    };
    setPlayers([...players, newPlayer]);
  };

  const updatePlayerName = (id: string, name: string, userId: number) => {
    setPlayers(
      players.map((player) =>
        player.id === id ? { ...player, name, userId } : player
      )
    );
  };

  // Updating Refs
  const foceusNextScore = (playerId: string) => {
    const scoreInput = scoreInputRefs.current[playerId];
    if (scoreInput) {
      scoreInput.focus();
    }
  };
  const focusNextWinner = (playerId: string) => {
    const winnerCheckbox = winnerCheckboxRefs.current[playerId];
    if (winnerCheckbox) {
      winnerCheckbox.focus();
    }
  };
  const focusNextTie = (playerId: string) => {
    const tieCheckbox = tieCheckboxRefs.current[playerId];
    if (tieCheckbox) {
      tieCheckbox.focus();
    }
  };

  // Handling Changes
  const updatePlayer = (
    id: string,
    field: keyof Player,
    value: string | boolean
  ) => {
    setPlayers(
      players.map((player) =>
        player.id === id
          ? {
              ...player,
              [field]: value,
            }
          : player
      )
    );
  };

  const handleScoreChange = (id: string, value: string) => {
    if (value === "" || /^-?\d*\.?\d*$/.test(value)) {
      updatePlayer(id, "score", value);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-30">
        <Card className="max-w-4xl mx-auto">
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

              {/* Tribe Selection */}
              <div className="space-y-2">
                <Label htmlFor="tribe">Tribe (Optional)</Label>
                <GroupSearchBar onSelect={setGroup} />
              </div>

              {/* Player Selection */}
              <div className="space-y-4 pt-8">
                <div className="flex justify-between items-center">
                  <Label>Players</Label>
                  <Button
                    type="button"
                    onClick={addPlayer}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2 h-9 bg-green-400 font-semibold"
                    data-testid="add-player-button"
                    tabIndex={0}
                  >
                    <Plus className="h-4 w-4" />
                    Add Player
                  </Button>
                </div>

                {/* Desktop Layout */}
                <div className="hidden lg:flex items-center gap-4 px-4 py-2 text-sm text-muted-foreground font-medium border rounded-lg bg-muted/30">
                  <div className="flex-[2] min-w-0">Player Name</div>
                  <div className="w-24 text-center">Score</div>
                  <div className="w-20 text-center">Winner</div>
                  <div className="w-16 text-center">Tie</div>
                  <div className="w-10"></div> {/* Space for delete button */}
                </div>

                <div className="space-y-3">
                  {players.map((player, idx) => (
                    <div key={player.id} className="flex items-center gap-4">
                      <div className="hidden lg:flex flex-1 items-center gap-4 p-4 border rounded-lg">
                        <div className="flex=[2] min-w-0">
                          <PlayerInput
                            value={player.name}
                            onChange={(name, userId) =>
                              updatePlayerName(player.id, name, userId!)
                            }
                            onNext={() => foceusNextScore(player.id)}
                            placeholder={`Player ${idx + 1}`}
                            tabIndex={idx * 4 + 1}
                          />
                        </div>
                        <div className="w-24">
                          <Input
                            ref={(el) => {
                              scoreInputRefs.current[player.id] = el;
                            }}
                            type="number"
                            step="1"
                            placeholder={player.score ? "" : "-"}
                            value={player.score}
                            onChange={(e) => {
                              const value = e.target.value;
                              if (
                                value === "" ||
                                value === "-" ||
                                /^-?\d+$/.test(value)
                              ) {
                                handleScoreChange(player.id, value);
                              }
                            }}
                            className="text-center [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]"
                            onFocus={(e) => (e.target.placeholder = "")}
                            onBlur={(e) => {
                              if (!e.target.value) {
                                e.target.placeholder = "-";
                              }
                            }}
                            tabIndex={idx * 4 + 2}
                            onKeyDown={(e) => {
                              if (e.key === "Tab" && !e.shiftKey) {
                                e.preventDefault();
                                focusNextWinner(player.id);
                              }
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default page;
