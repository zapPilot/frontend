/**
 * Tests for useDrawdownAnalysis Hook
 *
 * Comprehensive test suite covering:
 * - Drawdown calculations
 * - Recovery point detection
 * - Peak tracking
 * - Edge cases (empty data, single point, negative values)
 * - Loading and error states
 * - Metrics calculations
 */

import { renderHook } from "@testing-library/react";
import { describe, expect,it } from "vitest";

import { useDrawdownAnalysis } from "@/hooks/charts/useDrawdownAnalysis";
import type { PortfolioDataPoint } from "@/types/domain/portfolio";

/**
 * Helper function to create mock portfolio data
 */
function createPortfolioData(
  values: number[],
  startDate = "2024-01-01"
): PortfolioDataPoint[] {
  return values.map((value, index) => {
    const date = new Date(startDate);
    date.setDate(date.getDate() + index);

    return {
      date: date.toISOString().split("T")[0] || startDate,
      value,
      change: 0,
      benchmark: value * 0.95,
      protocols: [],
      categories: [],
    };
  });
}

describe("useDrawdownAnalysis", () => {
  describe("Basic Functionality", () => {
    it("should return empty data for undefined portfolioHistory", () => {
      const { result } = renderHook(() =>
        useDrawdownAnalysis({
          portfolioHistory: undefined,
        })
      );

      expect(result.current.drawdownData).toEqual([]);
      expect(result.current.metrics).toBeNull();
      expect(result.current.hasData).toBe(false);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it("should return empty data for empty portfolioHistory array", () => {
      const { result } = renderHook(() =>
        useDrawdownAnalysis({
          portfolioHistory: [],
        })
      );

      expect(result.current.drawdownData).toEqual([]);
      expect(result.current.metrics).toBeNull();
      expect(result.current.hasData).toBe(false);
    });

    it("should handle loading state", () => {
      const { result } = renderHook(() =>
        useDrawdownAnalysis({
          portfolioHistory: [],
          isLoading: true,
        })
      );

      expect(result.current.isLoading).toBe(true);
    });

    it("should handle error state", () => {
      const errorMessage = "Failed to fetch data";
      const { result } = renderHook(() =>
        useDrawdownAnalysis({
          portfolioHistory: [],
          error: errorMessage,
        })
      );

      expect(result.current.error).toBe(errorMessage);
    });
  });

  describe("Drawdown Calculations", () => {
    it("should calculate 0% drawdown at initial peak", () => {
      const portfolioData = createPortfolioData([1000]);

      const { result } = renderHook(() =>
        useDrawdownAnalysis({
          portfolioHistory: portfolioData,
        })
      );

      expect(result.current.drawdownData).toHaveLength(1);
      expect(result.current.drawdownData[0]?.drawdown).toBe(0);
      expect(result.current.drawdownData[0]?.isRecoveryPoint).toBe(false);
    });

    it("should calculate correct drawdown percentage from peak", () => {
      // Start at 1000, drop to 800 (-20%)
      const portfolioData = createPortfolioData([1000, 800]);

      const { result } = renderHook(() =>
        useDrawdownAnalysis({
          portfolioHistory: portfolioData,
        })
      );

      expect(result.current.drawdownData).toHaveLength(2);
      expect(result.current.drawdownData[0]?.drawdown).toBe(0); // At peak
      expect(result.current.drawdownData[1]?.drawdown).toBe(-20); // -20% from peak
    });

    it("should track running peak correctly", () => {
      // Start at 1000, drop to 800, rise to 900 (still below peak)
      const portfolioData = createPortfolioData([1000, 800, 900]);

      const { result } = renderHook(() =>
        useDrawdownAnalysis({
          portfolioHistory: portfolioData,
        })
      );

      expect(result.current.drawdownData).toHaveLength(3);
      expect(result.current.drawdownData[0]?.drawdown).toBe(0); // At peak (1000)
      expect(result.current.drawdownData[1]?.drawdown).toBe(-20); // -20% from 1000
      expect(result.current.drawdownData[2]?.drawdown).toBe(-10); // -10% from 1000 (not 900)
    });

    it("should handle multiple peaks correctly", () => {
      // Peak at 1000, drop to 800, new peak at 1200, drop to 1000
      const portfolioData = createPortfolioData([1000, 800, 1200, 1000]);

      const { result } = renderHook(() =>
        useDrawdownAnalysis({
          portfolioHistory: portfolioData,
        })
      );

      expect(result.current.drawdownData).toHaveLength(4);
      expect(result.current.drawdownData[0]?.drawdown).toBe(0); // Peak 1
      expect(result.current.drawdownData[1]?.drawdown).toBe(-20); // -20% from 1000
      expect(result.current.drawdownData[2]?.drawdown).toBeCloseTo(0, 1); // New peak
      expect(result.current.drawdownData[3]?.drawdown).toBeCloseTo(-16.67, 1); // -16.67% from 1200
    });

    it("should handle gradual decline", () => {
      const portfolioData = createPortfolioData([1000, 950, 900, 850, 800]);

      const { result } = renderHook(() =>
        useDrawdownAnalysis({
          portfolioHistory: portfolioData,
        })
      );

      expect(result.current.drawdownData).toHaveLength(5);
      expect(result.current.drawdownData[0]?.drawdown).toBe(0);
      expect(result.current.drawdownData[1]?.drawdown).toBe(-5);
      expect(result.current.drawdownData[2]?.drawdown).toBe(-10);
      expect(result.current.drawdownData[3]?.drawdown).toBe(-15);
      expect(result.current.drawdownData[4]?.drawdown).toBe(-20);
    });

    it("should handle steady growth (no drawdown)", () => {
      const portfolioData = createPortfolioData([1000, 1100, 1200, 1300]);

      const { result } = renderHook(() =>
        useDrawdownAnalysis({
          portfolioHistory: portfolioData,
        })
      );

      expect(result.current.drawdownData).toHaveLength(4);
      // All drawdowns should be 0 or very close to 0 (new peaks)
      for (const point of result.current.drawdownData) {
        expect(Math.abs(point.drawdown)).toBeLessThan(0.1);
      }
    });
  });

  describe("Recovery Point Detection", () => {
    it("should mark recovery point when reaching new peak", () => {
      // Drop then recover to new peak
      const portfolioData = createPortfolioData([1000, 800, 1000, 1200]);

      const { result } = renderHook(() =>
        useDrawdownAnalysis({
          portfolioHistory: portfolioData,
        })
      );

      expect(result.current.drawdownData).toHaveLength(4);
      expect(result.current.drawdownData[2]?.isRecoveryPoint).toBe(true); // Recovery to 1000
      // The 4th point (1200) is at a new peak but may not be marked as recovery
      // since it's continuing growth from previous peak. Check that at least
      // one recovery point exists in the data.
      const recoveryPoints = result.current.drawdownData.filter(
        point => point.isRecoveryPoint
      );
      expect(recoveryPoints.length).toBeGreaterThanOrEqual(1);
    });

    it("should NOT mark recovery point during drawdown", () => {
      const portfolioData = createPortfolioData([1000, 900, 800]);

      const { result } = renderHook(() =>
        useDrawdownAnalysis({
          portfolioHistory: portfolioData,
        })
      );

      expect(result.current.drawdownData).toHaveLength(3);
      expect(result.current.drawdownData[1]?.isRecoveryPoint).toBe(false);
      expect(result.current.drawdownData[2]?.isRecoveryPoint).toBe(false);
    });

    it("should track recovery duration correctly", () => {
      // 5-day underwater period
      const portfolioData = createPortfolioData([1000, 900, 850, 900, 950, 1000]);

      const { result } = renderHook(() =>
        useDrawdownAnalysis({
          portfolioHistory: portfolioData,
        })
      );

      const recoveryPoint = result.current.drawdownData.find(
        point => point.isRecoveryPoint
      );
      expect(recoveryPoint).toBeDefined();
      expect(recoveryPoint?.recoveryDurationDays).toBeGreaterThan(0);
    });

    it("should count multiple recoveries", () => {
      // Two complete drawdown/recovery cycles
      const portfolioData = createPortfolioData([
        1000, 800, 1000, // First cycle
        900, 1100, // Second cycle
      ]);

      const { result } = renderHook(() =>
        useDrawdownAnalysis({
          portfolioHistory: portfolioData,
        })
      );

      const recoveryPoints = result.current.drawdownData.filter(
        point => point.isRecoveryPoint
      );
      expect(recoveryPoints.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe("Metrics Calculations", () => {
    it("should calculate maxDrawdown correctly", () => {
      // Max drawdown of -30% at 700
      const portfolioData = createPortfolioData([1000, 900, 700, 800, 1000]);

      const { result } = renderHook(() =>
        useDrawdownAnalysis({
          portfolioHistory: portfolioData,
        })
      );

      expect(result.current.metrics).not.toBeNull();
      expect(result.current.metrics?.maxDrawdown).toBe(-30);
    });

    it("should calculate currentDrawdown correctly", () => {
      // Currently at -10% drawdown
      const portfolioData = createPortfolioData([1000, 900]);

      const { result } = renderHook(() =>
        useDrawdownAnalysis({
          portfolioHistory: portfolioData,
        })
      );

      expect(result.current.metrics?.currentDrawdown).toBe(-10);
    });

    it("should set currentStatus to 'At Peak' when recovered", () => {
      const portfolioData = createPortfolioData([1000, 800, 1000]);

      const { result } = renderHook(() =>
        useDrawdownAnalysis({
          portfolioHistory: portfolioData,
        })
      );

      expect(result.current.metrics?.currentStatus).toBe("At Peak");
    });

    it("should set currentStatus to 'Underwater' when in drawdown", () => {
      const portfolioData = createPortfolioData([1000, 800]);

      const { result } = renderHook(() =>
        useDrawdownAnalysis({
          portfolioHistory: portfolioData,
        })
      );

      expect(result.current.metrics?.currentStatus).toBe("Underwater");
    });

    it("should calculate averageDrawdown correctly", () => {
      // Drawdowns: 0%, -10%, -20% => average = -10%
      const portfolioData = createPortfolioData([1000, 900, 800]);

      const { result } = renderHook(() =>
        useDrawdownAnalysis({
          portfolioHistory: portfolioData,
        })
      );

      expect(result.current.metrics?.averageDrawdown).toBeCloseTo(-10, 1);
    });

    it("should count recoveries correctly", () => {
      const portfolioData = createPortfolioData([
        1000, 800, 1000, // Recovery 1
        900, 1100, // Recovery 2
      ]);

      const { result } = renderHook(() =>
        useDrawdownAnalysis({
          portfolioHistory: portfolioData,
        })
      );

      expect(result.current.metrics?.recoveryCount).toBeGreaterThanOrEqual(2);
    });

    it("should track latestPeakDate", () => {
      const portfolioData = createPortfolioData([1000, 1100, 900], "2024-01-01");

      const { result } = renderHook(() =>
        useDrawdownAnalysis({
          portfolioHistory: portfolioData,
        })
      );

      expect(result.current.metrics?.latestPeakDate).toBeDefined();
      expect(result.current.metrics?.latestPeakDate).toContain("2024-01");
    });
  });

  describe("Edge Cases", () => {
    it("should handle single data point", () => {
      const portfolioData = createPortfolioData([1000]);

      const { result } = renderHook(() =>
        useDrawdownAnalysis({
          portfolioHistory: portfolioData,
        })
      );

      expect(result.current.drawdownData).toHaveLength(1);
      expect(result.current.drawdownData[0]?.drawdown).toBe(0);
      expect(result.current.hasData).toBe(true);
    });

    it("should handle zero values gracefully", () => {
      const portfolioData = createPortfolioData([0, 0, 0]);

      const { result } = renderHook(() =>
        useDrawdownAnalysis({
          portfolioHistory: portfolioData,
        })
      );

      expect(result.current.drawdownData).toHaveLength(3);
      for (const point of result.current.drawdownData) {
        expect(point.drawdown).toBe(0);
      }
    });

    it("should handle starting from zero then growing", () => {
      const portfolioData = createPortfolioData([0, 100, 200, 150]);

      const { result } = renderHook(() =>
        useDrawdownAnalysis({
          portfolioHistory: portfolioData,
        })
      );

      expect(result.current.drawdownData).toHaveLength(4);
      // After reaching 200, dropping to 150 is -25%
      expect(result.current.drawdownData[3]?.drawdown).toBe(-25);
    });

    it("should handle very small drawdowns (near epsilon)", () => {
      // Very small drawdown of -0.05%
      const portfolioData = createPortfolioData([1000, 999.5]);

      const { result } = renderHook(() =>
        useDrawdownAnalysis({
          portfolioHistory: portfolioData,
        })
      );

      expect(result.current.drawdownData).toHaveLength(2);
      expect(Math.abs(result.current.drawdownData[1]?.drawdown || 0)).toBeLessThan(
        0.1
      );
    });

    it("should handle large datasets efficiently", () => {
      // Generate 365 days of data
      const values = Array.from({ length: 365 }, (_, i) => 1000 + i * 2);
      const portfolioData = createPortfolioData(values);

      const { result } = renderHook(() =>
        useDrawdownAnalysis({
          portfolioHistory: portfolioData,
        })
      );

      expect(result.current.drawdownData).toHaveLength(365);
      expect(result.current.hasData).toBe(true);
    });

    it("should handle volatile data with many peaks and troughs", () => {
      const portfolioData = createPortfolioData([
        1000, 900, 1100, 950, 1200, 1000, 1300, 1100, 1400,
      ]);

      const { result } = renderHook(() =>
        useDrawdownAnalysis({
          portfolioHistory: portfolioData,
        })
      );

      expect(result.current.drawdownData).toHaveLength(9);
      expect(result.current.hasData).toBe(true);
      expect(result.current.metrics?.maxDrawdown).toBeLessThan(0);
    });

    it("should handle identical values (flat portfolio)", () => {
      const portfolioData = createPortfolioData([1000, 1000, 1000, 1000]);

      const { result } = renderHook(() =>
        useDrawdownAnalysis({
          portfolioHistory: portfolioData,
        })
      );

      expect(result.current.drawdownData).toHaveLength(4);
      for (const point of result.current.drawdownData) {
        expect(point.drawdown).toBe(0);
      }
    });
  });

  describe("Data Integrity", () => {
    it("should maintain date order", () => {
      const portfolioData = createPortfolioData([1000, 900, 800], "2024-01-01");

      const { result } = renderHook(() =>
        useDrawdownAnalysis({
          portfolioHistory: portfolioData,
        })
      );

      const dates = result.current.drawdownData.map(point => point.date);
      const sortedDates = [...dates].sort();
      expect(dates).toEqual(sortedDates);
    });

    it("should preserve all data points", () => {
      const portfolioData = createPortfolioData([1000, 900, 800, 700, 600]);

      const { result } = renderHook(() =>
        useDrawdownAnalysis({
          portfolioHistory: portfolioData,
        })
      );

      expect(result.current.drawdownData).toHaveLength(
        portfolioData.length
      );
    });

    it("should include peakDate for all points", () => {
      const portfolioData = createPortfolioData([1000, 900, 800]);

      const { result } = renderHook(() =>
        useDrawdownAnalysis({
          portfolioHistory: portfolioData,
        })
      );

      for (const point of result.current.drawdownData) {
        expect(point.peakDate).toBeDefined();
        expect(typeof point.peakDate).toBe("string");
      }
    });

    it("should include daysFromPeak for underwater points", () => {
      const portfolioData = createPortfolioData([1000, 900, 800]);

      const { result } = renderHook(() =>
        useDrawdownAnalysis({
          portfolioHistory: portfolioData,
        })
      );

      // Underwater points should have daysFromPeak
      const underwaterPoint = result.current.drawdownData[1];
      expect(underwaterPoint?.daysFromPeak).toBeDefined();
      expect(underwaterPoint?.daysFromPeak).toBeGreaterThanOrEqual(0);
    });
  });

  describe("Real-World Scenarios", () => {
    it("should handle 2024 crypto bull run scenario", () => {
      // Realistic crypto portfolio: steady growth with occasional corrections
      const portfolioData = createPortfolioData([
        10000, 12000, 11000, 13000, 12500, 15000, 14000, 16000,
      ]);

      const { result } = renderHook(() =>
        useDrawdownAnalysis({
          portfolioHistory: portfolioData,
        })
      );

      expect(result.current.hasData).toBe(true);
      expect(result.current.metrics?.maxDrawdown).toBeLessThan(0);
      expect(result.current.metrics?.recoveryCount).toBeGreaterThan(0);
    });

    it("should handle bear market scenario", () => {
      // Prolonged decline with small bounces
      const portfolioData = createPortfolioData([
        10000, 9000, 8500, 9000, 8000, 7500, 8000, 7000,
      ]);

      const { result } = renderHook(() =>
        useDrawdownAnalysis({
          portfolioHistory: portfolioData,
        })
      );

      expect(result.current.metrics?.currentStatus).toBe("Underwater");
      expect(result.current.metrics?.maxDrawdown).toBeLessThan(-20);
    });

    it("should handle DeFi flash crash and recovery", () => {
      // Sudden drop and quick recovery
      const portfolioData = createPortfolioData([
        10000, 10200, 6000, 7000, 9000, 10000, 10500,
      ]);

      const { result } = renderHook(() =>
        useDrawdownAnalysis({
          portfolioHistory: portfolioData,
        })
      );

      expect(result.current.metrics?.maxDrawdown).toBeLessThan(-30);
      const recoveryPoints = result.current.drawdownData.filter(
        point => point.isRecoveryPoint
      );
      expect(recoveryPoints.length).toBeGreaterThan(0);
    });
  });
});
