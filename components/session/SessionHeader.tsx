"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "nextjs-toploader/app";
import { format } from "date-fns";
import {
  ArrowLeft,
  CalendarDays,
  Gauge,
  Handshake,
  Pencil,
  User,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { SessionPageData } from "@/app/(account)/session/[sessionId]/data";
import { cn } from "@/lib/utils";
import type { SessionMode } from "@/utils/sessionPage";

const MODE_TAG: Record<
  SessionMode,
  { label: string; icon: React.ElementType; className: string }
> = {
  rated: {
    label: "Rated",
    icon: Gauge,
    className: "bg-primary/10 text-primary dark:bg-primary/20",
  },
  unrated: {
    label: "Unrated",
    icon: Gauge,
    className: "border border-border text-muted-foreground",
  },
  coop: {
    label: "Co-op",
    icon: Handshake,
    className: "bg-foreground/6 text-foreground",
  },
  solo: {
    label: "Solo",
    icon: User,
    className: "bg-foreground/6 text-foreground",
  },
};

export default function SessionHeader({ data }: { data: SessionPageData }) {
  const router = useRouter();
  const tag = MODE_TAG[data.mode];
  const isTeamGame = data.players.some((p) => p.teamId !== null);

  // Back to wherever they came from; a shared link opened cold goes to the
  // session's tribe instead of leaving the app
  const goBack = () => {
    if (window.history.length > 1) router.back();
    else router.push(`/tribe/${data.tribe.id}`);
  };

  return (
    <header>
      <div className="flex items-center justify-between gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={goBack}
          className="-ml-2 min-h-11 text-muted-foreground sm:min-h-8"
        >
          <ArrowLeft />
          Back
        </Button>
        {data.canEdit && (
          <Button variant="outline" size="sm" asChild className="min-h-11 sm:min-h-8">
            <Link href={`/session/edit/${data.sessionId}`}>
              <Pencil />
              Edit
            </Link>
          </Button>
        )}
      </div>

      <h1 className="font-display mt-3 text-4xl font-bold leading-tight text-balance sm:text-5xl">
        {data.gameTitle}
      </h1>

      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <CalendarDays className="size-4" />
          {format(new Date(data.datePlayed), "d MMM yyyy")}
        </span>
        <Link
          href={`/tribe/${data.tribe.id}`}
          className="inline-flex items-center gap-1.5 rounded-sm font-medium text-foreground underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <span className="relative size-5 overflow-hidden rounded-full bg-muted">
            {data.tribe.image && (
              <Image
                src={data.tribe.image}
                alt=""
                fill
                sizes="20px"
                className="object-cover"
              />
            )}
          </span>
          {data.tribe.name}
        </Link>
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold",
            tag.className,
          )}
        >
          <tag.icon className="size-3.5" />
          {tag.label}
        </span>
        {isTeamGame && (
          <span className="inline-flex items-center gap-1 rounded-full bg-foreground/6 px-2 py-0.5 text-xs font-semibold text-foreground">
            <Users className="size-3.5" />
            Teams
          </span>
        )}
      </div>
    </header>
  );
}
