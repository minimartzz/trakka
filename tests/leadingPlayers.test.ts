import { describe, expect, it } from "vitest";
import { computeLeadingPlayers } from "@/components/tribes/games/utils";
import type { GameSession } from "@/types/tribes";

let sessionId = 0;

// A session of game 1 from [profileId, position] pairs; position 1 wins.
// Co-op puts everyone in first place.
const ranked = (
  entries: [number, number][],
  opts: { coop?: boolean; date?: string; loggedAt?: string } = {},
): GameSession => {
  const date = opts.date ?? "2026-01-01";
  return {
    sessionId: `s${sessionId++}`,
    datePlayed: date,
    createdAt: opts.loggedAt ?? `${date}T12:00:00Z`,
    gameId: 1,
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

const ids = (result: ReturnType<typeof computeLeadingPlayers>) => ({
  best: result.best?.profileId ?? null,
  loser: result.loser?.profileId ?? null,
  mostPlays: result.mostPlays?.profileId ?? null,
});

describe("computeLeadingPlayers", () => {
  it("only counts competitive sessions", () => {
    const sessions = [
      ...times(3, () =>
        ranked([
          [2, 1],
          [3, 2],
        ]),
      ),
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

    const result = computeLeadingPlayers(sessions, 1);

    expect(ids(result)).toMatchObject({ best: 2, loser: 3 });
    expect(result.mostPlays?.count).toBe(3);
  });

  it("weights the rate by plays, so 19 wins in 20 beats 3 in 3", () => {
    const sessions = [
      ...times(19, () =>
        ranked([
          [1, 1],
          [2, 2],
        ]),
      ),
      ranked([
        [2, 1],
        [1, 2],
      ]),
      ...times(3, () =>
        ranked([
          [3, 1],
          [4, 2],
        ]),
      ),
    ];

    const { best, loser } = computeLeadingPlayers(sessions, 1);

    expect(best).toMatchObject({ profileId: 1, count: 19, plays: 20 });
    expect(loser).toMatchObject({ profileId: 2, count: 19, plays: 20 });
  });

  it("needs 3 plays to be Best Player or Biggest Loser", () => {
    const sessions = times(2, () =>
      ranked([
        [1, 1],
        [2, 2],
      ]),
    );

    expect(ids(computeLeadingPlayers(sessions, 1))).toMatchObject({
      best: null,
      loser: null,
    });
  });

  it("makes finishing last, not just not winning, the loss for Biggest Loser", () => {
    const sessions = times(3, () =>
      ranked([
        [1, 1],
        [2, 2],
        [3, 3],
      ]),
    );

    expect(ids(computeLeadingPlayers(sessions, 1))).toMatchObject({
      best: 1,
      loser: 3,
    });
  });

  it("never makes the Best Player the Biggest Loser too", () => {
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
    ];

    const { best, loser } = computeLeadingPlayers(sessions, 1);

    expect(best).not.toBeNull();
    expect(loser).not.toBeNull();
    expect(loser?.profileId).not.toBe(best?.profileId);
  });

  it("gives Most Plays to whoever played most recently on a tie", () => {
    const sessions = [
      ranked(
        [
          [2, 1],
          [3, 2],
        ],
        { date: "2026-01-01" },
      ),
      ranked(
        [
          [4, 1],
          [5, 2],
        ],
        { date: "2026-01-02" },
      ),
    ];

    expect(computeLeadingPlayers(sessions, 1).mostPlays?.profileId).toBe(4);
  });

  it("lists recent games newest first, by date played then when logged", () => {
    const sessions = [
      ranked(
        [
          [1, 1],
          [2, 2],
        ],
        { date: "2026-01-01" },
      ),
      ranked(
        [
          [1, 2],
          [2, 1],
        ],
        { date: "2026-01-02", loggedAt: "2026-01-02T20:00:00Z" },
      ),
      ranked(
        [
          [1, 1],
          [2, 2],
        ],
        { date: "2026-01-02", loggedAt: "2026-01-02T09:00:00Z" },
      ),
    ];

    const { mostPlays } = computeLeadingPlayers(sessions, 1);

    expect(mostPlays?.recentGames.map((g) => g.position)).toEqual([2, 1, 1]);
  });
});
