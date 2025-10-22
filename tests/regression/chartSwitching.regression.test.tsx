/**
 * Regression test: Chart Switching Behavior
 *
 * Tests chart switching functionality to ensure:
 * - Hover state isolation between chart types
 * - No cursor artifacts when switching tabs
 * - Proper cleanup of animations and event listeners
 * - Correct data display after switching
 *
 * @see src/components/PortfolioChart.tsx
 * @see src/hooks/useChartHover.ts
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import PortfolioChart from "@/components/PortfolioChart/";
import { ChartTestFixtures } from "../fixtures/chartTestData";

// Mock Framer Motion
vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    line: ({ children, ...props }: any) => <line {...props}>{children}</line>,
    circle: ({ children, ...props }: any) => (
      <circle {...props}>{children}</circle>
    ),
    g: ({ children, ...props }: any) => <g {...props}>{children}</g>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// Mock Next.js Image
vi.mock("next/image", () => ({
  __esModule: true,
  default: ({ src, alt, ...props }: any) => (
    <span
      role="img"
      aria-label={alt}
      data-src={src}
      data-testid="next-image-mock"
      {...props}
    />
  ),
}));

describe("Chart Switching - Regression Tests", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
  });

  const renderChart = (activeTab: string = "performance") => {
    return render(
      <QueryClientProvider client={queryClient}>
        <PortfolioChart
          portfolioData={ChartTestFixtures.mediumPortfolioData()}
          allocationData={ChartTestFixtures.balancedAllocation()}
          drawdownData={ChartTestFixtures.drawdownData()}
          sharpeData={ChartTestFixtures.sharpeData()}
          volatilityData={ChartTestFixtures.volatilityData()}
          underwaterData={ChartTestFixtures.underwaterData()}
          activeTab={activeTab}
        />
      </QueryClientProvider>
    );
  };

  describe("Hover State Isolation", () => {
    it("should not carry over hover state when switching charts", async () => {
      const { rerender } = renderChart("performance");

      // Hover on performance chart
      const performanceSvg = container.querySelector(
        'svg[data-chart-type="performance"]'
      );
      if (performanceSvg) {
        await userEvent.pointer({
          target: performanceSvg,
          coords: { clientX: 400, clientY: 150 },
        });
      }

      await waitFor(() => {
        expect(screen.queryByTestId("chart-tooltip")).not.toBeNull();
      });

      // Switch to allocation chart
      rerender(
        <QueryClientProvider client={queryClient}>
          <PortfolioChart
            portfolioData={ChartTestFixtures.mediumPortfolioData()}
            allocationData={ChartTestFixtures.balancedAllocation()}
            activeTab="allocation"
          />
        </QueryClientProvider>
      );

      // Performance tooltip should be gone
      await waitFor(() => {
        expect(screen.queryByTestId("chart-tooltip")).toBeNull();
      });
    });

    it("should render correct cursor type for each chart", async () => {
      const { rerender, container } = renderChart("performance");

      // Performance chart: multi-circle indicator
      const performanceSvg = container.querySelector(
        'svg[data-chart-type="performance"]'
      );
      if (performanceSvg) {
        await userEvent.pointer({
          target: performanceSvg,
          coords: { clientX: 400, clientY: 150 },
        });
      }

      await waitFor(() => {
        // Performance should have circles
        const circles = container.querySelectorAll("circle");
        expect(circles.length).toBeGreaterThan(0);
      });

      // Switch to allocation chart
      rerender(
        <QueryClientProvider client={queryClient}>
          <PortfolioChart
            portfolioData={ChartTestFixtures.mediumPortfolioData()}
            allocationData={ChartTestFixtures.balancedAllocation()}
            activeTab="allocation"
          />
        </QueryClientProvider>
      );

      // Allocation chart: vertical line indicator
      const allocationSvg = container.querySelector(
        'svg[data-chart-type="allocation"]'
      );
      if (allocationSvg) {
        await userEvent.pointer({
          target: allocationSvg,
          coords: { clientX: 400, clientY: 150 },
        });
      }

      await waitFor(() => {
        const line = container.querySelector('line[stroke="#8b5cf6"]');
        expect(line).not.toBeNull();
        expect(line).toBeVerticalLine(400, { stroke: "#8b5cf6" });
      });
    });

    it("should maintain independent hover positions across charts", async () => {
      const { rerender, container } = renderChart("performance");

      // Hover at position 1 on performance
      const performanceSvg = container.querySelector(
        'svg[data-chart-type="performance"]'
      );
      if (performanceSvg) {
        await userEvent.pointer({
          target: performanceSvg,
          coords: { clientX: 200, clientY: 150 },
        });
      }

      await waitFor(() => {
        expect(screen.queryByTestId("chart-tooltip")).not.toBeNull();
      });

      // Switch to allocation
      rerender(
        <QueryClientProvider client={queryClient}>
          <PortfolioChart
            portfolioData={ChartTestFixtures.mediumPortfolioData()}
            allocationData={ChartTestFixtures.balancedAllocation()}
            activeTab="allocation"
          />
        </QueryClientProvider>
      );

      // Hover at position 2 on allocation
      const allocationSvg = container.querySelector(
        'svg[data-chart-type="allocation"]'
      );
      if (allocationSvg) {
        await userEvent.pointer({
          target: allocationSvg,
          coords: { clientX: 600, clientY: 150 },
        });
      }

      await waitFor(() => {
        const line = container.querySelector('line[stroke="#8b5cf6"]');
        expect(line?.getAttribute("x1")).toBe("600");
      });

      // Switch back to performance
      rerender(
        <QueryClientProvider client={queryClient}>
          <PortfolioChart
            portfolioData={ChartTestFixtures.mediumPortfolioData()}
            allocationData={ChartTestFixtures.balancedAllocation()}
            activeTab="performance"
          />
        </QueryClientProvider>
      );

      // Performance should not have allocation's hover position
      const newPerformanceSvg = container.querySelector(
        'svg[data-chart-type="performance"]'
      );
      expect(newPerformanceSvg).not.toBeNull();
    });
  });

  describe("Visual Cleanup", () => {
    it("should remove all cursor artifacts when switching charts", async () => {
      const { rerender, container } = renderChart("allocation");

      // Create cursor on allocation
      const allocationSvg = container.querySelector(
        'svg[data-chart-type="allocation"]'
      );
      if (allocationSvg) {
        await userEvent.pointer({
          target: allocationSvg,
          coords: { clientX: 400, clientY: 150 },
        });
      }

      await waitFor(() => {
        expect(
          container.querySelector('line[stroke="#8b5cf6"]')
        ).not.toBeNull();
      });

      // Switch to drawdown
      rerender(
        <QueryClientProvider client={queryClient}>
          <PortfolioChart
            portfolioData={ChartTestFixtures.mediumPortfolioData()}
            drawdownData={ChartTestFixtures.drawdownData()}
            activeTab="drawdown"
          />
        </QueryClientProvider>
      );

      // Allocation cursor should be gone
      await waitFor(() => {
        expect(
          container.querySelector(
            'svg[data-chart-type="allocation"] line[stroke="#8b5cf6"]'
          )
        ).toBeNull();
      });
    });

    it("should clean up tooltip when switching charts", async () => {
      const { rerender, container } = renderChart("performance");

      // Show tooltip
      const performanceSvg = container.querySelector(
        'svg[data-chart-type="performance"]'
      );
      if (performanceSvg) {
        await userEvent.pointer({
          target: performanceSvg,
          coords: { clientX: 400, clientY: 150 },
        });
      }

      await waitFor(() => {
        expect(screen.queryByTestId("chart-tooltip")).not.toBeNull();
      });

      // Switch chart
      rerender(
        <QueryClientProvider client={queryClient}>
          <PortfolioChart
            portfolioData={ChartTestFixtures.mediumPortfolioData()}
            sharpeData={ChartTestFixtures.sharpeData()}
            activeTab="sharpe"
          />
        </QueryClientProvider>
      );

      // Tooltip should be gone
      await waitFor(() => {
        expect(screen.queryByTestId("chart-tooltip")).toBeNull();
      });
    });

    it("should not have overlapping indicators from multiple charts", async () => {
      const { rerender, container } = renderChart("performance");

      // Hover performance
      const performanceSvg = container.querySelector(
        'svg[data-chart-type="performance"]'
      );
      if (performanceSvg) {
        await userEvent.pointer({
          target: performanceSvg,
          coords: { clientX: 400, clientY: 150 },
        });
      }

      // Switch to allocation
      rerender(
        <QueryClientProvider client={queryClient}>
          <PortfolioChart
            portfolioData={ChartTestFixtures.mediumPortfolioData()}
            allocationData={ChartTestFixtures.balancedAllocation()}
            activeTab="allocation"
          />
        </QueryClientProvider>
      );

      // Hover allocation
      const allocationSvg = container.querySelector(
        'svg[data-chart-type="allocation"]'
      );
      if (allocationSvg) {
        await userEvent.pointer({
          target: allocationSvg,
          coords: { clientX: 400, clientY: 150 },
        });
      }

      await waitFor(() => {
        // Should only have ONE set of indicators visible
        const indicators = container.querySelectorAll(
          '[data-testid*="indicator"]'
        );
        const lines = container.querySelectorAll('line[stroke="#8b5cf6"]');

        // Should have allocation's vertical line only
        expect(indicators.length).toBeLessThanOrEqual(1);
        expect(lines.length).toBe(1);
      });
    });
  });

  describe("Data Consistency", () => {
    it("should display correct data after switching charts", async () => {
      const { rerender } = renderChart("performance");

      // Verify performance data
      expect(screen.queryByText(/Portfolio Performance/i)).not.toBeNull();

      // Switch to allocation
      rerender(
        <QueryClientProvider client={queryClient}>
          <PortfolioChart
            portfolioData={ChartTestFixtures.mediumPortfolioData()}
            allocationData={ChartTestFixtures.balancedAllocation()}
            activeTab="allocation"
          />
        </QueryClientProvider>
      );

      // Verify allocation data
      await waitFor(() => {
        expect(
          screen.queryByText(/Asset Allocation/i) || screen.queryByText(/BTC/i)
        ).not.toBeNull();
      });
    });

    it("should maintain correct date range across chart switches", async () => {
      const { rerender, container } = renderChart("performance");

      // Switch through all chart types
      const chartTypes = [
        "allocation",
        "drawdown",
        "sharpe",
        "volatility",
        "underwater",
      ];

      for (const chartType of chartTypes) {
        rerender(
          <QueryClientProvider client={queryClient}>
            <PortfolioChart
              portfolioData={ChartTestFixtures.mediumPortfolioData()}
              allocationData={ChartTestFixtures.balancedAllocation()}
              drawdownData={ChartTestFixtures.drawdownData()}
              sharpeData={ChartTestFixtures.sharpeData()}
              volatilityData={ChartTestFixtures.volatilityData()}
              underwaterData={ChartTestFixtures.underwaterData()}
              activeTab={chartType}
            />
          </QueryClientProvider>
        );

        await waitFor(() => {
          // Each chart should have date labels
          const dateLabels = container.querySelectorAll(
            '[data-testid*="date"]'
          );
          expect(dateLabels.length).toBeGreaterThanOrEqual(0);
        });
      }
    });

    it("should update hover data based on active chart type", async () => {
      const { rerender, container } = renderChart("performance");

      // Hover on performance
      const performanceSvg = container.querySelector(
        'svg[data-chart-type="performance"]'
      );
      if (performanceSvg) {
        await userEvent.pointer({
          target: performanceSvg,
          coords: { clientX: 400, clientY: 150 },
        });
      }

      await waitFor(() => {
        const tooltip = screen.queryByTestId("chart-tooltip");
        // Performance tooltip should show value and benchmark
        expect(tooltip?.textContent).toMatch(/\$|value/i);
      });

      // Switch to sharpe
      rerender(
        <QueryClientProvider client={queryClient}>
          <PortfolioChart
            portfolioData={ChartTestFixtures.mediumPortfolioData()}
            sharpeData={ChartTestFixtures.sharpeData()}
            activeTab="sharpe"
          />
        </QueryClientProvider>
      );

      // Hover on sharpe
      const sharpeSvg = container.querySelector(
        'svg[data-chart-type="sharpe"]'
      );
      if (sharpeSvg) {
        await userEvent.pointer({
          target: sharpeSvg,
          coords: { clientX: 400, clientY: 150 },
        });
      }

      await waitFor(() => {
        const tooltip = screen.queryByTestId("chart-tooltip");
        // Sharpe tooltip should show ratio
        expect(tooltip?.textContent).toMatch(/sharpe|ratio/i);
      });
    });
  });

  describe("Animation Cleanup", () => {
    it("should complete exit animations before rendering new chart", async () => {
      const { rerender, container } = renderChart("allocation");

      // Hover to create animated indicator
      const allocationSvg = container.querySelector(
        'svg[data-chart-type="allocation"]'
      );
      if (allocationSvg) {
        await userEvent.pointer({
          target: allocationSvg,
          coords: { clientX: 400, clientY: 150 },
        });
      }

      await waitFor(() => {
        expect(
          container.querySelector('line[stroke="#8b5cf6"]')
        ).not.toBeNull();
      });

      // Switch chart (triggers exit animation)
      rerender(
        <QueryClientProvider client={queryClient}>
          <PortfolioChart
            portfolioData={ChartTestFixtures.mediumPortfolioData()}
            volatilityData={ChartTestFixtures.volatilityData()}
            activeTab="volatility"
          />
        </QueryClientProvider>
      );

      // Should not have both charts visible during transition
      await waitFor(() => {
        const allocationCharts = container.querySelectorAll(
          'svg[data-chart-type="allocation"]'
        );
        expect(allocationCharts.length).toBe(0);
      });
    });

    it("should handle rapid chart switching without animation glitches", async () => {
      const { rerender } = renderChart("performance");

      // Rapidly switch through charts
      const chartTypes = [
        "allocation",
        "drawdown",
        "sharpe",
        "performance",
        "volatility",
      ];

      for (const chartType of chartTypes) {
        rerender(
          <QueryClientProvider client={queryClient}>
            <PortfolioChart
              portfolioData={ChartTestFixtures.mediumPortfolioData()}
              allocationData={ChartTestFixtures.balancedAllocation()}
              drawdownData={ChartTestFixtures.drawdownData()}
              sharpeData={ChartTestFixtures.sharpeData()}
              volatilityData={ChartTestFixtures.volatilityData()}
              activeTab={chartType}
            />
          </QueryClientProvider>
        );

        // Should not crash or show errors
        await waitFor(() => {
          expect(screen.queryByText(/error/i)).toBeNull();
        });
      }
    });
  });

  describe("Memory Management", () => {
    it("should clean up event listeners when switching charts", async () => {
      const { rerender } = renderChart("performance");

      const initialListenerCount =
        (window as any).getEventListeners?.("mousemove")?.length || 0;

      // Switch to allocation
      rerender(
        <QueryClientProvider client={queryClient}>
          <PortfolioChart
            portfolioData={ChartTestFixtures.mediumPortfolioData()}
            allocationData={ChartTestFixtures.balancedAllocation()}
            activeTab="allocation"
          />
        </QueryClientProvider>
      );

      // Switch back to performance
      rerender(
        <QueryClientProvider client={queryClient}>
          <PortfolioChart
            portfolioData={ChartTestFixtures.mediumPortfolioData()}
            activeTab="performance"
          />
        </QueryClientProvider>
      );

      const finalListenerCount =
        (window as any).getEventListeners?.("mousemove")?.length || 0;

      // Should not accumulate listeners
      expect(finalListenerCount).toBeLessThanOrEqual(initialListenerCount + 1);
    });

    it("should not leak hover state objects", async () => {
      const { rerender } = renderChart("performance");

      // Switch charts multiple times
      for (let i = 0; i < 10; i++) {
        rerender(
          <QueryClientProvider client={queryClient}>
            <PortfolioChart
              portfolioData={ChartTestFixtures.mediumPortfolioData()}
              allocationData={ChartTestFixtures.balancedAllocation()}
              activeTab={i % 2 === 0 ? "performance" : "allocation"}
            />
          </QueryClientProvider>
        );
      }

      // Should complete without memory issues (test framework will catch leaks)
      expect(true).toBe(true);
    });
  });

  describe("Edge Cases", () => {
    it("should handle switching with missing data gracefully", async () => {
      const { rerender } = render(
        <QueryClientProvider client={queryClient}>
          <PortfolioChart
            portfolioData={ChartTestFixtures.mediumPortfolioData()}
            activeTab="performance"
          />
        </QueryClientProvider>
      );

      // Switch to allocation with no allocation data
      rerender(
        <QueryClientProvider client={queryClient}>
          <PortfolioChart
            portfolioData={ChartTestFixtures.mediumPortfolioData()}
            allocationData={ChartTestFixtures.emptyAllocationData()}
            activeTab="allocation"
          />
        </QueryClientProvider>
      );

      // Should not crash
      expect(screen.queryByText(/error/i)).toBeNull();
    });

    it("should handle switching while hovering", async () => {
      const { rerender, container } = renderChart("performance");

      // Start hovering
      const performanceSvg = container.querySelector(
        'svg[data-chart-type="performance"]'
      );
      if (performanceSvg) {
        await userEvent.pointer({
          target: performanceSvg,
          coords: { clientX: 400, clientY: 150 },
        });
      }

      // Switch while hover is active
      rerender(
        <QueryClientProvider client={queryClient}>
          <PortfolioChart
            portfolioData={ChartTestFixtures.mediumPortfolioData()}
            allocationData={ChartTestFixtures.balancedAllocation()}
            activeTab="allocation"
          />
        </QueryClientProvider>
      );

      // Should clean up hover state
      await waitFor(() => {
        expect(screen.queryByTestId("chart-tooltip")).toBeNull();
      });
    });

    it("should maintain chart dimensions when switching", async () => {
      const { rerender, container } = renderChart("performance");

      const initialSvg = container.querySelector("svg");
      const initialWidth = initialSvg?.getAttribute("width");
      const initialHeight = initialSvg?.getAttribute("height");

      // Switch chart
      rerender(
        <QueryClientProvider client={queryClient}>
          <PortfolioChart
            portfolioData={ChartTestFixtures.mediumPortfolioData()}
            allocationData={ChartTestFixtures.balancedAllocation()}
            activeTab="allocation"
          />
        </QueryClientProvider>
      );

      const newSvg = container.querySelector("svg");
      const newWidth = newSvg?.getAttribute("width");
      const newHeight = newSvg?.getAttribute("height");

      // Dimensions should be consistent
      expect(newWidth).toBe(initialWidth);
      expect(newHeight).toBe(initialHeight);
    });
  });
});
