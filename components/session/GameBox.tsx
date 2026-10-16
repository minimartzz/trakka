"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { format } from "date-fns";
import {
  CalendarDays,
  ChevronDown,
  Clock,
  Dices,
  Puzzle,
  Users,
  Weight,
} from "lucide-react";
import DotsIcon from "@/components/icons/DotsIcon";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import type {
  SessionGame,
  SessionPageData,
} from "@/app/(account)/session/[sessionId]/data";
import type { SessionExpansion } from "@/lib/interfaces";
import { cn } from "@/lib/utils";
import {
  getWeightBg,
  getWeightColor,
  getWeightLabel,
} from "@/components/tribes/games/utils";

const CHIP_LIMIT = 6;

const range = (min: number | null, max: number | null, dash = "–") =>
  min && max && min !== max ? `${min}${dash}${max}` : String(max || min || "");

const playTime = (game: SessionGame) =>
  range(game.minPlayingTime, game.maxPlayingTime, " – ") ||
  (game.playingTime ? String(game.playingTime) : "");

// Weight out of 5 with its Light / Medium / Heavy band, as on the tribe's
// Games tab
const WeightSpec: React.FC<{ weight: number }> = ({ weight }) => (
  <div
    className={cn(
      "flex items-baseline gap-1.5 rounded-lg border px-2 py-0.5",
      getWeightBg(weight),
    )}
  >
    <span className={cn("font-bold tabular-nums", getWeightColor(weight))}>
      {weight.toFixed(1)}
    </span>
    <span className="text-xs text-muted-foreground">/ 5</span>
    <span className={cn("text-xs font-medium", getWeightColor(weight))}>
      {getWeightLabel(weight)}
    </span>
  </div>
);

// Weight, play time and player count
const Specs: React.FC<{
  game: SessionGame | null;
  numPlayers: number;
  className?: string;
}> = ({ game, numPlayers, className }) => {
  const players = game ? range(game.minPlayers, game.maxPlayers) : "";
  const time = game ? playTime(game) : "";
  return (
    <dl className={cn("text-sm", className)}>
      {game && game.weight > 0 && (
        <div className="flex items-center justify-between gap-3">
          <dt className="inline-flex items-center gap-1.5 text-muted-foreground">
            <Weight className="size-3.5" />
            Weight
          </dt>
          <dd>
            <WeightSpec weight={game.weight} />
          </dd>
        </div>
      )}
      {time && (
        <div className="flex items-center justify-between gap-3">
          <dt className="inline-flex items-center gap-1.5 text-muted-foreground">
            <Clock className="size-3.5" />
            Play time
          </dt>
          <dd className="font-semibold tabular-nums">{time} min</dd>
        </div>
      )}
      <div className="flex items-center justify-between gap-3">
        <dt className="inline-flex items-center gap-1.5 text-muted-foreground">
          <Users className="size-3.5" />
          Players
        </dt>
        <dd className="flex items-center gap-1.5 tabular-nums">
          <DotsIcon
            value={numPlayers}
            className="mr-0 text-foreground **:data-dot:bg-current"
          />
          <span className="font-semibold">{numPlayers}</span>
          {players && (
            <span className="text-muted-foreground">of {players}</span>
          )}
        </dd>
      </div>
    </dl>
  );
};

// Mechanics then categories, capped with a "+N" that reveals the rest
const TagChips: React.FC<{ game: SessionGame }> = ({ game }) => {
  const [expanded, setExpanded] = useState(false);
  const tags = [...game.mechanics, ...game.categories];
  if (tags.length === 0) return null;

  const visible = expanded ? tags : tags.slice(0, CHIP_LIMIT);
  const hidden = tags.length - visible.length;
  return (
    <ul className="flex flex-wrap gap-1.5" aria-label="Mechanics and categories">
      {visible.map((tag) => (
        <li
          key={tag}
          className="rounded-md border px-2 py-0.5 text-xs text-foreground"
        >
          {tag}
        </li>
      ))}
      {hidden > 0 && (
        <li>
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="relative rounded-md bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground transition-colors after:absolute after:-inset-x-1 after:-inset-y-3 after:content-[''] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label={`Show ${hidden} more`}
          >
            +{hidden}
          </button>
        </li>
      )}
    </ul>
  );
};

const YearAndTags: React.FC<{ game: SessionGame | null }> = ({ game }) =>
  game ? (
    <>
      {game.yearPublished && (
        <p className="text-sm text-muted-foreground">
          Published {game.yearPublished}
        </p>
      )}
      <TagChips game={game} />
    </>
  ) : null;

const Expansions: React.FC<{ expansions: SessionExpansion[] }> = ({
  expansions,
}) =>
  expansions.length === 0 ? null : (
    <div>
      <h3 className="text-sm font-semibold">
        {expansions.length === 1 ? "Expansion" : "Expansions"}
      </h3>
      <ul className="mt-2 space-y-1.5">
        {expansions.map((expansion) => (
          <li key={expansion.id} className="flex items-center gap-2 text-sm">
            <span className="relative size-7 shrink-0 overflow-hidden rounded-sm bg-muted ring-1 ring-border">
              {expansion.thumbnail ? (
                <Image
                  src={expansion.thumbnail}
                  alt=""
                  fill
                  sizes="28px"
                  className="object-cover"
                />
              ) : (
                <Puzzle className="size-full p-1.5 text-muted-foreground" />
              )}
            </span>
            <span className="min-w-0 truncate">{expansion.name}</span>
          </li>
        ))}
      </ul>
    </div>
  );

const Cover: React.FC<{
  src: string | null;
  title: string;
  className?: string;
  sizes: string;
}> = ({ src, title, className, sizes }) => (
  <div className={cn("relative overflow-hidden bg-muted", className)}>
    {src ? (
      <Image
        src={src}
        alt={`${title} cover`}
        fill
        sizes={sizes}
        className="object-contain"
      />
    ) : (
      <Dices className="absolute inset-0 m-auto size-1/3 text-muted-foreground" />
    )}
  </div>
);

/** The back of the game box: a sticky rail beside the results on xl screens. */
export function GameRail({
  data,
  className,
}: {
  data: SessionPageData;
  className?: string;
}) {
  const { game } = data;
  return (
    <aside
      aria-label="Game details"
      className={cn(
        "sticky top-4 w-72 shrink-0 self-start overflow-hidden rounded-lg border bg-card",
        className,
      )}
    >
      <Cover
        src={game?.image ?? game?.thumbnail ?? null}
        title={data.gameTitle}
        sizes="288px"
        className="aspect-square border-b"
      />
      <div className="space-y-5 p-5">
        <div>
          <p className="font-display text-2xl font-bold leading-tight">
            {data.gameTitle}
          </p>
          {game?.yearPublished && (
            <p className="text-sm text-muted-foreground">
              Published {game.yearPublished}
            </p>
          )}
        </div>
        <Specs game={game} numPlayers={data.numPlayers} className="space-y-2.5" />
        {game && <TagChips game={game} />}
        <Expansions expansions={data.expansions} />
        <div className="space-y-1.5 border-t pt-4 text-sm">
          <Link
            href={`/tribe/${data.tribe.id}`}
            className="flex items-center gap-2 rounded-sm font-medium underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <span className="relative size-6 shrink-0 overflow-hidden rounded-full bg-muted">
              {data.tribe.image && (
                <Image
                  src={data.tribe.image}
                  alt=""
                  fill
                  sizes="24px"
                  className="object-cover"
                />
              )}
            </span>
            <span className="truncate">{data.tribe.name}</span>
          </Link>
          <p className="flex items-center gap-2 text-muted-foreground">
            <CalendarDays className="size-4" />
            {format(new Date(data.datePlayed), "d MMM yyyy")}
          </p>
        </div>
      </div>
    </aside>
  );
}

/** The game box folded into a band above the results below xl. */
export function GameBand({
  data,
  className,
}: {
  data: SessionPageData;
  className?: string;
}) {
  const { game } = data;
  return (
    <section
      aria-label="Game details"
      className={cn("rounded-lg border bg-card p-4", className)}
    >
      <div className="flex items-center gap-4">
        <Cover
          src={game?.thumbnail ?? game?.image ?? null}
          title={data.gameTitle}
          sizes="80px"
          className="size-18 shrink-0 rounded-md sm:size-20"
        />
        <Specs
          game={game}
          numPlayers={data.numPlayers}
          className="min-w-0 flex-1 space-y-1.5 sm:max-w-xs"
        />
      </div>
      {/* Phones get these in the expander below the results instead */}
      <div className="mt-4 hidden gap-6 border-t pt-4 md:flex">
        <div className="min-w-0 flex-1 space-y-2">
          <YearAndTags game={game} />
        </div>
        {data.expansions.length > 0 && (
          <div className="w-64 shrink-0">
            <Expansions expansions={data.expansions} />
          </div>
        )}
      </div>
    </section>
  );
}

/** Phones: mechanics, categories and expansions after the results. */
export function GameDetailsExpander({
  data,
  className,
}: {
  data: SessionPageData;
  className?: string;
}) {
  const { game } = data;
  const hasTags = !!game && game.mechanics.length + game.categories.length > 0;
  if (!hasTags && data.expansions.length === 0 && !game?.yearPublished) {
    return null;
  }

  return (
    <Collapsible className={cn("rounded-lg border bg-card", className)}>
      <CollapsibleTrigger className="group flex min-h-11 w-full items-center justify-between px-4 py-3 text-left font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        Game details
        <ChevronDown className="size-4 text-muted-foreground transition-transform group-data-[state=open]:rotate-180 motion-reduce:transition-none" />
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-4 border-t px-4 py-4">
        <YearAndTags game={game} />
        <Expansions expansions={data.expansions} />
      </CollapsibleContent>
    </Collapsible>
  );
}
