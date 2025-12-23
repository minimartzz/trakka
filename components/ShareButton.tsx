"use client";
import { Button } from "@/components/ui/button";
import { Share2 } from "lucide-react";
import React from "react";
import { toast } from "sonner";

interface ShareButtonProps {
  title: string;
  text: string;
  url: string;
  className: string;
}

const ShareButton = ({ title, text, url, className }: ShareButtonProps) => {
  const handleShare = async () => {
    // Checks if browser is Web Share API compatible
    if (!navigator.share) {
      console.warn(
        "Web Share API not supported in this browser. Copying URL instead."
      );

      try {
        await navigator.clipboard.writeText(url);
        toast.info("Share Unavailable", {
          description: "URL copied to clipboard",
        });
      } catch (error) {
        toast.error("Share Unavailable", {
          description: "Failed to copy URL to clipboard",
        });
      }
      return;
    }

    const shareData: ShareData = {
      title,
      text,
      url,
    };

    try {
      await navigator.share(shareData);
      console.log("Content successfully shared");
    } catch (error) {
      if ((error as Error).name != "AbortError") {
        console.error("Error sharing content", error);
        toast.error("Sharing Failed", {
          description: "An unexpected error occurred while trying to share",
        });
      }
    }
  };

  return (
    <Button
      onClick={handleShare}
      className={`${className} gap-x-2`}
      variant="outline"
    >
      <Share2 className="h-4 w-4" />
    </Button>
  );
};

export default ShareButton;
