import { describe, expect, it } from "vitest";
import {
  calculateBadges,
  calculateComparativeStats,
  calculateHeadToHead,
  calculatePlayerGameStatsDetailed,
} from "@/utils/playerStatsCalculations";
import type { GameSession, MemberElo, TribeMember } from "@/types/tribes";

// Eligible for badges (4+ games in the tribe)
const member = (profileId: number): TribeMember => ({
  profileId,
  username: `p${profileId}`,
  firstName: `P${profileId}`,
  lastName: "",
  image: null,
  roleId: 3,
  joinedAt: null,
  gamesPlayed: 10,
  wins: 0,
  winRate: 0,
});

const elo = (
  profileId: number,
  gameId: number,
  value: number,
  sessionsPlayed: number,
): MemberElo => ({
  profileId,
  gameId,
  elo: value,
  sessionsPlayed,
  gameTitle: null,
  thumbnail: null,
});

const badgeHolder = (
  badges: ReturnType<typeof calculateBadges>,
  type: string,
): number | undefined =>
  [...badges.entries()].find(([, list]) =>
    list.some((b) => b.type === type),
  )?.[0];

// A competitive session; each player is [profileId, isWinner, eloBefore, eloSessionsBefore]
const session = (
  sessionId: string,
  players: [number, boolean, number, number][],
): GameSession => ({
  sessionId,
  datePlayed: "2026-01-01",
  createdAt: "2026-01-01T12:00:00Z",
  gameId: 100,
  gameTitle: "Brass",
  gameImageUrl: null,
  thumbnail: null,
  playingTime: 120,
  gameWeight: 3.9,
  coop: false,
  isVp: true,
  players: players.map(
    ([profileId, isWinner, eloBefore, eloSessionsBefore], i) => ({
      profileId,
      username: `p${profileId}`,
      firstName: `P${profileId}`,
      lastName: "",
      image: null,
      isWinner,
      position: isWinner ? 1 : i + 1,
      score: null,
      victoryPoints: null,
      winContrib: null,
      eloBefore,
      eloAfter: null,
      eloSessionsBefore,
    }),
  ),
});

describe("Underdog", () => {
  it("counts wins over higher-Elo players only when both were past the Calibration period", () => {
    const members = [member(1), member(2), member(3), member(4), member(5)];
    const sessions = [
      // A real upset for 1
      session("s1", [
        [1, true, 200, 13],
        [2, false, 300, 15],
      ]),
      // 4 is still in the Calibration period: not an upset
      session("s2", [
        [4, true, 150, 2],
        [2, false, 300, 16],
      ]),
      session("s3", [
        [4, true, 160, 3],
        [2, false, 290, 17],
      ]),
      // 3 was still in the Calibration period as the loser: not an upset
      session("s4", [
        [4, true, 170, 11],
        [3, false, 400, 9],
      ]),
      // 5 is below 100 but past the Calibration period: still upsets
      session("s5", [
        [5, true, 80, 14],
        [2, false, 280, 18],
      ]),
      session("s6", [
        [5, true, 90, 15],
        [2, false, 270, 19],
      ]),
    ];

    const badges = calculateBadges(sessions, members, []);

    // 5 has 2 upsets and 1 has 1; none of 4's 3 wins count
    expect(badgeHolder(badges, "underdog")).toBe(5);
    expect(badges.get(5)!.find((b) => b.type === "underdog")!.value).toBe(
      "2 upsets",
    );
  });
});

describe("Elo King", () => {
  it("goes to the member with the highest Calibrated Elo in any single game", () => {
    const members = [member(1), member(2), member(3)];
    const elos = [
      elo(1, 100, 350, 12),
      elo(2, 100, 300, 30),
      elo(2, 200, 410, 13),
      elo(3, 300, 280, 40),
    ];

    const badges = calculateBadges([], members, elos);

    expect(badgeHolder(badges, "elo_king")).toBe(2);
  });

  it("ignores Elo from games the member is still in the Calibration period for", () => {
    const members = [member(1), member(2)];
    const elos = [elo(1, 100, 500, 9), elo(2, 100, 120, 10)];

    const badges = calculateBadges([], members, elos);

    expect(badgeHolder(badges, "elo_king")).toBe(2);
  });

  it("goes to nobody when every member is still in the Calibration period", () => {
    const badges = calculateBadges([], [member(1)], [elo(1, 100, 300, 9)]);

    expect(badgeHolder(badges, "elo_king")).toBeUndefined();
  });

  it("counts a member below 100 once the Calibration period is over", () => {
    const badges = calculateBadges([], [member(1)], [elo(1, 100, 95, 12)]);

    expect(badgeHolder(badges, "elo_king")).toBe(1);
  });

  it("breaks a tie in favour of the member with more sessions of that game", () => {
    const members = [member(1), member(2)];
    const elos = [elo(1, 100, 350, 14), elo(2, 200, 350, 21)];

    const badges = calculateBadges([], members, elos);

    expect(badgeHolder(badges, "elo_king")).toBe(2);
  });

  it("shows only the badge, with no value", () => {
    const badges = calculateBadges([], [member(1)], [elo(1, 100, 350, 14)]);

    const king = badges.get(1)!.find((b) => b.type === "elo_king")!;
    expect(king.value).toBe("");
  });
});

let playId = 0;

// One session of a game for player 1: competitive against one opponent,
// co-op with one teammate, or solo
const play = (
  gameId: number,
  won: boolean,
  kind: "competitive" | "coop" | "solo" = "competitive",
): GameSession => {
  const player = (profileId: number, isWinner: boolean) => ({
    profileId,
    username: `p${profileId}`,
    firstName: `P${profileId}`,
    lastName: "",
    image: null,
    isWinner,
    position: isWinner ? 1 : 2,
    score: null,
    victoryPoints: null,
    winContrib: null,
    eloBefore: null,
    eloAfter: null,
    eloSessionsBefore: null,
  });
  return {
    sessionId: `play${playId++}`,
    datePlayed: "2026-01-01",
    createdAt: "2026-01-01T12:00:00Z",
    gameId,
    gameTitle: `Game ${gameId}`,
    gameImageUrl: null,
    thumbnail: null,
    playingTime: 60,
    gameWeight: 2,
    coop: kind === "coop",
    isVp: kind === "competitive",
    players:
      kind === "solo"
        ? [player(1, won)]
        : kind === "coop"
          ? [player(1, won), player(2, won)]
          : [player(1, won), player(2, !won)],
  };
};

const plays = (
  gameId: number,
  wins: number,
  losses: number,
  kind?: "competitive" | "coop" | "solo",
): GameSession[] => [
  ...Array.from({ length: wins }, () => play(gameId, true, kind)),
  ...Array.from({ length: losses }, () => play(gameId, false, kind)),
];

const bestAndWorst = (sessions: GameSession[]) => {
  const { bestGame, worstGame } = calculatePlayerGameStatsDetailed(sessions, 1);
  return { best: bestGame?.gameId ?? null, worst: worstGame?.gameId ?? null };
};

describe("Best and worst game", () => {
  it("only counts competitive sessions", () => {
    const sessions = [
      ...plays(1, 5, 0, "coop"),
      ...plays(2, 4, 0, "solo"),
      ...plays(3, 3, 1),
      ...plays(4, 1, 3),
    ];

    expect(bestAndWorst(sessions)).toEqual({ best: 3, worst: 4 });
  });

  it("only considers games with at least 3 plays", () => {
    const sessions = [
      ...plays(1, 2, 0),
      ...plays(2, 2, 1),
      ...plays(3, 0, 2),
      ...plays(4, 1, 2),
    ];

    expect(bestAndWorst(sessions)).toEqual({ best: 2, worst: 4 });
  });

  it("weights the win rate by plays, but still shows the plain win rate", () => {
    const sessions = [
      ...plays(1, 3, 0),
      ...plays(2, 19, 1),
      ...plays(3, 0, 3),
      ...plays(4, 1, 19),
    ];

    const { bestGame, worstGame } = calculatePlayerGameStatsDetailed(
      sessions,
      1,
    );

    // 19 of 20 outranks 3 of 3, and 19 losses in 20 outrank 3 in 3
    expect(bestGame).toMatchObject({ gameId: 2, winRate: 95 });
    expect(worstGame).toMatchObject({ gameId: 4, winRate: 5 });
  });

  it("never picks the best game as the worst game too", () => {
    const sessions = [...plays(1, 5, 5), ...plays(2, 1, 0)];

    expect(bestAndWorst(sessions)).toEqual({ best: 1, worst: null });
  });

  it("has no best game without a win, and no worst game without a loss", () => {
    expect(bestAndWorst(plays(1, 0, 3))).toEqual({ best: null, worst: 1 });
    expect(bestAndWorst(plays(1, 3, 0))).toEqual({ best: 1, worst: null });
  });

  it("averages the player's score over Rated Sessions for Game WPA", () => {
    const scored = (gameId: number, score: number, isVp = true) => {
      const session = play(gameId, true);
      session.isVp = isVp;
      session.players[0].score = score;
      return session;
    };
    const sessions = [
      scored(1, 1),
      scored(1, 2),
      scored(1, 9, false),
      scored(2, 4, false),
    ];

    const { allGames } = calculatePlayerGameStatsDetailed(sessions, 1);
    const gameWpa = (gameId: number) =>
      allGames.find((g) => g.gameId === gameId)?.gameWpa;

    expect(gameWpa(1)).toBe(1.5);
    expect(gameWpa(2)).toBeNull();
  });
});

let rankedId = 0;

// A session from [profileId, position] pairs; position 1 wins. Co-op puts
// everyone in first place.
const ranked = (
  entries: [number, number][],
  opts: { coop?: boolean; date?: string; loggedAt?: string } = {},
): GameSession => {
  const date = opts.date ?? "2026-01-01";
  return {
    sessionId: `ranked${rankedId++}`,
    datePlayed: date,
    createdAt: opts.loggedAt ?? `${date}T12:00:00Z`,
    gameId: 100,
    gameTitle: "Brass",
    gameImageUrl: null,
    thumbnail: null,
    playingTime: 120,
    gameWeight: 3.9,
    coop: !!opts.coop,
    isVp: !opts.coop,
    players: entries.map(([profileId, position]) => ({
      profileId,
      username: `p${profileId}`,
      firstName: `P${profileId}`,
      lastName: "",
      image: null,
      isWinner: opts.coop ? true : position === 1,
      position: opts.coop ? 1 : position,
      score: null,
      victoryPoints: null,
      winContrib: null,
      eloBefore: null,
      eloAfter: null,
      eloSessionsBefore: null,
    })),
  };
};

const times = (k: number, make: () => GameSession) =>
  Array.from({ length: k }, make);

describe("Nemesis, Dominating and Best Buddy", () => {
  it("scores head-to-heads by finishing position, in competitive sessions only", () => {
    const sessions = [
      // P4 wins; you finish ahead of P2
      ...times(3, () =>
        ranked([
          [4, 1],
          [1, 2],
          [2, 3],
        ]),
      ),
      // Co-op with P4 doesn't count as a head-to-head
      ...times(5, () =>
        ranked(
          [
            [1, 1],
            [4, 1],
          ],
          { coop: true },
        ),
      ),
    ];

    const { nemesis, dominating } = calculateComparativeStats(sessions, 1);

    expect(nemesis).toMatchObject({ profileId: 4, wins: 0, losses: 3 });
    expect(dominating).toMatchObject({ profileId: 2, wins: 3, losses: 0 });
  });

  it("leaves out shared positions: draws and teammates", () => {
    const sessions = times(3, () =>
      ranked([
        [1, 1],
        [2, 1],
        [3, 2],
      ]),
    );

    const { nemesis, dominating } = calculateComparativeStats(sessions, 1);

    expect(nemesis).toBeNull();
    expect(dominating).toMatchObject({ profileId: 3, wins: 3, losses: 0 });
  });

  it("weights the record by games, so 4 losses in 4 outranks 10 in 30", () => {
    const sessions = [
      ...times(20, () =>
        ranked([
          [1, 1],
          [2, 2],
        ]),
      ),
      ...times(10, () =>
        ranked([
          [2, 1],
          [1, 2],
        ]),
      ),
      ...times(4, () =>
        ranked([
          [3, 1],
          [1, 2],
        ]),
      ),
    ];

    const { nemesis, dominating } = calculateComparativeStats(sessions, 1);

    expect(nemesis?.profileId).toBe(3);
    expect(dominating?.profileId).toBe(2);
  });

  it("needs 3 head-to-heads, and never makes the Nemesis Dominating too", () => {
    const sessions = [
      ...times(3, () =>
        ranked([
          [1, 1],
          [2, 2],
        ]),
      ),
      ...times(3, () =>
        ranked([
          [2, 1],
          [1, 2],
        ]),
      ),
      ...times(2, () =>
        ranked([
          [1, 1],
          [3, 2],
        ]),
      ),
    ];

    const { nemesis, dominating } = calculateComparativeStats(sessions, 1);

    expect(nemesis?.profileId).toBe(2);
    expect(dominating).toBeNull();
  });

  it("makes Best Buddy whoever you've played the most sessions with, co-op included, most recent first on a tie", () => {
    const sessions = [
      ...times(4, () =>
        ranked(
          [
            [1, 1],
            [2, 1],
          ],
          { coop: true, date: "2026-01-02" },
        ),
      ),
      ...times(4, () =>
        ranked(
          [
            [1, 1],
            [3, 2],
          ],
          { date: "2026-01-01" },
        ),
      ),
    ];

    const { bestBuddy } = calculateComparativeStats(sessions, 1);

    expect(bestBuddy).toMatchObject({ profileId: 2, sessionsTogether: 4 });
  });

  it("lists the 3 most recent head-to-heads with both positions, newest first", () => {
    const vsP2 = (date: string, mine: number, theirs: number) =>
      ranked(
        [
          [1, mine],
          [2, theirs],
        ],
        { date },
      );
    const sessions = [
      vsP2("2026-01-01", 1, 2),
      vsP2("2026-01-04", 2, 1),
      vsP2("2026-01-02", 1, 3),
      vsP2("2026-01-03", 3, 1),
      // A draw and a co-op session are newer, but aren't head-to-heads
      vsP2("2026-01-05", 1, 1),
      ranked(
        [
          [1, 1],
          [2, 1],
        ],
        { coop: true, date: "2026-01-06" },
      ),
    ];

    const { nemesis } = calculateComparativeStats(sessions, 1);

    expect(nemesis?.recent).toEqual([
      expect.objectContaining({
        datePlayed: "2026-01-04",
        position: 2,
        theirPosition: 1,
      }),
      expect.objectContaining({
        datePlayed: "2026-01-03",
        position: 3,
        theirPosition: 1,
      }),
      expect.objectContaining({
        datePlayed: "2026-01-02",
        position: 1,
        theirPosition: 3,
      }),
    ]);
  });
});

describe("Head-to-head", () => {
  const p1Ahead = (date: string, loggedAt?: string) =>
    ranked(
      [
        [1, 1],
        [2, 2],
      ],
      { date, loggedAt },
    );
  const p2Ahead = (date: string, loggedAt?: string) =>
    ranked(
      [
        [2, 1],
        [1, 2],
      ],
      { date, loggedAt },
    );

  it("only counts competitive sessions", () => {
    const sessions = [
      p1Ahead("2026-01-01"),
      p1Ahead("2026-01-02"),
      ranked(
        [
          [1, 1],
          [2, 1],
        ],
        { coop: true, date: "2026-01-03" },
      ),
    ];

    const h2h = calculateHeadToHead(sessions, 1, 2);

    expect(h2h).toMatchObject({ p1H2HWins: 2, p2H2HWins: 0, h2hTies: 0 });
    expect(h2h.h2hByPlayerCount.find((b) => b.label === "2p")?.total).toBe(2);
    expect(h2h.currentStreak).toEqual({ profileId: 1, streak: 2 });
  });

  it("ties teammates, and gives the win to the one on the winning team", () => {
    const sessions = [
      // Same team
      ranked([
        [1, 1],
        [2, 1],
        [3, 2],
        [4, 2],
      ]),
      // Opposite teams, 1's team wins
      ranked([
        [1, 1],
        [3, 1],
        [2, 2],
        [4, 2],
      ]),
    ];

    const h2h = calculateHeadToHead(sessions, 1, 2);

    expect(h2h).toMatchObject({ p1H2HWins: 1, p2H2HWins: 0, h2hTies: 1 });
  });

  it("lets a tie neither extend nor end a streak", () => {
    const sessions = [
      p1Ahead("2026-01-01"),
      ranked(
        [
          [1, 1],
          [2, 1],
        ],
        { date: "2026-01-02" },
      ),
      p1Ahead("2026-01-03"),
    ];

    const h2h = calculateHeadToHead(sessions, 1, 2);

    expect(h2h.currentStreak).toEqual({ profileId: 1, streak: 2 });
    expect(h2h.pastStreaks).toEqual([]);
  });

  it("orders sessions on the same day by when they were logged", () => {
    const sessions = [
      p1Ahead("2026-01-01"),
      p2Ahead("2026-01-02", "2026-01-02T20:00:00Z"),
      p1Ahead("2026-01-02", "2026-01-02T09:00:00Z"),
    ];

    const h2h = calculateHeadToHead(sessions, 1, 2);

    expect(h2h.currentStreak).toEqual({ profileId: 2, streak: 1 });
    expect(h2h.pastStreaks).toEqual([{ profileId: 1, streak: 2 }]);
  });
});
