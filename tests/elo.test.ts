import { describe, expect, it } from "vitest";
import {
  eloDisplay,
  eloTier,
  isCalibrated,
  kFactor,
  replayElo,
  type EloRowInput,
  type PlayerEloState,
} from "@/utils/elo";

let nextRowId = 1;

// One player's row in a session. Defaults describe a rated, competitive,
// individual session on 2026-01-01.
const row = (
  sessionId: string,
  profileId: number,
  position: number,
  overrides: Partial<EloRowInput> = {},
): EloRowInput => ({
  rowId: nextRowId++,
  sessionId,
  profileId,
  position,
  teamId: null,
  isVp: true,
  coop: false,
  datePlayed: "2026-01-01",
  createdAt: new Date("2026-01-01T12:00:00Z"),
  ...overrides,
});

const state = (elo: number, sessionsPlayed: number): PlayerEloState => ({
  elo,
  sessionsPlayed,
});

const resultFor = (result: ReturnType<typeof replayElo>, rowId: number) =>
  result.rows.find((r) => r.rowId === rowId)!;

describe("K-factor", () => {
  it("starts at 80 and drops 5 a session through the Calibration period", () => {
    expect(kFactor(0)).toBe(80);
    expect(kFactor(1)).toBe(75);
    expect(kFactor(4)).toBe(60);
    expect(kFactor(9)).toBe(35);
  });

  it("stays at 30 once the Calibration period is over", () => {
    expect(kFactor(10)).toBe(30);
    expect(kFactor(20)).toBe(30);
    expect(kFactor(100)).toBe(30);
  });
});

describe("isCalibrated", () => {
  it("is false for the first 10 Rated Sessions, whatever the Elo", () => {
    expect(isCalibrated(0)).toBe(false);
    expect(isCalibrated(9)).toBe(false);
    expect(isCalibrated(10)).toBe(true);
  });
});

describe("replayElo", () => {
  it("starts newcomers at 0, and a loser below 100 loses nothing", () => {
    const winner = row("s1", 1, 1);
    const loser = row("s1", 2, 2);

    const result = replayElo([winner, loser], new Map());

    expect(resultFor(result, winner.rowId)).toMatchObject({
      eloBefore: 0,
      eloAfter: 40,
      eloSessionsBefore: 0,
    });
    expect(resultFor(result, loser.rowId)).toMatchObject({
      eloBefore: 0,
      eloAfter: 0,
      eloSessionsBefore: 0,
    });
    expect(result.players.get(1)).toEqual(state(40, 1));
    expect(result.players.get(2)).toEqual(state(0, 1));
  });

  it("matches the docs/ELO.md worked example", () => {
    const bob = row("s1", 2, 1);
    const alice = row("s1", 1, 2);
    const dan = row("s1", 4, 3);
    const cara = row("s1", 3, 4);
    const start = new Map([
      [1, state(320, 20)],
      [2, state(60, 2)],
      [3, state(250, 10)],
      [4, state(110, 40)],
    ]);

    const result = replayElo([bob, alice, dan, cara], start);

    expect(resultFor(result, alice.rowId).eloAfter).toBeCloseTo(314.4, 2);
    expect(resultFor(result, bob.rowId).eloAfter).toBeCloseTo(209.63, 2);
    expect(resultFor(result, cara.rowId).eloAfter).toBeCloseTo(194.77, 2);
    expect(resultFor(result, dan.rowId).eloAfter).toBeCloseTo(106.7, 2);
  });

  it("sums Matchups rather than averaging them", () => {
    const winner = row("s1", 1, 1);
    const others = [2, 3, 4, 5].map((id) => row("s1", id, 2));

    const result = replayElo([winner, ...others], new Map());

    // 80 × 4 opponents × (1 − 0.5)
    expect(resultFor(result, winner.rowId).eloAfter).toBeCloseTo(160, 6);
  });

  it("treats a shared position as a draw", () => {
    const low = row("s1", 1, 1);
    const high = row("s1", 2, 1);
    const start = new Map([
      [1, state(150, 10)],
      [2, state(250, 10)],
    ]);

    const result = replayElo([low, high], start);

    expect(resultFor(result, low.rowId).eloAfter).toBeCloseTo(154.2, 2);
    expect(resultFor(result, high.rowId).eloAfter).toBeCloseTo(245.8, 2);
  });

  it("never takes Elo away from a player below 100, in or after the Calibration period", () => {
    const strong = row("s1", 1, 1);
    const calibrating = row("s1", 2, 2);
    const alsoStrong = row("s3", 7, 1);
    const calibrated = row("s3", 3, 2);
    // Three newcomers: 2nd place nets exactly 0, last place would be −80
    const first = row("s2", 4, 1);
    const middle = row("s2", 5, 2);
    const last = row("s2", 6, 3);
    const start = new Map([
      [1, state(300, 30)],
      [2, state(40, 3)],
      [3, state(60, 12)],
      [7, state(300, 30)],
    ]);

    const result = replayElo(
      [strong, calibrating, alsoStrong, calibrated, first, middle, last],
      start,
    );

    expect(resultFor(result, calibrating.rowId).eloAfter).toBe(40);
    expect(resultFor(result, calibrated.rowId).eloAfter).toBe(60);
    expect(resultFor(result, first.rowId).eloAfter).toBeCloseTo(80, 6);
    expect(resultFor(result, middle.rowId).eloAfter).toBeCloseTo(0, 6);
    expect(resultFor(result, last.rowId).eloAfter).toBe(0);
  });

  it("never lets a loss take a player below the floor of 100", () => {
    const winner = row("s1", 1, 1);
    const loser = row("s1", 2, 2);
    const start = new Map([
      [1, state(110, 40)],
      [2, state(110, 6)],
    ]);

    const result = replayElo([winner, loser], start);

    // Unclamped, 110 − 50 × 0.5 would be 85
    expect(resultFor(result, loser.rowId).eloAfter).toBe(100);
  });

  it("rates teams on their average Elo, scaling each teammate by their own K", () => {
    const team = { teamId: 1 };
    const rival = { teamId: 2 };
    const p1 = row("s1", 1, 1, team);
    const p2 = row("s1", 2, 1, team);
    const p3 = row("s1", 3, 2, rival);
    const p4 = row("s1", 4, 2, rival);
    const start = new Map([
      [1, state(300, 50)],
      [2, state(0, 0)],
      [3, state(200, 50)],
      [4, state(200, 50)],
    ]);

    const result = replayElo([p1, p2, p3, p4], start);

    // Team averages 150 vs 200
    expect(resultFor(result, p1.rowId).eloAfter).toBeCloseTo(317.14, 2);
    expect(resultFor(result, p2.rowId).eloAfter).toBeCloseTo(45.72, 2);
    expect(resultFor(result, p3.rowId).eloAfter).toBeCloseTo(182.86, 2);
    expect(resultFor(result, p4.rowId).eloAfter).toBeCloseTo(182.86, 2);
  });

  it("skips unrated, coop and solo sessions, leaving Elo untouched", () => {
    const unrated = [
      row("s1", 1, 1, { isVp: false }),
      row("s1", 2, 2, { isVp: false }),
    ];
    const coop = [
      row("s2", 1, 1, { coop: true }),
      row("s2", 2, 1, { coop: true }),
    ];
    const solo = [row("s3", 1, 1)];
    const start = new Map([[1, state(220, 7)]]);

    const result = replayElo([...unrated, ...coop, ...solo], start);

    for (const r of [...unrated, ...coop, ...solo]) {
      expect(resultFor(result, r.rowId)).toEqual({
        rowId: r.rowId,
        eloBefore: null,
        eloAfter: null,
        eloSessionsBefore: null,
      });
    }
    expect(result.players.get(1)).toEqual(state(220, 7));
    expect(result.players.has(2)).toBe(false);
  });

  it("processes sessions by date played, then by when they were logged", () => {
    const at = (datePlayed: string, createdAt: string) => ({
      datePlayed,
      createdAt: new Date(createdAt),
    });
    const later = at("2026-01-02", "2026-01-02T08:00:00Z");
    const sameDayLate = at("2026-01-01", "2026-01-01T12:00:00Z");
    const sameDayEarly = at("2026-01-01", "2026-01-01T09:00:00Z");
    const a = row("a", 1, 1, later);
    const b = row("b", 1, 1, sameDayLate);
    const c = row("c", 1, 1, sameDayEarly);

    const result = replayElo(
      [
        a,
        row("a", 2, 2, later),
        b,
        row("b", 2, 2, sameDayLate),
        c,
        row("c", 2, 2, sameDayEarly),
      ],
      new Map(),
    );

    expect(resultFor(result, c.rowId).eloSessionsBefore).toBe(0);
    expect(resultFor(result, b.rowId).eloSessionsBefore).toBe(1);
    expect(resultFor(result, a.rowId).eloSessionsBefore).toBe(2);
  });

  it("gives the same result replaying from a later date as replaying everything", () => {
    const day = (d: string) => ({
      datePlayed: d,
      createdAt: new Date(`${d}T12:00:00Z`),
    });
    const first = [
      row("s1", 1, 1, day("2026-01-01")),
      row("s1", 2, 2, day("2026-01-01")),
    ];
    const rest = [
      row("s2", 2, 1, day("2026-01-02")),
      row("s2", 3, 2, day("2026-01-02")),
      row("s2", 1, 3, day("2026-01-02")),
      row("s3", 3, 1, day("2026-01-03")),
      row("s3", 1, 2, day("2026-01-03")),
    ];

    const full = replayElo([...first, ...rest], new Map());
    const startAfterFirst = replayElo(first, new Map()).players;
    const partial = replayElo(rest, startAfterFirst);

    for (const r of rest) {
      expect(resultFor(partial, r.rowId)).toEqual(resultFor(full, r.rowId));
    }
    expect(partial.players).toEqual(full.players);
  });
});

describe("eloDisplay", () => {
  it("marks a player as calibrating during the Calibration period, even above 100", () => {
    expect(
      eloDisplay({ eloBefore: 60, eloAfter: 209.63, eloSessionsBefore: 2 }),
    ).toEqual({ delta: 150, elo: 210, calibrating: true });
  });

  it("drops the marker on the session that completes the Calibration period, even below 100", () => {
    expect(
      eloDisplay({ eloBefore: 60.4, eloAfter: 70.4, eloSessionsBefore: 9 }),
    ).toEqual({ delta: 10, elo: 70, calibrating: false });
  });

  it("doesn't mark a player below 100 after the Calibration period", () => {
    expect(
      eloDisplay({ eloBefore: 95, eloAfter: 95, eloSessionsBefore: 12 }),
    ).toEqual({ delta: 0, elo: 95, calibrating: false });
  });

  it("shows the Elo Change matching the rounded values", () => {
    expect(
      eloDisplay({ eloBefore: 312.6, eloAfter: 290.2, eloSessionsBefore: 20 }),
    ).toEqual({ delta: -23, elo: 290, calibrating: false });
  });

  it("shows nothing for rows that don't affect Elo", () => {
    expect(
      eloDisplay({ eloBefore: null, eloAfter: null, eloSessionsBefore: null }),
    ).toBeNull();
  });
});

describe("eloTier", () => {
  it("bands Elo into tiers, upper bound inclusive, with maroon open-ended", () => {
    expect(eloTier(0)).toBe("iron");
    expect(eloTier(50)).toBe("iron");
    expect(eloTier(51)).toBe("bronze");
    expect(eloTier(100)).toBe("bronze");
    expect(eloTier(101)).toBe("silver");
    expect(eloTier(200)).toBe("silver");
    expect(eloTier(201)).toBe("gold");
    expect(eloTier(300)).toBe("gold");
    expect(eloTier(301)).toBe("emerald");
    expect(eloTier(400)).toBe("emerald");
    expect(eloTier(401)).toBe("purple");
    expect(eloTier(500)).toBe("purple");
    expect(eloTier(501)).toBe("maroon");
    expect(eloTier(812)).toBe("maroon");
  });
});
