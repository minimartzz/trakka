import { describe, expect, it } from "vitest";
import {
  eloSeries,
  periodStart,
  vpBinLabel,
  vpHistogram,
  type RatedPlay,
} from "@/utils/gamePerformance";

const play = (
  datePlayed: string,
  eloBefore: number,
  eloAfter: number,
  eloSessionsBefore = 12,
): RatedPlay => ({
  sessionId: datePlayed,
  datePlayed,
  tribe: "T",
  eloBefore,
  eloAfter,
  eloSessionsBefore,
});

describe("periodStart", () => {
  const now = new Date(2026, 9, 22);

  it("counts back from today", () => {
    expect(periodStart("1W", now)).toBe("2026-10-15");
    expect(periodStart("1M", now)).toBe("2026-09-22");
    expect(periodStart("6M", now)).toBe("2026-04-22");
  });

  it("has no start for all time", () => {
    expect(periodStart("ALL", now)).toBeNull();
  });
});

describe("eloSeries", () => {
  const plays = [
    play("2026-01-01", 0, 40, 0),
    play("2026-06-01", 40, 30.4),
    play("2026-10-01", 30.4, 55.6),
  ];

  it("starts from the Elo before the period's first session", () => {
    const series = eloSeries(plays, "2026-05-01");
    expect(series.map((p) => p.elo)).toEqual([40, 30, 56]);
    expect(series.map((p) => p.index)).toEqual([0, 1, 2]);
    expect(series[0].session).toBeNull();
    expect(series[2].delta).toBe(26);
  });

  it("marks sessions still in Calibration", () => {
    expect(eloSeries(plays, null)[1].calibrating).toBe(true);
    expect(eloSeries(plays, null)[2].calibrating).toBe(false);
  });

  it("is empty when the period has no sessions", () => {
    expect(eloSeries(plays, "2026-10-02")).toEqual([]);
  });
});

describe("vpHistogram", () => {
  it("bins into round widths covering every value", () => {
    const bins = vpHistogram([41, 48, 55, 96]);
    expect(bins.map(vpBinLabel)).toEqual([
      "40–49",
      "50–59",
      "60–69",
      "70–79",
      "80–89",
      "90–99",
    ]);
    expect(bins.map((b) => b.count)).toEqual([2, 1, 0, 0, 0, 1]);
  });

  it("uses single-value bins for a narrow range", () => {
    const bins = vpHistogram([3, 3, 5]);
    expect(bins.map(vpBinLabel)).toEqual(["3", "4", "5"]);
    expect(bins.map((b) => b.count)).toEqual([2, 0, 1]);
  });

  it("handles negative VP", () => {
    const bins = vpHistogram([-5, 0, 5]);
    expect(bins.reduce((n, b) => n + b.count, 0)).toBe(3);
    expect(bins[0].from).toBeLessThanOrEqual(-5);
  });

  it("is empty without values", () => {
    expect(vpHistogram([])).toEqual([]);
  });
});
