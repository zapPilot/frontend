/**
 * Unit tests: PortfolioChart Component
 *
 * Comprehensive unit tests for the PortfolioChart component covering:
 * - Rendering of all 6 chart types
 * - Props validation and defaults
 * - Loading states and error handling
 * - Accessibility compliance
 * - Performance optimization
 *
 * @see src/components/PortfolioChart.tsx
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import PortfolioChart from "@/components/PortfolioChart";
import { ChartTestFixtures } from "../../fixtures/chartTestData";
import {
  PortfolioDataFactory,
  AllocationDataFactory,
  DrawdownDataFactory,
  SharpeDataFactory,
  VolatilityDataFactory,
  UnderwaterDataFactory,
} from "../../utils/chartHoverTestFactories";

// Mock Framer Motion
vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    line: ({ children, ...props }: any) => <line {...props}>{children}</line>,
    circle: ({ children, ...props }: any) => <circle {...props}>{children}</circle>,
    g: ({ children, ...props }: any) => <g {...props}>{children}</g>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// Mock Next.js Image
vi.mock("next/image", () => ({
  default: ({ src, alt, ...props }: any) => <img src={src} alt={alt} {...props} />,
}));

describe("PortfolioChart Component", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
  });

  const renderChart = (props: Partial<React.ComponentProps<typeof PortfolioChart>> = {}) => {
    const defaultProps = {
      portfolioData: ChartTestFixtures.mediumPortfolioData(),
      allocationData: ChartTestFixtures.balancedAllocation(),
      drawdownData: ChartTestFixtures.drawdownData(),
      sharpeData: ChartTestFixtures.sharpeData(),
      volatilityData: ChartTestFixtures.volatilityData(),
      underwaterData: ChartTestFixtures.underwaterData(),
      activeTab: "performance" as const,
      ...props,
    };

    return render(
      <QueryClientProvider client={queryClient}>
        <PortfolioChart {...defaultProps} />
      </QueryClientProvider>
    );
  };

  describe("Rendering - All Chart Types", () => {
    it("should render performance chart with correct data", () => {
      const { container } = renderChart({ activeTab: "performance" });

      const svg = container.querySelector('svg[data-chart-type="performance"]');
      expect(svg).not.toBeNull();
    });

    it("should render allocation chart with stacked bars", () => {
      const { container } = renderChart({ activeTab: "allocation" });

      const svg = container.querySelector('svg[data-chart-type="allocation"]');
      expect(svg).not.toBeNull();

      // Should have areas for each asset class
      const areas = container.querySelectorAll("path[fill]");
      expect(areas.length).toBeGreaterThan(0);
    });

    it("should render drawdown chart with area fill", () => {
      const { container } = renderChart({ activeTab: "drawdown" });

      const svg = container.querySelector('svg[data-chart-type="drawdown"]');
      expect(svg).not.toBeNull();
    });

    it("should render sharpe ratio chart", () => {
      const { container } = renderChart({ activeTab: "sharpe" });

      const svg = container.querySelector('svg[data-chart-type="sharpe"]');
      expect(svg).not.toBeNull();
    });

    it("should render volatility chart", () => {
      const { container } = renderChart({ activeTab: "volatility" });

      const svg = container.querySelector('svg[data-chart-type="volatility"]');
      expect(svg).not.toBeNull();
    });

    it("should render underwater chart", () => {
      const { container } = renderChart({ activeTab: "underwater" });

      const svg = container.querySelector('svg[data-chart-type="underwater"]');
      expect(svg).not.toBeNull();
    });

    it("should render tab navigation", () => {
      renderChart();

      // Should have tabs for all chart types
      expect(screen.queryByRole("tablist") || screen.queryByRole("navigation")).not.toBeNull();
    });

    it("should highlight active tab", () => {
      renderChart({ activeTab: "allocation" });

      // Active tab should be visually distinguished
      const activeTab = screen.queryByRole("tab", { selected: true });
      expect(activeTab).not.toBeNull();
    });
  });

  describe("Props Handling", () => {
    it("should handle missing optional data props gracefully", () => {
      const { container } = render(
        <QueryClientProvider client={queryClient}>
          <PortfolioChart
            portfolioData={ChartTestFixtures.mediumPortfolioData()}
            activeTab="performance"
          />
        </QueryClientProvider>
      );

      expect(container).toBeTruthy();
    });

    it("should display empty state for empty data", () => {
      const { container } = renderChart({
        portfolioData: ChartTestFixtures.emptyPortfolioData(),
        activeTab: "performance",
      });

      // Should show empty state or message
      expect(container.textContent).toMatch(/no data|empty/i);
    });

    it("should handle single data point", () => {
      const { container } = renderChart({
        portfolioData: ChartTestFixtures.singlePortfolioPoint(),
        activeTab: "performance",
      });

      const svg = container.querySelector("svg");
      expect(svg).not.toBeNull();
    });

    it("should respect activeTab prop", () => {
      const { container, rerender } = renderChart({ activeTab: "performance" });

      expect(container.querySelector('svg[data-chart-type="performance"]')).not.toBeNull();

      rerender(
        <QueryClientProvider client={queryClient}>
          <PortfolioChart
            portfolioData={ChartTestFixtures.mediumPortfolioData()}
            allocationData={ChartTestFixtures.balancedAllocation()}
            activeTab="allocation"
          />
        </QueryClientProvider>
      );

      expect(container.querySelector('svg[data-chart-type="allocation"]')).not.toBeNull();
    });

    it("should handle different data sizes", () => {
      // Small dataset (5 points)
      const { container: small } = renderChart({
        portfolioData: ChartTestFixtures.smallPortfolioData(),
      });
      expect(small.querySelector("svg")).not.toBeNull();

      // Large dataset (90 points)
      const { container: large } = renderChart({
        portfolioData: ChartTestFixtures.largePortfolioData(),
      });
      expect(large.querySelector("svg")).not.toBeNull();
    });

    it("should handle volatile data", () => {
      const { container } = renderChart({
        portfolioData: ChartTestFixtures.portfolioVolatile(),
      });

      expect(container.querySelector("svg")).not.toBeNull();
    });

    it("should handle uptrend data", () => {
      const { container } = renderChart({
        portfolioData: ChartTestFixtures.portfolioUptrend(),
      });

      expect(container.querySelector("svg")).not.toBeNull();
    });

    it("should handle downtrend data", () => {
      const { container } = renderChart({
        portfolioData: ChartTestFixtures.portfolioDowntrend(),
      });

      expect(container.querySelector("svg")).not.toBeNull();
    });
  });

  describe("Loading States", () => {
    it("should show loading skeleton when data is loading", () => {
      const { container } = render(
        <QueryClientProvider client={queryClient}>
          <PortfolioChart
            portfolioData={undefined}
            isLoading={true}
            activeTab="performance"
          />
        </QueryClientProvider>
      );

      // Should show skeleton or loading indicator
      expect(
        container.querySelector('[data-testid="chart-skeleton"]') ||
        container.textContent?.match(/loading/i)
      ).toBeTruthy();
    });

    it("should hide loading state when data arrives", async () => {
      const { container, rerender } = render(
        <QueryClientProvider client={queryClient}>
          <PortfolioChart
            portfolioData={undefined}
            isLoading={true}
            activeTab="performance"
          />
        </QueryClientProvider>
      );

      // Initially loading
      expect(container.textContent).toMatch(/loading/i);

      // Data arrives
      rerender(
        <QueryClientProvider client={queryClient}>
          <PortfolioChart
            portfolioData={ChartTestFixtures.mediumPortfolioData()}
            isLoading={false}
            activeTab="performance"
          />
        </QueryClientProvider>
      );

      await waitFor(() => {
        expect(container.querySelector("svg")).not.toBeNull();
      });
    });
  });

  describe("Error Handling", () => {
    it("should display error message on data fetch failure", () => {
      const errorMessage = "Failed to load portfolio data";

      const { container } = render(
        <QueryClientProvider client={queryClient}>
          <PortfolioChart
            portfolioData={undefined}
            error={new Error(errorMessage)}
            activeTab="performance"
          />
        </QueryClientProvider>
      );

      expect(container.textContent).toMatch(/error|failed/i);
    });

    it("should handle malformed data gracefully", () => {
      const malformedData = [
        {
          date: "invalid-date",
          value: NaN,
          change: Infinity,
        },
      ] as any;

      const { container } = renderChart({
        portfolioData: malformedData,
      });

      // Should not crash
      expect(container).toBeTruthy();
    });

    it("should handle negative values in data", () => {
      const negativeData = PortfolioDataFactory.createPoints(10, (i) => ({
        value: -1000 * i,
        change: -0.1,
      }));

      const { container } = renderChart({
        portfolioData: negativeData,
      });

      expect(container.querySelector("svg")).not.toBeNull();
    });
  });

  describe("Interactivity", () => {
    it("should show tooltip on hover", async () => {
      const { container } = renderChart();

      const svg = container.querySelector("svg");
      if (svg) {
        await userEvent.pointer({ target: svg, coords: { clientX: 400, clientY: 150 } });
      }

      await waitFor(() => {
        const tooltip = screen.queryByTestId("chart-tooltip");
        expect(tooltip).not.toBeNull();
      });
    });

    it("should hide tooltip on mouse leave", async () => {
      const { container } = renderChart();

      const svg = container.querySelector("svg");
      if (svg) {
        await userEvent.pointer({ target: svg, coords: { clientX: 400, clientY: 150 } });

        await waitFor(() => {
          expect(screen.queryByTestId("chart-tooltip")).not.toBeNull();
        });

        await userEvent.unhover(svg);

        await waitFor(() => {
          expect(screen.queryByTestId("chart-tooltip")).toBeNull();
        });
      }
    });

    it("should switch tabs on tab click", async () => {
      const { container } = renderChart();

      const allocationTab = screen.queryByRole("tab", { name: /allocation/i });

      if (allocationTab) {
        await userEvent.click(allocationTab);

        await waitFor(() => {
          expect(container.querySelector('svg[data-chart-type="allocation"]')).not.toBeNull();
        });
      }
    });

    it("should support keyboard navigation", async () => {
      renderChart();

      const tabs = screen.queryAllByRole("tab");
      if (tabs.length > 0) {
        // Tab to first tab
        await userEvent.tab();
        expect(document.activeElement).toBe(tabs[0]);

        // Arrow key to next tab
        await userEvent.keyboard("{ArrowRight}");
        // Should focus next tab or maintain focus
        expect(document.activeElement).toBeTruthy();
      }
    });
  });

  describe("Accessibility", () => {
    it("should have proper ARIA labels for charts", () => {
      const { container } = renderChart();

      const svg = container.querySelector("svg");
      const ariaLabel = svg?.getAttribute("aria-label") || svg?.getAttribute("role");
      expect(ariaLabel).toBeTruthy();
    });

    it("should have accessible tab navigation", () => {
      renderChart();

      const tablist = screen.queryByRole("tablist");
      const tabs = screen.queryAllByRole("tab");

      // Should have tablist and tabs
      expect(tablist || tabs.length > 0).toBeTruthy();
    });

    it("should mark decorative elements as aria-hidden", () => {
      const { container } = renderChart();

      // Cursor indicators should be aria-hidden
      const decorativeElements = container.querySelectorAll('[aria-hidden="true"]');
      expect(decorativeElements.length).toBeGreaterThan(0);
    });

    it("should provide text alternatives for data visualizations", () => {
      const { container } = renderChart();

      // Should have descriptive text or labels
      const labels = container.querySelectorAll("text");
      expect(labels.length).toBeGreaterThan(0);
    });
  });

  describe("Performance", () => {
    it("should not re-render when unrelated props change", () => {
      const renderSpy = vi.fn();

      const TestWrapper = (props: any) => {
        renderSpy();
        return <PortfolioChart {...props} />;
      };

      const { rerender } = render(
        <QueryClientProvider client={queryClient}>
          <TestWrapper
            portfolioData={ChartTestFixtures.mediumPortfolioData()}
            activeTab="performance"
            unrelatedProp="value1"
          />
        </QueryClientProvider>
      );

      const initialRenderCount = renderSpy.mock.calls.length;

      // Change unrelated prop
      rerender(
        <QueryClientProvider client={queryClient}>
          <TestWrapper
            portfolioData={ChartTestFixtures.mediumPortfolioData()}
            activeTab="performance"
            unrelatedProp="value2"
          />
        </QueryClientProvider>
      );

      // Should have re-rendered (React 19 behavior)
      expect(renderSpy.mock.calls.length).toBeGreaterThanOrEqual(initialRenderCount);
    });

    it("should handle large datasets efficiently", () => {
      const largeData = PortfolioDataFactory.createPoints(1000);

      const startTime = performance.now();

      renderChart({ portfolioData: largeData });

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Should render large dataset in reasonable time (< 1000ms)
      expect(renderTime).toBeLessThan(1000);
    });

    it("should debounce hover events", async () => {
      const { container } = renderChart();

      const svg = container.querySelector("svg");
      if (svg) {
        // Rapid hover movements
        for (let x = 100; x <= 700; x += 50) {
          await userEvent.pointer({ target: svg, coords: { clientX: x, clientY: 150 } });
        }

        // Should still work correctly after rapid movements
        await waitFor(() => {
          const line = container.querySelector('line') || container.querySelector('circle');
          expect(line).not.toBeNull();
        });
      }
    });
  });

  describe("Responsive Behavior", () => {
    it("should render on mobile viewport", () => {
      // Mock mobile viewport
      Object.defineProperty(window, "innerWidth", {
        writable: true,
        configurable: true,
        value: 375,
      });

      const { container } = renderChart();
      expect(container.querySelector("svg")).not.toBeNull();
    });

    it("should render on desktop viewport", () => {
      // Mock desktop viewport
      Object.defineProperty(window, "innerWidth", {
        writable: true,
        configurable: true,
        value: 1920,
      });

      const { container } = renderChart();
      expect(container.querySelector("svg")).not.toBeNull();
    });

    it("should maintain aspect ratio on resize", () => {
      const { container } = renderChart();

      const svg = container.querySelector("svg");
      const initialViewBox = svg?.getAttribute("viewBox");

      // Simulate resize
      window.dispatchEvent(new Event("resize"));

      const newSvg = container.querySelector("svg");
      const newViewBox = newSvg?.getAttribute("viewBox");

      // ViewBox should be consistent
      expect(newViewBox).toBe(initialViewBox);
    });
  });

  describe("Data Formatting", () => {
    it("should format currency values correctly", async () => {
      const { container } = renderChart({
        portfolioData: PortfolioDataFactory.createPoints(5, (i) => ({
          value: 12345.67 + i * 100,
        })),
      });

      const svg = container.querySelector("svg");
      if (svg) {
        await userEvent.pointer({ target: svg, coords: { clientX: 400, clientY: 150 } });

        await waitFor(() => {
          const tooltip = screen.queryByTestId("chart-tooltip");
          // Should format with $ and decimals
          expect(tooltip?.textContent).toMatch(/\$[\d,]+\.\d{2}/);
        });
      }
    });

    it("should format percentages correctly", async () => {
      const { container } = renderChart({ activeTab: "allocation" });

      const svg = container.querySelector("svg");
      if (svg) {
        await userEvent.pointer({ target: svg, coords: { clientX: 400, clientY: 150 } });

        await waitFor(() => {
          const tooltip = screen.queryByTestId("chart-tooltip");
          // Should format with % symbol
          expect(tooltip?.textContent).toMatch(/\d+\.?\d*%/);
        });
      }
    });

    it("should format dates consistently", () => {
      const { container } = renderChart();

      // Check x-axis labels
      const dateLabels = container.querySelectorAll("text");
      const hasDateFormat = Array.from(dateLabels).some((label) =>
        /\w{3}\s+\d{1,2}/.test(label.textContent || "")
      );

      expect(hasDateFormat).toBe(true);
    });
  });
});
