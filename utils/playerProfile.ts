// Stats for the public player page (/player/[username]). Pure: takes the
// player's sessions as filterSessionData returns them (newest first).
import type { GroupedSession } from "@/lib/interfaces";
import { isCalibrated } from "@/utils/elo";
import { sessionMode } from "@/utils/sessionPage";
import { getWeightLabel } from "@/components/tribes/games/utils";
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
// Weeks without a session stay in the list with a count of 0.
export function weeklySessions(sessions: GroupedSession[], today: Date) {
  const counts = new Map<string, number>();
  for (const s of sessions) {
    const key = weekKey(parseISO(s.datePlayed));
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  const thisWeek = startOfWeek(today, { weekStartsOn: 1 });
  return Array.from({ length: WEEKS }, (_, i) => {
    const weekStart = weekKey(subWeeks(thisWeek, WEEKS - 1 - i));
    return { weekStart, count: counts.get(weekStart) ?? 0 };
  });
}

const WEIGHT_BANDS = ["Light", "Medium", "Heavy", "Very Heavy"];

// Sessions per game weight band (getWeightLabel's bands). Games without a
// known weight are left out rather than counted as Light.
export function difficultyBreakdown(sessions: GroupedSession[]) {
  const counts = new Map(WEIGHT_BANDS.map((label) => [label, 0]));
  for (const s of sessions) {
    if (!s.gameWeight || s.gameWeight <= 0) continue;
    const label = getWeightLabel(s.gameWeight);
    counts.set(label, counts.get(label)! + 1);
  }
  return WEIGHT_BANDS.map((label) => ({ label, count: counts.get(label)! }));
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
