"use client";
import { getSelectablePlayers } from "@/app/(generic)/session/create/action";
import { Player } from "@/components/SessionForm";
import PlayerInput, { PlayerInputHandle } from "@/components/PlayerInput";
import ScoreInput from "@/components/ScoreInput";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Ghost, Loader2, Minus, Plus, Skull, Trophy, X } from "lucide-react";
import React, { useRef } from "react";
import { useFormStatus } from "react-dom";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface CountStepperProps {
  count: number;
  onAdd: () => void;
  onRemove: () => void;
  addLabel: string;
  removeLabel: string;
}

interface PlayerSessionSelectionProps {
  selectablePlayers: Awaited<ReturnType<typeof getSelectablePlayers>>[number][];
  players: Player[];
  setPlayers: React.Dispatch<React.SetStateAction<Player[]>>;
  submitted?: boolean;
  teamMode?: boolean;
  coop?: boolean;
  isSolo?: boolean;
}

const makeBlankPlayer = (teamId?: string | null): Player => ({
  id: Date.now().toString() + Math.random().toString(36).slice(2, 6),
  profileId: 0,
  firstName: "",
  lastName: "",
  username: "",
  groupId: "",
  profilePic: "",
  isAnonymous: false,
  score: null,
  isWinner: false,
  isTie: false,
  teamId: teamId ?? null,
});

const CountStepper = ({
  count,
  onAdd,
  onRemove,
  addLabel,
  removeLabel,
}: CountStepperProps) => {
  return (
    <div className="inline-flex w-fit -space-x-px rounded-md shadow-xs rtl:space-x-reverse">
      <Button
        variant="outline"
        type="button"
        size="icon"
        className="rounded-none rounded-l-md shadow-none focus-visible:z-10"
        onClick={onRemove}
        disabled={count <= 1}
      >
        <Minus className="w-4 h-4" />
        <span className="sr-only">{removeLabel}</span>
      </Button>
      <span className="bg-background dark:border-input dark:bg-input/30 flex items-center border px-3 text-sm font-medium">
        {count}
      </span>
      <Button
        variant="outline"
        type="button"
        size="icon"
        className="rounded-none rounded-r-md shadow-none focus-visible:z-10"
        onClick={onAdd}
      >
        <Plus className="w-4 h-4" />
        <span className="sr-only">{addLabel}</span>
      </Button>
    </div>
  );
};

const PlayerSessionSelection = ({
  selectablePlayers,
  players,
  setPlayers,
  submitted = false,
  teamMode = false,
  coop = false,
  isSolo = false,
}: PlayerSessionSelectionProps) => {
  const { pending } = useFormStatus();
  const pathname = usePathname();
  const router = useRouter();
  const isEdit = pathname.includes("/edit/");
  const playerInputRefs = useRef<Map<string, PlayerInputHandle>>(new Map());

  // Functions
  const handleAddPlayer = () => {
    setPlayers([...players, makeBlankPlayer()]);
  };

  const handleReducePlayer = (id: string) => {
    if (players.length > 1) {
      setPlayers(players.filter((player) => player.id !== id));
    }
  };

  // Stepper "-" in regular mode drops the last player row.
  const handleReduceLastPlayer = () => {
    if (players.length > 1) {
      setPlayers(players.slice(0, -1));
    }
  };

  const handleUpdates = (id: string, updates: Partial<Player>) => {
    setPlayers((prev) =>
      prev.map((player) =>
        player.id === id ? { ...player, ...updates } : player,
      ),
    );
  };

  // Shared score/winner/tie controls write to every member of a team.
  const handleUpdateTeam = (teamId: string, updates: Partial<Player>) => {
    setPlayers((prev) =>
      prev.map((player) =>
        player.teamId === teamId ? { ...player, ...updates } : player,
      ),
    );
  };

  // Applies the same Object update to all players
  const handleUpdateAll = (updates: Partial<Player>) => {
    setPlayers((prev) => prev.map((player) => ({ ...player, ...updates })));
  };

  const handleAddMemberToTeam = (teamId: string) => {
    setPlayers((prev) => {
      const rep = prev.find((p) => p.teamId === teamId);
      const member = makeBlankPlayer(teamId);
      if (rep) {
        member.score = rep.score;
        member.isWinner = rep.isWinner;
        member.isTie = rep.isTie;
      }
      let lastIdx = -1;
      prev.forEach((p, i) => {
        if (p.teamId === teamId) lastIdx = i;
      });
      const next = [...prev];
      next.splice(lastIdx + 1, 0, member);
      return next;
    });
  };

  const handleAddTeam = () => {
    setPlayers([...players, makeBlankPlayer(crypto.randomUUID())]);
  };

  const handleRemoveTeam = (teamId: string) => {
    setPlayers((prev) => {
      const remaining = prev.filter((p) => p.teamId !== teamId);
      return remaining.length > 0 ? remaining : prev;
    });
  };

  // Group players into teams for team-mode rendering, preserving order.
  const teamOrder: string[] = [];
  const teamMap = new Map<string, Player[]>();
  for (const player of players) {
    const key = player.teamId ?? player.id;
    if (!teamMap.has(key)) {
      teamMap.set(key, []);
      teamOrder.push(key);
    }
    teamMap.get(key)!.push(player);
  }

  // Stepper "-" in team mode drops the last team (and all its members).
  const handleRemoveLastTeam = () => {
    if (teamOrder.length <= 1) return;
    const lastTeamId = teamOrder[teamOrder.length - 1];
    setPlayers((prev) => prev.filter((p) => p.teamId !== lastTeamId));
  };

  // Player-name combobox shared by both modes; filters out accounts already
  // picked in other rows so the same profile can't be selected twice.
  const renderPlayerNameInput = (player: Player) => {
    const selectedProfileIds = new Set(
      players
        .filter((p) => p.id !== player.id && p.profileId !== 0)
        .map((p) => p.profileId),
    );
    const availablePlayers = selectablePlayers.filter(
      (p) => !selectedProfileIds.has(p.profileId),
    );
    return (
      <PlayerInput
        ref={(handle) => {
          if (handle) playerInputRefs.current.set(player.id, handle);
          else playerInputRefs.current.delete(player.id);
        }} // Remove the selected user by clearing the input field
        selectablePlayers={availablePlayers}
        playerId={player.id}
        playerSelect={handleUpdates}
        playerDetails={player.profileId !== 0 ? player : undefined}
        allowAnonymous={!isEdit}
        invalid={submitted && player.firstName === ""}
      />
    );
  };

  // Anonymous player button: Converts whatever is entered in the input into
  // the anonymous user's name
  const AnonymousButton = ({ player }: { player: Player }) => (
    <button
      type="button"
      aria-label={
        player.isAnonymous ? "Anonymous player" : "Mark as anonymous player"
      }
      title={
        player.isAnonymous ? "Anonymous player" : "Mark as anonymous player"
      }
      aria-pressed={player.isAnonymous}
      onClick={() => playerInputRefs.current.get(player.id)?.markAnonymous()}
      className={cn(
        "absolute bottom-2 right-2 z-20 flex h-7 w-7 items-center justify-center rounded-full transition-colors",
        player.isAnonymous
          ? "text-accent-5"
          : "text-muted-foreground hover:bg-accent hover:text-foreground",
      )}
    >
      <Ghost className="h-4 w-4" />
    </button>
  );

  return (
    <div>
      {/* Coop: Scores + Win/ Lost are shared across all players in the session */}
      {/* Coop Toggle Button */}
      {coop && (
        <div className="my-3 flex flex-row gap-6 rounded-md bg-muted/40 px-4 py-3 md:flex-col md:gap-3">
          <div className="order-1 flex flex-col md:flex-row md:items-center md:justify-between">
            <Label className="text-muted-foreground mb-2 md:mb-0">
              Did the group win?
            </Label>
            <div
              role="group"
              aria-label="Session outcome"
              className="inline-flex rounded-md border bg-background p-0.5"
            >
              <button
                type="button"
                aria-pressed={players[0]?.isWinner === true}
                onClick={() =>
                  handleUpdateAll({ isWinner: true, isTie: false })
                }
                className={cn(
                  "flex items-center gap-1.5 rounded-[0.3rem] px-3 py-1.5 text-sm font-semibold transition-colors",
                  players[0]?.isWinner === true
                    ? "bg-accent-1 text-[oklch(25.3%_0.0321_265.95)]"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Trophy className="h-4 w-4" />
                Won
              </button>
              <button
                type="button"
                aria-pressed={players[0]?.isWinner === false}
                onClick={() =>
                  handleUpdateAll({ isWinner: false, isTie: false })
                }
                className={cn(
                  "flex items-center gap-1.5 rounded-[0.3rem] px-3 py-1.5 text-sm font-semibold transition-colors",
                  players[0]?.isWinner === false
                    ? "bg-destructive text-white"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Skull className="h-4 w-4" />
                Lost
              </button>
            </div>
          </div>

          {/* Coop Score Field */}
          <div className="order-2 flex flex-col md:flex-row md:items-center md:justify-between">
            <Label className="text-muted-foreground mb-2 md:mb-0">Score</Label>
            <div className="flex h-9 items-center gap-1.5">
              <div className="w-20">
                <ScoreInput
                  key="coop-score"
                  playerId="coop"
                  updateScore={(_id, updates) => handleUpdateAll(updates)}
                  initialValue={players[0]?.score}
                />
              </div>
              <span className="text-xs font-semibold uppercase tracking-[0.04em] text-muted-foreground">
                pts
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Control Section */}
      <div className="flex justify-between items-center">
        {teamMode ? (
          <CountStepper
            count={teamOrder.length}
            onAdd={handleAddTeam}
            onRemove={handleRemoveLastTeam}
            addLabel="Add Team"
            removeLabel="Remove Team"
          />
        ) : (
          <CountStepper
            count={players.length}
            onAdd={handleAddPlayer}
            onRemove={handleReduceLastPlayer}
            addLabel="Add Player"
            removeLabel="Remove Player"
          />
        )}
        <div className="flex items-center gap-2">
          {isEdit && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="font-semibold hover:cursor-pointer text-destructive border-destructive hover:bg-red-200 hover:text-red-600"
              onClick={() => router.back()}
              disabled={pending}
            >
              Cancel
            </Button>
          )}
          <Button
            type="submit"
            variant="outline"
            size="sm"
            className="font-semibold text-white bg-accent-5 hover:bg-accent-5/80 focus-visible:ring-accent-5/20bg-accent-5 dark:bg-accent-5 dark:hover:bg-accent-5/80 hover:cursor-pointer"
            disabled={pending}
          >
            {pending ? (
              <div className="flex items-center">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                <span>{isEdit ? "Updating..." : "Saving..."}</span>
              </div>
            ) : isEdit ? (
              "Update"
            ) : (
              "Save"
            )}
          </Button>
        </div>
      </div>

      {/* Team Mode: All members of the team share the same score and outcome */}
      {teamMode ? (
        <div className="flex flex-col gap-3 mt-3">
          {teamOrder.map((teamId, teamIdx) => {
            const members = teamMap.get(teamId)!;
            const teamRep = members[0];
            return (
              <Card
                key={teamId}
                className="group relative w-full overflow-hidden border-muted-foreground/20 bg-card/50 backdrop-blur-sm transition-all hover:border-muted-foreground/50 rounded-md shadow-none"
              >
                {/* Team Position */}
                <div
                  className="pointer-events-none absolute left-2 top-1 z-0 select-none text-4xl leading-none text-muted-foreground/30"
                  aria-hidden="true"
                >
                  {teamIdx + 1}
                </div>

                {/* Remove Team */}
                <Button
                  variant="ghost"
                  type="button"
                  size="icon"
                  className="absolute right-2 top-1 z-20 h-8 w-8 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => handleRemoveTeam(teamId)}
                  disabled={teamOrder.length <= 1}
                >
                  <X className="h-4 w-4" />
                  <span className="sr-only">Remove team</span>
                </Button>

                <CardContent className="relative z-10 py-3 px-6 sm:px-10">
                  <div className="flex flex-col gap-5 md:flex-row md:gap-6">
                    {/* Roster: label + member rows + add player */}
                    <div className="w-full min-w-0 md:flex-1">
                      <Label className="text-muted-foreground mb-2">
                        Players
                      </Label>
                      <div className="flex flex-col gap-2">
                        {members.map((player) => (
                          <div
                            key={player.id}
                            className="flex items-center gap-1.5"
                          >
                            <div className="min-w-0 flex-1">
                              {renderPlayerNameInput(player)}
                            </div>
                            <Button
                              variant="ghost"
                              type="button"
                              size="icon"
                              className="h-8 w-8 shrink-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                              onClick={() => handleReducePlayer(player.id)}
                              disabled={players.length <= 1}
                            >
                              <X className="h-4 w-4" />
                              <span className="sr-only">Remove player</span>
                            </Button>
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => handleAddMemberToTeam(teamId)}
                          className="mt-0.5 inline-flex w-fit items-center gap-1 text-sm font-semibold text-primary transition-colors hover:text-primary/80"
                        >
                          <Plus className="h-4 w-4" />
                          Add player
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-4 border-t pt-4 md:border-t-0 md:pt-0 md:items-end md:justify-start md:shrink-0 md:self-start md:pr-2">
                      <div>
                        <Label className="text-muted-foreground mb-2">
                          Score
                        </Label>
                        <div className="flex h-9 items-center gap-1.5">
                          <div className="w-20">
                            <ScoreInput
                              key={`${teamId}-score`}
                              playerId={teamId}
                              updateScore={(_id, updates) =>
                                handleUpdateTeam(teamId, updates)
                              }
                              initialValue={teamRep.score}
                            />
                          </div>
                          <span className="text-xs font-semibold uppercase tracking-[0.04em] text-muted-foreground">
                            pts
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 sm:gap-4">
                        <div className="flex flex-col items-center">
                          <Label
                            htmlFor={`team-winner-${teamIdx}`}
                            className="text-muted-foreground mb-2"
                          >
                            Winner
                          </Label>
                          <div className="flex h-11 w-11 items-center justify-center md:h-9 md:w-9">
                            <Checkbox
                              id={`team-winner-${teamIdx}`}
                              className="h-7 w-7 border-2 data-[state=checked]:bg-accent-3 dark:data-[state=checked]:bg-accent-3 data-[state=checked]:border-blue-500 rounded-full"
                              checked={teamRep.isWinner}
                              onCheckedChange={(checked) =>
                                handleUpdateTeam(teamId, {
                                  isWinner: checked as boolean,
                                })
                              }
                            />
                          </div>
                        </div>
                        <div className="flex flex-col items-center">
                          <Label
                            htmlFor={`team-tied-${teamIdx}`}
                            className="text-muted-foreground mb-2"
                          >
                            Tied
                          </Label>
                          <div className="flex h-11 w-11 items-center justify-center md:h-9 md:w-9">
                            <Checkbox
                              id={`team-tied-${teamIdx}`}
                              className="h-7 w-7 border-2 data-[state=checked]:bg-accent-3 dark:data-[state=checked]:bg-accent-3 data-[state=checked]:border-blue-500 rounded-full"
                              checked={teamRep.isTie}
                              onCheckedChange={(checked) =>
                                handleUpdateTeam(teamId, {
                                  isTie: checked as boolean,
                                })
                              }
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className={cn("flex flex-col gap-2", coop ? "mt-2" : "mt-3")}>
          {players.map((player, idx) => (
            <Card
              key={player.id}
              className="group relative w-full overflow-hidden border-muted-foreground/20 bg-card/50 backdrop-blur-sm transition-all hover:border-muted-foreground/50 rounded-md shadow-none"
            >
              {/* Player Position */}
              <div
                className="pointer-events-none absolute left-2 top-1 z-0 select-none text-4xl leading-none text-muted-foreground/30"
                aria-hidden="true"
              >
                {idx + 1}
              </div>

              {/* Remove Player */}
              <Button
                variant="ghost"
                type="button"
                size="icon"
                className="absolute right-2 top-1 z-20 h-8 w-8 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                onClick={() => handleReducePlayer(player.id)}
              >
                <X className="h-4 w-4" />
              </Button>

              {!isEdit && <AnonymousButton player={player} />}

              {/* Card Body */}
              <CardContent className="relative z-10 py-0 px-6 pb-4 sm:px-10 md:pb-0">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between md:gap-6">
                  <div className="w-full md:max-w-lg md:flex-1 md:pr-0">
                    <Label className="text-muted-foreground mb-2">
                      Player Name
                    </Label>
                    {renderPlayerNameInput(player)}
                  </div>

                  {/* Regular score input (not Coop) */}
                  {!coop && (
                    <div className="flex items-center gap-6 border-t pt-4 sm:gap-8 md:mr-4 md:border-t-0 md:pt-0">
                      <div className="md:-left-1">
                        <Label className="text-muted-foreground mb-2">
                          Score
                        </Label>
                        <div className="flex items-center gap-1.5">
                          <div className="w-20">
                            <ScoreInput
                              playerId={player.id}
                              updateScore={handleUpdates}
                              initialValue={player.score}
                            />
                          </div>
                          <span className="text-xs font-semibold uppercase tracking-[0.04em] text-muted-foreground">
                            pts
                          </span>
                        </div>
                      </div>

                      {/* Solo games only have a single result score field */}
                      {isSolo ? (
                        <div className="ml-auto md:ml-0">
                          <Label className="text-muted-foreground mb-2 block">
                            Result
                          </Label>
                          <div
                            role="group"
                            aria-label="Session outcome"
                            className="inline-flex rounded-md border p-0.5"
                          >
                            <button
                              type="button"
                              aria-pressed={player.isWinner === true}
                              onClick={() =>
                                handleUpdates(player.id, {
                                  isWinner: true,
                                  isTie: false,
                                })
                              }
                              className={cn(
                                "flex items-center gap-1.5 rounded-[0.3rem] px-3 py-1.5 text-sm font-semibold transition-colors",
                                player.isWinner === true
                                  ? "bg-accent-1 text-[oklch(25.3%_0.0321_265.95)]"
                                  : "text-muted-foreground hover:text-foreground",
                              )}
                            >
                              <Trophy className="h-4 w-4" />
                              Won
                            </button>
                            <button
                              type="button"
                              aria-pressed={player.isWinner === false}
                              onClick={() =>
                                handleUpdates(player.id, {
                                  isWinner: false,
                                  isTie: false,
                                })
                              }
                              className={cn(
                                "flex items-center gap-1.5 rounded-[0.3rem] px-3 py-1.5 text-sm font-semibold transition-colors",
                                player.isWinner === false
                                  ? "bg-destructive text-white"
                                  : "text-muted-foreground hover:text-foreground",
                              )}
                            >
                              <Skull className="h-4 w-4" />
                              Lost
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="ml-auto flex items-center gap-4 md:ml-0">
                          <div className="flex flex-col items-center">
                            <Label
                              htmlFor={`winner-${idx}`}
                              className="text-muted-foreground mb-2"
                            >
                              Winner
                            </Label>
                            <div className="flex h-11 w-11 items-center justify-center md:h-9 md:w-9">
                              <Checkbox
                                id={`winner-${idx}`}
                                className="h-7 w-7 border-2 data-[state=checked]:bg-accent-3 dark:data-[state=checked]:bg-accent-3 data-[state=checked]:border-blue-500 rounded-full"
                                checked={player.isWinner}
                                onCheckedChange={(checked) =>
                                  handleUpdates(player.id, {
                                    isWinner: checked as boolean,
                                  })
                                }
                              />
                            </div>
                          </div>
                          <div className="flex flex-col items-center">
                            <Label
                              htmlFor={`tied-${idx}`}
                              className="text-muted-foreground mb-2"
                            >
                              Tied
                            </Label>
                            <div className="flex h-11 w-11 items-center justify-center md:h-9 md:w-9">
                              <Checkbox
                                id={`tied-${idx}`}
                                className="h-7 w-7 border-2 data-[state=checked]:bg-accent-3 dark:data-[state=checked]:bg-accent-3 data-[state=checked]:border-blue-500 rounded-full"
                                checked={player.isTie}
                                onCheckedChange={(checked) =>
                                  handleUpdates(player.id, {
                                    isTie: checked as boolean,
                                  })
                                }
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add a new team/ playere button */}
      <div className="flex w-full items-center justify-center mt-4">
        <Button
          variant="ghost"
          type="button"
          size="icon"
          className="rounded-full bg-primary/80 hover:bg-primary dark:hover:bg-primary"
          onClick={teamMode ? handleAddTeam : handleAddPlayer}
        >
          <Plus className="w-6 h-6 text-white" />
          <span className="sr-only">
            {teamMode ? "Add Team" : "Add Player"}
          </span>
        </Button>
      </div>
    </div>
  );
};

export default PlayerSessionSelection;
