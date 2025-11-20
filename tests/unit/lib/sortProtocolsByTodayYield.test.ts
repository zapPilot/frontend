import { describe, expect, it } from "vitest";

import { sortProtocolsByTodayYield } from "@/lib/sortProtocolsByTodayYield";
import type { ProtocolYieldBreakdown } from "@/services/analyticsService";

describe("sortProtocolsByTodayYield", () => {
  it("should sort protocols by today's yield in descending order", () => {
    const breakdown: ProtocolYieldBreakdown[] = [
      {
        protocol: "Aave",
        window: {
          total_yield_usd: 100,
          average_daily_yield_usd: 10,
          data_points: 7,
          positive_days: 5,
          negative_days: 2,
        },
        today: { date: "2025-01-19", yield_usd: 5.5 },
      },
      {
        protocol: "Compound",
        window: {
          total_yield_usd: 200,
          average_daily_yield_usd: 20,
          data_points: 7,
          positive_days: 6,
          negative_days: 1,
        },
        today: { date: "2025-01-19", yield_usd: 12.3 },
      },
      {
        protocol: "Uniswap",
        window: {
          total_yield_usd: 50,
          average_daily_yield_usd: 5,
          data_points: 7,
          positive_days: 4,
          negative_days: 3,
        },
        today: { date: "2025-01-19", yield_usd: 8.1 },
      },
    ];

    const sorted = sortProtocolsByTodayYield(breakdown);

    expect(sorted[0].protocol).toBe("Compound"); // 12.3
    expect(sorted[1].protocol).toBe("Uniswap"); // 8.1
    expect(sorted[2].protocol).toBe("Aave"); // 5.5
  });

  it("should place protocols without today's data at the end", () => {
    const breakdown: ProtocolYieldBreakdown[] = [
      {
        protocol: "Aave",
        window: {
          total_yield_usd: 100,
          average_daily_yield_usd: 10,
          data_points: 7,
          positive_days: 5,
          negative_days: 2,
        },
        today: { date: "2025-01-19", yield_usd: 5.5 },
      },
      {
        protocol: "Compound",
        window: {
          total_yield_usd: 200,
          average_daily_yield_usd: 20,
          data_points: 7,
          positive_days: 6,
          negative_days: 1,
        },
        today: null, // No data
      },
      {
        protocol: "Uniswap",
        window: {
          total_yield_usd: 50,
          average_daily_yield_usd: 5,
          data_points: 7,
          positive_days: 4,
          negative_days: 3,
        },
        today: { date: "2025-01-19", yield_usd: 12.3 },
      },
    ];

    const sorted = sortProtocolsByTodayYield(breakdown);

    expect(sorted[0].protocol).toBe("Uniswap"); // 12.3
    expect(sorted[1].protocol).toBe("Aave"); // 5.5
    expect(sorted[2].protocol).toBe("Compound"); // null → at end
  });

  it("should handle negative yields correctly", () => {
    const breakdown: ProtocolYieldBreakdown[] = [
      {
        protocol: "Aave",
        window: {
          total_yield_usd: 100,
          average_daily_yield_usd: 10,
          data_points: 7,
          positive_days: 5,
          negative_days: 2,
        },
        today: { date: "2025-01-19", yield_usd: -2.5 },
      },
      {
        protocol: "Compound",
        window: {
          total_yield_usd: 200,
          average_daily_yield_usd: 20,
          data_points: 7,
          positive_days: 6,
          negative_days: 1,
        },
        today: { date: "2025-01-19", yield_usd: 5.0 },
      },
      {
        protocol: "Uniswap",
        window: {
          total_yield_usd: 50,
          average_daily_yield_usd: 5,
          data_points: 7,
          positive_days: 4,
          negative_days: 3,
        },
        today: { date: "2025-01-19", yield_usd: -10.3 },
      },
    ];

    const sorted = sortProtocolsByTodayYield(breakdown);

    expect(sorted[0].protocol).toBe("Compound"); // 5.0 (highest)
    expect(sorted[1].protocol).toBe("Aave"); // -2.5
    expect(sorted[2].protocol).toBe("Uniswap"); // -10.3 (lowest)
  });

  it("should handle zero yields correctly", () => {
    const breakdown: ProtocolYieldBreakdown[] = [
      {
        protocol: "Aave",
        window: {
          total_yield_usd: 100,
          average_daily_yield_usd: 10,
          data_points: 7,
          positive_days: 5,
          negative_days: 2,
        },
        today: { date: "2025-01-19", yield_usd: 0 },
      },
      {
        protocol: "Compound",
        window: {
          total_yield_usd: 200,
          average_daily_yield_usd: 20,
          data_points: 7,
          positive_days: 6,
          negative_days: 1,
        },
        today: { date: "2025-01-19", yield_usd: 5.0 },
      },
      {
        protocol: "Uniswap",
        window: {
          total_yield_usd: 50,
          average_daily_yield_usd: 5,
          data_points: 7,
          positive_days: 4,
          negative_days: 3,
        },
        today: { date: "2025-01-19", yield_usd: -2.0 },
      },
    ];

    const sorted = sortProtocolsByTodayYield(breakdown);

    expect(sorted[0].protocol).toBe("Compound"); // 5.0
    expect(sorted[1].protocol).toBe("Aave"); // 0
    expect(sorted[2].protocol).toBe("Uniswap"); // -2.0
  });

  it("should handle empty array", () => {
    const breakdown: ProtocolYieldBreakdown[] = [];
    const sorted = sortProtocolsByTodayYield(breakdown);

    expect(sorted).toEqual([]);
  });

  it("should handle all protocols without today's data", () => {
    const breakdown: ProtocolYieldBreakdown[] = [
      {
        protocol: "Aave",
        window: {
          total_yield_usd: 100,
          average_daily_yield_usd: 10,
          data_points: 7,
          positive_days: 5,
          negative_days: 2,
        },
        today: null,
      },
      {
        protocol: "Compound",
        window: {
          total_yield_usd: 200,
          average_daily_yield_usd: 20,
          data_points: 7,
          positive_days: 6,
          negative_days: 1,
        },
        today: null,
      },
      {
        protocol: "Uniswap",
        window: {
          total_yield_usd: 50,
          average_daily_yield_usd: 5,
          data_points: 7,
          positive_days: 4,
          negative_days: 3,
        },
        today: null,
      },
    ];

    const sorted = sortProtocolsByTodayYield(breakdown);

    // Original order should be preserved (stable sort)
    expect(sorted[0].protocol).toBe("Aave");
    expect(sorted[1].protocol).toBe("Compound");
    expect(sorted[2].protocol).toBe("Uniswap");
  });

  it("should not mutate the original array", () => {
    const breakdown: ProtocolYieldBreakdown[] = [
      {
        protocol: "Aave",
        window: {
          total_yield_usd: 100,
          average_daily_yield_usd: 10,
          data_points: 7,
          positive_days: 5,
          negative_days: 2,
        },
        today: { date: "2025-01-19", yield_usd: 5.5 },
      },
      {
        protocol: "Compound",
        window: {
          total_yield_usd: 200,
          average_daily_yield_usd: 20,
          data_points: 7,
          positive_days: 6,
          negative_days: 1,
        },
        today: { date: "2025-01-19", yield_usd: 12.3 },
      },
    ];

    const originalOrder = breakdown.map(b => b.protocol);
    sortProtocolsByTodayYield(breakdown);

    expect(breakdown.map(b => b.protocol)).toEqual(originalOrder);
  });

  it("should handle single protocol", () => {
    const breakdown: ProtocolYieldBreakdown[] = [
      {
        protocol: "Aave",
        window: {
          total_yield_usd: 100,
          average_daily_yield_usd: 10,
          data_points: 7,
          positive_days: 5,
          negative_days: 2,
        },
        today: { date: "2025-01-19", yield_usd: 5.5 },
      },
    ];

    const sorted = sortProtocolsByTodayYield(breakdown);

    expect(sorted).toHaveLength(1);
    expect(sorted[0].protocol).toBe("Aave");
  });

  it("should handle protocols with undefined today (not just null)", () => {
    const breakdown: ProtocolYieldBreakdown[] = [
      {
        protocol: "Aave",
        window: {
          total_yield_usd: 100,
          average_daily_yield_usd: 10,
          data_points: 7,
          positive_days: 5,
          negative_days: 2,
        },
        today: { date: "2025-01-19", yield_usd: 5.5 },
      },
      {
        protocol: "Compound",
        window: {
          total_yield_usd: 200,
          average_daily_yield_usd: 20,
          data_points: 7,
          positive_days: 6,
          negative_days: 1,
        },
        today: undefined, // Explicitly undefined
      },
    ];

    const sorted = sortProtocolsByTodayYield(breakdown);

    expect(sorted[0].protocol).toBe("Aave"); // Has data
    expect(sorted[1].protocol).toBe("Compound"); // undefined → at end
  });
});
