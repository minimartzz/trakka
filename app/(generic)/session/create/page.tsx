"use client";
import useAuth from "@/app/hooks/useAuth";
import BGGSearchBar from "@/components/BGGSearchBar";
import GroupSearchBar, { SessionGroup } from "@/components/GroupSearchBar";
import PlayerInput from "@/components/PlayerInput";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { EnhancedCalendar } from "@/components/ui/enhanced-calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverTrigger } from "@/components/ui/popover";
import { compGameLogTable } from "@/db/schema/compGameLog";
import { cn } from "@/lib/utils";
import { BGGDetailsInterface } from "@/utils/fetchBgg";
import {
  generateSessionId,
  getDateInfo,
  getFirstPlay,
  getScore,
  getWinContrib,
} from "@/utils/sessionLog";
import { PopoverContent } from "@radix-ui/react-popover";
import { format } from "date-fns";
import { ArrowLeft, CalendarIcon, Plus, X } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useRef, useState } from "react";
import { toast } from "sonner";

interface Player {
  id: string;
  userId: number;
  name: string;
  score: string;
  isWinner: boolean;
  isTie: boolean;
}

type NewSession = typeof compGameLogTable.$inferInsert;

const Page = () => {
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const { user, authLoading } = useAuth();
  if (authLoading || !user) {
    return;
  }

  // // ALERT: Debugging states
  // useEffect(() => {
  //   // console.log(selectedUser);
  //   console.log(group);
  //   console.log(gameDetails);
  //   console.log(date);
  // }, [players]);

  // TODO: Add a useEffect here to pull down current logged in user data

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

  // Updating Refs - changing the focus after filling in entries
  const focusNextScore = (playerId: string) => {
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
  const focusNextPlayer = (currentIndex: number) => {
    const nextIndex = currentIndex + 1;
    if (nextIndex < players.length) {
      const nextPlayerInput = document.querySelector(
        `[tabindex='${nextIndex * 4 + 1}']`
      ) as HTMLInputElement;
      if (nextPlayerInput) {
        nextPlayerInput.focus();
      }
    } else {
      const addPlayerButton = document.querySelector(
        '[data-testid="add-player-button"]'
      ) as HTMLButtonElement;
      if (addPlayerButton) {
        addPlayerButton.focus();
      }
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

  const removePlayer = (id: string) => {
    if (players.length > 1) {
      setPlayers(players.filter((player) => player.id !== id));
    }
  };

  // Form insert
  const formatDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");

    return `${year}-${month}-${day}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // TODO: Check if user is signed in first

      // Validation
      const playersWithNames = players.filter((player) => player.name.trim());
      if (playersWithNames.length < 2) {
        throw new Error("at least two players are required");
      }
      if (!playersWithNames.some((p) => p.isWinner)) {
        throw new Error("At least one winner is required");
      }
      if (!gameDetails) {
        throw new Error("Game selection required");
      }

      // Hydrate players with necessary values
      const sessionId = generateSessionId();
      const datePlayed = formatDate(date);
      const bgg = {
        gameId: gameDetails.id,
        gameTitle: gameDetails.title,
        gameWeight: gameDetails.weight,
        gameLength: parseInt(gameDetails.playingtime),
      };
      const numPlayers = players.length;
      const groupId = group!.id; // TODO: Must have a group
      const isVp = true; // TODO: This needs to change eventually for non-VP games
      const dateInfo = getDateInfo(date);

      const sorted_players = players.sort((a, b) => {
        return parseInt(b.score, 10) - parseInt(a.score, 10);
      });

      let position = 1;
      const promises = sorted_players.map(async (item, index, array) => {
        const victoryPoints = parseInt(item.score);
        if (index > 0 && item.score !== array[index - 1].score) {
          position = index + 1;
        }
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
          profileId: item.userId,
          groupId,
          isVp,
          victoryPoints: victoryPoints,
          isWinner: item.isWinner,
          position: position,
          winContrib: getWinContrib(numPlayers, item.isWinner),
          score: score,
          highScore: false, // TODO: Need to think of a new way to handle this
          ...dateInfo,
          isFirstPlay: await getFirstPlay(bgg.gameId, item.userId),
          isTie: item.isTie,
        } as NewSession;
      });

      const entries = await Promise.all(promises);

      // Insert into the DB
      const response = await fetch("/api/session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(entries),
      });
      const dbOutcome = await response.json();
      if (response.ok && dbOutcome.success) {
        toast.success("Success! 🎉", {
          description: `Added session for ${gameDetails.title} played on ${datePlayed}`,
          position: "bottom-right",
          className: "bg-add-button",
        });

        // Redirect to Recent Games
        router.push("/recent-games");
      } else {
        toast.error("Failed! 🥺", {
          description: "Failed to add session. Check your inputs and try again",
          position: "bottom-right",
        });
      }

      setGameDetails(null);
      setGroup(null);
      setPlayers([
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
    } catch (error) {
      console.error("Error with saving session", error);
      toast.error("Failed! 🥺", {
        description: "Failed to add session. Check your inputs and try again",
        position: "bottom-right",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="flex flex-row items-center w-full gap-4 p-5 border-b">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-2xl font-bold">New Game Session</h1>
      </header>
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
            <form onSubmit={handleSubmit} className="space-y-6">
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
                    className="bg-background rounded-2xl border w-auto p-2 mt-2 z-10"
                    align="start"
                  >
                    <EnhancedCalendar
                      selected={date}
                      onSelect={(date) => date && setDate(date)}
                      disabled={(date) => date > new Date()}
                      className="pointer-events-auto bg-background"
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
                  <Label htmlFor="tribe">Tribe</Label>
                  <GroupSearchBar profileId={user.id} onSelect={setGroup} />
                </div>

                {/* Player Selection */}
                <div className="space-y-4 pt-6">
                  <div className="flex justify-between items-center">
                    <Label>Players</Label>
                    <Button
                      type="button"
                      onClick={addPlayer}
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-2 h-9 bg-add-button font-semibold"
                      data-testid="add-player-button"
                      tabIndex={0}
                    >
                      <Plus className="h-4 w-4" />
                      Add Player
                    </Button>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Select players using @ at the start and select. If user does
                    not exist, please ask them to create an account
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
                          <div className="flex=[2] min-w-0 w-117">
                            <PlayerInput
                              value={player.name}
                              onChange={(name, userId) =>
                                updatePlayerName(player.id, name, userId!)
                              }
                              onNext={() => focusNextScore(player.id)}
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
                          <div className="w-20 flex justify-center">
                            <Checkbox
                              ref={(el) => {
                                winnerCheckboxRefs.current[player.id] = el;
                              }}
                              checked={player.isWinner}
                              onCheckedChange={(checked) =>
                                updatePlayer(
                                  player.id,
                                  "isWinner",
                                  checked as boolean
                                )
                              }
                              tabIndex={idx * 4 + 3}
                              onKeyDown={(e) => {
                                if (e.key === "Tab" && !e.shiftKey) {
                                  e.preventDefault();
                                  focusNextTie(player.id);
                                }
                              }}
                            />
                          </div>
                          <div className="w-16 flex justify-center">
                            <Checkbox
                              ref={(el) => {
                                tieCheckboxRefs.current[player.id] = el;
                              }}
                              checked={player.isTie}
                              onCheckedChange={(checked) =>
                                updatePlayer(
                                  player.id,
                                  "isTie",
                                  checked as boolean
                                )
                              }
                              tabIndex={idx * 4 + 4}
                              onKeyDown={(e) => {
                                if (e.key === "Tab" && !e.shiftKey) {
                                  e.preventDefault();
                                  focusNextPlayer(idx);
                                }
                              }}
                            />
                          </div>
                        </div>
                        {/* Tablet Layout */}
                        <div className="hidden sm:flex lg:hidden flex-1 items-center gap-3 p-4 border rounded-lg">
                          <div className="flex-1 min-w-0">
                            <PlayerInput
                              value={player.name}
                              onChange={(name, userId) =>
                                updatePlayerName(player.id, name, userId!)
                              }
                              onNext={() => focusNextScore(player.id)}
                              placeholder={`Player ${idx + 1}`}
                            />
                          </div>
                          <div className="w-20">
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
                                // Allow empty string, negative sign, or valid integers
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
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex flex-col items-center gap-1">
                              <span className="text-xs text-muted-foreground">
                                Win
                              </span>
                              <Checkbox
                                checked={player.isWinner}
                                onCheckedChange={(checked) =>
                                  updatePlayer(
                                    player.id,
                                    "isWinner",
                                    checked as boolean
                                  )
                                }
                              />
                            </div>
                            <div className="flex flex-col items-center gap-1">
                              <span className="text-xs text-muted-foreground">
                                Tie
                              </span>
                              <Checkbox
                                checked={player.isTie}
                                onCheckedChange={(checked) =>
                                  updatePlayer(
                                    player.id,
                                    "isTie",
                                    checked as boolean
                                  )
                                }
                              />
                            </div>
                          </div>
                        </div>

                        {/* Mobile Layout */}
                        <div className="flex-1 sm:hidden space-y-3 p-4 border rounded-lg">
                          <div className="space-y-2">
                            <Label className="text-sm font-medium text-muted-foreground">
                              Player Name
                            </Label>
                            <PlayerInput
                              value={player.name}
                              onChange={(name, userId) =>
                                updatePlayerName(player.id, name, userId!)
                              }
                              onNext={() => focusNextScore(player.id)}
                              placeholder={`Player ${idx + 1}`}
                            />
                          </div>
                          <div className="grid grid-cols-3 gap-3">
                            <div className="space-y-2">
                              <Label className="text-sm font-medium text-muted-foreground">
                                Score
                              </Label>
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
                                  // Allow empty string, negative sign, or valid integers
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
                              />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-sm font-medium text-muted-foreground">
                                Winner
                              </Label>
                              <div className="flex justify-center pt-2">
                                <Checkbox
                                  checked={player.isWinner}
                                  onCheckedChange={(checked) =>
                                    updatePlayer(
                                      player.id,
                                      "isWinner",
                                      checked as boolean
                                    )
                                  }
                                />
                              </div>
                            </div>
                            <div className="space-y-2">
                              <Label className="text-sm font-medium text-muted-foreground">
                                Tie
                              </Label>
                              <div className="flex justify-center pt-2">
                                <Checkbox
                                  checked={player.isTie}
                                  onCheckedChange={(checked) =>
                                    updatePlayer(
                                      player.id,
                                      "isTie",
                                      checked as boolean
                                    )
                                  }
                                />
                              </div>
                            </div>
                          </div>
                        </div>

                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removePlayer(player.id)}
                          className="p-2 text-muted-foreground hover:text-destructive min-h-[44px] min-w-[44px] shrink-0"
                          disabled={players.length <= 1}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Save Game Session"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Page;
