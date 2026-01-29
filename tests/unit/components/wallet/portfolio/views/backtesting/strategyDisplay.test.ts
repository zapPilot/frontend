import { describe, expect, it } from "vitest";

import { calculatePercentages } from "@/components/wallet/portfolio/views/backtesting/utils/strategyDisplay";

describe("calculatePercentages", () => {
  it("calculates percentages correctly for normal case", () => {
    const result = calculatePercentages({
      spot: 60,
      stable: 30,
      lp: 10,
    });

    expect(result.spot).toBeCloseTo(60, 5);
    expect(result.stable).toBeCloseTo(30, 5);
    expect(result.lp).toBeCloseTo(10, 5);
    expect(result.spot + result.stable + result.lp).toBeCloseTo(100, 5);
  });

  it("returns all zeros when total is zero", () => {
    expect(
      calculatePercentages({
        spot: 0,
        stable: 0,
        lp: 0,
      })
    ).toEqual({ spot: 0, stable: 0, lp: 0 });
  });

  it("handles two constituents 50/50 split", () => {
    const result = calculatePercentages({
      spot: 50,
      stable: 50,
      lp: 0,
    });

    expect(result.spot).toBe(50);
    expect(result.stable).toBe(50);
    expect(result.lp).toBe(0);
    expect(result.spot + result.stable + result.lp).toBe(100);
  });
});
