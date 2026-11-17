// Stats for the public player page (/player/[username]). Pure: takes the
// player's sessions as filterSessionData returns them (newest first).
import type { GroupedSession } from "@/lib/interfaces";
import { isCalibrated } from "@/utils/elo";
import { sessionMode } from "@/utils/sessionPage";
import { getComplexityBin, getPlayerCountBin } from "@/utils/chartHelpers";
import { format, parseISO, startOfWeek, subWeeks } from "date-fns";

const playerRow = (session: GroupedSession, profileId: number) =>
  session.players.find((p) => p.profileId === profileId);

// Later of two sessions: by date played, then by when it was logged
const isLater = (a: GroupedSession, b: GroupedSession) =>
  a.datePlayed !== b.datePlayed
    ? a.datePlayed > b.datePlayed
    : a.createdAt.getTime() > b.createdAt.getTime();

// The key with the most sessions; a tie goes to the one played most recently.
// Returns that key's latest session alongside its count.
function mostSessionsBy<K>(
  sessions: GroupedSession[],
  keyOf: (s: GroupedSession) => K,
): { latest: GroupedSession; count: number } | null {
  const tally = new Map<K, { latest: GroupedSession; count: number }>();
  for (const s of sessions) {
    const entry = tally.get(keyOf(s));
    if (!entry) tally.set(keyOf(s), { latest: s, count: 1 });
    else {
      entry.count++;
      if (isLater(s, entry.latest)) entry.latest = s;
    }
  }

  let best: { latest: GroupedSession; count: number } | null = null;
  for (const entry of tally.values()) {
    if (
      !best ||
      entry.count > best.count ||
      (entry.count === best.count && isLater(entry.latest, best.latest))
    )
      best = entry;
  }
  return best;
}

export function mostPlayedGame(sessions: GroupedSession[]) {
  const top = mostSessionsBy(sessions, (s) => s.gameId);
  if (!top) return null;
  const { gameId, gameTitle, gameImage } = top.latest;
  return { gameId, gameTitle, gameImage, count: top.count };
}

export function topTribe(sessions: GroupedSession[]) {
  const top = mostSessionsBy(sessions, (s) => s.tribeId);
  if (!top) return null;
  const { tribeId, tribe, tribeImage } = top.latest;
  return { tribeId, name: tribe, image: tribeImage, count: top.count };
}

// The game with the highest Calibrated Elo, falling back to the highest Elo
// still in Calibration when no game is Calibrated. A tie goes to the game
// played most recently.
export function highestEloGame(
  elos: { gameId: number; elo: number; sessionsPlayed: number }[],
  sessions: GroupedSession[],
) {
  const latestByGame = new Map<number, GroupedSession>();
  for (const s of sessions) {
    const latest = latestByGame.get(s.gameId);
    if (!latest || isLater(s, latest)) latestByGame.set(s.gameId, s);
  }

  const known = elos.filter((e) => latestByGame.has(e.gameId));
  const calibrated = known.filter((e) => isCalibrated(e.sessionsPlayed));
  const pool = calibrated.length > 0 ? calibrated : known;

  let best: (typeof pool)[number] | null = null;
  for (const e of pool) {
    if (
      !best ||
      e.elo > best.elo ||
      (e.elo === best.elo &&
        isLater(latestByGame.get(e.gameId)!, latestByGame.get(best.gameId)!))
    )
      best = e;
  }
  if (!best) return null;

  const { gameTitle, gameImage } = latestByGame.get(best.gameId)!;
  return {
    gameId: best.gameId,
    gameTitle,
    gameImage,
    elo: best.elo,
    calibrated: calibrated.length > 0,
  };
}

const WEEKS = 52;
const weekKey = (date: Date) =>
  format(startOfWeek(date, { weekStartsOn: 1 }), "yyyy-MM-dd");

// Sessions per Monday-start week, oldest first, ending with today's week.
// Weeks without a session stay in the list with zeros. Each week also splits
// its sessions by complexity tier (unknown weights left out) and player count.
export function weeklySessions(sessions: GroupedSession[], today: Date) {
  const thisWeek = startOfWeek(today, { weekStartsOn: 1 });
  const weeks = Array.from({ length: WEEKS }, (_, i) => ({
    weekStart: weekKey(subWeeks(thisWeek, WEEKS - 1 - i)),
    count: 0,
    light: 0,
    medium: 0,
    heavy: 0,
    p1: 0,
    p2: 0,
    p3: 0,
    p4: 0,
    p5plus: 0,
  }));
  const byWeek = new Map(weeks.map((w) => [w.weekStart, w]));

  for (const s of sessions) {
    const week = byWeek.get(weekKey(parseISO(s.datePlayed)));
    if (!week) continue;
    week.count++;
    if (s.gameWeight && s.gameWeight > 0) week[getComplexityBin(s.gameWeight)]++;
    week[getPlayerCountBin(s.players.length)]++;
  }
  return weeks;
}

// Averages over the last 4 weeks of the chart, the current week included
export function lastMonthAverages(sessions: GroupedSession[], today: Date) {
  const from = weekKey(subWeeks(startOfWeek(today, { weekStartsOn: 1 }), 3));
  const recent = sessions.filter((s) => weekKey(parseISO(s.datePlayed)) >= from);
  return {
    sessionsPerWeek: recent.length / 4,
    complexity: averageComplexity(recent),
    players:
      recent.length === 0
        ? null
        : recent.reduce((sum, s) => sum + s.players.length, 0) / recent.length,
  };
}

// Top labels (mechanics or categories) by sessions played. Each session counts
// once per label its game has; share is out of every session, so sessions of
// unlabelled games still count in the total. Ties go to the label played most
// recently, then alphabetically.
export function topTags(
  sessions: GroupedSession[],
  labelsByGame: Record<number, string[]>,
  limit = 5,
) {
  const tally = new Map<string, { latest: GroupedSession; count: number }>();
  for (const s of sessions) {
    for (const label of new Set(labelsByGame[s.gameId] ?? [])) {
      const entry = tally.get(label);
      if (!entry) tally.set(label, { latest: s, count: 1 });
      else {
        entry.count++;
        if (isLater(s, entry.latest)) entry.latest = s;
      }
    }
  }

  return [...tally]
    .sort(
      ([a, x], [b, y]) =>
        y.count - x.count ||
        (isLater(x.latest, y.latest) ? -1 : isLater(y.latest, x.latest) ? 1 : 0) ||
        a.localeCompare(b),
    )
    .slice(0, limit)
    .map(([label, { count }]) => ({
      label,
      sessions: count,
      share: count / sessions.length,
    }));
}

// Average game weight per session; unknown weights are left out, as above
export function averageComplexity(sessions: GroupedSession[]): number | null {
  const weights = sessions
    .map((s) => s.gameWeight)
    .filter((w): w is number => w !== null && w > 0);
  if (weights.length === 0) return null;
  return weights.reduce((sum, w) => sum + w, 0) / weights.length;
}

// Average WPA per Rated Session, lifetime, across every tribe
export function averageWpa(
  sessions: GroupedSession[],
  profileId: number,
): number | null {
  const scores = sessions
    .filter((s) => sessionMode(s) === "rated")
    .map((s) => playerRow(s, profileId)?.score)
    .filter((score): score is number => score != null);
  if (scores.length === 0) return null;
  return scores.reduce((sum, score) => sum + score, 0) / scores.length;
}

// Every game the player has played, for the Games tab: favourites first, then
// by plays, ties to the one played most recently. Elo is their current Elo in
// the game, if it has one (rated games only).
export function playedGames(
  sessions: GroupedSession[],
  elos: { gameId: number; elo: number; sessionsPlayed: number }[],
  favouriteIds: Set<number>,
) {
  const games = new Map<number, { latest: GroupedSession; plays: number }>();
  for (const s of sessions) {
    const game = games.get(s.gameId);
    if (!game) games.set(s.gameId, { latest: s, plays: 1 });
    else {
      game.plays++;
      if (isLater(s, game.latest)) game.latest = s;
    }
  }
  const eloByGame = new Map(elos.map((e) => [e.gameId, e]));

  return [...games.values()]
    .sort(
      (a, b) =>
        Number(favouriteIds.has(b.latest.gameId)) - Number(favouriteIds.has(a.latest.gameId)) ||
        b.plays - a.plays ||
        (isLater(a.latest, b.latest) ? -1 : isLater(b.latest, a.latest) ? 1 : 0),
    )
    .map(({ latest, plays }) => {
      const elo = eloByGame.get(latest.gameId);
      return {
        gameId: latest.gameId,
        title: latest.gameTitle,
        thumbnail: latest.gameImage,
        plays,
        lastPlayed: latest.datePlayed,
        weight: latest.gameWeight,
        playingTime: latest.playingTime,
        favourite: favouriteIds.has(latest.gameId),
        elo: elo
          ? { elo: Math.round(elo.elo), calibrating: !isCalibrated(elo.sessionsPlayed) }
          : null,
      };
    });
}

export const PLAY_TIME_RANGES = [
  { key: "under30", label: "Under 30 min" },
  { key: "30to60", label: "30-60 min" },
  { key: "1to2h", label: "1-2 hours" },
  { key: "over2h", label: "Over 2 hours" },
] as const;
export type PlayTimeRange = (typeof PLAY_TIME_RANGES)[number]["key"];

export const playTimeRange = (minutes: number | null): PlayTimeRange | null =>
  !minutes || minutes <= 0
    ? null
    : minutes < 30
      ? "under30"
      : minutes <= 60
        ? "30to60"
        : minutes <= 120
          ? "1to2h"
          : "over2h";

export interface GameFilters {
  categories: string[];
  mechanics: string[];
  complexity: ("light" | "medium" | "heavy")[];
  playTime: PlayTimeRange[];
}

// Title search plus filters: a game matches any option within a filter, and
// every filter that has options picked. Games missing a value (no weight, no
// playing time) drop out once that filter is in use.
export function filterGames<
  G extends {
    title: string;
    weight: number | null;
    playingTime: number | null;
    categories: string[];
    mechanics: string[];
  },
>(games: G[], query: string, filters: GameFilters): G[] {
  const q = query.trim().toLowerCase();
  const anyOf = <T,>(picked: T[], values: T[]) =>
    picked.length === 0 || values.some((v) => picked.includes(v));

  return games.filter((g) => {
    const complexity = g.weight && g.weight > 0 ? [getComplexityBin(g.weight)] : [];
    const time = playTimeRange(g.playingTime);
    return (
      g.title.toLowerCase().includes(q) &&
      anyOf(filters.categories, g.categories) &&
      anyOf(filters.mechanics, g.mechanics) &&
      anyOf(filters.complexity, complexity) &&
      anyOf(filters.playTime, time ? [time] : [])
    );
  });
}
