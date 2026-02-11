"use client";
import { genInvite } from "@/components/actions/genInvite";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Share, Share2 } from "lucide-react";
import React, { useState } from "react";
import { toast } from "sonner";

interface ShareButtonProps {
  userId: number;
  tribes: {
    id: string;
    name: string;
  }[];
}

const ShareButton = ({ userId, tribes }: ShareButtonProps) => {
  const [loading, setLoading] = useState(false);
  const [tribeId, setTribeId] = useState<string | null>(null);
  const [tribeName, setTribeName] = useState<string | null>(null);

  const handleSelect = (value: string) => {
    const name = tribes.filter((tribe) => tribe.id === value)[0].name;
    setTribeId(value);
    setTribeName(name);
  };

  const handleShare = async () => {
    // Check if user has selected a tribe
    if (!tribeId) {
      toast.error("Please select a tribe");
      return;
    }

    setLoading(true);
    try {
      // Call server action and get invite link
      const result = await genInvite(tribeId, userId);
      if (!result.success || !result.inviteCode) {
        toast.error(result.message);
        return;
      }

      // Create the invite link
      const baseUrl =
        process.env.NEXT_PUBLIC_BASE_URL || window.location.origin;
      const inviteUrl = `${baseUrl}/join/${result.inviteCode}`;
      const shareData = {
        title: `Join ${tribeName} today!`,
        text: "Here is a unique invite link to join our tribe!",
        url: inviteUrl,
      };

      // Create the Web Share Invite link
      if (navigator.share) {
        try {
          await navigator.share(shareData);
        } catch (error) {
          if ((error as Error).name !== "AbortError") {
            console.error("Error sharing content", error);
          }
        }
      } else {
        await navigator.clipboard.writeText(inviteUrl);
        toast.success("Link copied to clipboard!");
      }
    } catch (error) {
      toast.error("Failed to generated invite link");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          className="gap-x-2 bg-accent-4 hover:bg-accent-4/80 dark:bg-accent-4/80 dark:hover:bg-accent-4"
          variant="outline"
        >
          <Share className="h-4 w-4 text-white" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-85">
        <div className="flex-col">
          <div className="space-y-2">
            <h4 className="leading-none font-semibold">Invite your friends!</h4>
            <p className="text-muted-foreground text-xs">
              Create a custom invite link for friends to join your tribe
            </p>
          </div>

          {/* Group Select */}
          <div className="mt-5 space-y-2">
            <h5 className="font-medium text-sm">Group</h5>
            <Select onValueChange={handleSelect}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select Group" />
              </SelectTrigger>
              <SelectContent>
                {tribes.map((tribe) => (
                  <SelectItem key={tribe.id} value={tribe.id}>
                    {tribe.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Share Button */}
          <div className="flex justify-center items-center mt-5">
            <Button
              onClick={handleShare}
              disabled={loading}
              className="w-full flex"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <div className="flex justify-center items-center gap-x-2">
                  <Share className="h-4 w-4" />
                  <span>Share Invite Link</span>
                </div>
              )}
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default ShareButton;
