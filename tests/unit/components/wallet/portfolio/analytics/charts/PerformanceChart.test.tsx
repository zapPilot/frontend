import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { PerformanceChart } from "@/components/wallet/portfolio/analytics/charts/PerformanceChart";

// Mock dependencies
vi.mock("@/hooks/useChartHover", () => ({
  useChartHover: () => ({
    hoveredPoint: null,
    onMouseMove: vi.fn(),
    onMouseLeave: vi.fn(),
    isHovering: false,
  }),
}));

vi.mock("@/components/charts", () => ({
  ChartIndicator: () => <div data-testid="chart-indicator" />,
  ChartTooltip: () => <div data-testid="chart-tooltip" />,
}));

vi.mock("../utils/chartHelpers", () => ({
  buildPath: () => "M 0 0 L 100 100",
  CHART_GRID_POSITIONS: { FIVE_LINES: [] },
}));

vi.mock("./ChartUI", () => ({
  ChartGridLines: () => <div data-testid="chart-grid-lines" />,
  ChartSurface: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="chart-surface">{children}</div>
  ),
}));

describe("PerformanceChart", () => {
  const mockData = [
    {
      x: 0,
      portfolio: 50,
      btc: 50,
      date: "2024-01-01",
      portfolioValue: 10000,
      btcBenchmarkValue: 10000,
    },
    {
      x: 100,
      portfolio: 60,
      btc: 55,
      date: "2024-01-02",
      portfolioValue: 12000,
      btcBenchmarkValue: 11000,
    },
  ];

  it("renders Legend without info icon", () => {
    render(
      <PerformanceChart
        chartData={mockData}
        startDate="2024-01-01"
        endDate="2024-01-02"
      />
    );

    // Legend items
    expect(screen.getByText("Portfolio")).toBeInTheDocument();
    expect(screen.getByText("BTC Benchmark")).toBeInTheDocument();

    // Check for SVG icon in the legend container
    // The "BTC Benchmark" text is in a span. The SVG *was* a sibling of that span.
    // We can get the benchmark text element, and check its parent's children.
    const benchmarkText = screen.getByText("BTC Benchmark");
    const parent = benchmarkText.parentElement;

    // Previously: Div > [Div(Line), Span(Text), SVG(Icon)]
    // Now: Div > [Div(Line), Span(Text)]
    // We expect NO svg element in the parent
    const svgIcon = parent?.querySelector("svg");
    expect(svgIcon).toBeNull();
  });
});
