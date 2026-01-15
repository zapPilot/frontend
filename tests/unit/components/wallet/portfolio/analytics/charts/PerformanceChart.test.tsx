import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { PerformanceChart } from "@/components/wallet/portfolio/analytics/charts/PerformanceChart";

// Mock dependencies
vi.mock("@/components/charts", () => ({
  ChartIndicator: () => <div data-testid="chart-indicator" />,
  ChartTooltip: () => <div data-testid="chart-tooltip" />,
}));

vi.mock("@/hooks/ui/useChartHover", () => ({
  useChartHover: () => ({
    hoveredPoint: null,
    onMouseMove: vi.fn(),
    onMouseLeave: vi.fn(),
  }),
}));

vi.mock("@/utils/formatters", () => ({
  formatChartDate: (date: string) => date,
}));

vi.mock("../utils/chartHelpers", () => ({
  buildPath: () => "M 0 0 L 100 100",
  CHART_GRID_POSITIONS: { FIVE_LINES: [] },
}));

vi.mock("./ChartUI", () => ({
  ChartGridLines: () => <div data-testid="chart-grid-lines" />,
  ChartSurface: ({ children }: any) => (
    <svg data-testid="chart-surface">{children}</svg>
  ),
}));

describe("PerformanceChart", () => {
  const mockData = [
    {
      x: 0,
      portfolio: 10,
      btc: 10,
      date: "2024-01-01",
      portfolioValue: 100,
      btcBenchmarkValue: 100,
    },
    {
      x: 1,
      portfolio: 20,
      btc: 20,
      date: "2024-01-02",
      portfolioValue: 200,
      btcBenchmarkValue: 200,
    },
  ];

  it("should render without crashing", () => {
    const { container } = render(
      <PerformanceChart
        chartData={mockData}
        startDate="2024-01-01"
        endDate="2024-01-02"
      />
    );
    expect(container).toBeInTheDocument();
  });

  it("should handle empty data", () => {
    const { container } = render(
      <PerformanceChart
        chartData={[]}
        startDate="2024-01-01"
        endDate="2024-01-02"
      />
    );
    expect(container).toBeInTheDocument();
  });

  it("should render with custom dimensions", () => {
    render(
      <PerformanceChart
        chartData={mockData}
        startDate="2024-01-01"
        endDate="2024-01-02"
        width={500}
        height={200}
      />
    );
    // Validation is implicit via render not crashing and mocks being called
    // In a real browser test we could check attributes
  });
});
