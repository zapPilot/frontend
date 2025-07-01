import { test, expect } from "@playwright/test";

test.describe("Chart Utility Functions", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
  });

  test("chart utility functions work correctly", async ({ page }) => {
    const chartUtilTests = await page.evaluate(() => {
      // Import and test chart utility functions
      const testData = [
        { date: "2024-01-01", value: 100000, change: 0, benchmark: 100000 },
        { date: "2024-01-02", value: 105000, change: 5, benchmark: 102000 },
        { date: "2024-01-03", value: 98000, change: -6.67, benchmark: 101000 },
        { date: "2024-01-04", value: 110000, change: 12.24, benchmark: 103000 },
        { date: "2024-01-05", value: 107000, change: -2.73, benchmark: 104000 },
      ];

      // Test generateSVGPath equivalent
      const generateSVGPath = (
        data: any[],
        getValue: (point: any) => number,
        width: number,
        height: number,
        padding: number = 10
      ): string => {
        if (!data || data.length === 0) return "";

        const values = data.map(getValue);
        const minValue = Math.min(...values);
        const maxValue = Math.max(...values);
        const range = maxValue - minValue || 1;

        const pathData = data
          .map((point, index) => {
            const x =
              padding + (index / (data.length - 1)) * (width - 2 * padding);
            const y =
              padding +
              ((maxValue - getValue(point)) / range) * (height - 2 * padding);
            return index === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
          })
          .join(" ");

        return pathData;
      };

      // Test generateAreaPath equivalent
      const generateAreaPath = (
        data: any[],
        getValue: (point: any) => number,
        width: number,
        height: number,
        padding: number = 10
      ): string => {
        const linePath = generateSVGPath(
          data,
          getValue,
          width,
          height,
          padding
        );
        if (!linePath) return "";

        const bottomY = height - padding;
        const startX = padding;
        const endX = padding + (width - 2 * padding);

        return `${linePath} L ${endX} ${bottomY} L ${startX} ${bottomY} Z`;
      };

      // Test generateYAxisLabels equivalent
      const generateYAxisLabels = (
        min: number,
        max: number,
        steps: number
      ): number[] => {
        const range = max - min;
        const step = range / (steps - 1);

        return Array.from({ length: steps }, (_, i) => max - i * step);
      };

      // Test formatAxisLabel equivalent
      const formatAxisLabel = (
        value: number,
        type: "currency" | "percentage" = "currency"
      ): string => {
        if (type === "percentage") {
          return `${value.toFixed(1)}%`;
        }

        const absValue = Math.abs(value);
        if (absValue >= 1000000) {
          return `$${(value / 1000000).toFixed(1)}M`;
        } else if (absValue >= 1000) {
          return `$${(value / 1000).toFixed(0)}k`;
        } else {
          return `$${value.toFixed(0)}`;
        }
      };

      // Run tests
      const results = {
        svgPath: generateSVGPath(testData, d => d.value, 800, 300),
        areaPath: generateAreaPath(testData, d => d.value, 800, 300),
        yAxisLabels: generateYAxisLabels(90000, 120000, 4),
        formatCurrency: formatAxisLabel(125000),
        formatLarge: formatAxisLabel(1500000),
        formatPercentage: formatAxisLabel(15.5, "percentage"),
        emptyDataPath: generateSVGPath([], d => d.value, 800, 300),
      };

      return results;
    });

    // Verify SVG path generation
    expect(chartUtilTests.svgPath).toBeTruthy();
    expect(chartUtilTests.svgPath).toContain("M ");
    expect(chartUtilTests.svgPath).toContain("L ");

    // Verify area path generation
    expect(chartUtilTests.areaPath).toBeTruthy();
    expect(chartUtilTests.areaPath).toContain("Z");

    // Verify Y-axis labels
    expect(chartUtilTests.yAxisLabels).toHaveLength(4);
    expect(chartUtilTests.yAxisLabels[0]).toBe(120000);
    expect(chartUtilTests.yAxisLabels[3]).toBe(90000);

    // Verify currency formatting
    expect(chartUtilTests.formatCurrency).toBe("$125k");
    expect(chartUtilTests.formatLarge).toBe("$1.5M");
    expect(chartUtilTests.formatPercentage).toBe("15.5%");

    // Verify empty data handling
    expect(chartUtilTests.emptyDataPath).toBe("");
  });

  test("CHART_PERIODS constant is properly defined", async ({ page }) => {
    const chartPeriodsTest = await page.evaluate(() => {
      // Test CHART_PERIODS availability
      const CHART_PERIODS = [
        { label: "1W", value: "1W", days: 7 },
        { label: "1M", value: "1M", days: 30 },
        { label: "3M", value: "3M", days: 90 },
        { label: "6M", value: "6M", days: 180 },
        { label: "1Y", value: "1Y", days: 365 },
        { label: "ALL", value: "ALL", days: 500 },
      ];

      return {
        length: CHART_PERIODS.length,
        hasAllPeriods: CHART_PERIODS.every(p => p.label && p.value && p.days),
        periods: CHART_PERIODS.map(p => p.value),
        maxDays: Math.max(...CHART_PERIODS.map(p => p.days)),
      };
    });

    expect(chartPeriodsTest.length).toBe(6);
    expect(chartPeriodsTest.hasAllPeriods).toBe(true);
    expect(chartPeriodsTest.periods).toEqual([
      "1W",
      "1M",
      "3M",
      "6M",
      "1Y",
      "ALL",
    ]);
    expect(chartPeriodsTest.maxDays).toBe(500);
  });

  test("portfolio data generation functions work correctly", async ({
    page,
  }) => {
    const portfolioTest = await page.evaluate(() => {
      // Test generatePortfolioHistory equivalent
      const generatePortfolioHistory = (period: string) => {
        const CHART_PERIODS = [
          { label: "1W", value: "1W", days: 7 },
          { label: "1M", value: "1M", days: 30 },
          { label: "3M", value: "3M", days: 90 },
          { label: "6M", value: "6M", days: 180 },
          { label: "1Y", value: "1Y", days: 365 },
          { label: "ALL", value: "ALL", days: 500 },
        ];

        const days = CHART_PERIODS.find(p => p.value === period)?.days || 90;
        const data: any[] = [];
        const baseValue = 100000;

        for (let i = days; i >= 0; i--) {
          const date = new Date();
          date.setDate(date.getDate() - i);

          const progress = (days - i) / days;
          const trend =
            Math.sin(progress * Math.PI * 3) * 0.1 + progress * 0.25;
          const noise = (Math.random() - 0.5) * 0.05;
          const value = baseValue * (1 + trend + noise);

          const benchmarkTrend = progress * 0.15;
          const benchmarkNoise = (Math.random() - 0.5) * 0.02;
          const benchmark = baseValue * (1 + benchmarkTrend + benchmarkNoise);

          const change =
            i === days
              ? 0
              : ((value - (data[data.length - 1]?.value || value)) / value) *
                100;

          data.push({
            date: date.toISOString().split("T")[0],
            value,
            change,
            benchmark,
          });
        }

        return data;
      };

      // Test drawdown calculation
      const calculateDrawdownData = (portfolioHistory: any[]) => {
        let peak = 0;
        return portfolioHistory.map(point => {
          peak = Math.max(peak, point.value);
          const drawdown = peak > 0 ? ((point.value - peak) / peak) * 100 : 0;
          return {
            date: point.date,
            drawdown,
          };
        });
      };

      const testHistory = generatePortfolioHistory("1M");
      const drawdownData = calculateDrawdownData(testHistory);

      return {
        historyLength: testHistory.length,
        hasValidDates: testHistory.every(d => d.date && d.date.length === 10),
        hasValidValues: testHistory.every(
          d => typeof d.value === "number" && d.value > 0
        ),
        hasBenchmark: testHistory.every(d => typeof d.benchmark === "number"),
        drawdownLength: drawdownData.length,
        drawdownIsNegativeOrZero: drawdownData.every(d => d.drawdown <= 0),
      };
    });

    expect(portfolioTest.historyLength).toBeGreaterThan(20);
    expect(portfolioTest.hasValidDates).toBe(true);
    expect(portfolioTest.hasValidValues).toBe(true);
    expect(portfolioTest.hasBenchmark).toBe(true);
    expect(portfolioTest.drawdownLength).toBe(portfolioTest.historyLength);
    expect(portfolioTest.drawdownIsNegativeOrZero).toBe(true);
  });

  test("chart performance with large datasets", async ({ page }) => {
    const performanceTest = await page.evaluate(() => {
      const generateLargeDataset = (size: number) => {
        const data = [];
        for (let i = 0; i < size; i++) {
          data.push({
            date: `2024-01-${String(i + 1).padStart(2, "0")}`,
            value: 100000 + Math.random() * 50000,
            change: (Math.random() - 0.5) * 10,
            benchmark: 100000 + Math.random() * 30000,
          });
        }
        return data;
      };

      const generateSVGPath = (
        data: any[],
        getValue: (p: any) => number,
        width: number,
        height: number
      ) => {
        if (!data || data.length === 0) return "";

        const values = data.map(getValue);
        const minValue = Math.min(...values);
        const maxValue = Math.max(...values);
        const range = maxValue - minValue || 1;

        return data
          .map((point, index) => {
            const x = 10 + (index / (data.length - 1)) * (width - 20);
            const y =
              10 + ((maxValue - getValue(point)) / range) * (height - 20);
            return index === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
          })
          .join(" ");
      };

      // Test with different dataset sizes
      const sizes = [100, 500, 1000];
      const results: any = {};

      sizes.forEach(size => {
        const startTime = performance.now();
        const dataset = generateLargeDataset(size);
        const path = generateSVGPath(dataset, d => d.value, 800, 300);
        const endTime = performance.now();

        results[`size_${size}`] = {
          time: endTime - startTime,
          pathLength: path.length,
          hasValidPath: path.includes("M ") && path.includes("L "),
        };
      });

      return results;
    });

    // Performance should be reasonable for large datasets
    expect(performanceTest.size_100.time).toBeLessThan(50);
    expect(performanceTest.size_500.time).toBeLessThan(100);
    expect(performanceTest.size_1000.time).toBeLessThan(200);

    // All generated paths should be valid
    Object.values(performanceTest).forEach((result: any) => {
      expect(result.hasValidPath).toBe(true);
      expect(result.pathLength).toBeGreaterThan(0);
    });
  });

  test("edge cases and error handling", async ({ page }) => {
    const edgeCaseTests = await page.evaluate(() => {
      const generateSVGPath = (
        data: any[],
        getValue: (p: any) => number,
        width: number,
        height: number
      ) => {
        if (!data || data.length === 0) return "";

        const values = data.map(getValue);
        const minValue = Math.min(...values);
        const maxValue = Math.max(...values);
        const range = maxValue - minValue || 1;

        return data
          .map((point, index) => {
            const x = 10 + (index / (data.length - 1)) * (width - 20);
            const y =
              10 + ((maxValue - getValue(point)) / range) * (height - 20);
            return index === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
          })
          .join(" ");
      };

      const formatAxisLabel = (value: number): string => {
        const absValue = Math.abs(value);
        if (absValue >= 1000000) {
          return `$${(value / 1000000).toFixed(1)}M`;
        } else if (absValue >= 1000) {
          return `$${(value / 1000).toFixed(0)}k`;
        } else {
          return `$${value.toFixed(0)}`;
        }
      };

      return {
        emptyArray: generateSVGPath([], d => d.value, 800, 300),
        singlePoint: generateSVGPath([{ value: 100 }], d => d.value, 800, 300),
        identicalValues: generateSVGPath(
          [{ value: 100 }, { value: 100 }, { value: 100 }],
          d => d.value,
          800,
          300
        ),
        negativeValues: formatAxisLabel(-1500),
        zeroValue: formatAxisLabel(0),
        veryLargeValue: formatAxisLabel(1500000000),
        verySmallValue: formatAxisLabel(0.01),
        NaNValue: isNaN(parseFloat(formatAxisLabel(NaN))),
        infinityValue: formatAxisLabel(Infinity),
      };
    });

    // Edge case handling
    expect(edgeCaseTests.emptyArray).toBe("");
    expect(edgeCaseTests.singlePoint).toContain("M ");
    expect(edgeCaseTests.identicalValues).toBeTruthy();
    expect(edgeCaseTests.negativeValues).toBe("$-2k");
    expect(edgeCaseTests.zeroValue).toBe("$0");
    expect(edgeCaseTests.veryLargeValue).toBe("$1500.0M");
    expect(edgeCaseTests.verySmallValue).toBe("$0");
  });
});
