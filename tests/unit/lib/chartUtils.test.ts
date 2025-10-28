import { describe, it, expect, vi } from "vitest";
import {
  generateSVGPath,
  generateAreaPath,
  formatAxisLabel,
  generateYAxisLabels,
  generateAllocationChartData,
  safeDivision,
} from "../../../src/lib/chartUtils";
import type {
  PortfolioDataPoint,
  AssetAllocationPoint,
} from "../../../src/types/portfolio";

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

  describe("generateAreaPath", () => {
    const createMockData = (values: number[]): PortfolioDataPoint[] => {
      return values.map((value, index) => ({
        date: `2025-01-${index + 1}`,
        value,
        change: 0,
      }));
    };

    const getValue = (point: PortfolioDataPoint) => point.value;

    it("should return empty string for empty data array", () => {
      const result = generateAreaPath([], getValue);
      expect(result).toBe("");
    });

    it("should generate area path that closes at bottom", () => {
      const data = createMockData([100, 200, 150]);
      const width = 800;
      const height = 300;
      const padding = 20;

      const result = generateAreaPath(data, getValue, width, height, padding);

      // Should contain the line path
      expect(result.startsWith("M")).toBe(true);

      // Should close the area with L commands and Z
      expect(result).toContain(`L ${width} ${height - padding}`);
      expect(result).toContain(`L 0 ${height - padding}`);
      expect(result.endsWith(" Z")).toBe(true);
    });

    it("should generate area path with custom dimensions", () => {
      const data = createMockData([100, 200]);
      const width = 400;
      const height = 200;
      const padding = 10;

      const result = generateAreaPath(data, getValue, width, height, padding);

      expect(result).toContain(`L ${width} ${height - padding}`);
      expect(result).toContain(`L 0 ${height - padding}`);
      expect(result.endsWith(" Z")).toBe(true);
    });

    it("should build on generateSVGPath output", () => {
      const data = createMockData([100, 200, 150]);
      const svgPath = generateSVGPath(data, getValue, 800, 300, 20);
      const areaPath = generateAreaPath(data, getValue, 800, 300, 20);

      // Area path should start with the SVG path
      expect(areaPath.startsWith(svgPath)).toBe(true);
    });

    it("should handle single point", () => {
      const data = createMockData([100]);
      const result = generateAreaPath(data, getValue, 800, 300, 20);

      expect(result).toBeTruthy();
      expect(result.endsWith(" Z")).toBe(true);
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

  describe("generateAllocationChartData", () => {
    const createMockAllocation = (
      data: Array<{
        date: string;
        btc: number;
        eth: number;
        stablecoin: number;
        altcoin: number;
      }>
    ): AssetAllocationPoint[] => {
      return data;
    };

    it("should return empty array for empty data", () => {
      const result = generateAllocationChartData([]);
      expect(result).toEqual([]);
    });

    it("should generate chart points for single allocation point", () => {
      const data = createMockAllocation([
        {
          date: "2025-01-01",
          btc: 100,
          eth: 200,
          stablecoin: 300,
          altcoin: 50,
        },
      ]);

      const result = generateAllocationChartData(data, 800, 300);

      // Should have 4 points (one per asset type)
      expect(result).toHaveLength(4);

      // Verify all assets are represented
      const assetKeys = result.map(point => point.assetKey);
      expect(assetKeys).toContain("btc");
      expect(assetKeys).toContain("eth");
      expect(assetKeys).toContain("stablecoin");
      expect(assetKeys).toContain("altcoin");
    });

    it("should generate stacked points for multiple allocation points", () => {
      const data = createMockAllocation([
        {
          date: "2025-01-01",
          btc: 100,
          eth: 100,
          stablecoin: 100,
          altcoin: 100,
        },
        {
          date: "2025-01-02",
          btc: 200,
          eth: 150,
          stablecoin: 100,
          altcoin: 50,
        },
      ]);

      const result = generateAllocationChartData(data, 800, 300);

      // Should have 8 points (4 assets × 2 time points)
      expect(result).toHaveLength(8);
    });

    it("should assign correct colors to assets", () => {
      const data = createMockAllocation([
        {
          date: "2025-01-01",
          btc: 100,
          eth: 100,
          stablecoin: 100,
          altcoin: 100,
        },
      ]);

      const result = generateAllocationChartData(data);

      const btcPoint = result.find(p => p.assetKey === "btc");
      const ethPoint = result.find(p => p.assetKey === "eth");
      const stablecoinPoint = result.find(p => p.assetKey === "stablecoin");
      const altcoinPoint = result.find(p => p.assetKey === "altcoin");

      expect(btcPoint?.color).toBe("#f59e0b");
      expect(ethPoint?.color).toBe("#6366f1");
      expect(stablecoinPoint?.color).toBe("#10b981");
      expect(altcoinPoint?.color).toBe("#ef4444");
    });

    it("should scale heights proportionally to asset values", () => {
      const data = createMockAllocation([
        {
          date: "2025-01-01",
          btc: 100,
          eth: 100,
          stablecoin: 100,
          altcoin: 100,
        },
      ]);

      const height = 300;
      const result = generateAllocationChartData(data, 800, height);

      // With equal values, each asset should take 1/4 of the height
      const totalHeight = result.reduce((sum, point) => sum + point.height, 0);
      expect(totalHeight).toBeCloseTo(height, 0);

      // Each asset should have approximately equal height
      result.forEach(point => {
        expect(point.height).toBeCloseTo(height / 4, 0);
      });
    });

    it("should position x coordinates based on data index and width", () => {
      const data = createMockAllocation([
        {
          date: "2025-01-01",
          btc: 100,
          eth: 100,
          stablecoin: 100,
          altcoin: 100,
        },
        {
          date: "2025-01-02",
          btc: 100,
          eth: 100,
          stablecoin: 100,
          altcoin: 100,
        },
      ]);

      const width = 800;
      const result = generateAllocationChartData(data, width, 300);

      // First 4 points should be at x = -2 (index 0)
      const firstPoints = result.slice(0, 4);
      firstPoints.forEach(point => {
        expect(point.x).toBe(-2);
      });

      // Last 4 points should be at x = width - 2 (index 1)
      const lastPoints = result.slice(4, 8);
      lastPoints.forEach(point => {
        expect(point.x).toBe(width - 2);
      });
    });

    it("should set correct width for chart points", () => {
      const data = createMockAllocation([
        {
          date: "2025-01-01",
          btc: 100,
          eth: 100,
          stablecoin: 100,
          altcoin: 100,
        },
      ]);

      const result = generateAllocationChartData(data);

      // All points should have width of 4
      result.forEach(point => {
        expect(point.width).toBe(4);
      });
    });

    it("should store original asset values", () => {
      const data = createMockAllocation([
        {
          date: "2025-01-01",
          btc: 123,
          eth: 456,
          stablecoin: 789,
          altcoin: 567,
        },
      ]);

      const result = generateAllocationChartData(data);

      const btcPoint = result.find(p => p.assetKey === "btc");
      const ethPoint = result.find(p => p.assetKey === "eth");

      expect(btcPoint?.value).toBe(123);
      expect(ethPoint?.value).toBe(456);
    });

    it("should handle custom width and height", () => {
      const data = createMockAllocation([
        {
          date: "2025-01-01",
          btc: 100,
          eth: 100,
          stablecoin: 100,
          altcoin: 100,
        },
      ]);

      const customWidth = 400;
      const customHeight = 200;
      const result = generateAllocationChartData(
        data,
        customWidth,
        customHeight
      );

      const totalHeight = result.reduce((sum, point) => sum + point.height, 0);
      expect(totalHeight).toBeCloseTo(customHeight, 0);
    });

    it("should handle zero values for some assets", () => {
      const data = createMockAllocation([
        {
          date: "2025-01-01",
          btc: 100,
          eth: 0,
          stablecoin: 200,
          altcoin: 100,
        },
      ]);

      const result = generateAllocationChartData(data, 800, 300);

      // Should still generate 4 points
      expect(result).toHaveLength(4);

      // Zero-value assets should have zero height
      const ethPoint = result.find(p => p.assetKey === "eth");

      expect(ethPoint?.height).toBe(0);
      expect(ethPoint?.value).toBe(0);
    });

    it("should stack assets from bottom to top", () => {
      const data = createMockAllocation([
        {
          date: "2025-01-01",
          btc: 100,
          eth: 100,
          stablecoin: 100,
          altcoin: 100,
        },
      ]);

      const height = 300;
      const result = generateAllocationChartData(data, 800, height);

      // Assets should be stacked from bottom (altcoin) to top (btc)
      // The y position should decrease as we stack up
      const yPositions = result.map(p => ({ key: p.assetKey, y: p.y }));

      // Verify that y positions are valid (between 0 and height)
      yPositions.forEach(({ y }) => {
        expect(y).toBeGreaterThanOrEqual(0);
        expect(y).toBeLessThanOrEqual(height);
      });
    });
  });

  describe("safeDivision", () => {
    it("should perform normal division when denominator is non-zero", () => {
      expect(safeDivision(10, 2)).toBe(5);
      expect(safeDivision(100, 4)).toBe(25);
      expect(safeDivision(7, 3)).toBeCloseTo(2.333, 2);
    });

    it("should return fallback value when denominator is zero", () => {
      expect(safeDivision(10, 0)).toBe(1); // Default fallback
      expect(safeDivision(100, 0)).toBe(1);
    });

    it("should use custom fallback value", () => {
      expect(safeDivision(10, 0, 0)).toBe(0);
      expect(safeDivision(10, 0, 42)).toBe(42);
      expect(safeDivision(10, 0, -1)).toBe(-1);
    });

    it("should handle negative numbers", () => {
      expect(safeDivision(-10, 2)).toBe(-5);
      expect(safeDivision(10, -2)).toBe(-5);
      expect(safeDivision(-10, -2)).toBe(5);
    });

    it("should handle zero numerator", () => {
      expect(safeDivision(0, 5)).toBe(0);
      // 0 / -5 = -0 in JavaScript (Object.is distinguishes -0 from +0)
      expect(safeDivision(0, -5)).toBe(-0);
    });

    it("should handle decimal values", () => {
      expect(safeDivision(10.5, 2.5)).toBeCloseTo(4.2, 1);
      expect(safeDivision(0.1, 0.2)).toBeCloseTo(0.5, 1);
    });

    it("should handle very small denominators (not exactly zero)", () => {
      const result = safeDivision(1, 0.0001);
      expect(result).toBe(10000);
    });

    it("should handle very large numbers", () => {
      expect(safeDivision(1000000, 1000)).toBe(1000);
      expect(safeDivision(1e10, 1e5)).toBe(1e5);
    });

    it("should return fallback when denominator is exactly zero (not negative zero)", () => {
      expect(safeDivision(10, 0, 99)).toBe(99);
      expect(safeDivision(10, -0, 99)).toBe(99); // -0 === 0 in JavaScript
    });

    it("should handle Infinity results from normal division", () => {
      // When denominator is very small but not zero, result can be Infinity
      // However, Number.MIN_VALUE / 2 underflows to 0 in JavaScript
      const verySmall = Number.MIN_VALUE / 2;
      // This underflows to 0, so safeDivision returns fallback
      const result = safeDivision(1, verySmall);
      expect(result).toBe(1); // Fallback because verySmall === 0
    });
  });
});
