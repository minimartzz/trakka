// Layout for public players page
import Image from "next/image";
import {
  differenceInCalendarDays,
  format,
  formatDistanceToNowStrict,
  parseISO,
} from "date-fns";
import { CalibratingMark, EloArrow } from "@/components/GameSessionCard";
import type { GroupedSession } from "@/lib/interfaces";
import { cn } from "@/lib/utils";
import { ELO_TIER_CLASS, eloDisplay, eloTier } from "@/utils/elo";
import type {
  highestEloGame,
  mostPlayedGame,
  topTribe,
} from "@/utils/playerProfile";
import { positionOrdinalSuffix } from "@/utils/recordsProcessing";
import { formatWpa, sessionMode } from "@/utils/sessionPage";
import { getWeightColor } from "@/components/tribes/games/utils";

const WIN_TEXT = "text-emerald-600 dark:text-emerald-400";

const lastPlayedLabel = (datePlayed: string) => {
  const date = parseISO(datePlayed);
  const days = differenceInCalendarDays(new Date(), date);
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  return formatDistanceToNowStrict(date, { addSuffix: true });
};

// ── Identity ────────────────────────────────────────────────────────────────

export const PlayerHeader: React.FC<{
  firstName: string;
  lastName: string;
  username: string;
  image: string;
  joinedAt: Date | null;
  lastPlayed: string | null;
}> = ({ firstName, lastName, username, image, joinedAt, lastPlayed }) => (
  <header className="flex flex-col items-center gap-4 text-center sm:flex-row sm:gap-8 sm:text-left">
    <div className="relative flex size-28 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted sm:size-36">
      {image ? (
        <Image src={image} alt="" fill sizes="144px" className="object-cover" priority />
      ) : (
        <span className="font-display text-5xl font-bold text-muted-foreground">
          {firstName.charAt(0).toUpperCase()}
        </span>
      )}
    </div>
    <div className="min-w-0 max-w-full">
      <h1 className="truncate font-display text-4xl font-bold leading-[1.05] sm:text-5xl">
        {firstName} {lastName}
      </h1>
      <p className="mt-1 text-muted-foreground sm:text-lg font-bold">@{username}</p>
      <div className="mt-2 space-y-0.5 text-sm text-muted-foreground sm:text-base">
        {joinedAt && <p>Member since: {format(joinedAt, "MMM yyyy")}</p>}
        {lastPlayed && <p>Last played: {lastPlayedLabel(lastPlayed)}</p>}
      </div>
    </div>
  </header>
);

// ── Latest session ──────────────────────────────────────────────────────────

export const LatestSessionBanner: React.FC<{
  session: GroupedSession;
  profileId: number;
  // Full-size game image; the session only carries the thumbnail
  image: string | null;
}> = ({ session, profileId, image }) => {
  const me = session.players.find((p) => p.profileId === profileId);
  if (!me) return null;

  const mode = sessionMode(session);
  const competitive = mode === "rated" || mode === "unrated";
  // Team games place teams, not players
  const places = session.isTeamGame
    ? new Set(session.players.map((p) => p.teamId)).size
    : session.numPlayers;
  const elo = eloDisplay(me);
  const src = image ?? session.gameImage;

  return (
    <section
      aria-label="Latest session"
      className="flex gap-4 rounded-xl border bg-primary/8 p-4 dark:bg-primary/15"
    >
      <div className="relative size-24 shrink-0 overflow-hidden rounded-lg bg-muted sm:size-28">
        {src && <Image src={src} alt="" fill sizes="112px" className="object-cover" />}
      </div>

      <div className="flex min-w-0 flex-1 flex-col justify-between gap-1.5 sm:gap-2">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="truncate font-display text-xl font-bold leading-tight sm:text-2xl">
              {session.gameTitle}
            </h2>
            <p className="text-sm text-muted-foreground">
              {format(parseISO(session.datePlayed), "EEE d MMM yyyy")}
            </p>
          </div>
          <div
            className={cn(
              "shrink-0 font-display text-2xl font-bold leading-none sm:text-3xl",
              me.isWinner && WIN_TEXT,
            )}
          >
            {competitive ? (
              <>
                {positionOrdinalSuffix(me.position)}
                <span className="text-lg text-muted-foreground">/{places}</span>
              </>
            ) : me.isWinner ? (
              "Won"
            ) : (
              "Lost"
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 sm:gap-4">
          {me.victoryPoints !== null && (
            <span className="flex size-11 shrink-0 items-center justify-center rounded-full border-2 border-foreground/20 sm:size-13">
              <span className="flex flex-col items-center leading-none">
                <span className="font-display text-sm font-bold tabular-nums sm:text-base">
                  {me.victoryPoints}
                </span>
                <span className="text-[0.625rem] uppercase text-muted-foreground">
                  {competitive ? "VP" : "Score"}
                </span>
              </span>
            </span>
          )}
          {elo && (
            <span
              className={cn(
                "relative inline-flex items-center rounded-lg px-2.5 py-1 text-sm font-bold tabular-nums sm:px-3 sm:py-1.5 sm:text-base",
                ELO_TIER_CLASS[eloTier(elo.elo)],
              )}
            >
              ELO {elo.elo}
              {elo.calibrating && <CalibratingMark />}
              {elo.delta !== 0 && (
                <span
                  className={cn(
                    "absolute -top-2 -right-2 flex size-5 items-center justify-center rounded-full",
                    elo.delta > 0
                      ? "bg-emerald-300 text-emerald-950"
                      : "bg-red-300 text-red-950",
                  )}
                >
                  <EloArrow delta={elo.delta} className="size-3" />
                </span>
              )}
            </span>
          )}
        </div>
      </div>
    </section>
  );
};

// ── Records ─────────────────────────────────────────────────────────────────

// Mesh gradients in the style of the dashboard stat cards, one per highlight.
// The first two are the dashboard's own; written out in full so Tailwind sees them.
const MESH = {
  sessions:
    "bg-[radial-gradient(120%_120%_at_85%_15%,var(--accent-2)_0%,transparent_55%),radial-gradient(110%_110%_at_15%_25%,var(--accent-5)_0%,transparent_50%),radial-gradient(130%_130%_at_50%_100%,var(--accent-1)_0%,transparent_60%)]",
  wpa: "bg-[radial-gradient(120%_120%_at_15%_15%,var(--accent-3)_0%,transparent_55%),radial-gradient(110%_110%_at_90%_30%,var(--accent-1)_0%,transparent_50%),radial-gradient(130%_130%_at_60%_100%,var(--accent-4)_0%,transparent_60%)]",
  complexity:
    "bg-[radial-gradient(120%_120%_at_10%_90%,var(--accent-4)_0%,transparent_55%),radial-gradient(110%_110%_at_90%_10%,var(--accent-2)_0%,transparent_50%),radial-gradient(130%_130%_at_50%_0%,var(--accent-1)_0%,transparent_55%)]",
  played:
    "bg-[radial-gradient(120%_120%_at_90%_20%,var(--accent-1)_0%,transparent_55%),radial-gradient(110%_110%_at_10%_60%,var(--accent-3)_0%,transparent_50%),radial-gradient(130%_130%_at_70%_100%,var(--accent-5)_0%,transparent_60%)]",
  elo: "bg-[radial-gradient(120%_120%_at_20%_10%,var(--accent-5)_0%,transparent_55%),radial-gradient(110%_110%_at_95%_50%,var(--accent-1)_0%,transparent_50%),radial-gradient(130%_130%_at_30%_100%,var(--accent-3)_0%,transparent_60%)]",
  tribe:
    "bg-[radial-gradient(120%_120%_at_50%_0%,var(--accent-2)_0%,transparent_55%),radial-gradient(110%_110%_at_0%_100%,var(--accent-4)_0%,transparent_50%),radial-gradient(130%_130%_at_100%_80%,var(--accent-5)_0%,transparent_55%)]",
};

// Every highlight is the same-sized card: bold label top left, value bottom right
const HighlightCard: React.FC<{
  label: string;
  mesh: string;
  children: React.ReactNode;
}> = ({ label, mesh, children }) => (
  <div className="relative h-36 min-w-0 overflow-hidden rounded-xl bg-background shadow-sm">
    <div
      aria-hidden
      className={cn("pointer-events-none absolute inset-0 opacity-45 dark:opacity-35", mesh)}
    />
    {/* Lifts the bottom-right corner so the value always has contrast */}
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 bg-linear-to-tl from-background/85 via-background/25 to-transparent"
    />
    <div className="relative flex h-full flex-col justify-between p-4">
      <p className="text-sm font-bold text-foreground/80">{label}</p>
      <div className="min-w-0 text-right">{children}</div>
    </div>
  </div>
);

const StatHighlight: React.FC<{
  label: string;
  mesh: string;
  value: React.ReactNode;
  className?: string;
}> = ({ label, mesh, value, className }) => (
  <HighlightCard label={label} mesh={mesh}>
    <span
      className={cn("font-display text-5xl font-bold leading-none tabular-nums", className)}
    >
      {value}
    </span>
  </HighlightCard>
);

// shortcut: sized by character count, not measured width; swap for a fit-text
// hook if real names still clip
const fitText = (text: string) =>
  text.length <= 10 ? "text-2xl" : text.length <= 18 ? "text-xl" : "text-base";

const NamedHighlight: React.FC<{
  label: string;
  mesh: string;
  name: string | undefined;
  detail: React.ReactNode;
}> = ({ label, mesh, name = "-", detail }) => (
  <HighlightCard label={label} mesh={mesh}>
    <div
      title={name}
      className={cn("line-clamp-2 font-display font-bold leading-tight wrap-break-word", fitText(name))}
    >
      {name}
    </div>
    {detail && (
      <div className="mt-1 font-display text-xl font-bold leading-tight text-muted-foreground">
        {detail}
      </div>
    )}
  </HighlightCard>
);

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

export const RecordsStrip: React.FC<{
  wpa: number | null;
  sessionCount: number;
  complexity: number | null;
  topGame: ReturnType<typeof mostPlayedGame>;
  topElo: ReturnType<typeof highestEloGame>;
  tribe: ReturnType<typeof topTribe>;
}> = ({ wpa, sessionCount, complexity, topGame, topElo, tribe }) => (
  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
    <StatHighlight label="Sessions" mesh={MESH.sessions} value={sessionCount} />
    <StatHighlight label="Average WPA" mesh={MESH.wpa} value={formatWpa(wpa)} />
    <StatHighlight
      label="Average Complexity"
      mesh={MESH.complexity}
      value={complexity === null ? "-" : complexity.toFixed(1)}
      className={complexity === null ? undefined : getWeightColor(complexity)}
    />
    <NamedHighlight
      label="Most played"
      mesh={MESH.played}
      name={topGame?.gameTitle}
      detail={topGame && plural(topGame.count, "play")}
    />
    <NamedHighlight
      label="Highest ELO"
      mesh={MESH.elo}
      name={topElo?.gameTitle}
      detail={
        topElo && (
          <span
            className={cn(
              "inline-flex items-center rounded-lg px-2 py-0.5 font-bold tabular-nums",
              ELO_TIER_CLASS[eloTier(topElo.elo)],
            )}
          >
            ELO {Math.round(topElo.elo)}
            {!topElo.calibrated && <CalibratingMark />}
          </span>
        )
      }
    />
    <NamedHighlight
      label="Top Tribe"
      mesh={MESH.tribe}
      name={tribe?.name}
      detail={tribe && plural(tribe.count, "session")}
    />
  </div>
);
