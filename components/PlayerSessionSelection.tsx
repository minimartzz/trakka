"use client";
import { getSelectablePlayers } from "@/app/(generic)/session/create/action";
import { Player } from "@/app/(generic)/session/create/page";
import PlayerInput2 from "@/components/PlayerInput2";
import ScoreInput from "@/components/ScoreInput";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Loader2, Minus, Plus, X } from "lucide-react";
import React, { useEffect, useState } from "react";

interface PlayerControllerProps {
  players: Player[];
  setPlayers: React.Dispatch<React.SetStateAction<Player[]>>;
}

interface PlayerSessionSelectionProps {
  selectablePlayers: Awaited<ReturnType<typeof getSelectablePlayers>>[number][];
  players: Player[];
  setPlayers: React.Dispatch<React.SetStateAction<Player[]>>;
  submitting: boolean;
}

const PlayerController = ({ players, setPlayers }: PlayerControllerProps) => {
  const handleReducePlayer = () => {
    if (players.length > 1) {
      setPlayers(players.slice(0, -1));
    }
  };

  const handleAddPlayer = () => {
    const newPlayer: Player = {
      id: Date.now().toString(),
      userId: 0,
      name: "",
      score: null,
      isWinner: false,
      isTie: false,
    };
    setPlayers([...players, newPlayer]);
  };

  return (
    <div className="inline-flex w-fit -space-x-px rounded-md shadow-xs rtl:space-x-reverse">
      <Button
        variant="outline"
        type="button"
        size="icon"
        className="rounded-none rounded-l-md shadow-none focus-visible:z-10"
        onClick={handleReducePlayer}
        disabled={players.length <= 1}
      >
        <Minus className="w-4 h-4" />
        <span className="sr-only">Remove Player</span>
      </Button>
      <span className="bg-background dark:border-input dark:bg-input/30 flex items-center border px-3 text-sm font-medium">
        {players.length}
      </span>
      <Button
        variant="outline"
        type="button"
        size="icon"
        className="rounded-none rounded-r-md shadow-none focus-visible:z-10"
        onClick={handleAddPlayer}
      >
        <Plus className="w-4 h-4" />
        <span className="sr-only">Add Player</span>
      </Button>
    </div>
  );
};

const PlayerSessionSelection = ({
  selectablePlayers,
  players,
  setPlayers,
  submitting,
}: PlayerSessionSelectionProps) => {
  // Functions
  const handleAddPlayer = () => {
    const newPlayer: Player = {
      id: Date.now().toString(),
      userId: 0,
      name: "",
      score: null,
      isWinner: false,
      isTie: false,
    };
    setPlayers([...players, newPlayer]);
  };

  const handleReducePlayer = () => {
    if (players.length > 1) {
      setPlayers(players.slice(0, -1));
    }
  };

  const handleUpdates = (id: string, updates: Partial<Player>) => {
    setPlayers((prev) =>
      prev.map((player) =>
        player.id === id ? { ...player, ...updates } : player
      )
    );
  };

  return (
    <div>
      {/* Control Section */}
      <div className="flex justify-between items-center">
        <PlayerController players={players} setPlayers={setPlayers} />
        <Button
          type="submit"
          variant="outline"
          size="sm"
          className="bg-green-600/80 text-white hover:bg-green-600/40 focus-visible:ring-green-600/20 hover:text-green-600 dark:bg-green-400/10 dark:text-green-400 dark:hover:bg-green-400/20 dark:focus-visible:ring-green-400/40 font-semibold"
          disabled={submitting}
        >
          {submitting ? (
            <div className="flex items-center">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              <span>Saving ...</span>
            </div>
          ) : (
            "Save"
          )}
        </Button>
      </div>

      {/* Player Details */}
      <div className="flex flex-col gap-2 mt-3">
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
              onClick={handleReducePlayer}
            >
              <X className="h-4 w-4" />
            </Button>

            {/* Card Body */}
            <CardContent className="relative z-10 py-0 px-10">
              <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                {/* TODO: Player Input */}
                <div className="w-full md:max-w-lg md:flex-1 md:pr-0">
                  <Label className="text-muted-foreground mb-2">
                    Player Name
                  </Label>
                  <PlayerInput2
                    selectablePlayers={selectablePlayers}
                    playerId={player.id}
                    playerSelect={handleUpdates}
                  />
                </div>

                <div className="flex items-center space-x-4 mr-4">
                  {/* Score Input */}
                  <div className="w-20 -left-1">
                    <Label className="text-muted-foreground mb-2">Score</Label>
                    <ScoreInput
                      playerId={player.id}
                      updateScore={handleUpdates}
                    />
                  </div>

                  {/* Winner and Tie checkboxes */}
                  <div className="flex flex-col items-center">
                    <Label
                      htmlFor={`winner-${idx}`}
                      className="text-muted-foreground mb-2"
                    >
                      Winner
                    </Label>
                    <Checkbox
                      id={`winner-${idx}`}
                      className="h-7 w-7 border-2 data-[state=checked]:bg-primary data-[state=checked]:border-blue-600 rounded-full"
                      checked={player.isWinner}
                      onCheckedChange={(checked) =>
                        handleUpdates(player.id, {
                          isWinner: checked as boolean,
                        })
                      }
                    />
                  </div>
                  <div className="flex flex-col items-center">
                    <Label
                      htmlFor={`tied-${idx}`}
                      className="text-muted-foreground mb-2"
                    >
                      Tied
                    </Label>
                    <Checkbox
                      id={`tied-${idx}`}
                      className="h-7 w-7 border-2 data-[state=checked]:bg-primary data-[state=checked]:border-blue-600 rounded-full"
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
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add Players Button - at Bottom */}
      <div className="flex w-full items-center justify-center mt-4">
        <Button
          variant="ghost"
          type="button"
          size="icon"
          className="rounded-full bg-primary/80 hover:bg-primary dark:hover:bg-primary"
          onClick={handleAddPlayer}
        >
          <Plus className="w-6 h-6 text-white" />
          <span className="sr-only">Add Player</span>
        </Button>
      </div>
    </div>
  );
};

export default PlayerSessionSelection;
