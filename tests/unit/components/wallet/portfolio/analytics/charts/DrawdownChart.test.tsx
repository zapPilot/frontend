import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { DrawdownChart } from "@/components/wallet/portfolio/analytics/charts/DrawdownChart";

// Mock ChartUI components
vi.mock("@/components/wallet/portfolio/analytics/charts/ChartUI", () => ({
  ChartGridLines: () => <div data-testid="grid-lines" />,
  ChartSurface: ({ children }: any) => (
    <svg data-testid="chart-surface">{children}</svg>
  ),
  YAxisLabels: () => <div data-testid="y-axis-labels" />,
}));

// Mock Chart components
vi.mock("@/components/charts", () => ({
  ChartIndicator: () => <div data-testid="chart-indicator" />,
  ChartTooltip: () => <div data-testid="chart-tooltip" />,
}));

// Mock chart helpers
vi.mock("@/hooks/ui/useChartHover", () => ({
  useChartHover: () => ({
    hoveredPoint: null,
    onMouseMove: vi.fn(),
    onMouseLeave: vi.fn(),
  }),
}));

vi.mock("../utils/chartHelpers", () => ({
  buildPath: () => "M 0,0 L 100,100",
  CHART_GRID_POSITIONS: { FOUR_LINES: [] },
}));

describe("DrawdownChart", () => {
  const mockData = [
    { x: 1, value: -10, date: "2024-01-01" },
    { x: 2, value: -5, date: "2024-01-02" },
  ];

  it("renders correctly with data", () => {
    render(<DrawdownChart chartData={mockData} maxDrawdown={-15} />);

    expect(screen.getByTestId("chart-surface")).toBeInTheDocument();
    expect(screen.getByText(/-15.0% Max/)).toBeInTheDocument();
    expect(screen.getByText("Drawdown")).toBeInTheDocument();
  });

  it("renders correct max drawdown label", () => {
    render(<DrawdownChart chartData={mockData} maxDrawdown={-25.5} />);
    expect(screen.getByText(/-25.5% Max/)).toBeInTheDocument();
  });
});
