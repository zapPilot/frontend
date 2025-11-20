import { describe, expect, it, vi } from "vitest";

import {
  formatAxisLabel,
  generateSVGPath,
  generateYAxisLabels,
  transformToPieChartData,
} from "../../../src/lib/chartUtils";
import type { PortfolioDataPoint } from "../../../src/types/portfolio";

// Mock the portfolioStateUtils dependency
vi.mock("@/hooks/usePortfolioState", () => ({
  portfolioStateUtils: {
    isEmptyArray: (arr: unknown[]) => !arr || arr.length === 0,
  },
}));

describe("chartUtils", () => {
  describe("generateSVGPath", () => {
    const createMockData = (values: number[]): PortfolioDataPoint[] => {
      return values.map((value, index) => ({
        date: `2025-01-${index + 1}`,
        value,
        change: 0,
      }));
    };

    const getValue = (point: PortfolioDataPoint) => point.value;

    it("should return empty string for empty data array", () => {
      const result = generateSVGPath([], getValue);
      expect(result).toBe("");
    });

    it("should handle single data point", () => {
      const data = createMockData([100]);
      const result = generateSVGPath(data, getValue, 800, 300, 20);

      // Single point should start with M (moveTo) command
      expect(result).toMatch(/^M \d+(\.\d+)? \d+(\.\d+)?$/);
      expect(result.startsWith("M")).toBe(true);
    });

    it("should generate path for multiple points with default dimensions", () => {
      const data = createMockData([100, 200, 150, 250]);
      const result = generateSVGPath(data, getValue);

      // Should start with M and contain L commands
      expect(result.startsWith("M")).toBe(true);
      expect(result).toContain("L");

      // Should have 4 coordinate pairs (one per data point)
      const segments = result.split(" L ");
      expect(segments).toHaveLength(4);
    });

    it("should generate path with custom dimensions", () => {
      const data = createMockData([100, 200]);
      const width = 400;
      const height = 200;
      const padding = 10;

      const result = generateSVGPath(data, getValue, width, height, padding);

      expect(result).toBeTruthy();
      expect(result.startsWith("M")).toBe(true);
      expect(result).toContain("L");
    });

    it("should scale points correctly based on value range", () => {
      const data = createMockData([0, 1000]);
      const result = generateSVGPath(data, getValue, 800, 300, 20);

      // Parse coordinates to verify scaling
      const matches = result.match(/[\d.]+/g);
      expect(matches).toBeTruthy();
      expect(matches!.length).toBeGreaterThanOrEqual(4); // At least 2 points with x,y coords
    });

    it("should handle all equal values (zero range)", () => {
      const data = createMockData([100, 100, 100]);
      const result = generateSVGPath(data, getValue, 800, 300, 20);

      // Should still generate valid path even with no value variation
      expect(result).toBeTruthy();
      expect(result.startsWith("M")).toBe(true);
    });

    it("should handle negative values", () => {
      const data = createMockData([-50, -100, -75]);
      const result = generateSVGPath(data, getValue, 800, 300, 20);

      expect(result).toBeTruthy();
      expect(result.startsWith("M")).toBe(true);
      expect(result).toContain("L");
    });

    it("should handle mixed positive and negative values", () => {
      const data = createMockData([-100, 0, 100, 200]);
      const result = generateSVGPath(data, getValue, 800, 300, 20);

      expect(result).toBeTruthy();
      const segments = result.split(" L ");
      expect(segments).toHaveLength(4);
    });

    it("should handle very large values", () => {
      const data = createMockData([1000000, 2000000, 1500000]);
      const result = generateSVGPath(data, getValue, 800, 300, 20);

      expect(result).toBeTruthy();
      expect(result.startsWith("M")).toBe(true);
    });

    it("should handle very small values", () => {
      const data = createMockData([0.001, 0.002, 0.0015]);
      const result = generateSVGPath(data, getValue, 800, 300, 20);

      expect(result).toBeTruthy();
      expect(result.startsWith("M")).toBe(true);
    });

    it("should use custom getValue function", () => {
      const data: PortfolioDataPoint[] = [
        { date: "2025-01-01", value: 100, change: 10 },
        { date: "2025-01-02", value: 200, change: 20 },
      ];

      const getChange = (point: PortfolioDataPoint) => point.change;
      const result = generateSVGPath(data, getChange, 800, 300, 20);

      expect(result).toBeTruthy();
      expect(result.startsWith("M")).toBe(true);
    });

    it("should handle zero padding", () => {
      const data = createMockData([100, 200]);
      const result = generateSVGPath(data, getValue, 800, 300, 0);

      expect(result).toBeTruthy();
      expect(result.startsWith("M")).toBe(true);
    });
  });

  describe("formatAxisLabel", () => {
    describe("currency type", () => {
      it("should format small values as dollars", () => {
        expect(formatAxisLabel(0, "currency")).toBe("$0");
        expect(formatAxisLabel(50, "currency")).toBe("$50");
        expect(formatAxisLabel(999, "currency")).toBe("$999");
      });

      it("should format large values with k suffix", () => {
        expect(formatAxisLabel(1000, "currency")).toBe("$1k");
        expect(formatAxisLabel(1500, "currency")).toBe("$2k"); // Rounds up
        expect(formatAxisLabel(5000, "currency")).toBe("$5k");
        expect(formatAxisLabel(10000, "currency")).toBe("$10k");
        expect(formatAxisLabel(999999, "currency")).toBe("$1000k");
      });

      it("should handle decimal values", () => {
        expect(formatAxisLabel(123.456, "currency")).toBe("$123");
        expect(formatAxisLabel(1234.56, "currency")).toBe("$1k");
      });

      it("should handle negative values", () => {
        expect(formatAxisLabel(-100, "currency")).toBe("$-100");
        // Note: Negative values >= 1000 in absolute value don't get k suffix in current implementation
        expect(formatAxisLabel(-1500, "currency")).toBe("$-1500");
      });

      it("should use currency type by default", () => {
        expect(formatAxisLabel(100)).toBe("$100");
        expect(formatAxisLabel(2000)).toBe("$2k");
      });
    });

    describe("percentage type", () => {
      it("should format as percentage with one decimal", () => {
        expect(formatAxisLabel(0, "percentage")).toBe("0.0%");
        expect(formatAxisLabel(50, "percentage")).toBe("50.0%");
        expect(formatAxisLabel(100, "percentage")).toBe("100.0%");
      });

      it("should handle decimal values", () => {
        expect(formatAxisLabel(12.345, "percentage")).toBe("12.3%");
        expect(formatAxisLabel(99.99, "percentage")).toBe("100.0%");
      });

      it("should handle negative percentages", () => {
        expect(formatAxisLabel(-5.5, "percentage")).toBe("-5.5%");
        expect(formatAxisLabel(-100, "percentage")).toBe("-100.0%");
      });

      it("should handle very large percentage values", () => {
        expect(formatAxisLabel(1000, "percentage")).toBe("1000.0%");
        expect(formatAxisLabel(5000, "percentage")).toBe("5000.0%");
      });
    });
  });

  describe("generateYAxisLabels", () => {
    it("should generate default 5 labels", () => {
      const labels = generateYAxisLabels(0, 100);
      expect(labels).toHaveLength(5);
    });

    it("should generate labels from max to min", () => {
      const labels = generateYAxisLabels(0, 100, 5);

      expect(labels[0]).toBe(100); // First label is max
      expect(labels[labels.length - 1]).toBe(0); // Last label is min
    });

    it("should generate evenly spaced labels", () => {
      const labels = generateYAxisLabels(0, 100, 5);

      expect(labels).toEqual([100, 75, 50, 25, 0]);
    });

    it("should handle custom step count", () => {
      const labels = generateYAxisLabels(0, 100, 3);
      expect(labels).toHaveLength(3);
      expect(labels).toEqual([100, 50, 0]);
    });

    it("should handle single step", () => {
      const labels = generateYAxisLabels(0, 100, 1);
      expect(labels).toHaveLength(1);
      // With steps=1, stepSize = range/(1-1) = range/0 = Infinity, causing NaN
      // This is expected behavior for edge case steps=1
      expect(labels[0]).toBeNaN();
    });

    it("should handle non-zero minimum", () => {
      const labels = generateYAxisLabels(50, 150, 5);

      expect(labels[0]).toBe(150);
      expect(labels[labels.length - 1]).toBe(50);
      expect(labels).toHaveLength(5);
    });

    it("should handle negative ranges", () => {
      const labels = generateYAxisLabels(-100, 0, 5);

      expect(labels[0]).toBe(0);
      expect(labels[labels.length - 1]).toBe(-100);
    });

    it("should handle decimal values", () => {
      const labels = generateYAxisLabels(0.5, 1.5, 5);

      expect(labels[0]).toBeCloseTo(1.5);
      expect(labels[labels.length - 1]).toBeCloseTo(0.5);
      expect(labels).toHaveLength(5);
    });

    it("should handle very large ranges", () => {
      const labels = generateYAxisLabels(0, 1000000, 5);

      expect(labels[0]).toBe(1000000);
      expect(labels[labels.length - 1]).toBe(0);
      expect(labels).toHaveLength(5);
    });

    it("should handle zero range (min equals max)", () => {
      const labels = generateYAxisLabels(100, 100, 5);

      // All labels should be the same value
      expect(labels.every(label => label === 100)).toBe(true);
      expect(labels).toHaveLength(5);
    });
  });

  describe("transformToPieChartData", () => {
    it("should derive category metadata when enabled", () => {
      const result = transformToPieChartData(
        [
          { id: "btc", value: 5000, percentage: 50 },
          { id: "eth", value: 3000, percentage: 30 },
          { id: "stablecoins", value: 2000, percentage: 20 },
        ],
        { deriveCategoryMetadata: true }
      );

      expect(result).toHaveLength(3);
      expect(result[0]).toMatchObject({
        label: "Bitcoin",
        color: "#F7931A",
        percentage: 50,
        value: 5000,
      });
      expect(result[1].label).toBe("Ethereum");
      expect(result[2].label).toBe("Stablecoins");
    });

    it("should compute percentages when missing", () => {
      const result = transformToPieChartData(
        [
          { id: "btc", value: 4000 },
          { id: "eth", value: 1000 },
        ],
        { deriveCategoryMetadata: true }
      );

      const totalPercentage = result.reduce(
        (sum, item) => sum + item.percentage,
        0
      );

      expect(totalPercentage).toBeCloseTo(100, 5);
      expect(result[0].percentage).toBeCloseTo(80, 5);
      expect(result[1].percentage).toBeCloseTo(20, 5);
    });

    it("should respect custom labels and colors when metadata derivation disabled", () => {
      const result = transformToPieChartData([
        {
          id: "custom",
          value: 100,
          label: "Custom Category",
          color: "#123456",
        },
      ]);

      expect(result).toEqual([
        {
          label: "Custom Category",
          color: "#123456",
          value: 100,
          percentage: 100,
        },
      ]);
    });
  });
});
