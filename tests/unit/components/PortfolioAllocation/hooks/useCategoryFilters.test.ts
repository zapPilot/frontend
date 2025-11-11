import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { useCategoryFilters } from "@/components/PortfolioAllocation/hooks/useCategoryFilters";
import { ProcessedAssetCategory } from "@/components/PortfolioAllocation/types";

describe("useCategoryFilters", () => {
  const createMockCategory = (
    id: string,
    isExcluded: boolean,
    value: number
  ): ProcessedAssetCategory => ({
    id,
    name: id.toUpperCase(),
    protocols: [],
    color: "#000000",
    isExcluded,
    totalAllocationPercentage: value,
    activeAllocationPercentage: isExcluded ? 0 : value,
    totalValue: value * 100,
  });

  describe("Basic Filtering", () => {
    it("should separate included and excluded categories correctly", () => {
      const categories: ProcessedAssetCategory[] = [
        createMockCategory("btc", false, 50),
        createMockCategory("eth", false, 30),
        createMockCategory("stablecoins", true, 20),
      ];

      const { result } = renderHook(() => useCategoryFilters(categories));

      expect(result.current.includedCategories).toHaveLength(2);
      expect(result.current.excludedCategories).toHaveLength(1);
    });

    it("should include only non-excluded categories in includedCategories", () => {
      const categories: ProcessedAssetCategory[] = [
        createMockCategory("btc", false, 50),
        createMockCategory("eth", false, 30),
        createMockCategory("stablecoins", true, 20),
      ];

      const { result } = renderHook(() => useCategoryFilters(categories));

      expect(result.current.includedCategories).toEqual([
        expect.objectContaining({ id: "btc", isExcluded: false }),
        expect.objectContaining({ id: "eth", isExcluded: false }),
      ]);
    });

    it("should include only excluded categories in excludedCategories", () => {
      const categories: ProcessedAssetCategory[] = [
        createMockCategory("btc", false, 50),
        createMockCategory("eth", false, 30),
        createMockCategory("stablecoins", true, 20),
      ];

      const { result } = renderHook(() => useCategoryFilters(categories));

      expect(result.current.excludedCategories).toEqual([
        expect.objectContaining({ id: "stablecoins", isExcluded: true }),
      ]);
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty array", () => {
      const { result } = renderHook(() => useCategoryFilters([]));

      expect(result.current.includedCategories).toEqual([]);
      expect(result.current.excludedCategories).toEqual([]);
    });

    it("should handle all categories included", () => {
      const categories: ProcessedAssetCategory[] = [
        createMockCategory("btc", false, 33),
        createMockCategory("eth", false, 33),
        createMockCategory("stablecoins", false, 34),
      ];

      const { result } = renderHook(() => useCategoryFilters(categories));

      expect(result.current.includedCategories).toHaveLength(3);
      expect(result.current.excludedCategories).toHaveLength(0);
    });

    it("should handle all categories excluded", () => {
      const categories: ProcessedAssetCategory[] = [
        createMockCategory("btc", true, 33),
        createMockCategory("eth", true, 33),
        createMockCategory("stablecoins", true, 34),
      ];

      const { result } = renderHook(() => useCategoryFilters(categories));

      expect(result.current.includedCategories).toHaveLength(0);
      expect(result.current.excludedCategories).toHaveLength(3);
    });

    it("should handle single category included", () => {
      const categories: ProcessedAssetCategory[] = [
        createMockCategory("btc", false, 100),
      ];

      const { result } = renderHook(() => useCategoryFilters(categories));

      expect(result.current.includedCategories).toHaveLength(1);
      expect(result.current.excludedCategories).toHaveLength(0);
      expect(result.current.includedCategories[0].id).toBe("btc");
    });

    it("should handle single category excluded", () => {
      const categories: ProcessedAssetCategory[] = [
        createMockCategory("btc", true, 100),
      ];

      const { result } = renderHook(() => useCategoryFilters(categories));

      expect(result.current.includedCategories).toHaveLength(0);
      expect(result.current.excludedCategories).toHaveLength(1);
      expect(result.current.excludedCategories[0].id).toBe("btc");
    });
  });

  describe("Memoization Behavior", () => {
    it("should memoize result when input doesn't change", () => {
      const categories: ProcessedAssetCategory[] = [
        createMockCategory("btc", false, 50),
        createMockCategory("eth", true, 50),
      ];

      const { result, rerender } = renderHook(() =>
        useCategoryFilters(categories)
      );

      const firstResult = result.current;

      rerender();

      expect(result.current).toBe(firstResult);
      expect(result.current.includedCategories).toBe(
        firstResult.includedCategories
      );
      expect(result.current.excludedCategories).toBe(
        firstResult.excludedCategories
      );
    });

    it("should recalculate when categories change", () => {
      const { result, rerender } = renderHook(
        ({ cats }) => useCategoryFilters(cats),
        {
          initialProps: {
            cats: [
              createMockCategory("btc", false, 50),
              createMockCategory("eth", true, 50),
            ],
          },
        }
      );

      const firstResult = result.current;

      rerender({
        cats: [
          createMockCategory("btc", true, 50),
          createMockCategory("eth", false, 50),
        ],
      });

      expect(result.current).not.toBe(firstResult);
      expect(result.current.includedCategories).toHaveLength(1);
      expect(result.current.includedCategories[0].id).toBe("eth");
      expect(result.current.excludedCategories).toHaveLength(1);
      expect(result.current.excludedCategories[0].id).toBe("btc");
    });

    it("should recalculate when exclusion status changes", () => {
      const { result, rerender } = renderHook(
        ({ cats }) => useCategoryFilters(cats),
        {
          initialProps: {
            cats: [createMockCategory("btc", false, 100)],
          },
        }
      );

      expect(result.current.includedCategories).toHaveLength(1);
      expect(result.current.excludedCategories).toHaveLength(0);

      rerender({
        cats: [createMockCategory("btc", true, 100)],
      });

      expect(result.current.includedCategories).toHaveLength(0);
      expect(result.current.excludedCategories).toHaveLength(1);
    });
  });

  describe("Multiple Categories", () => {
    it("should handle multiple included categories", () => {
      const categories: ProcessedAssetCategory[] = [
        createMockCategory("btc", false, 25),
        createMockCategory("eth", false, 25),
        createMockCategory("stablecoins", false, 25),
        createMockCategory("others", false, 25),
      ];

      const { result } = renderHook(() => useCategoryFilters(categories));

      expect(result.current.includedCategories).toHaveLength(4);
      expect(result.current.excludedCategories).toHaveLength(0);
    });

    it("should handle multiple excluded categories", () => {
      const categories: ProcessedAssetCategory[] = [
        createMockCategory("btc", false, 50),
        createMockCategory("eth", true, 20),
        createMockCategory("stablecoins", true, 20),
        createMockCategory("others", true, 10),
      ];

      const { result } = renderHook(() => useCategoryFilters(categories));

      expect(result.current.includedCategories).toHaveLength(1);
      expect(result.current.excludedCategories).toHaveLength(3);
    });

    it("should maintain correct order for included categories", () => {
      const categories: ProcessedAssetCategory[] = [
        createMockCategory("btc", false, 40),
        createMockCategory("eth", false, 30),
        createMockCategory("stablecoins", false, 30),
      ];

      const { result } = renderHook(() => useCategoryFilters(categories));

      expect(result.current.includedCategories[0].id).toBe("btc");
      expect(result.current.includedCategories[1].id).toBe("eth");
      expect(result.current.includedCategories[2].id).toBe("stablecoins");
    });

    it("should maintain correct order for excluded categories", () => {
      const categories: ProcessedAssetCategory[] = [
        createMockCategory("btc", true, 40),
        createMockCategory("eth", true, 30),
        createMockCategory("stablecoins", true, 30),
      ];

      const { result } = renderHook(() => useCategoryFilters(categories));

      expect(result.current.excludedCategories[0].id).toBe("btc");
      expect(result.current.excludedCategories[1].id).toBe("eth");
      expect(result.current.excludedCategories[2].id).toBe("stablecoins");
    });
  });

  describe("Data Integrity", () => {
    it("should preserve all category properties in included categories", () => {
      const category = createMockCategory("btc", false, 100);

      const { result } = renderHook(() => useCategoryFilters([category]));

      const included = result.current.includedCategories[0];
      expect(included).toEqual(category);
      expect(included.id).toBe("btc");
      expect(included.name).toBe("BTC");
      expect(included.isExcluded).toBe(false);
      expect(included.totalAllocationPercentage).toBe(100);
    });

    it("should preserve all category properties in excluded categories", () => {
      const category = createMockCategory("eth", true, 100);

      const { result } = renderHook(() => useCategoryFilters([category]));

      const excluded = result.current.excludedCategories[0];
      expect(excluded).toEqual(category);
      expect(excluded.id).toBe("eth");
      expect(excluded.name).toBe("ETH");
      expect(excluded.isExcluded).toBe(true);
      expect(excluded.activeAllocationPercentage).toBe(0);
    });

    it("should not modify original category objects", () => {
      const categories: ProcessedAssetCategory[] = [
        createMockCategory("btc", false, 50),
        createMockCategory("eth", true, 50),
      ];

      const originalBtc = { ...categories[0] };
      const originalEth = { ...categories[1] };

      renderHook(() => useCategoryFilters(categories));

      expect(categories[0]).toEqual(originalBtc);
      expect(categories[1]).toEqual(originalEth);
    });
  });

  describe("Real-World Scenarios", () => {
    it("should handle typical portfolio with mixed exclusions", () => {
      const categories: ProcessedAssetCategory[] = [
        createMockCategory("btc", false, 40),
        createMockCategory("eth", false, 30),
        createMockCategory("stablecoins", true, 20),
        createMockCategory("others", false, 10),
      ];

      const { result } = renderHook(() => useCategoryFilters(categories));

      expect(result.current.includedCategories).toHaveLength(3);
      expect(result.current.excludedCategories).toHaveLength(1);

      const includedIds = result.current.includedCategories.map(cat => cat.id);
      expect(includedIds).toEqual(["btc", "eth", "others"]);

      const excludedIds = result.current.excludedCategories.map(cat => cat.id);
      expect(excludedIds).toEqual(["stablecoins"]);
    });

    it("should handle categories with zero allocation percentages", () => {
      const categories: ProcessedAssetCategory[] = [
        createMockCategory("btc", false, 100),
        createMockCategory("eth", false, 0),
        createMockCategory("stablecoins", true, 0),
      ];

      const { result } = renderHook(() => useCategoryFilters(categories));

      expect(result.current.includedCategories).toHaveLength(2);
      expect(
        result.current.includedCategories.some(cat => cat.id === "eth")
      ).toBe(true);
      expect(result.current.excludedCategories).toHaveLength(1);
    });

    it("should handle large number of categories", () => {
      const categories: ProcessedAssetCategory[] = Array.from(
        { length: 20 },
        (_, i) => createMockCategory(`cat${i}`, i % 2 === 0, 5)
      );

      const { result } = renderHook(() => useCategoryFilters(categories));

      expect(result.current.includedCategories).toHaveLength(10);
      expect(result.current.excludedCategories).toHaveLength(10);
      expect(
        result.current.includedCategories.length +
          result.current.excludedCategories.length
      ).toBe(20);
    });

    it("should handle categories being toggled from included to excluded", () => {
      const { result, rerender } = renderHook(
        ({ cats }) => useCategoryFilters(cats),
        {
          initialProps: {
            cats: [
              createMockCategory("btc", false, 50),
              createMockCategory("eth", false, 50),
            ],
          },
        }
      );

      expect(result.current.includedCategories).toHaveLength(2);
      expect(result.current.excludedCategories).toHaveLength(0);

      rerender({
        cats: [
          createMockCategory("btc", false, 100),
          createMockCategory("eth", true, 0),
        ],
      });

      expect(result.current.includedCategories).toHaveLength(1);
      expect(result.current.excludedCategories).toHaveLength(1);
      expect(result.current.includedCategories[0].id).toBe("btc");
      expect(result.current.excludedCategories[0].id).toBe("eth");
    });
  });

  describe("Return Value Structure", () => {
    it("should return object with includedCategories and excludedCategories", () => {
      const { result } = renderHook(() => useCategoryFilters([]));

      expect(result.current).toHaveProperty("includedCategories");
      expect(result.current).toHaveProperty("excludedCategories");
      expect(Array.isArray(result.current.includedCategories)).toBe(true);
      expect(Array.isArray(result.current.excludedCategories)).toBe(true);
    });

    it("should return consistent structure across different inputs", () => {
      const { result: result1 } = renderHook(() => useCategoryFilters([]));
      const { result: result2 } = renderHook(() =>
        useCategoryFilters([createMockCategory("btc", false, 100)])
      );

      expect(Object.keys(result1.current).sort()).toEqual(
        Object.keys(result2.current).sort()
      );
    });
  });

  describe("Category Count Validation", () => {
    it("should ensure total count equals sum of included and excluded", () => {
      const categories: ProcessedAssetCategory[] = [
        createMockCategory("btc", false, 40),
        createMockCategory("eth", false, 30),
        createMockCategory("stablecoins", true, 20),
        createMockCategory("others", true, 10),
      ];

      const { result } = renderHook(() => useCategoryFilters(categories));

      const totalCount =
        result.current.includedCategories.length +
        result.current.excludedCategories.length;

      expect(totalCount).toBe(categories.length);
    });

    it("should not duplicate categories between included and excluded", () => {
      const categories: ProcessedAssetCategory[] = [
        createMockCategory("btc", false, 50),
        createMockCategory("eth", true, 50),
      ];

      const { result } = renderHook(() => useCategoryFilters(categories));

      const includedIds = new Set(
        result.current.includedCategories.map(cat => cat.id)
      );
      const excludedIds = new Set(
        result.current.excludedCategories.map(cat => cat.id)
      );

      const intersection = [...includedIds].filter(id => excludedIds.has(id));
      expect(intersection).toHaveLength(0);
    });
  });
});
