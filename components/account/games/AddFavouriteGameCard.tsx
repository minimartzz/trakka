"use client";

import { addFavouriteGame } from "@/app/(account)/account/games/action";
import BGGSearchBar from "@/components/BGGSearchBar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { FavouriteGame } from "@/db/schema/profile";
import type { BGGDetailsInterface } from "@/utils/fetchBgg";
import { Loader2, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface AddFavouriteGameCardProps {
  onAdded: (game: FavouriteGame) => void;
}

/**
 * The dashed "+" slot: opens a dialog to search BGG, then closes immediately
 * on selection and hands the parent grid a "pending" card that shows a
 * spinner until the save round-trip resolves.
 */
const AddFavouriteGameCard = ({ onAdded }: AddFavouriteGameCardProps) => {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSelect = async (result: BGGDetailsInterface) => {
    setOpen(false);
    setSaving(true);

    const game: FavouriteGame = {
      bggId: Number(result.id),
      title: result.title,
      image: result.image || null,
    };

    const response = await addFavouriteGame(game);
    setSaving(false);

    if (!response.success) {
      toast.error(response.message ?? "Failed to add that game.");
      return;
    }

    onAdded(game);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={saving}
        aria-label="Add a favourite game"
        className="flex aspect-[3/4] flex-col items-center justify-center gap-2 rounded-lg border border-dashed text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground disabled:pointer-events-none"
      >
        {saving ? (
          <Loader2 className="size-6 animate-spin" />
        ) : (
          <>
            <Plus className="size-6" />
            <span className="text-xs font-medium">Add a game</span>
          </>
        )}
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add a favourite game</DialogTitle>
          </DialogHeader>
          <BGGSearchBar showPreview={false} onSelect={handleSelect} />
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AddFavouriteGameCard;
