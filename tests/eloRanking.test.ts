import { describe, expect, it } from "vitest";
import {
  collapseEloRanking,
  rankByElo,
  type EloRankRow,
} from "@/components/tribes/games/utils";
import type { MemberElo, TribeMember } from "@/types/tribes";

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
  value: number,
  sessionsPlayed = 8,
  gameId = 1,
): MemberElo => ({
  profileId,
  gameId,
  elo: value,
  sessionsPlayed,
  gameTitle: null,
  thumbnail: null,
});

// Players 1..n, ranked in that order
const ranking = (n: number): EloRankRow[] =>
  rankByElo(
    Array.from({ length: n }, (_, i) => elo(i + 1, 1000 - i * 10)),
    Array.from({ length: n }, (_, i) => member(i + 1)),
    1,
  );

const profileIds = (rows: (EloRankRow | null)[]) =>
  rows.map((r) => (r === null ? "..." : r.profileId));

describe("rankByElo", () => {
  it("ranks members by their Elo in the game, highest first", () => {
    const rows = rankByElo(
      [
        elo(1, 250.4),
        elo(2, 312.6, 3),
        elo(3, 900, 8, 2),
        // Not a member of the tribe's list
        elo(9, 999),
      ],
      [member(1), member(2), member(3)],
      1,
    );

    expect(rows).toEqual([
      expect.objectContaining({
        rank: 1,
        profileId: 2,
        elo: 313,
        calibrating: true,
      }),
      expect.objectContaining({
        rank: 2,
        profileId: 1,
        elo: 250,
        calibrating: false,
      }),
    ]);
  });

  it("breaks a tie in favour of more Rated Sessions", () => {
    const rows = rankByElo(
      [elo(1, 200, 6), elo(2, 200, 12)],
      [member(1), member(2)],
      1,
    );

    expect(rows.map((r) => r.profileId)).toEqual([2, 1]);
  });
});

describe("collapseEloRanking", () => {
  it("shows the top 5 when the current user is in the top 4", () => {
    expect(profileIds(collapseEloRanking(ranking(8), 3))).toEqual([
      1, 2, 3, 4, 5,
    ]);
  });

  it("shows the top 5 with no gap when the current user is 5th", () => {
    expect(profileIds(collapseEloRanking(ranking(8), 5))).toEqual([
      1, 2, 3, 4, 5,
    ]);
  });

  it("shows the top 4, a gap, then the current user when they rank lower", () => {
    expect(profileIds(collapseEloRanking(ranking(8), 7))).toEqual([
      1,
      2,
      3,
      4,
      "...",
      7,
    ]);
  });

  it("shows the top 5 when the current user has no Elo in the game", () => {
    expect(profileIds(collapseEloRanking(ranking(8), 42))).toEqual([
      1, 2, 3, 4, 5,
    ]);
  });

  it("shows everyone when there are 5 or fewer", () => {
    expect(profileIds(collapseEloRanking(ranking(3), 3))).toEqual([1, 2, 3]);
  });
});
