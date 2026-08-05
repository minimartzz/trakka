"use client";

import {
  requestClaim,
  verifyClaimCode,
} from "@/app/(account)/account/claim/action";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check, KeyRound, Loader2, Trophy, X } from "lucide-react";
import Image from "next/image";
import React, { useState } from "react";
import { toast } from "sonner";
import posthog from "posthog-js";

interface VerifiedAnon {
  anonProfileId: number;
  firstName: string;
  lastName: string;
  username: string;
  tribeName: string | null;
  recentGames: {
    gameTitle: string;
    datePlayed: string;
    gameImage: string | null;
    victoryPoints: number | null;
    isWinner: boolean;
  }[];
}

// A single claim row: enter a code -> Verify -> preview the anonymous player's
// recent games -> Request. Once requested the row locks and the parent appends
// a fresh row so more codes can be claimed.
const ClaimRow = ({ onRequested }: { onRequested: () => void }) => {
  const [code, setCode] = useState("");
  const [verified, setVerified] = useState<VerifiedAnon | null>(null);
  const [locked, setLocked] = useState(false);
  const [pending, setPending] = useState(false);

  const handleVerify = async () => {
    if (!code.trim() || pending) return;
    setPending(true);
    const result = await verifyClaimCode(code);
    setPending(false);

    if (!result.success) {
      if (result.message === "code_not_found") {
        toast.error("This claim code doesn't exist.");
      } else if (result.message === "already_claiming") {
        toast.error("Someone else is already claiming this player.");
      } else {
        toast.error(result.message ?? "Something went wrong");
      }
      return;
    }

    setVerified(result.data as VerifiedAnon);
  };

  const handleRequest = async () => {
    if (!verified || pending) return;
    setPending(true);
    const result = await requestClaim(verified.anonProfileId);
    setPending(false);

    if (!result.success) {
      if (result.message === "already_claiming") {
        toast.error("Someone else is already claiming this player.");
      } else if (result.message === "code_not_found") {
        toast.error("This claim code has already been claimed.");
        setVerified(null);
      } else {
        toast.error(result.message ?? "Something went wrong");
      }
      return;
    }

    posthog.capture("anonymous_player_claim_requested");
    toast.success("Claim request sent to the tribe's admin.");
    setLocked(true);
    onRequested();
  };

  const handleReset = () => {
    setVerified(null);
    setCode("");
  };

  return (
    <div className="flex flex-col gap-3 rounded-lg border p-4">
      <div className="flex items-center gap-3">
        <Input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Enter claim code"
          disabled={locked || !!verified}
          aria-label="Claim code"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !verified) {
              e.preventDefault();
              handleVerify();
            }
          }}
        />
        {verified ? (
          <Button
            type="button"
            onClick={handleRequest}
            disabled={locked || pending}
            className="w-28 shrink-0"
          >
            {pending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : locked ? (
              <>
                <Check className="h-4 w-4" /> Requested
              </>
            ) : (
              "Request"
            )}
          </Button>
        ) : (
          <Button
            type="button"
            onClick={handleVerify}
            disabled={pending || !code.trim()}
            className="w-28 shrink-0"
          >
            {pending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Verify"
            )}
          </Button>
        )}
      </div>

      {verified && (
        <div className="rounded-md bg-muted/40 p-3">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <span className="text-sm font-medium">
                {verified.firstName} {verified.lastName}
              </span>{" "}
              <span className="text-xs text-muted-foreground">
                @{verified.username}
                {verified.tribeName ? ` · ${verified.tribeName}` : ""}
              </span>
            </div>
            {!locked && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0 text-muted-foreground"
                onClick={handleReset}
                aria-label="Remove"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          {verified.recentGames.length > 0 ? (
            <ul className="mt-2 flex flex-col gap-2">
              {verified.recentGames.map((game, i) => (
                <li key={i} className="flex items-center gap-2">
                  <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-sm bg-muted">
                    {game.gameImage && (
                      <Image
                        src={game.gameImage}
                        alt=""
                        fill
                        className="object-cover"
                      />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="truncate text-sm">{game.gameTitle}</span>
                      {game.isWinner && (
                        <Trophy className="h-3.5 w-3.5 shrink-0 text-amber-500" />
                      )}
                    </div>
                    <div className="truncate text-xs text-muted-foreground">
                      {game.datePlayed}
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="text-sm font-medium tabular-nums">
                      {game.victoryPoints ?? "—"}
                    </div>
                    {game.isWinner && (
                      <div className="text-[10px] font-medium uppercase text-amber-600">
                        Won
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-xs text-muted-foreground">
              No games recorded yet.
            </p>
          )}
        </div>
      )}
    </div>
  );
};

const ClaimAnonymousUser = () => {
  // Each verified request appends a new empty row so more codes can be claimed.
  const [rowKeys, setRowKeys] = useState<number[]>([0]);

  const addRow = () =>
    setRowKeys((prev) => [...prev, (prev[prev.length - 1] ?? 0) + 1]);

  return (
    <section>
      <h2 className="flex items-center gap-2 text-lg font-semibold">
        <KeyRound className="h-4 w-4 text-muted-foreground" />
        Claim an Anonymous User
      </h2>
      <p className="mb-4 text-sm text-muted-foreground">
        Enter a claim code to link an anonymous player&apos;s past sessions to
        your account. Verify it, then send a request to the tribe&apos;s admin
        to approve.
      </p>
      <div className="flex flex-col gap-3">
        {rowKeys.map((key) => (
          <ClaimRow key={key} onRequested={addRow} />
        ))}
      </div>
    </section>
  );
};

export default ClaimAnonymousUser;
