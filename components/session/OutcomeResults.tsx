import { Medal, Trophy } from "lucide-react";
import type {
  SessionPageData,
  SessionPagePlayer,
} from "@/app/(account)/session/[sessionId]/data";
import { cn } from "@/lib/utils";
import SessionDescription from "./SessionDescription";
import { formatWpa, playLabel } from "@/utils/sessionPage";
import { PlayerIdentity } from "./PlayerParts";

// Co-op and solo sessions have one result for everyone: Won or Lost, with the
// icon and label carrying it as well as the colour
function Outcome({
  won,
  score,
  scoreLabel,
}: {
  won: boolean;
  score: number | null;
  scoreLabel: string;
}) {
  const Icon = won ? Trophy : Medal;
  return (
    <section
      aria-label="Result"
      className={cn(
        "flex items-center justify-between gap-6 rounded-lg border p-5 sm:p-6",
        won
          ? "border-accent-1/60 bg-accent-1/20 text-[oklch(32%_0.08_156)] dark:text-accent-1"
          : "border-destructive/40 bg-destructive/10 text-destructive dark:text-[oklch(72%_0.15_26)]",
      )}
    >
      <div className="flex items-center gap-3">
        <Icon className="size-9 shrink-0 sm:size-10" />
        <p className="font-display text-5xl font-bold leading-none sm:text-6xl">
          {won ? "Won" : "Lost"}
        </p>
      </div>
      {score !== null && (
        <div className="text-right">
          <p className="text-sm font-medium text-foreground/75">
            {scoreLabel}
          </p>
          <p className="font-display text-5xl font-bold leading-none tabular-nums text-foreground sm:text-6xl">
            {score}
          </p>
        </div>
      )}
    </section>
  );
}

const PlayerLine: React.FC<{
  player: SessionPagePlayer;
  isViewer: boolean;
}> = ({ player, isViewer }) => (
  <li
    className={cn(
      "flex items-center gap-3 px-4 py-3",
      isViewer && "bg-primary/12 dark:bg-primary/18",
    )}
  >
    <div className="min-w-0 flex-1">
      <PlayerIdentity player={player} isViewer={isViewer} />
    </div>
    <dl className="flex shrink-0 gap-5 text-right text-sm">
      <div>
        <dt className="text-xs text-muted-foreground">WPA</dt>
        <dd className="font-semibold tabular-nums">{formatWpa(player.wpa)}</dd>
      </div>
      <div>
        <dt className="text-xs text-muted-foreground">Play</dt>
        <dd className="font-semibold tabular-nums">
          {playLabel(player.playNumber)}
        </dd>
      </div>
    </dl>
  </li>
);

/** Co-op: the shared outcome first, then the notes, then the party. */
export function CoopResults({
  data,
  viewerId,
}: {
  data: SessionPageData;
  viewerId: number;
}) {
  const first = data.players[0];
  return (
    <>
      <Outcome
        won={first.isWinner}
        score={first.victoryPoints}
        scoreLabel="Group score"
      />
      {data.description && (
        <SessionDescription description={data.description} prominent />
      )}
      <section aria-labelledby="party-heading">
        <h2 id="party-heading" className="text-xl font-semibold">
          The party
        </h2>
        <ul className="mt-3 divide-y overflow-hidden rounded-lg border bg-card">
          {data.players.map((player) => (
            <PlayerLine
              key={player.profileId}
              player={player}
              isViewer={player.profileId === viewerId}
            />
          ))}
        </ul>
      </section>
    </>
  );
}

/** Solo: the outcome and score, the player's stats, then their notes. */
export function SoloResults({
  data,
  viewerId,
}: {
  data: SessionPageData;
  viewerId: number;
}) {
  const player = data.players[0];
  return (
    <>
      <Outcome
        won={player.isWinner}
        score={player.victoryPoints}
        scoreLabel="Score"
      />
      <ul className="overflow-hidden rounded-lg border bg-card">
        <PlayerLine player={player} isViewer={player.profileId === viewerId} />
      </ul>
      {data.description && (
        <SessionDescription description={data.description} />
      )}
    </>
  );
}
