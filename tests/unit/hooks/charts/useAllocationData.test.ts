/**
 * Tests for useAllocationData Hook
 *
 * Validates asset allocation data processing, transformation, and edge case handling.
 * Ensures proper type detection, percentage normalization, and pie chart generation.
 */

import { renderHook } from "@testing-library/react";
import { describe, expect,it } from "vitest";

import type { AllocationTimeseriesInputPoint } from "@/components/PortfolioChart/types";
import {
  useAllocationData,
  type UseAllocationDataParams,
} from "@/hooks/charts/useAllocationData";
import type { AssetAllocationPoint } from "@/types/domain/portfolio";

describe("useAllocationData", () => {
  describe("Empty State Handling", () => {
    it("should return empty state when no data provided", () => {
      const { result } = renderHook(() =>
        useAllocationData({
          allocationHistory: undefined,
        })
      );

      expect(result.current.allocationData).toEqual([]);
      expect(result.current.currentAllocation).toBeNull();
      expect(result.current.pieChartData).toEqual([]);
      expect(result.current.hasData).toBe(false);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it("should return empty state when empty array provided", () => {
      const { result } = renderHook(() =>
        useAllocationData({
          allocationHistory: [],
        })
      );

      expect(result.current.allocationData).toEqual([]);
      expect(result.current.currentAllocation).toBeNull();
      expect(result.current.pieChartData).toEqual([]);
      expect(result.current.hasData).toBe(false);
    });

    it("should respect external loading state", () => {
      const { result } = renderHook(() =>
        useAllocationData({
          allocationHistory: [],
          isLoading: true,
        })
      );

      expect(result.current.isLoading).toBe(true);
    });

    it("should respect external error state", () => {
      const errorMessage = "Failed to fetch allocation data";
      const { result } = renderHook(() =>
        useAllocationData({
          allocationHistory: [],
          error: errorMessage,
        })
      );

      expect(result.current.error).toBe(errorMessage);
    });
  });

  describe("Aggregated Data Processing", () => {
    it("should process pre-aggregated allocation data", () => {
      const aggregatedData: AssetAllocationPoint[] = [
        {
          date: "2024-01-01",
          btc: 30,
          eth: 25,
          stablecoin: 25,
          altcoin: 20,
        },
        {
          date: "2024-01-02",
          btc: 32,
          eth: 24,
          stablecoin: 24,
          altcoin: 20,
        },
      ];

      const { result } = renderHook(() =>
        useAllocationData({
          allocationHistory: aggregatedData,
        })
      );

      expect(result.current.allocationData).toEqual(aggregatedData);
      expect(result.current.hasData).toBe(true);
    });

    it("should extract current allocation from last data point", () => {
      const aggregatedData: AssetAllocationPoint[] = [
        {
          date: "2024-01-01",
          btc: 30,
          eth: 25,
          stablecoin: 25,
          altcoin: 20,
        },
        {
          date: "2024-01-02",
          btc: 35,
          eth: 30,
          stablecoin: 20,
          altcoin: 15,
        },
      ];

      const { result } = renderHook(() =>
        useAllocationData({
          allocationHistory: aggregatedData,
        })
      );

      expect(result.current.currentAllocation).toEqual({
        btc: 35,
        eth: 30,
        stablecoin: 20,
        altcoin: 15,
      });
    });

    it("should handle single data point", () => {
      const singlePoint: AssetAllocationPoint[] = [
        {
          date: "2024-01-01",
          btc: 40,
          eth: 30,
          stablecoin: 20,
          altcoin: 10,
        },
      ];

      const { result } = renderHook(() =>
        useAllocationData({
          allocationHistory: singlePoint,
        })
      );

      expect(result.current.allocationData).toHaveLength(1);
      expect(result.current.currentAllocation).toEqual({
        btc: 40,
        eth: 30,
        stablecoin: 20,
        altcoin: 10,
      });
    });
  });

  describe("Timeseries Data Transformation", () => {
    it("should transform timeseries data to aggregated format", () => {
      const timeseriesData: AllocationTimeseriesInputPoint[] = [
        {
          date: "2024-01-01",
          category: "BTC",
          allocation_percentage: 30,
          category_value_usd: 3000,
          total_portfolio_value_usd: 10000,
        },
        {
          date: "2024-01-01",
          category: "ETH",
          allocation_percentage: 25,
          category_value_usd: 2500,
          total_portfolio_value_usd: 10000,
        },
        {
          date: "2024-01-01",
          category: "Stablecoin",
          allocation_percentage: 25,
          category_value_usd: 2500,
          total_portfolio_value_usd: 10000,
        },
        {
          date: "2024-01-01",
          category: "Other",
          allocation_percentage: 20,
          category_value_usd: 2000,
          total_portfolio_value_usd: 10000,
        },
      ];

      const { result } = renderHook(() =>
        useAllocationData({
          allocationHistory: timeseriesData,
        })
      );

      expect(result.current.allocationData).toHaveLength(1);
      expect(result.current.hasData).toBe(true);

      const allocation = result.current.allocationData[0];
      expect(allocation?.date).toBe("2024-01-01");
      expect(allocation?.btc).toBeGreaterThan(0);
      expect(allocation?.eth).toBeGreaterThan(0);
      expect(allocation?.stablecoin).toBeGreaterThan(0);
      expect(allocation?.altcoin).toBeGreaterThan(0);
    });

    it("should handle multiple dates in timeseries data", () => {
      const timeseriesData: AllocationTimeseriesInputPoint[] = [
        {
          date: "2024-01-01",
          category: "BTC",
          allocation_percentage: 30,
        },
        {
          date: "2024-01-02",
          category: "BTC",
          allocation_percentage: 35,
        },
      ];

      const { result } = renderHook(() =>
        useAllocationData({
          allocationHistory: timeseriesData,
        })
      );

      expect(result.current.allocationData.length).toBeGreaterThanOrEqual(2);
    });

    it("should normalize percentages to sum to 100", () => {
      const timeseriesData: AllocationTimeseriesInputPoint[] = [
        {
          date: "2024-01-01",
          category: "BTC",
          allocation_percentage: 60,
        },
        {
          date: "2024-01-01",
          category: "ETH",
          allocation_percentage: 60,
        },
      ];

      const { result } = renderHook(() =>
        useAllocationData({
          allocationHistory: timeseriesData,
        })
      );

      const allocation = result.current.allocationData[0];
      if (allocation) {
        const total =
          allocation.btc +
          allocation.eth +
          allocation.stablecoin +
          allocation.altcoin;
        expect(total).toBeCloseTo(100, 1);
      }
    });
  });

  describe("Pie Chart Data Generation", () => {
    it("should generate pie chart data from current allocation", () => {
      const aggregatedData: AssetAllocationPoint[] = [
        {
          date: "2024-01-01",
          btc: 40,
          eth: 30,
          stablecoin: 20,
          altcoin: 10,
        },
      ];

      const { result } = renderHook(() =>
        useAllocationData({
          allocationHistory: aggregatedData,
        })
      );

      expect(result.current.pieChartData).toHaveLength(4);

      // Should be sorted by value (largest first)
      expect(result.current.pieChartData[0]?.id).toBe("btc");
      expect(result.current.pieChartData[0]?.value).toBe(40);
      expect(result.current.pieChartData[1]?.id).toBe("eth");
      expect(result.current.pieChartData[1]?.value).toBe(30);
      expect(result.current.pieChartData[2]?.id).toBe("stablecoin");
      expect(result.current.pieChartData[2]?.value).toBe(20);
      expect(result.current.pieChartData[3]?.id).toBe("altcoin");
      expect(result.current.pieChartData[3]?.value).toBe(10);
    });

    it("should filter out zero allocations from pie chart", () => {
      const aggregatedData: AssetAllocationPoint[] = [
        {
          date: "2024-01-01",
          btc: 50,
          eth: 50,
          stablecoin: 0,
          altcoin: 0,
        },
      ];

      const { result } = renderHook(() =>
        useAllocationData({
          allocationHistory: aggregatedData,
        })
      );

      expect(result.current.pieChartData).toHaveLength(2);
      expect(result.current.pieChartData.every(item => item.value > 0)).toBe(
        true
      );
    });

    it("should include percentage property in pie chart data", () => {
      const aggregatedData: AssetAllocationPoint[] = [
        {
          date: "2024-01-01",
          btc: 40,
          eth: 30,
          stablecoin: 20,
          altcoin: 10,
        },
      ];

      const { result } = renderHook(() =>
        useAllocationData({
          allocationHistory: aggregatedData,
        })
      );

      for (const item of result.current.pieChartData) {
        expect(item.percentage).toBe(item.value);
        expect(typeof item.id).toBe("string");
        expect(typeof item.value).toBe("number");
      }
    });

    it("should return empty pie chart data when no allocation available", () => {
      const { result } = renderHook(() =>
        useAllocationData({
          allocationHistory: [],
        })
      );

      expect(result.current.pieChartData).toEqual([]);
    });
  });

  describe("Edge Cases", () => {
    it("should handle zero allocations across all categories", () => {
      const zeroData: AssetAllocationPoint[] = [
        {
          date: "2024-01-01",
          btc: 0,
          eth: 0,
          stablecoin: 0,
          altcoin: 0,
        },
      ];

      const { result } = renderHook(() =>
        useAllocationData({
          allocationHistory: zeroData,
        })
      );

      expect(result.current.hasData).toBe(true); // Has data points
      expect(result.current.pieChartData).toEqual([]); // But no pie chart data (all zeros)
      expect(result.current.currentAllocation).toEqual({
        btc: 0,
        eth: 0,
        stablecoin: 0,
        altcoin: 0,
      });
    });

    it("should handle negative allocations (debt positions)", () => {
      const timeseriesData: AllocationTimeseriesInputPoint[] = [
        {
          date: "2024-01-01",
          category: "BTC",
          allocation_percentage: -10, // Negative allocation (debt)
        },
        {
          date: "2024-01-01",
          category: "ETH",
          allocation_percentage: 50,
        },
      ];

      const { result } = renderHook(() =>
        useAllocationData({
          allocationHistory: timeseriesData,
        })
      );

      // Negative allocations should be filtered out during transformation
      expect(result.current.hasData).toBe(true);
    });

    it("should handle missing category fields in timeseries data", () => {
      const incompleteData: AllocationTimeseriesInputPoint[] = [
        {
          date: "2024-01-01",
          allocation_percentage: 50,
          // Missing category/protocol field
        },
      ];

      const { result } = renderHook(() =>
        useAllocationData({
          allocationHistory: incompleteData,
        })
      );

      // Should still process without errors
      expect(result.current.allocationData).toHaveLength(1);
    });

    it("should handle very small allocation percentages", () => {
      const aggregatedData: AssetAllocationPoint[] = [
        {
          date: "2024-01-01",
          btc: 99.99,
          eth: 0.005,
          stablecoin: 0.003,
          altcoin: 0.002,
        },
      ];

      const { result } = renderHook(() =>
        useAllocationData({
          allocationHistory: aggregatedData,
        })
      );

      expect(result.current.hasData).toBe(true);
      expect(result.current.pieChartData.length).toBeGreaterThan(0);
    });

    it("should handle large allocation datasets efficiently", () => {
      // Generate 365 days of data
      const largeDataset: AssetAllocationPoint[] = Array.from(
        { length: 365 },
        (_, i) => ({
          date: new Date(2024, 0, i + 1).toISOString().split("T")[0] || "",
          btc: 30 + Math.random() * 10,
          eth: 25 + Math.random() * 10,
          stablecoin: 25 + Math.random() * 10,
          altcoin: 20 + Math.random() * 10,
        })
      );

      const { result } = renderHook(() =>
        useAllocationData({
          allocationHistory: largeDataset,
        })
      );

      expect(result.current.allocationData).toHaveLength(365);
      expect(result.current.hasData).toBe(true);
      expect(result.current.currentAllocation).not.toBeNull();
    });
  });

  describe("Type Detection", () => {
    it("should correctly detect aggregated data format", () => {
      const aggregatedData: AssetAllocationPoint[] = [
        {
          date: "2024-01-01",
          btc: 25,
          eth: 25,
          stablecoin: 25,
          altcoin: 25,
        },
      ];

      const { result } = renderHook(() =>
        useAllocationData({
          allocationHistory: aggregatedData,
        })
      );

      // Should not transform, just pass through
      expect(result.current.allocationData).toEqual(aggregatedData);
    });

    it("should correctly detect timeseries data format", () => {
      const timeseriesData: AllocationTimeseriesInputPoint[] = [
        {
          date: "2024-01-01",
          category: "BTC",
          percentage: 50,
        },
      ];

      const { result } = renderHook(() =>
        useAllocationData({
          allocationHistory: timeseriesData,
        })
      );

      // Should transform to aggregated format
      expect(result.current.allocationData[0]).toHaveProperty("btc");
      expect(result.current.allocationData[0]).toHaveProperty("eth");
      expect(result.current.allocationData[0]).toHaveProperty("stablecoin");
      expect(result.current.allocationData[0]).toHaveProperty("altcoin");
    });
  });

  describe("Memoization", () => {
    it("should memoize allocation data transformation", () => {
      const aggregatedData: AssetAllocationPoint[] = [
        {
          date: "2024-01-01",
          btc: 30,
          eth: 25,
          stablecoin: 25,
          altcoin: 20,
        },
      ];

      const { result, rerender } = renderHook(
        ({ data }: { data: UseAllocationDataParams }) => useAllocationData(data),
        {
          initialProps: { data: { allocationHistory: aggregatedData } },
        }
      );

      const firstResult = result.current.allocationData;

      // Rerender with same data
      rerender({ data: { allocationHistory: aggregatedData } });

      // Should return same reference (memoized)
      expect(result.current.allocationData).toBe(firstResult);
    });

    it("should recalculate when input data changes", () => {
      const data1: AssetAllocationPoint[] = [
        {
          date: "2024-01-01",
          btc: 30,
          eth: 25,
          stablecoin: 25,
          altcoin: 20,
        },
      ];

      const data2: AssetAllocationPoint[] = [
        {
          date: "2024-01-02",
          btc: 35,
          eth: 30,
          stablecoin: 20,
          altcoin: 15,
        },
      ];

      const { result, rerender } = renderHook(
        ({ data }: { data: UseAllocationDataParams }) => useAllocationData(data),
        {
          initialProps: { data: { allocationHistory: data1 } },
        }
      );

      const firstAllocation = result.current.currentAllocation;

      // Rerender with different data
      rerender({ data: { allocationHistory: data2 } });

      // Should have new allocation values
      expect(result.current.currentAllocation).not.toEqual(firstAllocation);
      expect(result.current.currentAllocation?.btc).toBe(35);
    });
  });
});
