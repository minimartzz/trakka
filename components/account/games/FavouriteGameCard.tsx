"use client";

import { removeFavouriteGame } from "@/app/(account)/account/games/action";
import type { FavouriteGame } from "@/db/schema/profile";
import { cn } from "@/lib/utils";
import { Loader2, Trash2 } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { toast } from "sonner";

interface FavouriteGameCardProps {
  game: FavouriteGame;
  onRemoved: (bggId: number) => void;
  /** Touch-tapped open state. Owned by the parent grid so tapping a second
   * card closes the first — only one card is open at a time on touch. */
  tapped: boolean;
  onToggleTapped: () => void;
}

/**
 * A picked game as a cover + title. Desktop reveals a delete button on
 * hover, touch devices toggle it on tap.
 */
const FavouriteGameCard = ({
  game,
  onRemoved,
  tapped,
  onToggleTapped,
}: FavouriteGameCardProps) => {
  const [removing, setRemoving] = useState(false);

  const handleRemove = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (removing) return;
    setRemoving(true);
    const result = await removeFavouriteGame(game.bggId);
    if (!result.success) {
      setRemoving(false);
      toast.error(result.message ?? "Failed to remove that game.");
      return;
    }
    onRemoved(game.bggId);
  };

  return (
    <div
      className="group/card relative aspect-3/4 overflow-hidden rounded-lg border bg-card [@media(hover:hover)_and_(pointer:fine)]:cursor-default"
      // Touch devices: tap toggles the delete overlay.
      onClick={onToggleTapped}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onToggleTapped();
        }
      }}
      aria-label={`${game.title}`}
    >
      <div className="absolute inset-0 flex flex-col">
        <div className="relative flex-1 bg-muted">
          {game.image && (
            <Image
              src={game.image}
              alt=""
              fill
              sizes="(min-width: 1024px) 16vw, 33vw"
              className="object-cover"
            />
          )}
        </div>
        <div className="p-2.5">
          <p className="truncate text-sm font-medium">{game.title}</p>
        </div>
      </div>

      <div
        className={cn(
          "absolute inset-0 bg-black/0 transition-colors duration-150",
          "[@media(hover:hover)_and_(pointer:fine)]:group-hover/card:bg-black/40",
          tapped && "bg-black/40",
        )}
      >
        <button
          type="button"
          onClick={handleRemove}
          disabled={removing}
          aria-label={`Remove ${game.title} from favourites`}
          className={cn(
            "absolute top-1.5 right-1.5 flex size-7 items-center justify-center rounded-full bg-destructive text-white shadow-sm transition-opacity",
            "opacity-0 [@media(hover:hover)_and_(pointer:fine)]:group-hover/card:opacity-100",
            tapped && "opacity-100",
          )}
        >
          {removing ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Trash2 className="size-3.5" />
          )}
        </button>
      </div>
    </div>
  );
};

export default FavouriteGameCard;
