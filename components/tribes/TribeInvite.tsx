"use client";
import { genInvite } from "@/components/actions/genInvite";
import { Button } from "@/components/ui/button";
import { Loader2, SquareArrowUpRight } from "lucide-react";
import React, { useState } from "react";
import { toast } from "sonner";

interface TribeInviteProps {
  userId: number;
  tribeId: string;
  tribeName: string;
  className: string;
}

const TribeInvite = ({
  userId,
  tribeId,
  tribeName,
  className,
}: TribeInviteProps) => {
  // Group ID
  const [loading, setLoading] = useState(false);

  const handleGenerateAndShare = async () => {
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
    <div>
      <Button
        onClick={handleGenerateAndShare}
        disabled={loading}
        className={className}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <SquareArrowUpRight className="h-4 w-4" />
        )}
        <p className="hidden sm:block">Invite a Friend</p>
      </Button>
    </div>
  );
};

export default TribeInvite;
