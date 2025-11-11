import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useChartDataTransforms } from "@/components/PortfolioAllocation/hooks/useChartDataTransforms";
import { ChartDataPoint } from "@/components/PortfolioAllocation/types";
import * as chartUtils from "@/lib/chartUtils";
import { PieChartData } from "@/types/portfolio";

// Mock the chartUtils module
vi.mock("@/lib/chartUtils", () => ({
  transformToPieChartData: vi.fn(),
}));

describe("useChartDataTransforms", () => {
  const mockChartData: ChartDataPoint[] = [
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
      value: 30,
      color: "#627EEA",
      isExcluded: false,
    },
    {
      id: "stablecoins",
      name: "Stablecoins",
      value: 20,
      color: "#26A17B",
      isExcluded: false,
    },
  ];

  const mockPieChartData: PieChartData[] = [
    {
      label: "Bitcoin",
      value: 50,
      percentage: 50,
      color: "#F7931A",
    },
    {
      label: "Ethereum",
      value: 30,
      percentage: 30,
      color: "#627EEA",
    },
    {
      label: "Stablecoins",
      value: 20,
      percentage: 20,
      color: "#26A17B",
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(chartUtils.transformToPieChartData).mockReturnValue(
      mockPieChartData
    );
  });

  describe("Data Transformation", () => {
    it("should transform chart data to pie chart format", () => {
      const { result } = renderHook(() =>
        useChartDataTransforms(mockChartData)
      );

      expect(result.current).toEqual(mockPieChartData);
    });

    it("should call transformToPieChartData with correct parameters", () => {
      renderHook(() => useChartDataTransforms(mockChartData));

      expect(chartUtils.transformToPieChartData).toHaveBeenCalledWith(
        [
          {
            id: "btc",
            label: "Bitcoin",
            value: 50,
            percentage: 50,
            color: "#F7931A",
          },
          {
            id: "eth",
            label: "Ethereum",
            value: 30,
            percentage: 30,
            color: "#627EEA",
          },
          {
            id: "stablecoins",
            label: "Stablecoins",
            value: 20,
            percentage: 20,
            color: "#26A17B",
          },
        ],
        { deriveCategoryMetadata: false }
      );
    });

    it("should map ChartDataPoint fields to transform input correctly", () => {
      renderHook(() => useChartDataTransforms(mockChartData));

      const callArg = vi.mocked(chartUtils.transformToPieChartData).mock
        .calls[0][0];

      expect(callArg[0]).toMatchObject({
        id: "btc",
        label: "Bitcoin",
        value: 50,
        percentage: 50,
        color: "#F7931A",
      });
    });

    it("should pass deriveCategoryMetadata as false", () => {
      renderHook(() => useChartDataTransforms(mockChartData));

      const options = vi.mocked(chartUtils.transformToPieChartData).mock
        .calls[0][1];

      expect(options).toEqual({ deriveCategoryMetadata: false });
    });
  });

  describe("Memoization Behavior", () => {
    it("should memoize result when input doesn't change", () => {
      const { result, rerender } = renderHook(() =>
        useChartDataTransforms(mockChartData)
      );

      const firstResult = result.current;

      rerender();

      expect(result.current).toBe(firstResult);
      expect(chartUtils.transformToPieChartData).toHaveBeenCalledTimes(1);
    });

    it("should recalculate when chart data changes", () => {
      const { rerender } = renderHook(
        ({ data }) => useChartDataTransforms(data),
        {
          initialProps: { data: mockChartData },
        }
      );

      const newData: ChartDataPoint[] = [
        ...mockChartData,
        {
          id: "others",
          name: "Others",
          value: 10,
          color: "#888888",
          isExcluded: false,
        },
      ];

      rerender({ data: newData });

      expect(chartUtils.transformToPieChartData).toHaveBeenCalledTimes(2);
    });

    it("should recalculate when data values change", () => {
      const { rerender } = renderHook(
        ({ data }) => useChartDataTransforms(data),
        {
          initialProps: { data: mockChartData },
        }
      );

      const updatedData: ChartDataPoint[] = mockChartData.map(item =>
        item.id === "btc" ? { ...item, value: 60 } : item
      );

      rerender({ data: updatedData });

      expect(chartUtils.transformToPieChartData).toHaveBeenCalledTimes(2);
    });

    it("should recalculate when data colors change", () => {
      const { rerender } = renderHook(
        ({ data }) => useChartDataTransforms(data),
        {
          initialProps: { data: mockChartData },
        }
      );

      const updatedData: ChartDataPoint[] = mockChartData.map(item =>
        item.id === "btc" ? { ...item, color: "#FFFFFF" } : item
      );

      rerender({ data: updatedData });

      expect(chartUtils.transformToPieChartData).toHaveBeenCalledTimes(2);
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty chart data array", () => {
      renderHook(() => useChartDataTransforms([]));

      expect(chartUtils.transformToPieChartData).toHaveBeenCalledWith([], {
        deriveCategoryMetadata: false,
      });
    });

    it("should handle single data point", () => {
      const singleData: ChartDataPoint[] = [mockChartData[0]];

      renderHook(() => useChartDataTransforms(singleData));

      expect(chartUtils.transformToPieChartData).toHaveBeenCalledWith(
        [
          {
            id: "btc",
            label: "Bitcoin",
            value: 50,
            percentage: 50,
            color: "#F7931A",
          },
        ],
        { deriveCategoryMetadata: false }
      );
    });

    it("should handle data points with zero values", () => {
      const dataWithZero: ChartDataPoint[] = [
        mockChartData[0],
        { ...mockChartData[1], value: 0 },
      ];

      renderHook(() => useChartDataTransforms(dataWithZero));

      const callArg = vi.mocked(chartUtils.transformToPieChartData).mock
        .calls[0][0];

      expect(callArg[1]).toMatchObject({
        value: 0,
        percentage: 0,
      });
    });

    it("should handle data points with very large values", () => {
      const largeValueData: ChartDataPoint[] = [
        { ...mockChartData[0], value: 1000000 },
      ];

      renderHook(() => useChartDataTransforms(largeValueData));

      const callArg = vi.mocked(chartUtils.transformToPieChartData).mock
        .calls[0][0];

      expect(callArg[0].value).toBe(1000000);
      expect(callArg[0].percentage).toBe(1000000);
    });

    it("should handle data points with fractional values", () => {
      const fractionalData: ChartDataPoint[] = [
        { ...mockChartData[0], value: 33.333 },
        { ...mockChartData[1], value: 33.333 },
        { ...mockChartData[2], value: 33.334 },
      ];

      renderHook(() => useChartDataTransforms(fractionalData));

      const callArg = vi.mocked(chartUtils.transformToPieChartData).mock
        .calls[0][0];

      expect(callArg[0].value).toBe(33.333);
      expect(callArg[1].value).toBe(33.333);
      expect(callArg[2].value).toBe(33.334);
    });
  });

  describe("Field Mapping", () => {
    it("should map id field correctly", () => {
      renderHook(() => useChartDataTransforms(mockChartData));

      const callArg = vi.mocked(chartUtils.transformToPieChartData).mock
        .calls[0][0];

      expect(callArg[0].id).toBe("btc");
      expect(callArg[1].id).toBe("eth");
      expect(callArg[2].id).toBe("stablecoins");
    });

    it("should map name to label correctly", () => {
      renderHook(() => useChartDataTransforms(mockChartData));

      const callArg = vi.mocked(chartUtils.transformToPieChartData).mock
        .calls[0][0];

      expect(callArg[0].label).toBe("Bitcoin");
      expect(callArg[1].label).toBe("Ethereum");
      expect(callArg[2].label).toBe("Stablecoins");
    });

    it("should map value to both value and percentage", () => {
      renderHook(() => useChartDataTransforms(mockChartData));

      const callArg = vi.mocked(chartUtils.transformToPieChartData).mock
        .calls[0][0];

      for (const [index, item] of callArg.entries()) {
        expect(item.value).toBe(mockChartData[index].value);
        expect(item.percentage).toBe(mockChartData[index].value);
      }
    });

    it("should preserve color values", () => {
      renderHook(() => useChartDataTransforms(mockChartData));

      const callArg = vi.mocked(chartUtils.transformToPieChartData).mock
        .calls[0][0];

      expect(callArg[0].color).toBe("#F7931A");
      expect(callArg[1].color).toBe("#627EEA");
      expect(callArg[2].color).toBe("#26A17B");
    });

    it("should not include isExcluded field in transform input", () => {
      renderHook(() => useChartDataTransforms(mockChartData));

      const callArg = vi.mocked(chartUtils.transformToPieChartData).mock
        .calls[0][0];

      expect(callArg[0]).not.toHaveProperty("isExcluded");
    });
  });

  describe("Return Value", () => {
    it("should return array of PieChartData", () => {
      const { result } = renderHook(() =>
        useChartDataTransforms(mockChartData)
      );

      expect(Array.isArray(result.current)).toBe(true);
      expect(result.current).toHaveLength(3);
    });

    it("should return PieChartData with correct structure", () => {
      const { result } = renderHook(() =>
        useChartDataTransforms(mockChartData)
      );

      for (const item of result.current) {
        expect(item).toHaveProperty("label");
        expect(item).toHaveProperty("value");
        expect(item).toHaveProperty("percentage");
        expect(item).toHaveProperty("color");
      }
    });

    it("should preserve data returned from transformToPieChartData", () => {
      const customPieData: PieChartData[] = [
        { label: "Custom", value: 100, percentage: 100, color: "#FFF" },
      ];

      vi.mocked(chartUtils.transformToPieChartData).mockReturnValue(
        customPieData
      );

      const { result } = renderHook(() =>
        useChartDataTransforms(mockChartData)
      );

      expect(result.current).toBe(customPieData);
    });
  });

  describe("Real-World Scenarios", () => {
    it("should handle typical portfolio with three categories", () => {
      const { result } = renderHook(() =>
        useChartDataTransforms(mockChartData)
      );

      expect(result.current).toHaveLength(3);
      expect(chartUtils.transformToPieChartData).toHaveBeenCalledTimes(1);
    });

    it("should handle portfolio with all equal allocations", () => {
      const equalData: ChartDataPoint[] = [
        { ...mockChartData[0], value: 33.33 },
        { ...mockChartData[1], value: 33.33 },
        { ...mockChartData[2], value: 33.34 },
      ];

      renderHook(() => useChartDataTransforms(equalData));

      const callArg = vi.mocked(chartUtils.transformToPieChartData).mock
        .calls[0][0];

      expect(callArg[0].value).toBe(33.33);
      expect(callArg[1].value).toBe(33.33);
      expect(callArg[2].value).toBe(33.34);
    });

    it("should handle portfolio with dominant single category", () => {
      const dominantData: ChartDataPoint[] = [
        { ...mockChartData[0], value: 90 },
        { ...mockChartData[1], value: 5 },
        { ...mockChartData[2], value: 5 },
      ];

      renderHook(() => useChartDataTransforms(dominantData));

      const callArg = vi.mocked(chartUtils.transformToPieChartData).mock
        .calls[0][0];

      expect(callArg[0].value).toBe(90);
    });

    it("should handle many categories", () => {
      const manyCategories: ChartDataPoint[] = Array.from(
        { length: 10 },
        (_, i) => ({
          id: `cat${i}`,
          name: `Category ${i}`,
          value: 10,
          color: `#${i}${i}${i}${i}${i}${i}`,
          isExcluded: false,
        })
      );

      renderHook(() => useChartDataTransforms(manyCategories));

      const callArg = vi.mocked(chartUtils.transformToPieChartData).mock
        .calls[0][0];

      expect(callArg).toHaveLength(10);
    });
  });

  describe("Data Update Scenarios", () => {
    it("should update when removing a category", () => {
      const { rerender } = renderHook(
        ({ data }) => useChartDataTransforms(data),
        {
          initialProps: { data: mockChartData },
        }
      );

      const reducedData = mockChartData.slice(0, 2);

      rerender({ data: reducedData });

      expect(chartUtils.transformToPieChartData).toHaveBeenCalledTimes(2);

      const callArg = vi.mocked(chartUtils.transformToPieChartData).mock
        .calls[1][0];

      expect(callArg).toHaveLength(2);
    });

    it("should update when adding a category", () => {
      const { rerender } = renderHook(
        ({ data }) => useChartDataTransforms(data),
        {
          initialProps: { data: mockChartData },
        }
      );

      const expandedData: ChartDataPoint[] = [
        ...mockChartData,
        {
          id: "others",
          name: "Others",
          value: 15,
          color: "#888888",
          isExcluded: false,
        },
      ];

      rerender({ data: expandedData });

      expect(chartUtils.transformToPieChartData).toHaveBeenCalledTimes(2);

      const callArg = vi.mocked(chartUtils.transformToPieChartData).mock
        .calls[1][0];

      expect(callArg).toHaveLength(4);
    });

    it("should update when reordering categories", () => {
      const { rerender } = renderHook(
        ({ data }) => useChartDataTransforms(data),
        {
          initialProps: { data: mockChartData },
        }
      );

      const reorderedData = [
        mockChartData[2],
        mockChartData[0],
        mockChartData[1],
      ];

      rerender({ data: reorderedData });

      expect(chartUtils.transformToPieChartData).toHaveBeenCalledTimes(2);

      const callArg = vi.mocked(chartUtils.transformToPieChartData).mock
        .calls[1][0];

      expect(callArg[0].id).toBe("stablecoins");
      expect(callArg[1].id).toBe("btc");
      expect(callArg[2].id).toBe("eth");
    });
  });

  describe("Consistency Tests", () => {
    it("should maintain consistent mapping across multiple renders", () => {
      const { rerender } = renderHook(() =>
        useChartDataTransforms(mockChartData)
      );

      const firstCall = vi.mocked(chartUtils.transformToPieChartData).mock
        .calls[0][0];

      rerender();

      // Should not call again due to memoization
      expect(chartUtils.transformToPieChartData).toHaveBeenCalledTimes(1);

      // But if it did call, the mapping should be identical
      expect(firstCall[0]).toMatchObject({
        id: "btc",
        label: "Bitcoin",
        value: 50,
        percentage: 50,
      });
    });

    it("should always set deriveCategoryMetadata to false", () => {
      const { rerender } = renderHook(
        ({ data }) => useChartDataTransforms(data),
        {
          initialProps: { data: mockChartData },
        }
      );

      rerender({ data: [mockChartData[0]] });
      rerender({ data: mockChartData });

      const calls = vi.mocked(chartUtils.transformToPieChartData).mock.calls;

      for (const call of calls) {
        expect(call[1]).toEqual({ deriveCategoryMetadata: false });
      }
    });
  });
});
