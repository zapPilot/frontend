import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ChartTooltip } from "@/components/charts/ChartTooltip";
import type { PerformanceHoverData } from "@/types/chartHover";

vi.mock("framer-motion", () => ({
  motion: {
    div: vi.fn(({ children, ...props }) => <div {...props}>{children}</div>),
  },
}));

const baseHoverPoint: PerformanceHoverData = {
  chartType: "performance",
  date: "2025-02-01",
  x: 640,
  y: 60,
  value: 10000,
  benchmark: 9500,
};

describe("ChartTooltip", () => {
  it("renders performance tooltip content with accessible role", () => {
    render(
      <ChartTooltip
        hoveredPoint={baseHoverPoint}
        chartWidth={800}
        chartHeight={300}
      />
    );

    const tooltip = screen.getByRole("tooltip");
    expect(tooltip).toBeInTheDocument();
    expect(tooltip).toHaveAttribute("data-chart-type", "performance");
    expect(screen.getByText("Portfolio")).toBeInTheDocument();
    expect(screen.getByText("$10,000.00")).toBeInTheDocument();
  });

  it("filters allocation categories below threshold", () => {
    render(
      <ChartTooltip
        hoveredPoint={{
          chartType: "allocation",
          date: "2025-02-01",
          x: 320,
          y: 180,
          btc: 48,
          eth: 36,
          stablecoin: 0.4,
          altcoin: 0,
        }}
        chartWidth={800}
        chartHeight={300}
      />
    );

    expect(screen.getByText("BTC")).toBeInTheDocument();
    expect(screen.getByText("ETH")).toBeInTheDocument();
    expect(screen.queryByText("Stablecoin")).not.toBeInTheDocument();
  });

  it("clamps tooltip position when hover is near top-right legend", () => {
    render(
      <ChartTooltip
        hoveredPoint={{
          chartType: "volatility",
          date: "2025-02-01",
          x: 760,
          y: 40,
          volatility: 28,
          riskLevel: "High",
        }}
        chartWidth={800}
        chartHeight={300}
      />
    );

    const tooltip = screen.getByRole("tooltip") as HTMLDivElement;
    expect(parseFloat(tooltip.style.left)).toBeLessThanOrEqual(60);
    expect(parseFloat(tooltip.style.top)).toBeGreaterThanOrEqual(34);
    expect(screen.getByText(/High volatility warning/i)).toBeInTheDocument();
  });
});
