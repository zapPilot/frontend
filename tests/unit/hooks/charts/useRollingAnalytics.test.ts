/**
 * Tests for useRollingAnalytics hook
 *
 * Verifies rolling analytics data processing including:
 * - Sharpe ratio transformation with interpretation labels
 * - Volatility transformation with risk level categorization
 * - Daily yield aggregation and cumulative tracking
 * - Edge cases and error handling
 */

import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
  type DailyYieldApiData,
  useRollingAnalytics,
  type UseRollingAnalyticsParams,
} from "@/hooks/charts/useRollingAnalytics";

describe("useRollingAnalytics", () => {
  describe("Sharpe Ratio Processing", () => {
    it("should process Sharpe ratio data with interpretations", () => {
      const params: UseRollingAnalyticsParams = {
        sharpeHistory: [
          { date: "2024-01-01", rolling_sharpe_ratio: 2.5 }, // Excellent
          { date: "2024-01-02", rolling_sharpe_ratio: 1.5 }, // Good
          { date: "2024-01-03", rolling_sharpe_ratio: 0.5 }, // Fair
          { date: "2024-01-04", rolling_sharpe_ratio: -0.5 }, // Poor
          { date: "2024-01-05", rolling_sharpe_ratio: -1.5 }, // Very Poor
        ],
      };

      const { result } = renderHook(() => useRollingAnalytics(params));

      expect(result.current.sharpeData).toHaveLength(5);
      expect(result.current.sharpeData[0]).toEqual({
        date: "2024-01-01",
        sharpe: 2.5,
        interpretation: "Excellent",
      });
      expect(result.current.sharpeData[1]).toEqual({
        date: "2024-01-02",
        sharpe: 1.5,
        interpretation: "Good",
      });
      expect(result.current.sharpeData[2]).toEqual({
        date: "2024-01-03",
        sharpe: 0.5,
        interpretation: "Fair",
      });
      expect(result.current.sharpeData[3]).toEqual({
        date: "2024-01-04",
        sharpe: -0.5,
        interpretation: "Poor",
      });
      expect(result.current.sharpeData[4]).toEqual({
        date: "2024-01-05",
        sharpe: -1.5,
        interpretation: "Very Poor",
      });
    });

    it("should filter out null Sharpe ratios", () => {
      const params: UseRollingAnalyticsParams = {
        sharpeHistory: [
          { date: "2024-01-01", rolling_sharpe_ratio: 1.5 },
          { date: "2024-01-02", rolling_sharpe_ratio: null },
          { date: "2024-01-03", rolling_sharpe_ratio: 0.5 },
        ],
      };

      const { result } = renderHook(() => useRollingAnalytics(params));

      expect(result.current.sharpeData).toHaveLength(2);
      expect(result.current.sharpeData[0].date).toBe("2024-01-01");
      expect(result.current.sharpeData[1].date).toBe("2024-01-03");
    });

    it("should handle empty Sharpe history", () => {
      const params: UseRollingAnalyticsParams = {
        sharpeHistory: [],
      };

      const { result } = renderHook(() => useRollingAnalytics(params));

      expect(result.current.sharpeData).toEqual([]);
      expect(result.current.hasData).toBe(false);
    });

    it("should handle undefined Sharpe history", () => {
      const params: UseRollingAnalyticsParams = {};

      const { result } = renderHook(() => useRollingAnalytics(params));

      expect(result.current.sharpeData).toEqual([]);
    });

    it("should correctly interpret Sharpe ratio thresholds", () => {
      const params: UseRollingAnalyticsParams = {
        sharpeHistory: [
          { date: "2024-01-01", rolling_sharpe_ratio: 2.0 }, // Exactly 2.0 - Good (not Excellent, needs > 2.0)
          { date: "2024-01-02", rolling_sharpe_ratio: 2.1 }, // Just above 2.0 - Excellent
          { date: "2024-01-03", rolling_sharpe_ratio: 1.0 }, // Exactly 1.0 - Fair (not Good, needs > 1.0)
          { date: "2024-01-04", rolling_sharpe_ratio: 0.0 }, // Exactly 0.0 - Poor (not Fair, needs > 0.0)
          { date: "2024-01-05", rolling_sharpe_ratio: -1.0 }, // Exactly -1.0 - Very Poor (not Poor, needs > -1.0)
        ],
      };

      const { result } = renderHook(() => useRollingAnalytics(params));

      expect(result.current.sharpeData[0].interpretation).toBe("Good");
      expect(result.current.sharpeData[1].interpretation).toBe("Excellent");
      expect(result.current.sharpeData[2].interpretation).toBe("Fair");
      expect(result.current.sharpeData[3].interpretation).toBe("Poor");
      expect(result.current.sharpeData[4].interpretation).toBe("Very Poor");
    });
  });

  describe("Volatility Processing", () => {
    it("should process volatility data with risk levels", () => {
      const params: UseRollingAnalyticsParams = {
        volatilityHistory: [
          {
            date: "2024-01-01",
            annualized_volatility_pct: 5,
          }, // Low
          {
            date: "2024-01-02",
            annualized_volatility_pct: 15,
          }, // Moderate
          {
            date: "2024-01-03",
            annualized_volatility_pct: 35,
          }, // High
          {
            date: "2024-01-04",
            annualized_volatility_pct: 60,
          }, // Very High
        ],
      };

      const { result } = renderHook(() => useRollingAnalytics(params));

      expect(result.current.volatilityData).toHaveLength(4);
      expect(result.current.volatilityData[0]).toEqual({
        date: "2024-01-01",
        volatility: 5,
        riskLevel: "Low",
      });
      expect(result.current.volatilityData[1]).toEqual({
        date: "2024-01-02",
        volatility: 15,
        riskLevel: "Moderate",
      });
      expect(result.current.volatilityData[2]).toEqual({
        date: "2024-01-03",
        volatility: 35,
        riskLevel: "High",
      });
      expect(result.current.volatilityData[3]).toEqual({
        date: "2024-01-04",
        volatility: 60,
        riskLevel: "Very High",
      });
    });

    it("should prefer annualized volatility over daily volatility", () => {
      const params: UseRollingAnalyticsParams = {
        volatilityHistory: [
          {
            date: "2024-01-01",
            annualized_volatility_pct: 15,
            rolling_volatility_daily_pct: 5,
          },
        ],
      };

      const { result } = renderHook(() => useRollingAnalytics(params));

      expect(result.current.volatilityData[0].volatility).toBe(15);
    });

    it("should fallback to daily volatility if annualized is null", () => {
      const params: UseRollingAnalyticsParams = {
        volatilityHistory: [
          {
            date: "2024-01-01",
            annualized_volatility_pct: null,
            rolling_volatility_daily_pct: 12,
          },
        ],
      };

      const { result } = renderHook(() => useRollingAnalytics(params));

      expect(result.current.volatilityData[0].volatility).toBe(12);
    });

    it("should filter out points with no volatility data", () => {
      const params: UseRollingAnalyticsParams = {
        volatilityHistory: [
          {
            date: "2024-01-01",
            annualized_volatility_pct: 15,
          },
          {
            date: "2024-01-02",
            annualized_volatility_pct: null,
            rolling_volatility_daily_pct: null,
          },
          {
            date: "2024-01-03",
            annualized_volatility_pct: 20,
          },
        ],
      };

      const { result } = renderHook(() => useRollingAnalytics(params));

      expect(result.current.volatilityData).toHaveLength(2);
      expect(result.current.volatilityData[0].date).toBe("2024-01-01");
      expect(result.current.volatilityData[1].date).toBe("2024-01-03");
    });

    it("should correctly categorize volatility thresholds", () => {
      const params: UseRollingAnalyticsParams = {
        volatilityHistory: [
          {
            date: "2024-01-01",
            annualized_volatility_pct: 10,
          }, // Exactly 10 - should be Moderate
          {
            date: "2024-01-02",
            annualized_volatility_pct: 9.9,
          }, // Just below 10 - Low
          {
            date: "2024-01-03",
            annualized_volatility_pct: 25,
          }, // Exactly 25 - should be High
          {
            date: "2024-01-04",
            annualized_volatility_pct: 50,
          }, // Exactly 50 - should be Very High
        ],
      };

      const { result } = renderHook(() => useRollingAnalytics(params));

      expect(result.current.volatilityData[0].riskLevel).toBe("Moderate");
      expect(result.current.volatilityData[1].riskLevel).toBe("Low");
      expect(result.current.volatilityData[2].riskLevel).toBe("High");
      expect(result.current.volatilityData[3].riskLevel).toBe("Very High");
    });
  });

  describe("Daily Yield Processing", () => {
    it("should process daily yield data with cumulative tracking", () => {
      const dailyYieldHistory: DailyYieldApiData[] = [
        {
          date: "2024-01-01",
          total_yield_usd: 100,
          cumulative_yield_usd: 100,
          protocol_count: 2,
        },
        {
          date: "2024-01-02",
          total_yield_usd: 150,
          cumulative_yield_usd: 250,
          protocol_count: 3,
        },
        {
          date: "2024-01-03",
          total_yield_usd: 200,
          cumulative_yield_usd: 450,
          protocol_count: 2,
        },
      ];

      const params: UseRollingAnalyticsParams = {
        dailyYieldHistory,
      };

      const { result } = renderHook(() => useRollingAnalytics(params));

      expect(result.current.dailyYieldData).toHaveLength(3);
      expect(result.current.dailyYieldData[0]).toEqual({
        date: "2024-01-01",
        totalYield: 100,
        cumulativeYield: 100,
        protocolCount: 2,
      });
      expect(result.current.dailyYieldData[1]).toEqual({
        date: "2024-01-02",
        totalYield: 150,
        cumulativeYield: 250,
        protocolCount: 3,
      });
      expect(result.current.dailyYieldData[2]).toEqual({
        date: "2024-01-03",
        totalYield: 200,
        cumulativeYield: 450,
        protocolCount: 2,
      });
    });

    it("should handle daily yield without protocol count", () => {
      const dailyYieldHistory: DailyYieldApiData[] = [
        {
          date: "2024-01-01",
          total_yield_usd: 100,
          cumulative_yield_usd: 100,
        },
      ];

      const params: UseRollingAnalyticsParams = {
        dailyYieldHistory,
      };

      const { result } = renderHook(() => useRollingAnalytics(params));

      expect(result.current.dailyYieldData[0]).toEqual({
        date: "2024-01-01",
        totalYield: 100,
        cumulativeYield: 100,
      });
      expect(result.current.dailyYieldData[0].protocolCount).toBeUndefined();
    });

    it("should handle empty daily yield history", () => {
      const params: UseRollingAnalyticsParams = {
        dailyYieldHistory: [],
      };

      const { result } = renderHook(() => useRollingAnalytics(params));

      expect(result.current.dailyYieldData).toEqual([]);
    });
  });

  describe("Loading and Error States", () => {
    it("should pass through loading state", () => {
      const params: UseRollingAnalyticsParams = {
        isLoading: true,
      };

      const { result } = renderHook(() => useRollingAnalytics(params));

      expect(result.current.isLoading).toBe(true);
    });

    it("should pass through error state", () => {
      const params: UseRollingAnalyticsParams = {
        error: "Failed to fetch analytics",
      };

      const { result } = renderHook(() => useRollingAnalytics(params));

      expect(result.current.error).toBe("Failed to fetch analytics");
    });

    it("should default loading to false", () => {
      const params: UseRollingAnalyticsParams = {};

      const { result } = renderHook(() => useRollingAnalytics(params));

      expect(result.current.isLoading).toBe(false);
    });

    it("should default error to null", () => {
      const params: UseRollingAnalyticsParams = {};

      const { result } = renderHook(() => useRollingAnalytics(params));

      expect(result.current.error).toBeNull();
    });
  });

  describe("Data Availability (hasData)", () => {
    it("should return hasData=true when Sharpe data exists", () => {
      const params: UseRollingAnalyticsParams = {
        sharpeHistory: [{ date: "2024-01-01", rolling_sharpe_ratio: 1.5 }],
      };

      const { result } = renderHook(() => useRollingAnalytics(params));

      expect(result.current.hasData).toBe(true);
    });

    it("should return hasData=true when volatility data exists", () => {
      const params: UseRollingAnalyticsParams = {
        volatilityHistory: [
          { date: "2024-01-01", annualized_volatility_pct: 15 },
        ],
      };

      const { result } = renderHook(() => useRollingAnalytics(params));

      expect(result.current.hasData).toBe(true);
    });

    it("should return hasData=true when daily yield data exists", () => {
      const dailyYieldHistory: DailyYieldApiData[] = [
        {
          date: "2024-01-01",
          total_yield_usd: 100,
          cumulative_yield_usd: 100,
        },
      ];

      const params: UseRollingAnalyticsParams = {
        dailyYieldHistory,
      };

      const { result } = renderHook(() => useRollingAnalytics(params));

      expect(result.current.hasData).toBe(true);
    });

    it("should return hasData=false when all datasets are empty", () => {
      const params: UseRollingAnalyticsParams = {
        sharpeHistory: [],
        volatilityHistory: [],
        dailyYieldHistory: [],
      };

      const { result } = renderHook(() => useRollingAnalytics(params));

      expect(result.current.hasData).toBe(false);
    });

    it("should return hasData=true when any dataset has data", () => {
      const params: UseRollingAnalyticsParams = {
        sharpeHistory: [],
        volatilityHistory: [
          { date: "2024-01-01", annualized_volatility_pct: 15 },
        ],
        dailyYieldHistory: [],
      };

      const { result } = renderHook(() => useRollingAnalytics(params));

      expect(result.current.hasData).toBe(true);
    });
  });

  describe("Combined Datasets", () => {
    it("should process all datasets together", () => {
      const dailyYieldHistory: DailyYieldApiData[] = [
        {
          date: "2024-01-01",
          total_yield_usd: 100,
          cumulative_yield_usd: 100,
          protocol_count: 2,
        },
      ];

      const params: UseRollingAnalyticsParams = {
        sharpeHistory: [{ date: "2024-01-01", rolling_sharpe_ratio: 1.5 }],
        volatilityHistory: [
          { date: "2024-01-01", annualized_volatility_pct: 15 },
        ],
        dailyYieldHistory,
        isLoading: false,
        error: null,
      };

      const { result } = renderHook(() => useRollingAnalytics(params));

      expect(result.current.sharpeData).toHaveLength(1);
      expect(result.current.volatilityData).toHaveLength(1);
      expect(result.current.dailyYieldData).toHaveLength(1);
      expect(result.current.hasData).toBe(true);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it("should handle partial data availability", () => {
      const params: UseRollingAnalyticsParams = {
        sharpeHistory: [{ date: "2024-01-01", rolling_sharpe_ratio: 1.5 }],
        volatilityHistory: [],
        dailyYieldHistory: [],
      };

      const { result } = renderHook(() => useRollingAnalytics(params));

      expect(result.current.sharpeData).toHaveLength(1);
      expect(result.current.volatilityData).toHaveLength(0);
      expect(result.current.dailyYieldData).toHaveLength(0);
      expect(result.current.hasData).toBe(true);
    });
  });
});
