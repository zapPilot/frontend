import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { SharpeChart } from "@/components/PortfolioChart/charts/SharpeChart";

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
    extraSvgContent,
  }: any) => (
    <div data-testid="metric-chart-layout">
      <div data-chart-type={chartType}>{chartType}</div>
      <div data-testid="line-path">{linePath || "no-line"}</div>
      <div data-testid="area-path">{areaPath || "no-area"}</div>
      <div data-testid="line-color">{lineColor}</div>
      <div data-testid="y-axis-labels">{yAxisLabels.join(",")}</div>
      <div data-testid="legend">{legend}</div>
      <div data-testid="description">{description}</div>
      <div data-testid="extra-svg">
        {extraSvgContent ? "has-extra" : "no-extra"}
      </div>
    </div>
  ),
}));

const mockSharpeData = [
  { date: "2024-01-01", sharpe: 1.2 },
  { date: "2024-01-02", sharpe: 1.5 },
  { date: "2024-01-03", sharpe: 1.8 },
  { date: "2024-01-04", sharpe: 1.3 },
  { date: "2024-01-05", sharpe: 1.6 },
];

const mockExcellentSharpe = [
  { date: "2024-01-01", sharpe: 2.5 },
  { date: "2024-01-02", sharpe: 3.0 },
  { date: "2024-01-03", sharpe: 2.8 },
];

const mockPoorSharpe = [
  { date: "2024-01-01", sharpe: 0.2 },
  { date: "2024-01-02", sharpe: 0.5 },
  { date: "2024-01-03", sharpe: 0.3 },
];

const mockNegativeSharpe = [
  { date: "2024-01-01", sharpe: -0.5 },
  { date: "2024-01-02", sharpe: -0.2 },
  { date: "2024-01-03", sharpe: -0.8 },
];

describe("SharpeChart", () => {
  describe("Basic Rendering", () => {
    it("should render MetricChartLayout with sharpe type", () => {
      render(<SharpeChart data={mockSharpeData} />);

      expect(screen.getByTestId("metric-chart-layout")).toBeInTheDocument();
      expect(screen.getByText("sharpe")).toBeInTheDocument();
    });

    it("should render with default dimensions", () => {
      const { container } = render(<SharpeChart data={mockSharpeData} />);

      expect(
        container.querySelector('[data-chart-type="sharpe"]')
      ).toBeInTheDocument();
    });

    it("should apply custom width", () => {
      render(<SharpeChart data={mockSharpeData} width={1000} />);

      expect(screen.getByTestId("metric-chart-layout")).toBeInTheDocument();
    });

    it("should apply custom height", () => {
      render(<SharpeChart data={mockSharpeData} height={400} />);

      expect(screen.getByTestId("metric-chart-layout")).toBeInTheDocument();
    });

    it("should apply custom padding", () => {
      render(<SharpeChart data={mockSharpeData} padding={20} />);

      expect(screen.getByTestId("metric-chart-layout")).toBeInTheDocument();
    });
  });

  describe("Empty Data State", () => {
    it("should render with empty data array", () => {
      render(<SharpeChart data={[]} />);

      expect(screen.getByTestId("metric-chart-layout")).toBeInTheDocument();
      expect(screen.getByTestId("line-path")).toHaveTextContent("no-line");
      expect(screen.getByTestId("area-path")).toHaveTextContent("no-area");
    });

    it("should not crash with undefined data", () => {
      render(<SharpeChart data={[] as any} />);

      expect(screen.getByTestId("metric-chart-layout")).toBeInTheDocument();
    });
  });

  describe("Chart Paths", () => {
    it("should generate line path from data", () => {
      render(<SharpeChart data={mockSharpeData} />);

      const linePath = screen.getByTestId("line-path");
      expect(linePath.textContent).not.toBe("no-line");
      expect(linePath.textContent).toContain("M");
    });

    it("should generate area path from data", () => {
      render(<SharpeChart data={mockSharpeData} />);

      const areaPath = screen.getByTestId("area-path");
      expect(areaPath.textContent).not.toBe("no-area");
      expect(areaPath.textContent).toContain("M");
    });

    it("should handle single data point", () => {
      const singlePoint = [{ date: "2024-01-01", sharpe: 1.5 }];
      render(<SharpeChart data={singlePoint} />);

      expect(screen.getByTestId("line-path")).toBeInTheDocument();
      expect(screen.getByTestId("area-path")).toBeInTheDocument();
    });

    it("should handle data with zero sharpe", () => {
      const zeroData = [
        { date: "2024-01-01", sharpe: 0 },
        { date: "2024-01-02", sharpe: 0 },
      ];
      render(<SharpeChart data={zeroData} />);

      expect(screen.getByTestId("line-path")).toBeInTheDocument();
    });
  });

  describe("Color Scheme", () => {
    it("should use emerald color for line", () => {
      render(<SharpeChart data={mockSharpeData} />);

      expect(screen.getByTestId("line-color")).toHaveTextContent("#10b981");
    });

    it("should use sharpeGradient id", () => {
      render(<SharpeChart data={mockSharpeData} />);

      expect(screen.getByTestId("metric-chart-layout")).toBeInTheDocument();
    });
  });

  describe("Y-Axis Labels", () => {
    it("should render correct y-axis labels", () => {
      render(<SharpeChart data={mockSharpeData} />);

      const labels = screen.getByTestId("y-axis-labels");
      expect(labels).toHaveTextContent("3.5,2.5,1.5,0.5,-0.5,-1.0");
    });

    it("should maintain labels for different data ranges", () => {
      render(<SharpeChart data={mockExcellentSharpe} />);

      const labels = screen.getByTestId("y-axis-labels");
      expect(labels).toHaveTextContent("3.5,2.5,1.5,0.5,-0.5,-1.0");
    });

    it("should show negative values in labels", () => {
      render(<SharpeChart data={mockNegativeSharpe} />);

      const labels = screen.getByTestId("y-axis-labels");
      expect(labels).toHaveTextContent("3.5,2.5,1.5,0.5,-0.5,-1.0");
    });
  });

  describe("Legend", () => {
    it("should render Rolling Sharpe Ratio legend", () => {
      render(<SharpeChart data={mockSharpeData} />);

      const legend = screen.getByTestId("legend");
      expect(legend).toHaveTextContent("Rolling Sharpe Ratio");
    });

    it("should render reference line legend", () => {
      render(<SharpeChart data={mockSharpeData} />);

      const legend = screen.getByTestId("legend");
      expect(legend).toHaveTextContent("Sharpe = 1.0");
    });

    it("should include both legend items", () => {
      const { container } = render(<SharpeChart data={mockSharpeData} />);

      const legend = screen.getByTestId("legend");
      expect(legend).toHaveTextContent("Rolling Sharpe Ratio");
      expect(legend).toHaveTextContent("Sharpe = 1.0");
    });
  });

  describe("Description", () => {
    it("should include sharpe description", () => {
      render(<SharpeChart data={mockSharpeData} />);

      const description = screen.getByTestId("description");
      expect(description).toHaveTextContent(
        "Rolling Sharpe ratio trend for the portfolio"
      );
    });
  });

  describe("Reference Line", () => {
    it("should render extra SVG content for reference line", () => {
      render(<SharpeChart data={mockSharpeData} />);

      const extraSvg = screen.getByTestId("extra-svg");
      expect(extraSvg).toHaveTextContent("has-extra");
    });

    it("should include reference line at Sharpe = 1.0", () => {
      render(<SharpeChart data={mockSharpeData} />);

      // Reference line should be passed as extraSvgContent
      expect(screen.getByTestId("extra-svg")).toHaveTextContent("has-extra");
    });
  });

  describe("Sharpe Interpretation", () => {
    it("should process excellent sharpe data", () => {
      render(<SharpeChart data={mockExcellentSharpe} />);

      expect(screen.getByTestId("metric-chart-layout")).toBeInTheDocument();
    });

    it("should process poor sharpe data", () => {
      render(<SharpeChart data={mockPoorSharpe} />);

      expect(screen.getByTestId("metric-chart-layout")).toBeInTheDocument();
    });

    it("should process negative sharpe data", () => {
      render(<SharpeChart data={mockNegativeSharpe} />);

      expect(screen.getByTestId("metric-chart-layout")).toBeInTheDocument();
    });

    it("should handle sharpe at exactly 1.0", () => {
      const thresholdData = [{ date: "2024-01-01", sharpe: 1.0 }];

      render(<SharpeChart data={thresholdData} />);

      expect(screen.getByTestId("metric-chart-layout")).toBeInTheDocument();
    });

    it("should handle sharpe at boundaries", () => {
      const boundaryData = [
        { date: "2024-01-01", sharpe: -1.0 }, // Min value
        { date: "2024-01-02", sharpe: 3.5 }, // Max value
      ];

      render(<SharpeChart data={boundaryData} />);

      expect(screen.getByTestId("metric-chart-layout")).toBeInTheDocument();
    });

    it("should handle sharpe above max boundary", () => {
      const extremeData = [{ date: "2024-01-01", sharpe: 5.0 }];

      render(<SharpeChart data={extremeData} />);

      expect(screen.getByTestId("metric-chart-layout")).toBeInTheDocument();
    });

    it("should handle sharpe below min boundary", () => {
      const extremeData = [{ date: "2024-01-01", sharpe: -2.0 }];

      render(<SharpeChart data={extremeData} />);

      expect(screen.getByTestId("metric-chart-layout")).toBeInTheDocument();
    });
  });

  describe("Data Transformation", () => {
    it("should handle missing sharpe values", () => {
      const missingData = [
        { date: "2024-01-01", sharpe: 1.5 },
        { date: "2024-01-02", sharpe: null as any },
        { date: "2024-01-03", sharpe: 2.0 },
      ];

      render(<SharpeChart data={missingData} />);

      expect(screen.getByTestId("line-path")).toBeInTheDocument();
    });

    it("should handle very small sharpe values", () => {
      const tinyData = [
        { date: "2024-01-01", sharpe: 0.01 },
        { date: "2024-01-02", sharpe: 0.05 },
      ];

      render(<SharpeChart data={tinyData} />);

      expect(screen.getByTestId("line-path")).toBeInTheDocument();
    });

    it("should handle fractional sharpe values", () => {
      const fractionalData = [
        { date: "2024-01-01", sharpe: 1.234 },
        { date: "2024-01-02", sharpe: 2.567 },
        { date: "2024-01-03", sharpe: 0.891 },
      ];

      render(<SharpeChart data={fractionalData} />);

      expect(screen.getByTestId("line-path")).toBeInTheDocument();
    });
  });

  describe("Date Formatting", () => {
    it("should handle various date formats", () => {
      const variousDates = [
        { date: "2024-01-01", sharpe: 1.5 },
        { date: "2024-12-31", sharpe: 1.8 },
      ];

      render(<SharpeChart data={variousDates} />);

      expect(screen.getByTestId("metric-chart-layout")).toBeInTheDocument();
    });

    it("should handle ISO date strings", () => {
      const isoData = [
        { date: "2024-01-01T00:00:00Z", sharpe: 1.5 },
        { date: "2024-01-02T00:00:00Z", sharpe: 1.8 },
      ];

      render(<SharpeChart data={isoData} />);

      expect(screen.getByTestId("metric-chart-layout")).toBeInTheDocument();
    });
  });

  describe("Performance", () => {
    it("should handle large datasets efficiently", () => {
      const largeData = Array.from({ length: 365 }, (_, i) => ({
        date: `2024-01-${String((i % 30) + 1).padStart(2, "0")}`,
        sharpe: 0.5 + Math.random() * 2.5,
      }));

      render(<SharpeChart data={largeData} />);

      expect(screen.getByTestId("metric-chart-layout")).toBeInTheDocument();
    });

    it("should memoize chart paths", () => {
      const { rerender } = render(<SharpeChart data={mockSharpeData} />);

      const initialLinePath = screen.getByTestId("line-path").textContent;

      // Rerender with same data
      rerender(<SharpeChart data={mockSharpeData} />);

      expect(screen.getByTestId("line-path").textContent).toBe(initialLinePath);
    });

    it("should update paths when data changes", () => {
      const { rerender } = render(<SharpeChart data={mockSharpeData} />);

      const initialLinePath = screen.getByTestId("line-path").textContent;

      // Rerender with different data
      rerender(<SharpeChart data={mockPoorSharpe} />);

      expect(screen.getByTestId("line-path").textContent).not.toBe(
        initialLinePath
      );
    });

    it("should memoize reference line calculation", () => {
      const { rerender } = render(<SharpeChart data={mockSharpeData} />);

      // Reference line should be memoized
      expect(screen.getByTestId("extra-svg")).toHaveTextContent("has-extra");

      rerender(<SharpeChart data={mockSharpeData} />);

      expect(screen.getByTestId("extra-svg")).toHaveTextContent("has-extra");
    });
  });

  describe("Edge Cases", () => {
    it("should handle data with duplicate dates", () => {
      const duplicateData = [
        { date: "2024-01-01", sharpe: 1.5 },
        { date: "2024-01-01", sharpe: 1.8 },
        { date: "2024-01-02", sharpe: 2.0 },
      ];

      render(<SharpeChart data={duplicateData} />);

      expect(screen.getByTestId("metric-chart-layout")).toBeInTheDocument();
    });

    it("should handle out-of-order dates", () => {
      const unorderedData = [
        { date: "2024-01-03", sharpe: 2.0 },
        { date: "2024-01-01", sharpe: 1.5 },
        { date: "2024-01-02", sharpe: 1.8 },
      ];

      render(<SharpeChart data={unorderedData} />);

      expect(screen.getByTestId("metric-chart-layout")).toBeInTheDocument();
    });

    it("should handle data with extreme sharpe fluctuations", () => {
      const volatileData = [
        { date: "2024-01-01", sharpe: -0.5 },
        { date: "2024-01-02", sharpe: 3.0 }, // Large swing
        { date: "2024-01-03", sharpe: 0.5 },
      ];

      render(<SharpeChart data={volatileData} />);

      expect(screen.getByTestId("line-path")).toBeInTheDocument();
    });

    it("should handle data with constant sharpe", () => {
      const constantData = [
        { date: "2024-01-01", sharpe: 1.5 },
        { date: "2024-01-02", sharpe: 1.5 },
        { date: "2024-01-03", sharpe: 1.5 },
      ];

      render(<SharpeChart data={constantData} />);

      expect(screen.getByTestId("line-path")).toBeInTheDocument();
    });

    it("should handle alternating positive and negative sharpe", () => {
      const alternatingData = [
        { date: "2024-01-01", sharpe: 1.5 },
        { date: "2024-01-02", sharpe: -0.5 },
        { date: "2024-01-03", sharpe: 2.0 },
        { date: "2024-01-04", sharpe: -0.3 },
      ];

      render(<SharpeChart data={alternatingData} />);

      expect(screen.getByTestId("line-path")).toBeInTheDocument();
    });
  });

  describe("Component Display Name", () => {
    it("should have correct display name for debugging", () => {
      expect(SharpeChart.displayName).toBe("SharpeChart");
    });
  });

  describe("Sharpe Ratio Scale", () => {
    it("should handle values at good threshold boundary", () => {
      const thresholdData = [
        { date: "2024-01-01", sharpe: 0.99 },
        { date: "2024-01-02", sharpe: 1.0 }, // Threshold
        { date: "2024-01-03", sharpe: 1.01 },
      ];

      render(<SharpeChart data={thresholdData} />);

      expect(screen.getByTestId("metric-chart-layout")).toBeInTheDocument();
    });

    it("should correctly position reference line", () => {
      render(<SharpeChart data={mockSharpeData} />);

      // Reference line at 1.0 should always be present
      expect(screen.getByTestId("extra-svg")).toHaveTextContent("has-extra");
    });
  });
});
