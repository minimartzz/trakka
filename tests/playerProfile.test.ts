import { describe, expect, it } from "vitest";
import {
  averageComplexity,
  filterGames,
  playedGames,
  playTimeRange,
  averageWpa,
  highestEloGame,
  lastMonthAverages,
  mostPlayedGame,
  topTags,
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
    expect(weeks[50]).toMatchObject({ weekStart: "2026-10-12", count: 2 });
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

  it("splits each week by complexity tier and player count", () => {
    const solo = [player(ME)];
    const crowd = [1, 2, 3, 4, 5, 6].map((id) => player(id));
    const [week] = weeklySessions(
      [
        session({ datePlayed: "2026-10-20", gameWeight: 2.5, players: solo }),
        session({ datePlayed: "2026-10-20", gameWeight: 3.6, players: crowd }),
        session({ datePlayed: "2026-10-20", gameWeight: null }),
      ],
      today,
    ).slice(-1);
    expect(week).toMatchObject({ count: 3, light: 1, medium: 0, heavy: 1 });
    expect(week).toMatchObject({ p1: 1, p2: 1, p5plus: 1 });
  });
});

describe("lastMonthAverages", () => {
  // A Thursday: the last 4 weeks start Monday 28 Sep 2026
  const today = new Date(2026, 9, 22);

  it("averages the last 4 weeks, current week included", () => {
    const averages = lastMonthAverages(
      [
        session({ datePlayed: "2026-10-21", gameWeight: 2 }),
        session({ datePlayed: "2026-09-28", gameWeight: 4 }),
        session({ datePlayed: "2026-09-27", gameWeight: 5 }),
      ],
      today,
    );
    expect(averages).toEqual({ sessionsPerWeek: 0.5, complexity: 3, players: 2 });
  });

  it("has no complexity or player average without recent sessions", () => {
    expect(lastMonthAverages([], today)).toEqual({
      sessionsPerWeek: 0,
      complexity: null,
      players: null,
    });
  });
});

describe("averageComplexity", () => {
  const weighing = (gameWeight: number | null) => session({ gameWeight });

  it("averages weight per session, skipping unknown weights", () => {
    const sessions = [2, 3, 4, null, 0].map(weighing);
    expect(averageComplexity(sessions)).toBe(3);
  });

  it("is null with no known weights", () => {
    expect(averageComplexity([weighing(null)])).toBeNull();
  });
});

describe("topTags", () => {
  const labels = {
    10: ["Engine Building", "Hand Management", "Engine Building"],
    20: ["Worker Placement", "Hand Management"],
  };
  const of = (gameId: number, datePlayed = "2026-10-01") =>
    session({ gameId, datePlayed });

  it("ranks labels by sessions, with share out of every session", () => {
    // Game 30 has no labels but still counts toward the total
    const tags = topTags([of(10), of(10), of(20), of(30)], labels);
    expect(tags).toEqual([
      { label: "Hand Management", sessions: 3, share: 0.75 },
      { label: "Engine Building", sessions: 2, share: 0.5 },
      { label: "Worker Placement", sessions: 1, share: 0.25 },
    ]);
  });

  it("breaks ties by most recent play, then alphabetically", () => {
    const tags = topTags(
      [of(10, "2026-10-01"), of(20, "2026-10-05")],
      { 10: ["B", "C"], 20: ["A", "D"] },
    );
    expect(tags.map((t) => t.label)).toEqual(["A", "D", "B", "C"]);
  });

  it("returns at most the limit, and nothing without labels", () => {
    expect(topTags([of(10), of(20)], labels, 2)).toHaveLength(2);
    expect(topTags([of(10)], {})).toEqual([]);
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

describe("playedGames", () => {
  const play = (gameId: number, datePlayed: string, gameTitle = `G${gameId}`) =>
    session({ gameId, gameTitle, datePlayed });

  it("puts favourites first, then most played, then most recent", () => {
    const games = playedGames(
      [
        play(1, "2026-10-01"),
        play(1, "2026-10-02"),
        play(2, "2026-10-03"),
        play(3, "2026-10-05"),
        play(4, "2026-09-01"),
      ],
      [],
      new Set([4]),
    );
    expect(games.map((g) => g.gameId)).toEqual([4, 1, 3, 2]);
    expect(games[1]).toMatchObject({ plays: 2, lastPlayed: "2026-10-02", favourite: false });
    expect(games[0].favourite).toBe(true);
  });

  it("attaches the current Elo, rounded, with calibration", () => {
    const [game] = playedGames(
      [play(1, "2026-10-01")],
      [{ gameId: 1, elo: 212.6, sessionsPlayed: 3 }],
      new Set(),
    );
    expect(game.elo).toEqual({ elo: 213, calibrating: true });
  });
});

describe("playTimeRange", () => {
  it("buckets minutes into the filter ranges, edges inclusive upward", () => {
    expect([29, 30, 60, 61, 120, 121].map(playTimeRange)).toEqual([
      "under30",
      "30to60",
      "30to60",
      "1to2h",
      "1to2h",
      "over2h",
    ]);
    expect(playTimeRange(null)).toBeNull();
    expect(playTimeRange(0)).toBeNull();
  });
});

describe("filterGames", () => {
  const game = (title: string, over: Partial<Parameters<typeof filterGames>[0][number]> = {}) => ({
    title,
    weight: 2,
    playingTime: 45,
    categories: ["Animals"],
    mechanics: ["Engine Building"],
    ...over,
  });
  const none = { categories: [], mechanics: [], complexity: [], playTime: [] };
  const games = [
    game("Wingspan"),
    game("Brass", { weight: 3.9, playingTime: 120, categories: ["Economic"] }),
    game("Mystery", { weight: null, playingTime: null }),
  ];
  const titles = (gs: { title: string }[]) => gs.map((g) => g.title);

  it("searches titles case-insensitively", () => {
    expect(titles(filterGames(games, "  wING ", none))).toEqual(["Wingspan"]);
  });

  it("matches any option within a filter and every filter in use", () => {
    expect(
      titles(filterGames(games, "", { ...none, categories: ["Animals", "Economic"] })),
    ).toEqual(["Wingspan", "Brass", "Mystery"]);
    expect(
      titles(filterGames(games, "", { ...none, categories: ["Economic"], complexity: ["light"] })),
    ).toEqual([]);
  });

  it("drops games missing a value once that filter is in use", () => {
    expect(titles(filterGames(games, "", { ...none, complexity: ["light", "heavy"] }))).toEqual([
      "Wingspan",
      "Brass",
    ]);
    expect(titles(filterGames(games, "", { ...none, playTime: ["30to60"] }))).toEqual(["Wingspan"]);
  });
});
