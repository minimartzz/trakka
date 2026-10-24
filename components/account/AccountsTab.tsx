"use client";

import { updateProfileVisibility } from "@/app/(account)/account/action";
import WipOverlay from "@/components/account/WipOverlay";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { SITE_URL } from "@/lib/seo";
import { Check, Copy, Eye, Link2, Share } from "lucide-react";
import React, { useState, useTransition } from "react";
import { toast } from "sonner";

interface AccountsTabProps {
  username: string;
  isPublic: boolean;
}

const AccountsTab = ({ username, isPublic: initialIsPublic }: AccountsTabProps) => {
  const [isPublic, setIsPublic] = useState(initialIsPublic);
  const [copied, setCopied] = useState(false);
  const [isPending, startTransition] = useTransition();
  const profileUrl = `${SITE_URL}/player/${username}`;

  // Saves on flip; the switch moves straight away and moves back on failure
  const handleVisibilityChange = (checked: boolean) => {
    setIsPublic(checked);
    startTransition(async () => {
      const result = await updateProfileVisibility(checked);
      if (result.success) {
        toast.success(result.message);
      } else {
        setIsPublic(!checked);
        toast.error(result.message);
      }
    });
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(profileUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      return true;
    } catch {
      toast.error("Couldn't copy the link");
      return false;
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "My Trakka profile",
          text: "See how I'm doing on Trakka",
          url: profileUrl,
        });
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          console.error("Error sharing profile link", error);
          toast.error("Failed to open share menu");
        }
      }
      return;
    }
    if (await handleCopy()) toast.success("Link copied to clipboard!");
  };

  return (
    <div className="flex flex-col gap-8 py-6">
      <section>
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <Link2 className="h-4 w-4 text-muted-foreground" />
          Linked Accounts
        </h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Sign in with other accounts, like Google.
        </p>
        <WipOverlay>
          <div className="flex flex-col gap-2">
            {Array.from({ length: 2 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-3 rounded-lg border p-3"
              >
                <div className="h-8 w-8 shrink-0 rounded-full bg-muted" />
                <div className="h-3.5 w-32 flex-1 rounded bg-muted" />
                <div className="h-8 w-20 shrink-0 rounded-md bg-muted" />
              </div>
            ))}
          </div>
        </WipOverlay>
      </section>

      <section>
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <Eye className="h-4 w-4 text-muted-foreground" />
          Account Visibility
        </h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Control who can see your profile and stats.
        </p>
        <div className="rounded-lg border p-4">
          <div className="flex items-center justify-between gap-4">
            <label htmlFor="public-profile" className="space-y-1">
              <span className="block text-sm font-medium">Public profile</span>
              <span className="block text-sm text-muted-foreground">
                Anyone with the link can see your stats.
              </span>
            </label>
            <Switch
              id="public-profile"
              checked={isPublic}
              onCheckedChange={handleVisibilityChange}
              disabled={isPending}
            />
          </div>

          {isPublic && (
            <div className="mt-4 flex flex-col gap-2 border-t pt-4 sm:flex-row sm:items-center">
              <span className="min-w-0 flex-1 truncate rounded-md border bg-muted/40 px-3 py-2 font-mono text-sm">
                {profileUrl}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleCopy}
                  className="h-11 flex-1 gap-2 sm:h-9 sm:flex-none"
                >
                  {copied ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                  {copied ? "Copied" : "Copy"}
                </Button>
                {/* Signal violet marks share actions (DESIGN.md), as in ShareButton */}
                <Button
                  onClick={handleShare}
                  className="h-11 flex-1 gap-2 bg-accent-4 text-white hover:bg-accent-4/80 sm:h-9 sm:flex-none dark:bg-accent-4/80 dark:hover:bg-accent-4"
                >
                  <Share className="h-4 w-4" />
                  Share
                </Button>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default AccountsTab;
