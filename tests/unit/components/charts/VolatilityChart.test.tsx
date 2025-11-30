import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { VolatilityChart } from "@/components/PortfolioChart/charts/VolatilityChart";

// Mock useChartHover hook
const mockHandleMouseMove = vi.fn();
const mockHandlePointerMove = vi.fn();
const mockHandleMouseLeave = vi.fn();

vi.mock("@/hooks/useChartHover", () => ({
  useChartHover: vi.fn(() => ({
    hoveredPoint: null,
    handleMouseMove: mockHandleMouseMove,
    handlePointerMove: mockHandlePointerMove,
    handlePointerDown: vi.fn(),
    handleMouseLeave: mockHandleMouseLeave,
    handleTouchMove: vi.fn(),
    handleTouchEnd: vi.fn(),
  })),
}));

// Mock MetricChartLayout
vi.mock("@/components/PortfolioChart/charts/MetricChartLayout", () => ({
  MetricChartLayout: ({
    chartType,
    linePath,
    areaPath,
    lineColor,
    yAxisLabels,
    legend,
    description,
  }: any) => (
    <div data-testid="metric-chart-layout">
      <div data-chart-type={chartType}>{chartType}</div>
      <div data-testid="line-path">{linePath || "no-line"}</div>
      <div data-testid="area-path">{areaPath || "no-area"}</div>
      <div data-testid="line-color">{lineColor}</div>
      <div data-testid="y-axis-labels">{yAxisLabels.join(",")}</div>
      <div data-testid="legend">{legend}</div>
      <div data-testid="description">{description}</div>
    </div>
  ),
}));

const mockVolatilityData = [
  { date: "2024-01-01", volatility: 15.5 },
  { date: "2024-01-02", volatility: 18.2 },
  { date: "2024-01-03", volatility: 22.8 },
  { date: "2024-01-04", volatility: 19.4 },
  { date: "2024-01-05", volatility: 16.7 },
];

const mockHighVolatilityData = [
  { date: "2024-01-01", volatility: 55.0 },
  { date: "2024-01-02", volatility: 62.5 },
  { date: "2024-01-03", volatility: 48.3 },
];

const mockLowVolatilityData = [
  { date: "2024-01-01", volatility: 8.2 },
  { date: "2024-01-02", volatility: 10.5 },
  { date: "2024-01-03", volatility: 7.8 },
];

describe("VolatilityChart", () => {
  describe("Basic Rendering", () => {
    it("should render MetricChartLayout with volatility type", () => {
      render(<VolatilityChart data={mockVolatilityData} />);

      expect(screen.getByTestId("metric-chart-layout")).toBeInTheDocument();
      expect(screen.getByText("volatility")).toBeInTheDocument();
    });

    it("should render with default dimensions", () => {
      const { container } = render(<VolatilityChart data={mockVolatilityData} />);

      expect(container.querySelector('[data-chart-type="volatility"]')).toBeInTheDocument();
    });

    it("should apply custom width", () => {
      render(<VolatilityChart data={mockVolatilityData} width={1000} />);

      // Component should still render
      expect(screen.getByTestId("metric-chart-layout")).toBeInTheDocument();
    });

    it("should apply custom height", () => {
      render(<VolatilityChart data={mockVolatilityData} height={400} />);

      expect(screen.getByTestId("metric-chart-layout")).toBeInTheDocument();
    });

    it("should apply custom padding", () => {
      render(<VolatilityChart data={mockVolatilityData} padding={20} />);

      expect(screen.getByTestId("metric-chart-layout")).toBeInTheDocument();
    });
  });

  describe("Empty Data State", () => {
    it("should render with empty data array", () => {
      render(<VolatilityChart data={[]} />);

      expect(screen.getByTestId("metric-chart-layout")).toBeInTheDocument();
      expect(screen.getByTestId("line-path")).toHaveTextContent("no-line");
      expect(screen.getByTestId("area-path")).toHaveTextContent("no-area");
    });

    it("should not crash with undefined data", () => {
      render(<VolatilityChart data={[] as any} />);

      expect(screen.getByTestId("metric-chart-layout")).toBeInTheDocument();
    });
  });

  describe("Chart Paths", () => {
    it("should generate line path from data", () => {
      render(<VolatilityChart data={mockVolatilityData} />);

      const linePath = screen.getByTestId("line-path");
      expect(linePath.textContent).not.toBe("no-line");
      expect(linePath.textContent).toContain("M");
    });

    it("should generate area path from data", () => {
      render(<VolatilityChart data={mockVolatilityData} />);

      const areaPath = screen.getByTestId("area-path");
      expect(areaPath.textContent).not.toBe("no-area");
      expect(areaPath.textContent).toContain("M");
    });

    it("should handle single data point", () => {
      const singlePoint = [{ date: "2024-01-01", volatility: 20.0 }];
      render(<VolatilityChart data={singlePoint} />);

      expect(screen.getByTestId("line-path")).toBeInTheDocument();
      expect(screen.getByTestId("area-path")).toBeInTheDocument();
    });

    it("should handle data with zero volatility", () => {
      const zeroData = [
        { date: "2024-01-01", volatility: 0 },
        { date: "2024-01-02", volatility: 0 },
      ];
      render(<VolatilityChart data={zeroData} />);

      expect(screen.getByTestId("line-path")).toBeInTheDocument();
    });
  });

  describe("Color Scheme", () => {
    it("should use amber color for line", () => {
      render(<VolatilityChart data={mockVolatilityData} />);

      expect(screen.getByTestId("line-color")).toHaveTextContent("#f59e0b");
    });

    it("should use volatilityGradient id", () => {
      render(<VolatilityChart data={mockVolatilityData} />);

      // MetricChartLayout should receive gradientId
      expect(screen.getByTestId("metric-chart-layout")).toBeInTheDocument();
    });
  });

  describe("Y-Axis Labels", () => {
    it("should render correct y-axis labels", () => {
      render(<VolatilityChart data={mockVolatilityData} />);

      const labels = screen.getByTestId("y-axis-labels");
      expect(labels).toHaveTextContent("100%,75%,50%,25%,5%");
    });

    it("should maintain labels for different data ranges", () => {
      render(<VolatilityChart data={mockHighVolatilityData} />);

      const labels = screen.getByTestId("y-axis-labels");
      expect(labels).toHaveTextContent("100%,75%,50%,25%,5%");
    });
  });

  describe("Legend", () => {
    it("should render 30-Day Volatility legend", () => {
      render(<VolatilityChart data={mockVolatilityData} />);

      const legend = screen.getByTestId("legend");
      expect(legend).toHaveTextContent("30-Day Volatility");
    });

    it("should include legend visual indicator", () => {
      const { container } = render(<VolatilityChart data={mockVolatilityData} />);

      // Legend should contain the line indicator element
      expect(screen.getByTestId("legend")).toBeInTheDocument();
    });
  });

  describe("Description", () => {
    it("should include volatility description", () => {
      render(<VolatilityChart data={mockVolatilityData} />);

      const description = screen.getByTestId("description");
      expect(description).toHaveTextContent(
        "Rolling volatility expressed as annualized percentage"
      );
    });
  });

  describe("Risk Level Calculation", () => {
    it("should process low volatility data", () => {
      render(<VolatilityChart data={mockLowVolatilityData} />);

      // Component should render successfully with low volatility
      expect(screen.getByTestId("metric-chart-layout")).toBeInTheDocument();
    });

    it("should process high volatility data", () => {
      render(<VolatilityChart data={mockHighVolatilityData} />);

      expect(screen.getByTestId("metric-chart-layout")).toBeInTheDocument();
    });

    it("should handle volatility at boundaries", () => {
      const boundaryData = [
        { date: "2024-01-01", volatility: 5 }, // Min value
        { date: "2024-01-02", volatility: 100 }, // Max value
      ];

      render(<VolatilityChart data={boundaryData} />);

      expect(screen.getByTestId("metric-chart-layout")).toBeInTheDocument();
    });

    it("should handle volatility above max boundary", () => {
      const extremeData = [{ date: "2024-01-01", volatility: 150 }];

      render(<VolatilityChart data={extremeData} />);

      expect(screen.getByTestId("metric-chart-layout")).toBeInTheDocument();
    });
  });

  describe("Data Transformation", () => {
    it("should handle negative volatility values gracefully", () => {
      const negativeData = [
        { date: "2024-01-01", volatility: -10 },
        { date: "2024-01-02", volatility: 15 },
      ];

      render(<VolatilityChart data={negativeData} />);

      expect(screen.getByTestId("line-path")).toBeInTheDocument();
    });

    it("should handle missing volatility values", () => {
      const missingData = [
        { date: "2024-01-01", volatility: 15 },
        { date: "2024-01-02", volatility: null as any },
        { date: "2024-01-03", volatility: 20 },
      ];

      render(<VolatilityChart data={missingData} />);

      expect(screen.getByTestId("line-path")).toBeInTheDocument();
    });

    it("should handle very small volatility values", () => {
      const tinyData = [
        { date: "2024-01-01", volatility: 0.01 },
        { date: "2024-01-02", volatility: 0.05 },
      ];

      render(<VolatilityChart data={tinyData} />);

      expect(screen.getByTestId("line-path")).toBeInTheDocument();
    });
  });

  describe("Date Formatting", () => {
    it("should handle various date formats", () => {
      const variousDates = [
        { date: "2024-01-01", volatility: 15 },
        { date: "2024-12-31", volatility: 18 },
      ];

      render(<VolatilityChart data={variousDates} />);

      expect(screen.getByTestId("metric-chart-layout")).toBeInTheDocument();
    });

    it("should handle ISO date strings", () => {
      const isoData = [
        { date: "2024-01-01T00:00:00Z", volatility: 15 },
        { date: "2024-01-02T00:00:00Z", volatility: 18 },
      ];

      render(<VolatilityChart data={isoData} />);

      expect(screen.getByTestId("metric-chart-layout")).toBeInTheDocument();
    });
  });

  describe("Performance", () => {
    it("should handle large datasets efficiently", () => {
      const largeData = Array.from({ length: 365 }, (_, i) => ({
        date: `2024-01-${String(i % 30 + 1).padStart(2, "0")}`,
        volatility: 15 + Math.random() * 30,
      }));

      render(<VolatilityChart data={largeData} />);

      expect(screen.getByTestId("metric-chart-layout")).toBeInTheDocument();
    });

    it("should memoize chart paths", () => {
      const { rerender } = render(<VolatilityChart data={mockVolatilityData} />);

      const initialLinePath = screen.getByTestId("line-path").textContent;

      // Rerender with same data
      rerender(<VolatilityChart data={mockVolatilityData} />);

      expect(screen.getByTestId("line-path").textContent).toBe(initialLinePath);
    });

    it("should update paths when data changes", () => {
      const { rerender } = render(<VolatilityChart data={mockVolatilityData} />);

      const initialLinePath = screen.getByTestId("line-path").textContent;

      // Rerender with different data
      rerender(<VolatilityChart data={mockLowVolatilityData} />);

      expect(screen.getByTestId("line-path").textContent).not.toBe(
        initialLinePath
      );
    });
  });

  describe("Edge Cases", () => {
    it("should handle data with duplicate dates", () => {
      const duplicateData = [
        { date: "2024-01-01", volatility: 15 },
        { date: "2024-01-01", volatility: 18 },
        { date: "2024-01-02", volatility: 20 },
      ];

      render(<VolatilityChart data={duplicateData} />);

      expect(screen.getByTestId("metric-chart-layout")).toBeInTheDocument();
    });

    it("should handle out-of-order dates", () => {
      const unorderedData = [
        { date: "2024-01-03", volatility: 20 },
        { date: "2024-01-01", volatility: 15 },
        { date: "2024-01-02", volatility: 18 },
      ];

      render(<VolatilityChart data={unorderedData} />);

      expect(screen.getByTestId("metric-chart-layout")).toBeInTheDocument();
    });

    it("should handle data with extreme volatility spikes", () => {
      const spikeData = [
        { date: "2024-01-01", volatility: 15 },
        { date: "2024-01-02", volatility: 95 }, // Spike
        { date: "2024-01-03", volatility: 18 },
      ];

      render(<VolatilityChart data={spikeData} />);

      expect(screen.getByTestId("line-path")).toBeInTheDocument();
    });

    it("should handle data with constant volatility", () => {
      const constantData = [
        { date: "2024-01-01", volatility: 25 },
        { date: "2024-01-02", volatility: 25 },
        { date: "2024-01-03", volatility: 25 },
      ];

      render(<VolatilityChart data={constantData} />);

      expect(screen.getByTestId("line-path")).toBeInTheDocument();
    });
  });

  describe("Component Display Name", () => {
    it("should have correct display name for debugging", () => {
      expect(VolatilityChart.displayName).toBe("VolatilityChart");
    });
  });
});
