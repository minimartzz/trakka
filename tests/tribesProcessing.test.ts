import { describe, expect, it } from "vitest";
import { wpaBySession } from "@/utils/tribesProcessing";
import type { GameSession } from "@/types/tribes";

// A session with each player's [profileId, score]. Rated unless overridden.
const session = (
  sessionId: string,
  datePlayed: string,
  scores: [number, number | null][],
  overrides: Partial<GameSession> = {},
): GameSession => ({
  sessionId,
  datePlayed,
  createdAt: `${datePlayed}T12:00:00Z`,
  gameId: 100,
  gameTitle: "Brass",
  gameImageUrl: null,
  thumbnail: null,
  playingTime: 120,
  gameWeight: 3.9,
  coop: false,
  isVp: true,
  players: scores.map(([profileId, score], i) => ({
    profileId,
    username: `p${profileId}`,
    firstName: `P${profileId}`,
    lastName: "",
    image: null,
    isWinner: i === 0,
    position: i + 1,
    score,
    victoryPoints: null,
    winContrib: null,
    eloBefore: null,
    eloAfter: null,
    eloSessionsBefore: null,
  })),
  ...overrides,
});

describe("wpaBySession", () => {
  it("tracks the player's running WPA, in date order", () => {
    const sessions = [
      session("s2", "2026-01-02", [
        [1, 3],
        [2, 0],
      ]),
      session("s3", "2026-01-03", [
        [2, 1],
        [1, 2],
      ]),
      session("s1", "2026-01-01", [
        [1, 1],
        [2, 0],
      ]),
    ];

    const result = wpaBySession(sessions, 1);

    expect(result.get("s1")).toBe(1);
    expect(result.get("s2")).toBe(2);
    expect(result.get("s3")).toBe(2);
  });

  it("orders sessions on the same day by when they were logged", () => {
    const sessions = [
      session("late", "2026-01-01", [[1, 4]], {
        createdAt: "2026-01-01T20:00:00Z",
      }),
      session("early", "2026-01-01", [[1, 2]], {
        createdAt: "2026-01-01T09:00:00Z",
      }),
    ];

    const result = wpaBySession(sessions, 1);

    expect(result.get("early")).toBe(2);
    expect(result.get("late")).toBe(3);
  });

  it("leaves out unrated sessions and sessions the player wasn't in", () => {
    const sessions = [
      session("rated", "2026-01-01", [[1, 2]]),
      session("unrated", "2026-01-02", [[1, 9]], { isVp: false }),
      session("without", "2026-01-03", [[2, 5]]),
      session("next", "2026-01-04", [[1, 4]]),
    ];

    const result = wpaBySession(sessions, 1);

    expect(result.has("unrated")).toBe(false);
    expect(result.has("without")).toBe(false);
    expect(result.get("next")).toBe(3);
  });
});
