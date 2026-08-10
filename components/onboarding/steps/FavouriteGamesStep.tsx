"use client";

import BGGSearchBar from "@/components/BGGSearchBar";
import { Button } from "@/components/ui/button";
import type { FavouriteGame } from "@/db/schema/profile";
import { X } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";

const MAX_GAMES = 5;

interface FavouriteGamesStepProps {
  games: FavouriteGame[];
  onChange: (games: FavouriteGame[]) => void;
}

const FavouriteGamesStep = ({ games, onChange }: FavouriteGamesStepProps) => {
  const isFull = games.length >= MAX_GAMES;

  return (
    <div className="flex flex-col gap-6">
      {isFull ? (
        <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
          That&apos;s all five. Remove one to swap it out.
        </p>
      ) : (
        <BGGSearchBar
          showPreview={false}
          clearOnSelect
          onSelect={(game) => {
            const bggId = Number(game.id);
            if (games.some((g) => g.bggId === bggId)) {
              toast.info(`${game.title} is already on your list.`);
              return;
            }
            onChange([
              ...games,
              {
                bggId,
                title: game.title,
                image: game.image || null,
              },
            ]);
          }}
        />
      )}

      <div>
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="text-sm font-medium">Your picks</h2>
          <span className="text-xs tabular-nums text-muted-foreground">
            {games.length} / {MAX_GAMES}
          </span>
        </div>

        <ul className="grid grid-cols-3 gap-3 sm:grid-cols-5">
          {Array.from({ length: MAX_GAMES }).map((_, index) => {
            const game = games[index];

            if (!game) {
              return (
                <li
                  key={`empty-${index}`}
                  className="flex aspect-square items-center justify-center rounded-lg border border-dashed"
                >
                  <span className="font-display text-xl font-bold text-muted-foreground/40 tabular-nums">
                    {index + 1}
                  </span>
                </li>
              );
            }

            return (
              <li key={game.bggId} className="group relative">
                <div className="relative aspect-square overflow-hidden rounded-lg border bg-muted">
                  {game.image && (
                    <Image
                      src={game.image}
                      alt={game.title}
                      fill
                      sizes="(min-width: 640px) 20vw, 33vw"
                      className="object-cover"
                    />
                  )}
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  size="icon-sm"
                  onClick={() =>
                    onChange(games.filter((g) => g.bggId !== game.bggId))
                  }
                  aria-label={`Remove ${game.title}`}
                  className="absolute -top-2 -right-2 rounded-full shadow-sm"
                >
                  <X />
                </Button>
                <p className="mt-1.5 truncate text-xs text-muted-foreground">
                  {game.title}
                </p>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
};

export default FavouriteGamesStep;
