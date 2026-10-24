import { describe, expect, it } from "vitest";
import {
  averageWpa,
  difficultyBreakdown,
  highestEloGame,
  mostPlayedGame,
  topTribe,
  weeklySessions,
} from "@/utils/playerProfile";
import type { GroupedSession, SessionPlayer } from "@/lib/interfaces";

const ME = 1;
let rowId = 0;

const player = (
  profileId: number,
  over: Partial<SessionPlayer> = {},
): SessionPlayer => ({
  rowId: ++rowId,
  profileId,
  firstName: "P",
  lastName: String(profileId),
  username: `p${profileId}`,
  profilePic: "",
  isAnonymous: false,
  teamId: null,
  victoryPoints: null,
  position: 1,
  isWinner: false,
  isTie: false,
  isFirstPlay: false,
  isHighScore: false,
  score: null,
  eloBefore: null,
  eloAfter: null,
  eloSessionsBefore: null,
  ...over,
});

// A session the viewer (ME) played; `me` overrides their row
const session = (
  over: Partial<GroupedSession> & { me?: Partial<SessionPlayer> } = {},
): GroupedSession => {
  const { me, ...rest } = over;
  const players = rest.players ?? [player(ME, me), player(2, { position: 2 })];
  return {
    sessionId: `s${++rowId}`,
    datePlayed: "2026-10-01",
    gameTitle: "Wingspan",
    gameId: 10,
    gameImage: null,
    gameWeight: 2.4,
    playingTime: 60,
    createdAt: new Date("2026-10-01T20:00:00Z"),
    numPlayers: players.length,
    tribe: "Thursday Meeples",
    tribeId: "t1",
    tribeImage: "",
    isVp: true,
    coop: false,
    isTeamGame: false,
    expansions: [],
    isPlayer: true,
    isWinner: false,
    isTied: false,
    isLoser: false,
    isFirstPlay: false,
    isHighScore: false,
    rating: null,
    ...rest,
    players,
  };
};

describe("averageWpa", () => {
  it("averages the player's score over Rated Sessions only", () => {
    const sessions = [
      session({ me: { score: 2 } }),
      session({ me: { score: 3 } }),
      // Unrated sessions don't count towards WPA, even with a score
      session({ isVp: false, me: { score: 9 } }),
      // Nor do co-op or solo ones: they're never Rated Sessions
      session({ coop: true, me: { score: 9 } }),
      session({ players: [player(ME, { score: 9 })] }),
    ];
    expect(averageWpa(sessions, ME)).toBe(2.5);
  });

  it("is null when the player has no scored Rated Session", () => {
    expect(averageWpa([session({ isVp: false })], ME)).toBeNull();
  });
});

const wingspan = { gameId: 10, gameTitle: "Wingspan" };
const cascadia = { gameId: 20, gameTitle: "Cascadia" };

describe("mostPlayedGame", () => {
  it("picks the game with the most sessions", () => {
    const sessions = [
      session({ ...cascadia, datePlayed: "2026-10-05" }),
      session({ ...wingspan, datePlayed: "2026-09-01" }),
      session({ ...wingspan, datePlayed: "2026-09-02" }),
    ];
    expect(mostPlayedGame(sessions)).toMatchObject({
      gameId: 10,
      gameTitle: "Wingspan",
      count: 2,
    });
  });

  it("breaks a tie with the most recently played game", () => {
    const sessions = [
      session({ ...wingspan, datePlayed: "2026-09-01" }),
      session({ ...cascadia, datePlayed: "2026-09-03" }),
      session({ ...wingspan, datePlayed: "2026-09-02" }),
      session({ ...cascadia, datePlayed: "2026-08-01" }),
    ];
    expect(mostPlayedGame(sessions)?.gameId).toBe(20);
  });

  it("breaks a same-day tie with the later logged session", () => {
    const sessions = [
      session({
        ...wingspan,
        datePlayed: "2026-09-01",
        createdAt: new Date("2026-09-01T21:00:00Z"),
      }),
      session({
        ...cascadia,
        datePlayed: "2026-09-01",
        createdAt: new Date("2026-09-01T19:00:00Z"),
      }),
    ];
    expect(mostPlayedGame(sessions)?.gameId).toBe(10);
  });

  it("is null with no sessions", () => {
    expect(mostPlayedGame([])).toBeNull();
  });
});

describe("highestEloGame", () => {
  const arkNova = { gameId: 30, gameTitle: "Ark Nova" };
  const played = [
    session({ ...wingspan, datePlayed: "2026-09-01" }),
    session({ ...cascadia, datePlayed: "2026-09-02" }),
    session({ ...arkNova, datePlayed: "2026-09-03" }),
  ];

  it("picks the highest Calibrated Elo over a higher one still in Calibration", () => {
    const elos = [
      { gameId: 10, elo: 640, sessionsPlayed: 12 },
      { gameId: 20, elo: 410, sessionsPlayed: 10 },
      { gameId: 30, elo: 900, sessionsPlayed: 4 },
    ];
    expect(highestEloGame(elos, played)).toEqual({
      gameId: 10,
      gameTitle: "Wingspan",
      gameImage: null,
      elo: 640,
      calibrated: true,
    });
  });

  it("falls back to the highest Elo in Calibration when nothing is Calibrated", () => {
    const elos = [
      { gameId: 10, elo: 120, sessionsPlayed: 3 },
      { gameId: 30, elo: 260, sessionsPlayed: 6 },
    ];
    expect(highestEloGame(elos, played)).toMatchObject({
      gameId: 30,
      elo: 260,
      calibrated: false,
    });
  });

  it("breaks a tie with the most recently played game", () => {
    const elos = [
      { gameId: 10, elo: 500, sessionsPlayed: 11 },
      { gameId: 20, elo: 500, sessionsPlayed: 15 },
    ];
    expect(highestEloGame(elos, played)?.gameId).toBe(20);
  });

  it("is null with no Elo", () => {
    expect(highestEloGame([], played)).toBeNull();
  });
});

describe("weeklySessions", () => {
  // A Thursday: the current week starts Monday 19 Oct 2026
  const today = new Date(2026, 9, 22);
  const on = (datePlayed: string) => session({ datePlayed });

  it("returns 52 Monday-start weeks ending with the current week", () => {
    const weeks = weeklySessions([], today);
    expect(weeks).toHaveLength(52);
    expect(weeks[0].weekStart).toBe("2025-10-27");
    expect(weeks[51].weekStart).toBe("2026-10-19");
  });

  it("counts each session in the week it was played, Sunday closing the week", () => {
    const weeks = weeklySessions(
      [on("2026-10-19"), on("2026-10-18"), on("2026-10-12")],
      today,
    );
    expect(weeks[51].count).toBe(1);
    expect(weeks[50]).toEqual({ weekStart: "2026-10-12", count: 2 });
  });

  it("keeps empty weeks and drops sessions before the first week", () => {
    const weeks = weeklySessions(
      [on("2025-10-27"), on("2025-10-26"), on("2026-10-20")],
      today,
    );
    expect(weeks[0].count).toBe(1);
    expect(weeks[25].count).toBe(0);
    expect(weeks.reduce((sum, w) => sum + w.count, 0)).toBe(2);
  });
});

describe("difficultyBreakdown", () => {
  const weighing = (gameWeight: number | null) => session({ gameWeight });

  it("counts sessions per weight band, in band order, edges inclusive", () => {
    const sessions = [1.8, 2.5, 2.6, 3.5, 4.5, 4.8].map(weighing);
    expect(difficultyBreakdown(sessions)).toEqual([
      { label: "Light", count: 2 },
      { label: "Medium", count: 2 },
      { label: "Heavy", count: 1 },
      { label: "Very Heavy", count: 1 },
    ]);
  });

  it("leaves out games with no known weight", () => {
    const counts = difficultyBreakdown([weighing(null), weighing(0)]);
    expect(counts.every((band) => band.count === 0)).toBe(true);
  });
});

describe("topTribe", () => {
  const meeples = { tribeId: "t1", tribe: "Thursday Meeples" };
  const dice = { tribeId: "t2", tribe: "Dice Club" };

  it("picks the tribe with the most sessions", () => {
    const sessions = [
      session({ ...dice, datePlayed: "2026-10-05" }),
      session({ ...meeples, datePlayed: "2026-09-01" }),
      session({ ...meeples, datePlayed: "2026-09-02" }),
    ];
    expect(topTribe(sessions)).toMatchObject({
      tribeId: "t1",
      name: "Thursday Meeples",
      count: 2,
    });
  });

  it("breaks a tie with the most recently played tribe", () => {
    const sessions = [
      session({ ...meeples, datePlayed: "2026-09-01" }),
      session({ ...dice, datePlayed: "2026-09-04" }),
    ];
    expect(topTribe(sessions)?.tribeId).toBe("t2");
  });
});
