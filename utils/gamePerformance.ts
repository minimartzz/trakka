// Per-game performance for the dashboard's Games tab: the Elo line and the VP
// histogram over a chosen period. Pure: no DB access.

import { format, subMonths, subWeeks } from "date-fns";
import { eloDisplay } from "@/utils/elo";

export type Period = "1W" | "1M" | "3M" | "6M" | "ALL";
export const PERIODS: Period[] = ["1W", "1M", "3M", "6M", "ALL"];

// First date (yyyy-MM-dd) inside the period, or null for all time
export function periodStart(period: Period, now: Date): string | null {
  const start =
    period === "1W"
      ? subWeeks(now, 1)
      : period === "1M"
        ? subMonths(now, 1)
        : period === "3M"
          ? subMonths(now, 3)
          : period === "6M"
            ? subMonths(now, 6)
            : null;
  return start ? format(start, "yyyy-MM-dd") : null;
}

// One of the user's Rated Sessions of the game
export interface RatedPlay {
  sessionId: string;
  datePlayed: string;
  tribe: string;
  eloBefore: number;
  eloAfter: number;
  eloSessionsBefore: number;
}

export interface EloPoint {
  // Evenly spaced: one step per session, 0 is the Elo going into the period
  index: number;
  elo: number;
  delta: number;
  calibrating: boolean;
  // Null on the starting point
  session: RatedPlay | null;
}

// The Elo line over the period. `plays` must be oldest first. Starts from the
// Elo before the period's first session, so even one session draws a line.
export function eloSeries(plays: RatedPlay[], since: string | null): EloPoint[] {
  const inPeriod = since ? plays.filter((p) => p.datePlayed >= since) : plays;
  if (inPeriod.length === 0) return [];

  const first = inPeriod[0];
  const start: EloPoint = {
    index: 0,
    elo: Math.round(first.eloBefore),
    delta: 0,
    calibrating: false,
    session: null,
  };

  return [
    start,
    ...inPeriod.map((play, i) => {
      const display = eloDisplay(play)!;
      return {
        index: i + 1,
        elo: display.elo,
        delta: display.delta,
        calibrating: display.calibrating,
        session: play,
      };
    }),
  ];
}

export interface VpBin {
  // Inclusive bounds; VP are whole numbers
  from: number;
  to: number;
  count: number;
}

// Smallest of 1, 2, 5, 10, 20, 25, 50, 100... at least `raw`
const niceStep = (raw: number): number => {
  if (raw <= 1) return 1;
  const magnitude = 10 ** Math.floor(Math.log10(raw));
  for (const m of [1, 2, 2.5, 5, 10]) {
    const step = m * magnitude;
    if (step >= raw && Number.isInteger(step)) return step;
  }
  return 10 * magnitude;
};

// VP counted into at most about `targetBins` equal-width bins of a round width
export function vpHistogram(values: number[], targetBins = 8): VpBin[] {
  if (values.length === 0) return [];
  const min = Math.min(...values);
  const max = Math.max(...values);
  const step = niceStep((max - min + 1) / targetBins);
  const first = Math.floor(min / step) * step;

  const bins: VpBin[] = [];
  for (let from = first; from <= max; from += step) {
    bins.push({ from, to: from + step - 1, count: 0 });
  }
  for (const v of values) {
    bins[Math.floor((v - first) / step)].count += 1;
  }
  return bins;
}

export const vpBinLabel = (bin: VpBin) =>
  bin.from === bin.to ? String(bin.from) : `${bin.from}–${bin.to}`;
