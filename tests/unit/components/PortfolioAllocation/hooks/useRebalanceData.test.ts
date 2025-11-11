import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useRebalanceData } from "@/components/PortfolioAllocation/hooks/useRebalanceData";
import {
  ProcessedAssetCategory,
  RebalanceData,
} from "@/components/PortfolioAllocation/types";
import * as utils from "@/components/PortfolioAllocation/utils/dataProcessing";

// Mock the utility module
vi.mock("@/components/PortfolioAllocation/utils/dataProcessing", () => ({
  generateRebalanceData: vi.fn(),
}));

describe("useRebalanceData", () => {
  const mockProcessedCategories: ProcessedAssetCategory[] = [
    {
      id: "btc",
      name: "Bitcoin",
      protocols: [],
      color: "#F7931A",
      isExcluded: false,
      totalAllocationPercentage: 40,
      activeAllocationPercentage: 50,
      totalValue: 5000,
    },
    {
      id: "eth",
      name: "Ethereum",
      protocols: [],
      color: "#627EEA",
      isExcluded: false,
      totalAllocationPercentage: 30,
      activeAllocationPercentage: 37.5,
      totalValue: 3750,
    },
    {
      id: "stablecoins",
      name: "Stablecoins",
      protocols: [],
      color: "#26A17B",
      isExcluded: false,
      totalAllocationPercentage: 30,
      activeAllocationPercentage: 12.5,
      totalValue: 1250,
    },
  ];

  const mockRebalanceData: RebalanceData = {
    current: mockProcessedCategories,
    target: [
      {
        ...mockProcessedCategories[0],
        activeAllocationPercentage: 45,
        totalValue: 4500,
      },
      {
        ...mockProcessedCategories[1],
        activeAllocationPercentage: 35,
        totalValue: 3500,
      },
      {
        ...mockProcessedCategories[2],
        activeAllocationPercentage: 20,
        totalValue: 2000,
      },
    ],
    shifts: [
      {
        categoryId: "btc",
        categoryName: "Bitcoin",
        currentPercentage: 50,
        targetPercentage: 45,
        changeAmount: -5,
        changePercentage: -10,
        action: "decrease",
        actionDescription: "Sell",
      },
      {
        categoryId: "eth",
        categoryName: "Ethereum",
        currentPercentage: 37.5,
        targetPercentage: 35,
        changeAmount: -2.5,
        changePercentage: -6.67,
        action: "decrease",
        actionDescription: "Sell",
      },
      {
        categoryId: "stablecoins",
        categoryName: "Stablecoins",
        currentPercentage: 12.5,
        targetPercentage: 20,
        changeAmount: 7.5,
        changePercentage: 60,
        action: "increase",
        actionDescription: "Buy more",
      },
    ],
    totalRebalanceValue: 1500,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(utils.generateRebalanceData).mockReturnValue(mockRebalanceData);
  });

  describe("Rebalance Mode Enabled", () => {
    it("should return rebalance data when mode is enabled", () => {
      const { result } = renderHook(() =>
        useRebalanceData(mockProcessedCategories, true)
      );

      expect(result.current).toEqual(mockRebalanceData);
      expect(utils.generateRebalanceData).toHaveBeenCalledWith(
        mockProcessedCategories
      );
      expect(utils.generateRebalanceData).toHaveBeenCalledTimes(1);
    });

    it("should call generateRebalanceData with correct parameters", () => {
      renderHook(() => useRebalanceData(mockProcessedCategories, true));

      expect(utils.generateRebalanceData).toHaveBeenCalledWith(
        mockProcessedCategories
      );
    });

    it("should include current categories in result", () => {
      const { result } = renderHook(() =>
        useRebalanceData(mockProcessedCategories, true)
      );

      expect(result.current?.current).toEqual(mockProcessedCategories);
    });

    it("should include target categories in result", () => {
      const { result } = renderHook(() =>
        useRebalanceData(mockProcessedCategories, true)
      );

      expect(result.current?.target).toBeDefined();
      expect(result.current?.target).toHaveLength(3);
    });

    it("should include category shifts in result", () => {
      const { result } = renderHook(() =>
        useRebalanceData(mockProcessedCategories, true)
      );

      expect(result.current?.shifts).toBeDefined();
      expect(result.current?.shifts).toHaveLength(3);
      expect(result.current?.shifts[0]).toHaveProperty("action");
      expect(result.current?.shifts[0]).toHaveProperty("changeAmount");
    });

    it("should include total rebalance value in result", () => {
      const { result } = renderHook(() =>
        useRebalanceData(mockProcessedCategories, true)
      );

      expect(result.current?.totalRebalanceValue).toBe(1500);
    });
  });

  describe("Rebalance Mode Disabled", () => {
    it("should return undefined when mode is disabled", () => {
      const { result } = renderHook(() =>
        useRebalanceData(mockProcessedCategories, false)
      );

      expect(result.current).toBeUndefined();
      expect(utils.generateRebalanceData).not.toHaveBeenCalled();
    });

    it("should not call generateRebalanceData when disabled", () => {
      renderHook(() => useRebalanceData(mockProcessedCategories, false));

      expect(utils.generateRebalanceData).not.toHaveBeenCalled();
    });
  });

  describe("Memoization Behavior", () => {
    it("should memoize result when dependencies don't change", () => {
      const { result, rerender } = renderHook(() =>
        useRebalanceData(mockProcessedCategories, true)
      );

      const firstResult = result.current;

      rerender();

      expect(result.current).toBe(firstResult);
      expect(utils.generateRebalanceData).toHaveBeenCalledTimes(1);
    });

    it("should recalculate when isRebalanceMode changes from false to true", () => {
      const { result, rerender } = renderHook(
        ({ isRebalanceMode }) =>
          useRebalanceData(mockProcessedCategories, isRebalanceMode),
        {
          initialProps: { isRebalanceMode: false },
        }
      );

      expect(result.current).toBeUndefined();
      expect(utils.generateRebalanceData).not.toHaveBeenCalled();

      rerender({ isRebalanceMode: true });

      expect(result.current).toEqual(mockRebalanceData);
      expect(utils.generateRebalanceData).toHaveBeenCalledTimes(1);
    });

    it("should recalculate when isRebalanceMode changes from true to false", () => {
      const { result, rerender } = renderHook(
        ({ isRebalanceMode }) =>
          useRebalanceData(mockProcessedCategories, isRebalanceMode),
        {
          initialProps: { isRebalanceMode: true },
        }
      );

      expect(result.current).toEqual(mockRebalanceData);
      expect(utils.generateRebalanceData).toHaveBeenCalledTimes(1);

      rerender({ isRebalanceMode: false });

      expect(result.current).toBeUndefined();
      // Still only called once (not called again when switching to false)
      expect(utils.generateRebalanceData).toHaveBeenCalledTimes(1);
    });

    it("should recalculate when processedCategories change", () => {
      const { rerender } = renderHook(
        ({ categories }) => useRebalanceData(categories, true),
        {
          initialProps: { categories: mockProcessedCategories },
        }
      );

      const updatedCategories: ProcessedAssetCategory[] = [
        {
          ...mockProcessedCategories[0],
          totalValue: 6000,
          activeAllocationPercentage: 60,
        },
        ...mockProcessedCategories.slice(1),
      ];

      rerender({ categories: updatedCategories });

      expect(utils.generateRebalanceData).toHaveBeenCalledTimes(2);
      expect(utils.generateRebalanceData).toHaveBeenLastCalledWith(
        updatedCategories
      );
    });

    it("should not recalculate when both dependencies remain the same", () => {
      const { result, rerender } = renderHook(() =>
        useRebalanceData(mockProcessedCategories, true)
      );

      const firstResult = result.current;

      // Multiple rerenders
      rerender();
      rerender();
      rerender();

      expect(result.current).toBe(firstResult);
      expect(utils.generateRebalanceData).toHaveBeenCalledTimes(1);
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty processedCategories array when enabled", () => {
      const emptyCategories: ProcessedAssetCategory[] = [];

      renderHook(() => useRebalanceData(emptyCategories, true));

      expect(utils.generateRebalanceData).toHaveBeenCalledWith(emptyCategories);
    });

    it("should return undefined for empty array when disabled", () => {
      const emptyCategories: ProcessedAssetCategory[] = [];

      const { result } = renderHook(() =>
        useRebalanceData(emptyCategories, false)
      );

      expect(result.current).toBeUndefined();
      expect(utils.generateRebalanceData).not.toHaveBeenCalled();
    });

    it("should handle single category", () => {
      const singleCategory = [mockProcessedCategories[0]];

      renderHook(() => useRebalanceData(singleCategory, true));

      expect(utils.generateRebalanceData).toHaveBeenCalledWith(singleCategory);
    });

    it("should handle categories with zero values", () => {
      const categoriesWithZero: ProcessedAssetCategory[] = [
        { ...mockProcessedCategories[0], totalValue: 0 },
        mockProcessedCategories[1],
        mockProcessedCategories[2],
      ];

      renderHook(() => useRebalanceData(categoriesWithZero, true));

      expect(utils.generateRebalanceData).toHaveBeenCalledWith(
        categoriesWithZero
      );
    });

    it("should handle all categories excluded", () => {
      const allExcluded: ProcessedAssetCategory[] = mockProcessedCategories.map(
        cat => ({
          ...cat,
          isExcluded: true,
          activeAllocationPercentage: 0,
        })
      );

      renderHook(() => useRebalanceData(allExcluded, true));

      expect(utils.generateRebalanceData).toHaveBeenCalledWith(allExcluded);
    });
  });

  describe("Shift Actions", () => {
    it("should handle increase actions in shifts", () => {
      const { result } = renderHook(() =>
        useRebalanceData(mockProcessedCategories, true)
      );

      const increaseShifts = result.current?.shifts.filter(
        shift => shift.action === "increase"
      );
      expect(increaseShifts).toBeDefined();
      expect(increaseShifts!.length).toBeGreaterThan(0);
    });

    it("should handle decrease actions in shifts", () => {
      const { result } = renderHook(() =>
        useRebalanceData(mockProcessedCategories, true)
      );

      const decreaseShifts = result.current?.shifts.filter(
        shift => shift.action === "decrease"
      );
      expect(decreaseShifts).toBeDefined();
      expect(decreaseShifts!.length).toBeGreaterThan(0);
    });

    it("should preserve shift structure with all required fields", () => {
      const { result } = renderHook(() =>
        useRebalanceData(mockProcessedCategories, true)
      );

      const shift = result.current?.shifts[0];
      expect(shift).toHaveProperty("categoryId");
      expect(shift).toHaveProperty("categoryName");
      expect(shift).toHaveProperty("currentPercentage");
      expect(shift).toHaveProperty("targetPercentage");
      expect(shift).toHaveProperty("changeAmount");
      expect(shift).toHaveProperty("changePercentage");
      expect(shift).toHaveProperty("action");
      expect(shift).toHaveProperty("actionDescription");
    });
  });

  describe("Multiple Rerenders", () => {
    it("should handle multiple mode toggles efficiently", () => {
      const { rerender } = renderHook(
        ({ isRebalanceMode }) =>
          useRebalanceData(mockProcessedCategories, isRebalanceMode),
        {
          initialProps: { isRebalanceMode: false },
        }
      );

      rerender({ isRebalanceMode: true });
      rerender({ isRebalanceMode: false });
      rerender({ isRebalanceMode: true });

      // Called twice (only when mode is true)
      expect(utils.generateRebalanceData).toHaveBeenCalledTimes(2);
    });

    it("should handle category updates while mode is enabled", () => {
      const { rerender } = renderHook(
        ({ categories }) => useRebalanceData(categories, true),
        {
          initialProps: { categories: mockProcessedCategories },
        }
      );

      const updated1 = mockProcessedCategories.map(cat => ({
        ...cat,
        totalValue: cat.totalValue + 100,
      }));
      rerender({ categories: updated1 });

      const updated2 = mockProcessedCategories.map(cat => ({
        ...cat,
        totalValue: cat.totalValue + 200,
      }));
      rerender({ categories: updated2 });

      expect(utils.generateRebalanceData).toHaveBeenCalledTimes(3);
    });
  });

  describe("Real-World Scenarios", () => {
    it("should handle typical rebalancing scenario", () => {
      const { result } = renderHook(() =>
        useRebalanceData(mockProcessedCategories, true)
      );

      expect(result.current).toBeDefined();
      expect(result.current?.current).toHaveLength(3);
      expect(result.current?.target).toHaveLength(3);
      expect(result.current?.shifts).toHaveLength(3);
      expect(result.current?.totalRebalanceValue).toBeGreaterThan(0);
    });

    it("should work with mixed excluded and included categories", () => {
      const mixedCategories: ProcessedAssetCategory[] = [
        mockProcessedCategories[0],
        { ...mockProcessedCategories[1], isExcluded: true },
        mockProcessedCategories[2],
      ];

      renderHook(() => useRebalanceData(mixedCategories, true));

      expect(utils.generateRebalanceData).toHaveBeenCalledWith(mixedCategories);
    });

    it("should handle large portfolio values", () => {
      const largeValueCategories: ProcessedAssetCategory[] =
        mockProcessedCategories.map(cat => ({
          ...cat,
          totalValue: cat.totalValue * 100,
        }));

      renderHook(() => useRebalanceData(largeValueCategories, true));

      expect(utils.generateRebalanceData).toHaveBeenCalledWith(
        largeValueCategories
      );
    });

    it("should handle fractional percentages", () => {
      const fractionalCategories: ProcessedAssetCategory[] = [
        { ...mockProcessedCategories[0], activeAllocationPercentage: 33.333 },
        { ...mockProcessedCategories[1], activeAllocationPercentage: 33.333 },
        { ...mockProcessedCategories[2], activeAllocationPercentage: 33.334 },
      ];

      renderHook(() => useRebalanceData(fractionalCategories, true));

      expect(utils.generateRebalanceData).toHaveBeenCalledWith(
        fractionalCategories
      );
    });
  });

  describe("Integration with Mode Toggle", () => {
    it("should cleanly transition from disabled to enabled state", () => {
      const { result, rerender } = renderHook(
        ({ isEnabled }) => useRebalanceData(mockProcessedCategories, isEnabled),
        {
          initialProps: { isEnabled: false },
        }
      );

      expect(result.current).toBeUndefined();

      rerender({ isEnabled: true });

      expect(result.current).toBeDefined();
      expect(result.current).toEqual(mockRebalanceData);
    });

    it("should cleanly transition from enabled to disabled state", () => {
      const { result, rerender } = renderHook(
        ({ isEnabled }) => useRebalanceData(mockProcessedCategories, isEnabled),
        {
          initialProps: { isEnabled: true },
        }
      );

      expect(result.current).toEqual(mockRebalanceData);

      rerender({ isEnabled: false });

      expect(result.current).toBeUndefined();
    });
  });
});
