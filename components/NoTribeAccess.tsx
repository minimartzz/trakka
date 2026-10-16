"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { Check, Loader2, Lock, Users } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { requestToJoinTribe } from "@/components/actions/requestToJoinTribe";

interface NoTribeAccessProps {
  tribe: { id: string; name: string; image: string };
  requestPending: boolean;
  // What the viewer tried to open, e.g. "This session"
  subject?: string;
}

/**
 * Shown in place of a page that belongs to a Tribe the viewer isn't in. Says
 * whose it is and offers a join request, without showing any of its content.
 */
export default function NoTribeAccess({
  tribe,
  requestPending,
  subject = "This page",
}: NoTribeAccessProps) {
  const [requested, setRequested] = useState(requestPending);
  const [isPending, startTransition] = useTransition();

  const requestJoin = () =>
    startTransition(async () => {
      const result = await requestToJoinTribe(tribe.id);
      if (result.success) {
        setRequested(true);
        toast.success(`Request sent to ${tribe.name}`);
      } else {
        toast.error("Couldn't send your request. Try again in a moment.");
      }
    });

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-4 sm:p-8">
      <div className="w-full max-w-md rounded-lg border bg-card p-6 text-center sm:p-8">
        <div className="relative mx-auto size-20">
          <div className="relative size-full overflow-hidden rounded-full bg-muted">
            {tribe.image ? (
              <Image
                src={tribe.image}
                alt=""
                fill
                sizes="80px"
                className="object-cover"
              />
            ) : (
              <Users className="size-full p-5 text-muted-foreground" />
            )}
          </div>
          <span className="absolute -bottom-1 -right-1 flex size-8 items-center justify-center rounded-full bg-background ring-1 ring-border">
            <Lock className="size-4 text-muted-foreground" />
          </span>
        </div>

        <h1 className="mt-5 text-2xl font-semibold">{tribe.name}</h1>
        <p className="mt-2 text-muted-foreground">
          {subject} belongs to a tribe you&apos;re not in. Ask to join and an
          admin will review your request.
        </p>

        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Button
            onClick={requestJoin}
            disabled={requested || isPending}
            className="min-h-11 sm:min-h-9"
          >
            {isPending ? (
              <Loader2 className="animate-spin" />
            ) : requested ? (
              <Check />
            ) : null}
            {requested ? "Request sent" : "Request to join"}
          </Button>
          <Button variant="outline" asChild className="min-h-11 sm:min-h-9">
            <Link href="/dashboard">Back to dashboard</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
