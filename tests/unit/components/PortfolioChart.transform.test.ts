import { describe, expect, it, vi } from "vitest";

import { buildAllocationHistory } from "../../../src/components/PortfolioChart/";

vi.mock("../../../src/hooks/usePortfolioTrends", () => ({}));
vi.mock("../../../src/hooks/useRollingSharpe", () => ({}));
vi.mock("../../../src/hooks/useRollingVolatility", () => ({}));
vi.mock("../../../src/hooks/useEnhancedDrawdown", () => ({}));
vi.mock("../../../src/hooks/useUnderwaterRecovery", () => ({}));
vi.mock("../../../src/hooks/useAllocationTimeseries", () => ({}));
vi.mock("../../../src/contexts/UserContext", () => ({
  useUser: () => ({ userInfo: null }),
}));

const CLOSE_PRECISION = 3;

describe("buildAllocationHistory", () => {
  it("maps API allocation data with explicit percentages", () => {
    const rawPoints = [
      {
        date: "2025-08-08",
        category: "stablecoins",
        percentage: 12.56,
      },
      {
        date: "2025-08-08",
        category: "others",
        percentage: 87.44,
      },
    ];

    const result = buildAllocationHistory(rawPoints);

    expect(result).toHaveLength(1);
    const [point] = result;
    expect(point.date).toBe("2025-08-08");
    expect(point.btc).toBeCloseTo(0, CLOSE_PRECISION);
    expect(point.eth).toBeCloseTo(0, CLOSE_PRECISION);
    expect(point.stablecoin).toBeCloseTo(12.56, CLOSE_PRECISION);
    expect(point.altcoin).toBeCloseTo(87.44, CLOSE_PRECISION);
    const total = point.btc + point.eth + point.stablecoin + point.altcoin;
    expect(total).toBeCloseTo(100, CLOSE_PRECISION);
  });

  it("derives percentages when only category values are provided", () => {
    const rawPoints = [
      {
        date: "2025-08-09",
        category: "BTC",
        category_value: 40000,
        total_value: 100000,
      },
      {
        date: "2025-08-09",
        category: "ETH",
        category_value: 60000,
        total_value: 100000,
      },
    ];

    const result = buildAllocationHistory(rawPoints);

    expect(result).toHaveLength(1);
    const [point] = result;
    expect(point.btc).toBeCloseTo(40, CLOSE_PRECISION);
    expect(point.eth).toBeCloseTo(60, CLOSE_PRECISION);
    expect(point.stablecoin + point.altcoin).toBeCloseTo(0, CLOSE_PRECISION);
  });

  it("returns empty allocation history when no API points are available", () => {
    const result = buildAllocationHistory([]);

    expect(result).toHaveLength(0);
  });
});
