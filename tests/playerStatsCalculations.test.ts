import { describe, expect, it } from "vitest";
import { calculateBadges } from "@/utils/playerStatsCalculations";
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
): MemberElo => ({ profileId, gameId, elo: value, sessionsPlayed });

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
        [1, true, 200, 8],
        [2, false, 300, 10],
      ]),
      // 4 is still in the Calibration period: not an upset
      session("s2", [
        [4, true, 150, 2],
        [2, false, 300, 11],
      ]),
      session("s3", [
        [4, true, 160, 3],
        [2, false, 290, 12],
      ]),
      // 3 was still in the Calibration period as the loser: not an upset
      session("s4", [
        [4, true, 170, 6],
        [3, false, 400, 4],
      ]),
      // 5 is below 100 but past the Calibration period: still upsets
      session("s5", [
        [5, true, 80, 9],
        [2, false, 280, 13],
      ]),
      session("s6", [
        [5, true, 90, 10],
        [2, false, 270, 14],
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
      elo(2, 200, 410, 8),
      elo(3, 300, 280, 40),
    ];

    const badges = calculateBadges([], members, elos);

    expect(badgeHolder(badges, "elo_king")).toBe(2);
  });

  it("ignores Elo from games the member is still in the Calibration period for", () => {
    const members = [member(1), member(2)];
    const elos = [elo(1, 100, 500, 4), elo(2, 100, 120, 5)];

    const badges = calculateBadges([], members, elos);

    expect(badgeHolder(badges, "elo_king")).toBe(2);
  });

  it("goes to nobody when every member is still in the Calibration period", () => {
    const badges = calculateBadges([], [member(1)], [elo(1, 100, 300, 4)]);

    expect(badgeHolder(badges, "elo_king")).toBeUndefined();
  });

  it("counts a member below 100 once the Calibration period is over", () => {
    const badges = calculateBadges([], [member(1)], [elo(1, 100, 95, 12)]);

    expect(badgeHolder(badges, "elo_king")).toBe(1);
  });

  it("breaks a tie in favour of the member with more sessions of that game", () => {
    const members = [member(1), member(2)];
    const elos = [elo(1, 100, 350, 9), elo(2, 200, 350, 21)];

    const badges = calculateBadges([], members, elos);

    expect(badgeHolder(badges, "elo_king")).toBe(2);
  });

  it("shows only the badge, with no value", () => {
    const badges = calculateBadges([], [member(1)], [elo(1, 100, 350, 9)]);

    const king = badges.get(1)!.find((b) => b.type === "elo_king")!;
    expect(king.value).toBe("");
  });
});
