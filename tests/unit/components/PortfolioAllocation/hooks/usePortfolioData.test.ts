import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { usePortfolioData } from "@/components/PortfolioAllocation/hooks/usePortfolioData";
import { AssetCategory } from "@/components/PortfolioAllocation/types";
import * as utils from "@/components/PortfolioAllocation/utils/dataProcessing";

/* eslint-disable @typescript-eslint/no-unused-vars */

// Mock the utility module
vi.mock("@/components/PortfolioAllocation/utils/dataProcessing", () => ({
  processAssetCategories: vi.fn(),
}));

describe("usePortfolioData", () => {
  const mockAssetCategories: AssetCategory[] = [
    {
      id: "btc",
      name: "Bitcoin",
      protocols: [],
      color: "#F7931A",
    },
    {
      id: "eth",
      name: "Ethereum",
      protocols: [],
      color: "#627EEA",
    },
    {
      id: "stablecoins",
      name: "Stablecoins",
      protocols: [],
      color: "#26A17B",
    },
  ];

  const mockProcessedResult = {
    processedCategories: [
      {
        id: "btc",
        name: "Bitcoin",
        protocols: [],
        color: "#F7931A",
        isExcluded: false,
        totalAllocationPercentage: 33.33,
        activeAllocationPercentage: 50,
        totalValue: 5000,
      },
      {
        id: "eth",
        name: "Ethereum",
        protocols: [],
        color: "#627EEA",
        isExcluded: false,
        totalAllocationPercentage: 33.33,
        activeAllocationPercentage: 50,
        totalValue: 5000,
      },
      {
        id: "stablecoins",
        name: "Stablecoins",
        protocols: [],
        color: "#26A17B",
        isExcluded: true,
        totalAllocationPercentage: 33.33,
        activeAllocationPercentage: 0,
        totalValue: 0,
      },
    ],
    chartData: [
      {
        id: "btc",
        name: "Bitcoin",
        value: 50,
        color: "#F7931A",
        isExcluded: false,
      },
      {
        id: "eth",
        name: "Ethereum",
        value: 50,
        color: "#627EEA",
        isExcluded: false,
      },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Return a new object each time to test memoization properly
    vi.mocked(utils.processAssetCategories).mockImplementation(() => ({
      ...mockProcessedResult,
      processedCategories: [...mockProcessedResult.processedCategories],
      chartData: [...mockProcessedResult.chartData],
    }));
  });

  describe("Data Processing", () => {
    it("should call processAssetCategories with correct parameters", () => {
      const excludedIds = ["stablecoins"];

      renderHook(() => usePortfolioData(mockAssetCategories, excludedIds));

      expect(utils.processAssetCategories).toHaveBeenCalledWith(
        mockAssetCategories,
        excludedIds,
        {}
      );
    });

    it("should pass allocation overrides to processing function", () => {
      const excludedIds: string[] = [];
      const overrides = { btc: 60, eth: 40 };

      renderHook(() =>
        usePortfolioData(mockAssetCategories, excludedIds, {
          allocationOverrides: overrides,
        })
      );

      expect(utils.processAssetCategories).toHaveBeenCalledWith(
        mockAssetCategories,
        excludedIds,
        { allocationOverrides: overrides }
      );
    });

    it("should pass custom total portfolio value to processing function", () => {
      const excludedIds: string[] = [];
      const customValue = 50000;

      renderHook(() =>
        usePortfolioData(mockAssetCategories, excludedIds, {
          totalPortfolioValue: customValue,
        })
      );

      expect(utils.processAssetCategories).toHaveBeenCalledWith(
        mockAssetCategories,
        excludedIds,
        { totalPortfolioValue: customValue }
      );
    });

    it("should pass both overrides and custom value together", () => {
      const excludedIds: string[] = [];
      const overrides = { btc: 70, eth: 30 };
      const customValue = 100000;

      renderHook(() =>
        usePortfolioData(mockAssetCategories, excludedIds, {
          allocationOverrides: overrides,
          totalPortfolioValue: customValue,
        })
      );

      expect(utils.processAssetCategories).toHaveBeenCalledWith(
        mockAssetCategories,
        excludedIds,
        {
          allocationOverrides: overrides,
          totalPortfolioValue: customValue,
        }
      );
    });

    it("should return processed data from utility function", () => {
      const { result } = renderHook(() =>
        usePortfolioData(mockAssetCategories, [])
      );

      expect(result.current).toEqual(mockProcessedResult);
      expect(result.current.processedCategories).toHaveLength(3);
      expect(result.current.chartData).toHaveLength(2);
    });
  });

  describe("Memoization Behavior", () => {
    it("should memoize result when dependencies don't change", () => {
      const excludedIds = ["stablecoins"];
      const options = { totalPortfolioValue: 10000 };

      // Mock to return same reference for same inputs
      let callCount = 0;
      const memoizedResult = { ...mockProcessedResult };
      vi.mocked(utils.processAssetCategories).mockImplementation(() => {
        callCount++;
        return memoizedResult;
      });

      const { result, rerender } = renderHook(() =>
        usePortfolioData(mockAssetCategories, excludedIds, options)
      );

      const firstResult = result.current;

      rerender();

      // useMemo should prevent re-calculation
      expect(result.current).toBe(firstResult);
      expect(callCount).toBe(1);
    });

    it("should recalculate when asset categories change", () => {
      const excludedIds: string[] = [];

      // Reset mock to default implementation that returns new objects
      vi.mocked(utils.processAssetCategories).mockImplementation(() => ({
        ...mockProcessedResult,
        processedCategories: [...mockProcessedResult.processedCategories],
        chartData: [...mockProcessedResult.chartData],
      }));

      const { result, rerender } = renderHook(
        ({ categories }) => usePortfolioData(categories, excludedIds),
        {
          initialProps: { categories: mockAssetCategories },
        }
      );

      const newCategories = [
        ...mockAssetCategories,
        {
          id: "others",
          name: "Others",
          protocols: [],
          color: "#888888",
        },
      ];

      rerender({ categories: newCategories });

      // Should recalculate with new categories
      expect(utils.processAssetCategories).toHaveBeenCalledTimes(2);
      expect(utils.processAssetCategories).toHaveBeenLastCalledWith(
        newCategories,
        excludedIds,
        {}
      );
    });

    it("should recalculate when excluded IDs change", () => {
      // Reset mock to return new objects
      vi.mocked(utils.processAssetCategories).mockImplementation(() => ({
        ...mockProcessedResult,
        processedCategories: [...mockProcessedResult.processedCategories],
        chartData: [...mockProcessedResult.chartData],
      }));

      const { rerender } = renderHook(
        ({ excludedIds }) => usePortfolioData(mockAssetCategories, excludedIds),
        {
          initialProps: { excludedIds: ["stablecoins"] },
        }
      );

      rerender({ excludedIds: ["stablecoins", "others"] });

      expect(utils.processAssetCategories).toHaveBeenCalledTimes(2);
    });

    it("should recalculate when options change", () => {
      const excludedIds: string[] = [];

      // Reset mock to return new objects
      vi.mocked(utils.processAssetCategories).mockImplementation(() => ({
        ...mockProcessedResult,
        processedCategories: [...mockProcessedResult.processedCategories],
        chartData: [...mockProcessedResult.chartData],
      }));

      const { rerender } = renderHook(
        ({ options }) =>
          usePortfolioData(mockAssetCategories, excludedIds, options),
        {
          initialProps: { options: { totalPortfolioValue: 10000 } },
        }
      );

      rerender({ options: { totalPortfolioValue: 20000 } });

      expect(utils.processAssetCategories).toHaveBeenCalledTimes(2);
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty asset categories array", () => {
      const { result } = renderHook(() => usePortfolioData([], []));

      expect(utils.processAssetCategories).toHaveBeenCalledWith([], [], {});
      expect(result.current).toEqual(mockProcessedResult);
    });

    it("should handle empty excluded IDs array", () => {
      const { result } = renderHook(() =>
        usePortfolioData(mockAssetCategories, [])
      );

      expect(utils.processAssetCategories).toHaveBeenCalledWith(
        mockAssetCategories,
        [],
        {}
      );
      expect(result.current).toEqual(mockProcessedResult);
    });

    it("should handle all categories excluded", () => {
      const allExcluded = mockAssetCategories.map(cat => cat.id);

      renderHook(() => usePortfolioData(mockAssetCategories, allExcluded));

      expect(utils.processAssetCategories).toHaveBeenCalledWith(
        mockAssetCategories,
        allExcluded,
        {}
      );
    });

    it("should handle undefined options gracefully", () => {
      const { result } = renderHook(() =>
        usePortfolioData(mockAssetCategories, [])
      );

      expect(utils.processAssetCategories).toHaveBeenCalledWith(
        mockAssetCategories,
        [],
        {}
      );
      expect(result.current).toEqual(mockProcessedResult);
    });

    it("should handle empty allocation overrides object", () => {
      renderHook(() =>
        usePortfolioData(mockAssetCategories, [], {
          allocationOverrides: {},
        })
      );

      expect(utils.processAssetCategories).toHaveBeenCalledWith(
        mockAssetCategories,
        [],
        { allocationOverrides: {} }
      );
    });

    it("should handle zero total portfolio value", () => {
      renderHook(() =>
        usePortfolioData(mockAssetCategories, [], {
          totalPortfolioValue: 0,
        })
      );

      expect(utils.processAssetCategories).toHaveBeenCalledWith(
        mockAssetCategories,
        [],
        { totalPortfolioValue: 0 }
      );
    });
  });

  describe("Computed Values", () => {
    it("should preserve processedCategories structure", () => {
      const { result } = renderHook(() =>
        usePortfolioData(mockAssetCategories, ["stablecoins"])
      );

      expect(result.current.processedCategories).toMatchObject([
        {
          id: "btc",
          isExcluded: false,
          totalAllocationPercentage: 33.33,
          activeAllocationPercentage: 50,
        },
        {
          id: "eth",
          isExcluded: false,
          totalAllocationPercentage: 33.33,
          activeAllocationPercentage: 50,
        },
        {
          id: "stablecoins",
          isExcluded: true,
          totalAllocationPercentage: 33.33,
          activeAllocationPercentage: 0,
        },
      ]);
    });

    it("should preserve chartData structure", () => {
      const { result } = renderHook(() =>
        usePortfolioData(mockAssetCategories, ["stablecoins"])
      );

      expect(result.current.chartData).toMatchObject([
        {
          id: "btc",
          name: "Bitcoin",
          value: 50,
          isExcluded: false,
        },
        {
          id: "eth",
          name: "Ethereum",
          value: 50,
          isExcluded: false,
        },
      ]);
    });

    it("should filter excluded categories from chart data", () => {
      const { result } = renderHook(() =>
        usePortfolioData(mockAssetCategories, ["stablecoins"])
      );

      const excludedInChart = result.current.chartData.some(
        data => data.id === "stablecoins"
      );
      expect(excludedInChart).toBe(false);
    });
  });

  describe("Multiple Exclusions", () => {
    it("should handle multiple excluded categories", () => {
      const excludedIds = ["stablecoins", "others"];

      renderHook(() => usePortfolioData(mockAssetCategories, excludedIds));

      expect(utils.processAssetCategories).toHaveBeenCalledWith(
        mockAssetCategories,
        excludedIds,
        {}
      );
    });

    it("should handle excluding non-existent category IDs", () => {
      const excludedIds = ["nonexistent", "fake"];

      renderHook(() => usePortfolioData(mockAssetCategories, excludedIds));

      expect(utils.processAssetCategories).toHaveBeenCalledWith(
        mockAssetCategories,
        excludedIds,
        {}
      );
    });
  });

  describe("Real-World Scenarios", () => {
    it("should handle typical portfolio with partial exclusions", () => {
      const excludedIds = ["stablecoins"];
      const overrides = { btc: 60, eth: 40 };

      const { result } = renderHook(() =>
        usePortfolioData(mockAssetCategories, excludedIds, {
          allocationOverrides: overrides,
          totalPortfolioValue: 10000,
        })
      );

      expect(utils.processAssetCategories).toHaveBeenCalledWith(
        mockAssetCategories,
        excludedIds,
        {
          allocationOverrides: overrides,
          totalPortfolioValue: 10000,
        }
      );
      expect(result.current).toBeDefined();
      expect(result.current.processedCategories).toBeDefined();
      expect(result.current.chartData).toBeDefined();
    });

    it("should handle portfolio with no exclusions and equal allocation", () => {
      const { result } = renderHook(() =>
        usePortfolioData(mockAssetCategories, [])
      );

      expect(result.current.processedCategories).toHaveLength(3);
      expect(result.current.chartData.length).toBeGreaterThan(0);
    });

    it("should handle large portfolio value", () => {
      const largeValue = 1000000;

      renderHook(() =>
        usePortfolioData(mockAssetCategories, [], {
          totalPortfolioValue: largeValue,
        })
      );

      expect(utils.processAssetCategories).toHaveBeenCalledWith(
        mockAssetCategories,
        [],
        { totalPortfolioValue: largeValue }
      );
    });

    it("should handle fractional allocation percentages", () => {
      const fractionalOverrides = {
        btc: 33.33,
        eth: 33.33,
        stablecoins: 33.34,
      };

      renderHook(() =>
        usePortfolioData(mockAssetCategories, [], {
          allocationOverrides: fractionalOverrides,
        })
      );

      expect(utils.processAssetCategories).toHaveBeenCalledWith(
        mockAssetCategories,
        [],
        { allocationOverrides: fractionalOverrides }
      );
    });
  });
});
