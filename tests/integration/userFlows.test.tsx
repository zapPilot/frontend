/**
 * Integration tests: User Flows
 *
 * Tests complete user scenarios and workflows:
 * - Portfolio exploration: performance → allocation → detailed analysis
 * - Risk analysis: drawdown → sharpe → volatility assessment
 * - Mobile experience: touch interactions across charts
 * - Data analysis: complete workflows from load to insights
 *
 * @see src/components/PortfolioChart.tsx
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PortfolioChart } from "@/components/PortfolioChart/";
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

describe("User Flows - Integration Tests", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
  });

  const renderChart = (activeTab = "performance") => {
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

  describe("User Flow: Portfolio Exploration", () => {
    it("should complete full portfolio exploration workflow", async () => {
      const { container, rerender } = renderChart("performance");

      // Step 1: User views performance chart
      const performanceSvg = container.querySelector(
        'svg[data-chart-type="performance"]'
      );
      expect(performanceSvg).not.toBeNull();

      // Step 2: User hovers to see portfolio value
      if (performanceSvg) {
        await userEvent.pointer({
          target: performanceSvg,
          coords: { clientX: 400, clientY: 150 },
        });
      }

      await waitFor(() => {
        const tooltip = screen.queryByTestId("chart-tooltip");
        expect(tooltip).not.toBeNull();
        expect(tooltip?.textContent).toMatch(/\$/);
      });

      // Step 3: User switches to allocation to understand holdings
      const allocationTab = screen.queryByRole("tab", { name: /allocation/i });
      if (allocationTab) {
        await userEvent.click(allocationTab);
      } else {
        rerender(
          <QueryClientProvider client={queryClient}>
            <PortfolioChart
              portfolioData={ChartTestFixtures.mediumPortfolioData()}
              allocationData={ChartTestFixtures.balancedAllocation()}
              activeTab="allocation"
            />
          </QueryClientProvider>
        );
      }

      await waitFor(() => {
        expect(
          container.querySelector('svg[data-chart-type="allocation"]')
        ).not.toBeNull();
      });

      // Step 4: User hovers on allocation to see percentages
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
        const tooltip = screen.queryByTestId("chart-tooltip");
        expect(tooltip).not.toBeNull();
        // Should show allocation percentages
        expect(tooltip?.textContent).toMatch(/%|BTC|ETH/i);
      });

      // Step 5: User explores different time periods
      if (allocationSvg) {
        // Start of period
        await userEvent.pointer({
          target: allocationSvg,
          coords: { clientX: 100, clientY: 150 },
        });

        await waitFor(() => {
          const line = container.querySelector('line[stroke="#8b5cf6"]');
          expect(line).not.toBeNull();
          const x = Number(line?.getAttribute("x1"));
          expect(Number.isFinite(x)).toBe(true);
          expect(Math.abs(x - 100)).toBeLessThanOrEqual(20);
        });

        // End of period
        await userEvent.pointer({
          target: allocationSvg,
          coords: { clientX: 700, clientY: 150 },
        });

        await waitFor(() => {
          const line = container.querySelector('line[stroke="#8b5cf6"]');
          expect(line).not.toBeNull();
          const x = Number(line?.getAttribute("x1"));
          expect(Number.isFinite(x)).toBe(true);
          expect(Math.abs(x - 700)).toBeLessThanOrEqual(20);
        });
      }
    });

    it("should support quick comparison between portfolio value and allocation", async () => {
      const { container, rerender } = renderChart("performance");

      // View performance
      const performanceSvg = container.querySelector(
        'svg[data-chart-type="performance"]'
      );
      if (performanceSvg) {
        await userEvent.pointer({
          target: performanceSvg,
          coords: { clientX: 400, clientY: 150 },
        });
      }

      const performanceValue =
        screen.queryByTestId("chart-tooltip")?.textContent;
      expect(performanceValue).toBeTruthy();

      // Quickly switch to allocation
      rerender(
        <QueryClientProvider client={queryClient}>
          <PortfolioChart
            portfolioData={ChartTestFixtures.mediumPortfolioData()}
            allocationData={ChartTestFixtures.balancedAllocation()}
            activeTab="allocation"
          />
        </QueryClientProvider>
      );

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
        const tooltip = screen.queryByTestId("chart-tooltip");
        expect(tooltip).not.toBeNull();
      });

      // User can now mentally compare the two
      expect(performanceValue).not.toBe(
        screen.queryByTestId("chart-tooltip")?.textContent
      );
    });
  });

  describe("User Flow: Risk Analysis", () => {
    it("should complete comprehensive risk analysis workflow", async () => {
      const { container, rerender } = renderChart("drawdown");

      // Step 1: Check maximum drawdown
      const drawdownSvg = container.querySelector(
        'svg[data-chart-type="drawdown"]'
      );
      if (drawdownSvg) {
        await userEvent.pointer({
          target: drawdownSvg,
          coords: { clientX: 500, clientY: 150 },
        });
      }

      await waitFor(() => {
        const tooltip = screen.queryByTestId("chart-tooltip");
        expect(tooltip?.textContent).toMatch(/drawdown|-/i);
      });

      // Step 2: Compare with Sharpe ratio
      rerender(
        <QueryClientProvider client={queryClient}>
          <PortfolioChart
            portfolioData={ChartTestFixtures.mediumPortfolioData()}
            sharpeData={ChartTestFixtures.sharpeData()}
            activeTab="sharpe"
          />
        </QueryClientProvider>
      );

      await waitFor(() => {
        expect(
          container.querySelector('svg[data-chart-type="sharpe"]')
        ).not.toBeNull();
      });

      const sharpeSvg = container.querySelector(
        'svg[data-chart-type="sharpe"]'
      );
      if (sharpeSvg) {
        await userEvent.pointer({
          target: sharpeSvg,
          coords: { clientX: 500, clientY: 150 },
        });
      }

      await waitFor(() => {
        const tooltip = screen.queryByTestId("chart-tooltip");
        expect(tooltip?.textContent).toMatch(/sharpe|ratio/i);
      });

      // Step 3: Review volatility
      rerender(
        <QueryClientProvider client={queryClient}>
          <PortfolioChart
            portfolioData={ChartTestFixtures.mediumPortfolioData()}
            volatilityData={ChartTestFixtures.volatilityData()}
            activeTab="volatility"
          />
        </QueryClientProvider>
      );

      await waitFor(() => {
        expect(
          container.querySelector('svg[data-chart-type="volatility"]')
        ).not.toBeNull();
      });

      const volatilitySvg = container.querySelector(
        'svg[data-chart-type="volatility"]'
      );
      if (volatilitySvg) {
        await userEvent.pointer({
          target: volatilitySvg,
          coords: { clientX: 500, clientY: 150 },
        });
      }

      await waitFor(() => {
        const tooltip = screen.queryByTestId("chart-tooltip");
        expect(tooltip?.textContent).toMatch(/volatility|%/i);
      });

      // Step 4: Check underwater periods
      rerender(
        <QueryClientProvider client={queryClient}>
          <PortfolioChart
            portfolioData={ChartTestFixtures.mediumPortfolioData()}
            underwaterData={ChartTestFixtures.underwaterData()}
            activeTab="underwater"
          />
        </QueryClientProvider>
      );

      await waitFor(() => {
        expect(
          container.querySelector('svg[data-chart-type="underwater"]')
        ).not.toBeNull();
      });

      // User has now completed full risk analysis
      const underwaterSvg = container.querySelector(
        'svg[data-chart-type="underwater"]'
      );
      expect(underwaterSvg).not.toBeNull();
    });

    it("should identify worst risk periods across metrics", async () => {
      const { container, rerender } = renderChart("drawdown");

      // Find worst drawdown
      const drawdownSvg = container.querySelector(
        'svg[data-chart-type="drawdown"]'
      );
      if (drawdownSvg) {
        // Scan across the chart
        for (let x = 100; x <= 700; x += 100) {
          await userEvent.pointer({
            target: drawdownSvg,
            coords: { clientX: x, clientY: 150 },
          });

          await waitFor(() => {
            const tooltip = screen.queryByTestId("chart-tooltip");
            expect(tooltip).not.toBeNull();
          });
        }
      }

      // Check corresponding volatility
      rerender(
        <QueryClientProvider client={queryClient}>
          <PortfolioChart
            portfolioData={ChartTestFixtures.mediumPortfolioData()}
            volatilityData={ChartTestFixtures.volatilityData()}
            activeTab="volatility"
          />
        </QueryClientProvider>
      );

      const volatilitySvg = container.querySelector(
        'svg[data-chart-type="volatility"]'
      );
      if (volatilitySvg) {
        await userEvent.pointer({
          target: volatilitySvg,
          coords: { clientX: 500, clientY: 150 },
        });
      }

      await waitFor(() => {
        const tooltip = screen.queryByTestId("chart-tooltip");
        expect(tooltip).not.toBeNull();
      });
    });
  });

  describe("User Flow: Mobile Experience", () => {
    beforeEach(() => {
      // Mock mobile viewport
      Object.defineProperty(window, "innerWidth", {
        writable: true,
        configurable: true,
        value: 375,
      });

      Object.defineProperty(window, "innerHeight", {
        writable: true,
        configurable: true,
        value: 667,
      });
    });

    it("should support touch-based portfolio exploration", async () => {
      const { container } = renderChart("allocation");

      const allocationSvg = container.querySelector(
        'svg[data-chart-type="allocation"]'
      );

      if (allocationSvg) {
        // Touch start
        await userEvent.pointer({
          target: allocationSvg,
          coords: { clientX: 200, clientY: 150 },
        });

        await waitFor(() => {
          const line = container.querySelector('line[stroke="#8b5cf6"]');
          expect(line).not.toBeNull();
        });

        // Touch move (swipe across)
        await userEvent.pointer({
          target: allocationSvg,
          coords: { clientX: 600, clientY: 150 },
        });

        await waitFor(() => {
          const line = container.querySelector('line[stroke="#8b5cf6"]');
          expect(line).not.toBeNull();
          const x = Number(line?.getAttribute("x1"));
          expect(Number.isFinite(x)).toBe(true);
          expect(Math.abs(x - 600)).toBeLessThanOrEqual(20);
        });

        // Touch end
        await userEvent.unhover(allocationSvg);

        await waitFor(() => {
          expect(container.querySelector('line[stroke="#8b5cf6"]')).toBeNull();
        });
      }
    });

    it("should handle pinch-to-zoom gestures gracefully", async () => {
      const { container } = renderChart("performance");

      const svg = container.querySelector("svg");

      // Simulate zoom (browser handles actual zoom, we just verify no breakage)
      if (svg) {
        // Before zoom
        await userEvent.pointer({
          target: svg,
          coords: { clientX: 400, clientY: 150 },
        });

        await waitFor(() => {
          expect(screen.queryByTestId("chart-tooltip")).not.toBeNull();
        });

        // After zoom (coordinates might be different but chart should still work)
        await userEvent.pointer({
          target: svg,
          coords: { clientX: 200, clientY: 100 },
        });

        await waitFor(() => {
          expect(screen.queryByTestId("chart-tooltip")).not.toBeNull();
        });
      }
    });

    it("should support rapid tab switching on mobile", async () => {
      const { container, rerender } = renderChart("performance");

      const tabs = [
        "allocation",
        "drawdown",
        "sharpe",
        "volatility",
        "underwater",
      ];

      for (const tab of tabs) {
        rerender(
          <QueryClientProvider client={queryClient}>
            <PortfolioChart
              portfolioData={ChartTestFixtures.mediumPortfolioData()}
              allocationData={ChartTestFixtures.balancedAllocation()}
              drawdownData={ChartTestFixtures.drawdownData()}
              sharpeData={ChartTestFixtures.sharpeData()}
              volatilityData={ChartTestFixtures.volatilityData()}
              underwaterData={ChartTestFixtures.underwaterData()}
              activeTab={tab}
            />
          </QueryClientProvider>
        );

        await waitFor(() => {
          const svg = container.querySelector(`svg[data-chart-type="${tab}"]`);
          expect(svg).not.toBeNull();
        });
      }
    });
  });

  describe("User Flow: Data Analysis Workflow", () => {
    it("should support detailed trend analysis", async () => {
      const { container } = renderChart("performance");

      const performanceSvg = container.querySelector(
        'svg[data-chart-type="performance"]'
      );

      if (performanceSvg) {
        // Analyze start of period
        await userEvent.pointer({
          target: performanceSvg,
          coords: { clientX: 100, clientY: 150 },
        });

        const startTooltip = screen.queryByTestId("chart-tooltip");
        const startValue = startTooltip?.textContent;

        // Analyze middle of period
        await userEvent.pointer({
          target: performanceSvg,
          coords: { clientX: 400, clientY: 150 },
        });

        const midTooltip = screen.queryByTestId("chart-tooltip");
        const midValue = midTooltip?.textContent;

        // Analyze end of period
        await userEvent.pointer({
          target: performanceSvg,
          coords: { clientX: 700, clientY: 150 },
        });

        const endTooltip = screen.queryByTestId("chart-tooltip");
        const endValue = endTooltip?.textContent;

        // Values should be different (trend)
        expect(startValue).not.toBe(midValue);
        expect(midValue).not.toBe(endValue);
      }
    });

    it("should support allocation change tracking", async () => {
      const { container } = renderChart("allocation");

      const allocationSvg = container.querySelector(
        'svg[data-chart-type="allocation"]'
      );

      if (allocationSvg) {
        // Check allocation at different points
        const positions = [100, 250, 400, 550, 700];
        const allocations = [];

        for (const x of positions) {
          await userEvent.pointer({
            target: allocationSvg,
            coords: { clientX: x, clientY: 150 },
          });

          await waitFor(() => {
            const tooltip = screen.queryByTestId("chart-tooltip");
            if (tooltip) {
              allocations.push(tooltip.textContent);
            }
          });
        }

        // Should have captured allocation data at each point
        expect(allocations.length).toBeGreaterThan(0);
      }
    });

    it("should support correlation analysis between metrics", async () => {
      const { container, rerender } = renderChart("volatility");

      // Identify high volatility period
      const volatilitySvg = container.querySelector(
        'svg[data-chart-type="volatility"]'
      );
      if (volatilitySvg) {
        await userEvent.pointer({
          target: volatilitySvg,
          coords: { clientX: 400, clientY: 150 },
        });

        await waitFor(() => {
          const tooltip = screen.queryByTestId("chart-tooltip");
          expect(tooltip?.textContent).toMatch(/volatility/i);
        });
      }

      // Check corresponding drawdown
      rerender(
        <QueryClientProvider client={queryClient}>
          <PortfolioChart
            portfolioData={ChartTestFixtures.mediumPortfolioData()}
            drawdownData={ChartTestFixtures.drawdownData()}
            activeTab="drawdown"
          />
        </QueryClientProvider>
      );

      const drawdownSvg = container.querySelector(
        'svg[data-chart-type="drawdown"]'
      );
      if (drawdownSvg) {
        await userEvent.pointer({
          target: drawdownSvg,
          coords: { clientX: 400, clientY: 150 },
        });

        await waitFor(() => {
          const tooltip = screen.queryByTestId("chart-tooltip");
          expect(tooltip?.textContent).toMatch(/drawdown/i);
        });
      }

      // User can now correlate high volatility with drawdown periods
    });
  });

  describe("User Flow: Recovery from Errors", () => {
    it("should handle partial data loads gracefully", async () => {
      const { rerender } = render(
        <QueryClientProvider client={queryClient}>
          <PortfolioChart
            portfolioData={undefined}
            isLoading={true}
            activeTab="performance"
          />
        </QueryClientProvider>
      );

      // Initial loading state
      expect(screen.queryByText(/loading/i)).not.toBeNull();

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
        const svg = screen.queryByRole("img") || document.querySelector("svg");
        expect(svg).not.toBeNull();
      });
    });

    it("should allow retry after error", async () => {
      const { rerender, container } = render(
        <QueryClientProvider client={queryClient}>
          <PortfolioChart
            portfolioData={undefined}
            error={new Error("Network error")}
            activeTab="performance"
          />
        </QueryClientProvider>
      );

      // Error state
      expect(container.textContent).toMatch(/error|failed/i);

      // Retry with data
      rerender(
        <QueryClientProvider client={queryClient}>
          <PortfolioChart
            portfolioData={ChartTestFixtures.mediumPortfolioData()}
            error={undefined}
            activeTab="performance"
          />
        </QueryClientProvider>
      );

      await waitFor(() => {
        expect(container.querySelector("svg")).not.toBeNull();
      });
    });

    it("should maintain user context across data refreshes", async () => {
      const { container, rerender } = renderChart("allocation");

      // User hovers on specific point
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

      // Data refreshes
      rerender(
        <QueryClientProvider client={queryClient}>
          <PortfolioChart
            portfolioData={ChartTestFixtures.mediumPortfolioData()}
            allocationData={ChartTestFixtures.allocationBtcToEth()}
            activeTab="allocation"
          />
        </QueryClientProvider>
      );

      // Chart should update but hover should still work
      if (allocationSvg) {
        await userEvent.pointer({
          target: allocationSvg,
          coords: { clientX: 500, clientY: 150 },
        });
      }

      await waitFor(() => {
        const line = container.querySelector('line[stroke="#8b5cf6"]');
        expect(line).not.toBeNull();
        const x = Number(line?.getAttribute("x1"));
        expect(Number.isFinite(x)).toBe(true);
        expect(Math.abs(x - 500)).toBeLessThanOrEqual(20);
      });
    });
  });

  describe("User Flow: Accessibility Workflows", () => {
    it("should support keyboard-only navigation", async () => {
      renderChart();

      // Tab to first interactive element
      await userEvent.tab();

      // Should focus on a tab
      const focusedElement = document.activeElement;
      expect(focusedElement).toBeTruthy();
      expect(focusedElement?.getAttribute("role")).toMatch(/tab|button/i);

      // Arrow key navigation
      await userEvent.keyboard("{ArrowRight}");

      // Should move to next tab
      const newFocusedElement = document.activeElement;
      expect(newFocusedElement).toBeTruthy();
    });

    it("should announce chart changes to screen readers", async () => {
      const { container, rerender } = renderChart("performance");

      // Check for ARIA live region or labels
      const ariaLive = container.querySelector("[aria-live]");
      const ariaLabels = container.querySelectorAll("[aria-label]");

      expect(ariaLive || ariaLabels.length > 0).toBe(true);

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

      // Should update ARIA labels
      const newAriaLabels = container.querySelectorAll("[aria-label]");
      expect(newAriaLabels.length).toBeGreaterThan(0);
    });
  });
});
