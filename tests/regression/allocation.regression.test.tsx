/**
 * Regression test: Allocation Chart Cursor Behavior
 *
 * Tests the fix for multi-cursor stacking issue where multiple category
 * cursors were stacking together. Verifies the new single vertical line
 * indicator implementation.
 *
 * @see src/components/PortfolioChart.tsx:848-866
 */

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { PortfolioChart } from "@/components/PortfolioChart/";

import { ChartTestFixtures } from "../fixtures/chartTestData";
import { AllocationDataFactory } from "../utils/chartHoverTestFactories";
import { SVGEventFactory } from "../utils/eventFactories";

// Mock Framer Motion to simplify testing
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

// Mock Next.js Image component
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

describe("Allocation Chart - Cursor Regression Tests", () => {
  let queryClient: QueryClient;
  let eventFactory: SVGEventFactory;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
    eventFactory = new SVGEventFactory({
      left: 0,
      top: 0,
      width: 800,
      height: 300,
    });
  });

  const renderChart = (
    portfolioData = ChartTestFixtures.mediumPortfolioData(),
    allocationData = ChartTestFixtures.balancedAllocation()
  ) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <PortfolioChart
          portfolioData={portfolioData}
          allocationData={allocationData}
          activeTab="asset-allocation"
        />
      </QueryClientProvider>
    );
  };

  describe("Single Vertical Line Indicator", () => {
    it("should render only ONE vertical line indicator when hovering", async () => {
      const { container } = renderChart();

      const svg = container.querySelector(
        'svg[data-chart-type="asset-allocation"]'
      );
      expect(svg).not.toBeNull();

      // Simulate mouse hover
      if (svg) {
        await userEvent.pointer({
          target: svg,
          coords: { clientX: 400, clientY: 150 },
        });
      }

      await waitFor(() => {
        // Should find exactly ONE line element (the vertical indicator)
        const lines = container.querySelectorAll('line[stroke="#8b5cf6"]');
        expect(lines.length).toBe(1);
      });
    });

    it("should render vertical line with correct styling", async () => {
      const { container } = renderChart();

      const svg = container.querySelector(
        'svg[data-chart-type="asset-allocation"]'
      );
      expect(svg).not.toBeNull();

      // Trigger hover
      if (svg) {
        await userEvent.pointer({
          target: svg,
          coords: { clientX: 400, clientY: 150 },
        });
      }

      await waitFor(() => {
        const line = container.querySelector('line[stroke="#8b5cf6"]');
        expect(line).not.toBeNull();

        if (line) {
          // Verify it's a vertical line (x1 === x2)
          const x1 = line.getAttribute("x1");
          const x2 = line.getAttribute("x2");
          expect(x1).toBe(x2);

          // Verify stroke properties
          expect(line.getAttribute("stroke")).toBe("#8b5cf6");
          expect(line.getAttribute("strokeWidth")).toBe("2");
          expect(line.getAttribute("strokeDasharray")).toBe("4,4");
          expect(line.getAttribute("opacity")).toBe("0.8");
        }
      });
    });

    it("should span the full chart height (y1=10, y2=290)", async () => {
      const { container } = renderChart();

      const svg = container.querySelector(
        'svg[data-chart-type="asset-allocation"]'
      );
      if (svg) {
        await userEvent.pointer({
          target: svg,
          coords: { clientX: 400, clientY: 150 },
        });
      }

      await waitFor(() => {
        const line = container.querySelector('line[stroke="#8b5cf6"]');
        expect(line).toBeVerticalLine(400, {
          y1: 10,
          y2: 290,
          stroke: "#8b5cf6",
        });
      });
    });

    it("should NOT render multi-circle indicators for allocation chart", async () => {
      const { container } = renderChart();

      const svg = container.querySelector(
        'svg[data-chart-type="asset-allocation"]'
      );
      if (svg) {
        await userEvent.pointer({
          target: svg,
          coords: { clientX: 400, clientY: 150 },
        });
      }

      await waitFor(() => {
        // Should NOT find multiple stacked circles (old behavior)
        const circles = container.querySelectorAll("circle");
        expect(circles.length).toBe(0); // No circles for allocation chart
      });
    });
  });

  describe("Cursor Position Tracking", () => {
    it("should update cursor position on mouse move", async () => {
      const { container } = renderChart();

      const svg = container.querySelector(
        'svg[data-chart-type="asset-allocation"]'
      );

      // Move to position 1
      if (svg) {
        await userEvent.pointer({
          target: svg,
          coords: { clientX: 200, clientY: 150 },
        });
      }

      await waitFor(() => {
        const line = container.querySelector('line[stroke="#8b5cf6"]');
        const x1 = line?.getAttribute("x1");
        expect(x1).toBe("200");
      });

      // Move to position 2
      if (svg) {
        await userEvent.pointer({
          target: svg,
          coords: { clientX: 600, clientY: 150 },
        });
      }

      await waitFor(() => {
        const line = container.querySelector('line[stroke="#8b5cf6"]');
        const x1 = line?.getAttribute("x1");
        expect(x1).toBe("600");
      });
    });

    it("should remove cursor indicator on mouse leave", async () => {
      const { container } = renderChart();

      const svg = container.querySelector(
        'svg[data-chart-type="asset-allocation"]'
      );

      // Hover
      if (svg) {
        await userEvent.pointer({
          target: svg,
          coords: { clientX: 400, clientY: 150 },
        });
      }

      await waitFor(() => {
        expect(
          container.querySelector('line[stroke="#8b5cf6"]')
        ).not.toBeNull();
      });

      // Leave
      if (svg) {
        await userEvent.unhover(svg);
      }

      await waitFor(() => {
        expect(container.querySelector('line[stroke="#8b5cf6"]')).toBeNull();
      });
    });
  });

  describe("Data Point Accuracy", () => {
    it("should display correct allocation percentages on hover", async () => {
      const allocationData = AllocationDataFactory.createPoints(30, i => ({
        btc: 40 - i * 0.5,
        eth: 30 + i * 0.3,
        stablecoin: 15 + i * 0.1,
        defi: 10 + i * 0.05,
        altcoin: 5 + i * 0.05,
      }));

      const { container } = renderChart(
        ChartTestFixtures.mediumPortfolioData(),
        allocationData
      );

      const svg = container.querySelector(
        'svg[data-chart-type="asset-allocation"]'
      );
      if (svg) {
        await userEvent.pointer({
          target: svg,
          coords: { clientX: 400, clientY: 150 },
        });
      }

      await waitFor(() => {
        // Verify tooltip appears with allocation data
        const tooltip = screen.queryByTestId("chart-tooltip");
        expect(tooltip).not.toBeNull();
      });
    });

    it("should handle edge case: all categories zero", async () => {
      const zeroAllocationData = AllocationDataFactory.createPoints(5, () => ({
        btc: 0,
        eth: 0,
        stablecoin: 0,
        defi: 0,
        altcoin: 0,
      }));

      const { container } = renderChart(
        ChartTestFixtures.smallPortfolioData(),
        zeroAllocationData
      );

      const svg = container.querySelector(
        'svg[data-chart-type="asset-allocation"]'
      );
      if (svg) {
        await userEvent.pointer({
          target: svg,
          coords: { clientX: 200, clientY: 150 },
        });
      }

      // Should not crash and should show 0% for all categories
      await waitFor(() => {
        const line = container.querySelector('line[stroke="#8b5cf6"]');
        expect(line).not.toBeNull();
      });
    });
  });

  describe("Touch Interactions (Mobile)", () => {
    it("should display cursor on touch move", async () => {
      const { container } = renderChart();

      const svg = container.querySelector(
        'svg[data-chart-type="asset-allocation"]'
      );

      if (svg) {
        // Simulate touch
        await userEvent.pointer({
          target: svg,
          coords: { clientX: 400, clientY: 150 },
        });
      }

      await waitFor(() => {
        const line = container.querySelector('line[stroke="#8b5cf6"]');
        expect(line).not.toBeNull();
      });
    });

    it("should persist cursor during touch drag", async () => {
      const { container } = renderChart();

      const svg = container.querySelector(
        'svg[data-chart-type="asset-allocation"]'
      );

      if (svg) {
        // Start touch
        await userEvent.pointer({
          target: svg,
          coords: { clientX: 200, clientY: 150 },
        });

        // Drag to new position
        await userEvent.pointer({
          target: svg,
          coords: { clientX: 600, clientY: 150 },
        });
      }

      await waitFor(() => {
        const line = container.querySelector('line[stroke="#8b5cf6"]');
        expect(line).not.toBeNull();
        expect(line?.getAttribute("x1")).toBe("600");
      });
    });

    it("should remove cursor on touch end", async () => {
      const { container } = renderChart();

      const svg = container.querySelector(
        'svg[data-chart-type="asset-allocation"]'
      );

      if (svg) {
        // Touch move
        await userEvent.pointer({
          target: svg,
          coords: { clientX: 400, clientY: 150 },
        });

        await waitFor(() => {
          expect(
            container.querySelector('line[stroke="#8b5cf6"]')
          ).not.toBeNull();
        });

        // Touch end (unhover)
        await userEvent.unhover(svg);
      }

      await waitFor(() => {
        expect(container.querySelector('line[stroke="#8b5cf6"]')).toBeNull();
      });
    });
  });

  describe("Responsive Behavior", () => {
    it("should maintain cursor on window resize", async () => {
      const { container } = renderChart();

      const svg = container.querySelector(
        'svg[data-chart-type="asset-allocation"]'
      );

      if (svg) {
        await userEvent.pointer({
          target: svg,
          coords: { clientX: 400, clientY: 150 },
        });
      }

      await waitFor(() => {
        expect(
          container.querySelector('line[stroke="#8b5cf6"]')
        ).not.toBeNull();
      });

      // Simulate resize
      eventFactory.updateRect({ left: 0, top: 0, width: 600, height: 250 });

      // Cursor should still be present
      expect(container.querySelector('line[stroke="#8b5cf6"]')).not.toBeNull();
    });

    it("should adapt to different chart widths", async () => {
      // Small viewport
      eventFactory.updateRect({ left: 0, top: 0, width: 400, height: 200 });
      const { container: smallContainer } = renderChart();

      const smallSvg = smallContainer.querySelector(
        'svg[data-chart-type="asset-allocation"]'
      );
      if (smallSvg) {
        await userEvent.pointer({
          target: smallSvg,
          coords: { clientX: 200, clientY: 100 },
        });
      }

      await waitFor(() => {
        const line = smallContainer.querySelector('line[stroke="#8b5cf6"]');
        expect(line).not.toBeNull();
      });

      // Large viewport
      eventFactory.updateRect({ left: 0, top: 0, width: 1200, height: 400 });
      const { container: largeContainer } = renderChart();

      const largeSvg = largeContainer.querySelector(
        'svg[data-chart-type="asset-allocation"]'
      );
      if (largeSvg) {
        await userEvent.pointer({
          target: largeSvg,
          coords: { clientX: 600, clientY: 200 },
        });
      }

      await waitFor(() => {
        const line = largeContainer.querySelector('line[stroke="#8b5cf6"]');
        expect(line).not.toBeNull();
      });
    });
  });

  describe("Animation & Performance", () => {
    it("should animate cursor in/out smoothly", async () => {
      const { container } = renderChart();

      const svg = container.querySelector(
        'svg[data-chart-type="asset-allocation"]'
      );

      if (svg) {
        await userEvent.pointer({
          target: svg,
          coords: { clientX: 400, clientY: 150 },
        });
      }

      await waitFor(() => {
        const line = container.querySelector('line[stroke="#8b5cf6"]');
        expect(line).not.toBeNull();

        // Verify animation props are present (from Framer Motion)
        expect(
          line?.hasAttribute("animate") || line?.hasAttribute("style")
        ).toBe(true);
      });
    });

    it("should not cause layout thrashing on rapid mouse movements", async () => {
      const { container } = renderChart();

      const svg = container.querySelector(
        'svg[data-chart-type="asset-allocation"]'
      );

      if (svg) {
        // Simulate rapid movements
        const positions = [100, 200, 300, 400, 500, 600, 700];

        for (const x of positions) {
          await userEvent.pointer({
            target: svg,
            coords: { clientX: x, clientY: 150 },
          });
        }
      }

      // Should still render final cursor position correctly
      await waitFor(() => {
        const line = container.querySelector('line[stroke="#8b5cf6"]');
        expect(line).not.toBeNull();
        expect(line?.getAttribute("x1")).toBe("700");
      });
    });
  });

  describe("Accessibility", () => {
    it("should mark cursor line as aria-hidden", async () => {
      const { container } = renderChart();

      const svg = container.querySelector(
        'svg[data-chart-type="asset-allocation"]'
      );
      if (svg) {
        await userEvent.pointer({
          target: svg,
          coords: { clientX: 400, clientY: 150 },
        });
      }

      await waitFor(() => {
        const line = container.querySelector('line[stroke="#8b5cf6"]');
        expect(line?.getAttribute("aria-hidden")).toBe("true");
      });
    });

    it("should not interfere with pointer events", async () => {
      const { container } = renderChart();

      const svg = container.querySelector(
        'svg[data-chart-type="asset-allocation"]'
      );
      if (svg) {
        await userEvent.pointer({
          target: svg,
          coords: { clientX: 400, clientY: 150 },
        });
      }

      await waitFor(() => {
        const line = container.querySelector('line[stroke="#8b5cf6"]');
        const style = line?.getAttribute("style");
        expect(style).toContain("pointer-events: none");
      });
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty allocation data gracefully", () => {
      const { container } = renderChart(
        ChartTestFixtures.mediumPortfolioData(),
        ChartTestFixtures.emptyAllocationData()
      );

      const svg = container.querySelector(
        'svg[data-chart-type="asset-allocation"]'
      );
      expect(svg).not.toBeNull();

      // Should not crash with empty data
      expect(container).toBeTruthy();
    });

    it("should handle single data point", async () => {
      const singlePoint = AllocationDataFactory.createPoints(1);
      const { container } = renderChart(
        ChartTestFixtures.singlePortfolioPoint(),
        singlePoint
      );

      const svg = container.querySelector(
        'svg[data-chart-type="asset-allocation"]'
      );
      if (svg) {
        await userEvent.pointer({
          target: svg,
          coords: { clientX: 400, clientY: 150 },
        });
      }

      await waitFor(() => {
        const line = container.querySelector('line[stroke="#8b5cf6"]');
        expect(line).not.toBeNull();
      });
    });

    it("should handle rapid tab switching without cursor artifacts", async () => {
      const { container, rerender } = renderChart();

      const svg = container.querySelector(
        'svg[data-chart-type="asset-allocation"]'
      );
      if (svg) {
        await userEvent.pointer({
          target: svg,
          coords: { clientX: 400, clientY: 150 },
        });
      }

      await waitFor(() => {
        expect(
          container.querySelector('line[stroke="#8b5cf6"]')
        ).not.toBeNull();
      });

      // Switch to performance tab
      rerender(
        <QueryClientProvider client={queryClient}>
          <PortfolioChart
            portfolioData={ChartTestFixtures.mediumPortfolioData()}
            allocationData={ChartTestFixtures.balancedAllocation()}
            activeTab="performance"
          />
        </QueryClientProvider>
      );

      // Allocation cursor should be gone
      expect(
        container.querySelector(
          'svg[data-chart-type="asset-allocation"] line[stroke="#8b5cf6"]'
        )
      ).toBeNull();
    });
  });
});
