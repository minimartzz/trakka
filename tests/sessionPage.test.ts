import { describe, expect, it } from "vitest";
import {
  buildEloRace,
  playNumbers,
  sessionMode,
  standingGroups,
} from "@/utils/sessionPage";

describe("sessionMode", () => {
  it("is solo for a single player, whatever the coop flag", () => {
    expect(sessionMode({ numPlayers: 1, coop: true, isVp: false })).toBe(
      "solo",
    );
  });

  it("is coop for a coop session with several players", () => {
    expect(sessionMode({ numPlayers: 3, coop: true, isVp: false })).toBe(
      "coop",
    );
  });

  it("splits competitive sessions into rated and unrated", () => {
    expect(sessionMode({ numPlayers: 4, coop: false, isVp: true })).toBe(
      "rated",
    );
    expect(sessionMode({ numPlayers: 4, coop: false, isVp: false })).toBe(
      "unrated",
    );
  });
});

// A comp_game_log row in a player's history of this game
const play = (
  profileId: number,
  sessionId: string,
  datePlayed: string,
  createdAt = "2026-01-01T12:00:00Z",
) => ({ profileId, sessionId, datePlayed, createdAt: new Date(createdAt) });

const thisSession = {
  sessionId: "s-now",
  datePlayed: "2026-05-10",
  createdAt: new Date("2026-05-10T20:00:00Z"),
};

describe("playNumbers", () => {
  it("numbers this session after every earlier session of the game", () => {
    const history = [
      play(1, "a", "2026-01-03"),
      play(1, "b", "2026-02-14"),
      play(1, "s-now", "2026-05-10", "2026-05-10T20:00:00Z"),
      play(2, "s-now", "2026-05-10", "2026-05-10T20:00:00Z"),
    ];

    const result = playNumbers(history, thisSession);

    expect(result.get(1)).toBe(3);
    expect(result.get(2)).toBe(1);
  });

  it("orders same-day sessions by when they were logged", () => {
    const history = [
      // Same day, logged earlier: counts
      play(1, "morning", "2026-05-10", "2026-05-10T09:00:00Z"),
      play(1, "s-now", "2026-05-10", "2026-05-10T20:00:00Z"),
      // Same day, logged later: doesn't
      play(1, "late", "2026-05-10", "2026-05-10T23:00:00Z"),
    ];

    expect(playNumbers(history, thisSession).get(1)).toBe(2);
  });

  it("ignores sessions played on a later date", () => {
    const history = [
      play(1, "s-now", "2026-05-10", "2026-05-10T20:00:00Z"),
      play(1, "next-week", "2026-05-17", "2026-05-01T08:00:00Z"),
    ];

    expect(playNumbers(history, thisSession).get(1)).toBe(1);
  });
});

// A rated row: Elo after it, and Rated Sessions played before it
const rated = (
  profileId: number,
  n: number,
  eloAfter: number | null,
  groupId = "tribe-a",
) => ({
  ...play(profileId, `s${n}`, `2026-01-${String(n).padStart(2, "0")}`),
  groupId,
  eloAfter,
  eloSessionsBefore: eloAfter === null ? null : n - 1,
});

const session12 = {
  sessionId: "s12",
  datePlayed: "2026-01-12",
  createdAt: new Date("2026-01-01T12:00:00Z"),
  groupId: "tribe-a",
};

describe("buildEloRace", () => {
  it("keeps each player's last 10 Rated Sessions, ending at this one", () => {
    const history = Array.from({ length: 12 }, (_, i) =>
      rated(1, i + 1, 100 + (i + 1) * 10),
    );

    const points = buildEloRace(history, session12).get(1)!;

    expect(points.map((p) => p.index)).toEqual([
      -9, -8, -7, -6, -5, -4, -3, -2, -1, 0,
    ]);
    // Sessions 3..12
    expect(points[0].elo).toBe(130);
    expect(points[9].elo).toBe(220);
    expect(points[9].datePlayed).toBe("2026-01-12");
  });

  it("skips sessions that didn't affect Elo and sessions after this one", () => {
    const history = [
      rated(1, 1, 110),
      rated(1, 2, null), // unrated, coop or solo
      rated(1, 3, 130),
      rated(1, 12, 150),
      rated(1, 13, 170), // after this session
    ];

    const points = buildEloRace(history, session12).get(1)!;

    expect(points.map((p) => [p.index, p.elo])).toEqual([
      [-2, 110],
      [-1, 130],
      [0, 150],
    ]);
  });

  it("flags other Tribes' sessions and the first 5 as calibrating", () => {
    const history = [
      rated(1, 4, 140, "tribe-b"),
      rated(1, 5, 150),
      rated(1, 12, 160),
    ];

    const points = buildEloRace(history, session12).get(1)!;

    expect(points.map((p) => p.sameTribe)).toEqual([false, true, true]);
    // eloSessionsBefore 3 and 4: still calibrating after the 4th, not the 5th
    expect(points.map((p) => p.calibrating)).toEqual([true, false, false]);
  });

  it("leaves out players whose Elo this session didn't change", () => {
    // A rated session with one side moves nobody's Elo, so their history
    // can't end at this session
    const history = [rated(1, 3, 130), rated(1, 12, null)];

    expect(buildEloRace(history, session12).has(1)).toBe(false);
  });

  it("rounds Elo to what the rest of the app displays", () => {
    const points = buildEloRace([rated(1, 12, 212.6)], session12).get(1)!;

    expect(points[0].elo).toBe(213);
  });
});

const standing = (
  profileId: number,
  position: number,
  teamId: number | null = null,
) => ({ profileId, position, teamId });

describe("standingGroups", () => {
  it("gives each player their own place, sharing it on a tie", () => {
    const players = [
      standing(4, 4),
      standing(2, 2),
      standing(1, 1),
      standing(3, 2),
    ];

    const groups = standingGroups(players);

    expect(groups.map((g) => g.members.map((m) => m.profileId))).toEqual([
      [1],
      [2],
      [3],
      [4],
    ]);
    expect(groups.map((g) => [g.position, g.tied])).toEqual([
      [1, false],
      [2, true],
      [2, true],
      [4, false],
    ]);
  });

  it("groups team sessions by team, ordered by the team's place", () => {
    const players = [
      standing(1, 2, 1),
      standing(2, 2, 1),
      standing(3, 1, 2),
      standing(4, 1, 2),
    ];

    const groups = standingGroups(players);

    expect(groups.map((g) => [g.teamId, g.position])).toEqual([
      [2, 1],
      [1, 2],
    ]);
    expect(groups[0].members.map((m) => m.profileId)).toEqual([3, 4]);
    expect(groups.every((g) => !g.tied)).toBe(true);
  });
});
