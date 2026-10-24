// Sections of the public player page (/player/[username]), top to bottom:
// identity row, latest-session banner, records strip, then the weekly and
// difficulty charts. Server-rendered; nothing here is interactive.
import Image from "next/image";
import {
  differenceInCalendarDays,
  format,
  formatDistanceToNowStrict,
  parseISO,
} from "date-fns";
import { Trophy } from "lucide-react";
import { CalibratingMark, EloArrow } from "@/components/GameSessionCard";
import type { GroupedSession } from "@/lib/interfaces";
import { cn } from "@/lib/utils";
import { eloDisplay } from "@/utils/elo";
import type {
  difficultyBreakdown,
  highestEloGame,
  mostPlayedGame,
  topTribe,
  weeklySessions,
} from "@/utils/playerProfile";
import { positionOrdinalSuffix } from "@/utils/recordsProcessing";
import { formatWpa, sessionMode } from "@/utils/sessionPage";

const WIN_TEXT = "text-emerald-600 dark:text-emerald-400";

const MODE_LABEL = {
  rated: "Rated",
  unrated: "Unrated",
  coop: "Co-op",
  solo: "Solo",
};

const lastPlayedLabel = (datePlayed: string) => {
  const date = parseISO(datePlayed);
  const days = differenceInCalendarDays(new Date(), date);
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  return formatDistanceToNowStrict(date, { addSuffix: true });
};

const Thumb: React.FC<{ src: string | null; size: number; className?: string }> = ({
  src,
  size,
  className,
}) => (
  <div
    className={cn("relative shrink-0 overflow-hidden rounded-md bg-muted", className)}
    style={{ width: size, height: size }}
  >
    {src && (
      <Image src={src} alt="" fill sizes={`${size}px`} className="object-cover" />
    )}
  </div>
);

// ── Identity ────────────────────────────────────────────────────────────────

export const PlayerHeader: React.FC<{
  firstName: string;
  lastName: string;
  username: string;
  image: string;
  joinedAt: Date | null;
  lastPlayed: string | null;
}> = ({ firstName, lastName, username, image, joinedAt, lastPlayed }) => (
  <header className="flex items-center gap-4 sm:gap-6">
    <div className="relative flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted sm:size-22">
      {image ? (
        <Image src={image} alt="" fill sizes="88px" className="object-cover" priority />
      ) : (
        <span className="font-display text-3xl font-bold text-muted-foreground">
          {firstName.charAt(0).toUpperCase()}
        </span>
      )}
    </div>
    <div className="min-w-0">
      <h1 className="truncate font-display text-4xl font-bold leading-[1.05] sm:text-5xl">
        {firstName} {lastName}
      </h1>
      <p className="mt-1 text-sm text-muted-foreground sm:text-base">
        @{username}
        {joinedAt && <> · Joined {format(joinedAt, "MMM yyyy")}</>}
        {lastPlayed && <> · Last played {lastPlayedLabel(lastPlayed)}</>}
      </p>
    </div>
  </header>
);

// ── Latest session ──────────────────────────────────────────────────────────

const ResultFigure: React.FC<{
  value: React.ReactNode;
  label: React.ReactNode;
  className?: string;
}> = ({ value, label, className }) => (
  <div className="text-right">
    <div className={cn("font-display text-4xl font-bold leading-none sm:text-5xl", className)}>
      {value}
    </div>
    <div className="mt-1.5 text-xs text-muted-foreground">{label}</div>
  </div>
);

export const LatestSessionBanner: React.FC<{
  session: GroupedSession;
  profileId: number;
}> = ({ session, profileId }) => {
  const me = session.players.find((p) => p.profileId === profileId);
  if (!me) return null;

  const mode = sessionMode(session);
  const competitive = mode === "rated" || mode === "unrated";
  // Team games place teams, not players
  const places = session.isTeamGame
    ? new Set(session.players.map((p) => p.teamId)).size
    : session.numPlayers;
  const elo = eloDisplay(me);

  return (
    <section
      aria-label="Latest session"
      className="rounded-xl border bg-primary/8 p-4 sm:p-6 dark:bg-primary/15"
    >
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          <Thumb src={session.gameImage} size={72} />
          <div className="min-w-0">
            <h2 className="truncate font-display text-3xl font-bold leading-tight sm:text-4xl">
              {session.gameTitle}
            </h2>
            <p className="text-sm text-muted-foreground">
              Latest session · {format(parseISO(session.datePlayed), "EEE d MMM yyyy")} ·{" "}
              {MODE_LABEL[mode]} · {session.tribe}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 justify-end gap-6 sm:gap-8">
          {competitive ? (
            <ResultFigure
              value={
                <>
                  {positionOrdinalSuffix(me.position)}
                  <span className="text-xl text-muted-foreground"> /{places}</span>
                </>
              }
              label={
                <span className="inline-flex items-center gap-1">
                  {me.isWinner && <Trophy className={cn("size-3", WIN_TEXT)} />}
                  {me.isWinner ? "Won" : "Position"}
                </span>
              }
              className={cn(me.isWinner && WIN_TEXT)}
            />
          ) : (
            <ResultFigure
              value={me.isWinner ? "Won" : "Lost"}
              label={
                <span className="inline-flex items-center gap-1">
                  {me.isWinner && <Trophy className={cn("size-3", WIN_TEXT)} />}
                  Result
                </span>
              }
              className={cn(me.isWinner && WIN_TEXT)}
            />
          )}
          {me.victoryPoints !== null && (
            <ResultFigure value={me.victoryPoints} label={competitive ? "VP" : "Score"} />
          )}
          {elo && (
            <ResultFigure
              value={
                <span className="inline-flex items-center">
                  <EloArrow delta={elo.delta} className="size-6" />
                  {elo.delta === 0 ? "±0" : Math.abs(elo.delta)}
                  {elo.calibrating && <CalibratingMark />}
                </span>
              }
              label="Elo change"
              className={cn(
                elo.delta > 0 && WIN_TEXT,
                elo.delta < 0 && "text-destructive",
              )}
            />
          )}
        </div>
      </div>
    </section>
  );
};

// ── Records ─────────────────────────────────────────────────────────────────

const RecordCell: React.FC<{
  label: string;
  value: React.ReactNode;
  detail?: React.ReactNode;
  image?: string | null;
  big?: boolean;
}> = ({ label, value, detail, image, big }) => (
  <div className="min-w-0 p-4 sm:px-5">
    <dt className="text-sm text-muted-foreground">{label}</dt>
    <dd className="mt-1 flex min-w-0 items-center gap-2.5">
      {image !== undefined && <Thumb src={image} size={36} />}
      <div className="min-w-0">
        <div
          className={cn(
            "truncate font-display font-bold leading-tight",
            big ? "text-4xl sm:text-5xl" : "text-2xl",
          )}
        >
          {value}
        </div>
        {detail && <div className="truncate text-sm text-muted-foreground">{detail}</div>}
      </div>
    </dd>
  </div>
);

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

export const RecordsStrip: React.FC<{
  wpa: number | null;
  sessionCount: number;
  topGame: ReturnType<typeof mostPlayedGame>;
  topElo: ReturnType<typeof highestEloGame>;
  tribe: ReturnType<typeof topTribe>;
}> = ({ wpa, sessionCount, topGame, topElo, tribe }) => (
  // One strip of cells split by hairlines (the border colour showing through
  // a 1px gap); 2 columns on mobile with Top tribe spanning the last row
  <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border bg-border lg:grid-cols-[1fr_1fr_1.4fr_1.4fr_1.4fr] [&>*]:bg-card [&>*:last-child]:col-span-2 lg:[&>*:last-child]:col-span-1">
    <RecordCell label="Avg WPA" value={formatWpa(wpa)} detail="per Rated Session" big />
    <RecordCell label="Sessions" value={sessionCount} detail="played" big />
    <RecordCell
      label="Most played"
      value={topGame?.gameTitle ?? "—"}
      detail={topGame && plural(topGame.count, "play")}
      image={topGame ? topGame.gameImage : undefined}
    />
    <RecordCell
      label="Highest Elo"
      value={topElo?.gameTitle ?? "—"}
      detail={
        topElo && (
          <>
            {Math.round(topElo.elo).toLocaleString()}
            {!topElo.calibrated && <CalibratingMark />}
          </>
        )
      }
      image={topElo ? topElo.gameImage : undefined}
    />
    <RecordCell
      label="Top tribe"
      value={tribe?.name ?? "—"}
      detail={tribe && plural(tribe.count, "session")}
      image={tribe ? tribe.image : undefined}
    />
  </dl>
);

// ── Sessions per week ───────────────────────────────────────────────────────

// 52 bars, each with its count printed on top; empty weeks stay as gaps.
// Scrolls sideways inside its card when the bars would get too thin.
export const WeeklySessionsChart: React.FC<{
  weeks: ReturnType<typeof weeklySessions>;
}> = ({ weeks }) => {
  const max = Math.max(1, ...weeks.map((w) => w.count));
  const total = weeks.reduce((sum, w) => sum + w.count, 0);

  return (
    <section className="rounded-xl border bg-card p-4 sm:p-6">
      <h2 className="text-lg">Sessions per week</h2>
      <p className="text-sm text-muted-foreground">
        {plural(total, "session")} in the last 12 months
      </p>
      <div className="-mx-4 mt-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <div
          role="img"
          aria-label={`Sessions per week for the last 52 weeks, ${plural(total, "session")} in total`}
          className="grid min-w-[620px] grid-cols-[repeat(52,minmax(0,1fr))] gap-x-[3px]"
        >
          {weeks.map((week) => {
            const weekStart = parseISO(week.weekStart);
            return (
              <div key={week.weekStart} className="flex flex-col">
                <div className="flex h-36 flex-col justify-end">
                  {week.count > 0 && (
                    <>
                      <span className="mb-1 text-center text-[10px] font-semibold leading-none text-muted-foreground">
                        {week.count}
                      </span>
                      <span
                        className="block rounded-t-[2px] bg-primary"
                        style={{ height: `${(week.count / max) * 100 * 0.82}%` }}
                      />
                    </>
                  )}
                </div>
                <span className="mt-0.5 h-px bg-border" />
                {/* Month name under each month's first Monday */}
                <span className="mt-1.5 h-4 overflow-visible whitespace-nowrap text-[11px] leading-none text-muted-foreground">
                  {weekStart.getDate() <= 7 ? format(weekStart, "MMM") : ""}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

// ── Game difficulty ─────────────────────────────────────────────────────────

export const DifficultyBars: React.FC<{
  bands: ReturnType<typeof difficultyBreakdown>;
}> = ({ bands }) => {
  const max = Math.max(1, ...bands.map((b) => b.count));
  return (
    <section className="rounded-xl border bg-card p-4 sm:p-6">
      <h2 className="text-lg">Game difficulty</h2>
      <p className="text-sm text-muted-foreground">Sessions by game weight</p>
      <ul className="mt-4 space-y-3">
        {bands.map((band) => (
          <li
            key={band.label}
            className="grid grid-cols-[5.5rem_1fr_2.5rem] items-center gap-3 text-sm"
          >
            <span className="text-muted-foreground">{band.label}</span>
            <span aria-hidden className="h-3.5 rounded-[2px] bg-muted">
              <span
                className="block h-full rounded-[2px] bg-primary"
                style={{ width: `${(band.count / max) * 100}%` }}
              />
            </span>
            <span className="text-right font-semibold">{band.count}</span>
          </li>
        ))}
      </ul>
    </section>
  );
};
