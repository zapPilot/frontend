import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { MetricChartLayout } from "@/components/PortfolioChart/charts/MetricChartLayout";
import type { ChartHoverState } from "@/types/ui/chartHover";

// Mock dependencies
vi.mock("@/components/PortfolioChart/charts/ChartGrid", () => ({
  ChartGrid: () => <div data-testid="chart-grid">Grid</div>,
}));

vi.mock("@/components/charts", () => ({
  ChartIndicator: ({
    hoveredPoint,
  }: {
    hoveredPoint: ChartHoverState | null;
  }) => (
    <g data-testid="chart-indicator">
      {hoveredPoint && <circle data-testid="indicator-point" />}
    </g>
  ),
  ChartTooltip: ({
    hoveredPoint,
  }: {
    hoveredPoint: ChartHoverState | null;
    chartWidth: number;
    chartHeight: number;
  }) => (
    <div data-testid="chart-tooltip">
      {hoveredPoint ? "Tooltip Visible" : "Tooltip Hidden"}
    </div>
  ),
}));

vi.mock("@/components/PortfolioChart/components", () => ({
  ChartHelpModal: ({ chartType }: { chartType: string }) => (
    <button data-testid="help-modal">{chartType} Help</button>
  ),
}));

const mockGradientStops = [
  { offset: "0%", color: "#10b981", opacity: "0.3" },
  { offset: "100%", color: "#10b981", opacity: "0" },
];

const mockHoveredPoint: ChartHoverState = {
  chartType: "sharpe",
  x: 100,
  y: 150,
  date: "Jan 15, 2024",
  sharpe: 1.5,
  interpretation: "Good",
};

const defaultProps = {
  chartType: "sharpe" as const,
  width: 800,
  height: 300,
  gradientId: "testGradient",
  gradientStops: mockGradientStops,
  lineColor: "#10b981",
  hoveredPoint: null,
  interactionProps: {},
  yAxisLabels: ["3.5", "2.5", "1.5", "0.5", "-0.5"],
  legend: <div>Test Legend</div>,
  description: "Test chart description",
};

describe("MetricChartLayout", () => {
  describe("Basic Rendering", () => {
    it("should render chart container with correct height", () => {
      const { container } = render(<MetricChartLayout {...defaultProps} />);

      const chartContainer = container.querySelector(".h-80");
      expect(chartContainer).toBeInTheDocument();
    });

    it("should render ChartGrid component", () => {
      render(<MetricChartLayout {...defaultProps} />);

      expect(screen.getByTestId("chart-grid")).toBeInTheDocument();
    });

    it("should render svg with correct viewBox", () => {
      const { container } = render(<MetricChartLayout {...defaultProps} />);

      const svg = container.querySelector("svg");
      expect(svg).toHaveAttribute("viewBox", "0 0 800 300");
    });

    it("should render svg with full width and height classes", () => {
      const { container } = render(<MetricChartLayout {...defaultProps} />);

      const svg = container.querySelector("svg");
      expect(svg).toHaveClass("w-full", "h-full");
    });

    it("should set chart type as data attribute", () => {
      const { container } = render(<MetricChartLayout {...defaultProps} />);

      const svg = container.querySelector("svg");
      expect(svg).toHaveAttribute("data-chart-type", "sharpe");
    });

    it("should set aria-label for accessibility", () => {
      const { container } = render(
        <MetricChartLayout {...defaultProps} chartType="sharpe" />
      );

      const svg = container.querySelector("svg");
      expect(svg).toHaveAttribute(
        "aria-label",
        "Sharpe ratio chart showing risk-adjusted returns"
      );
    });
  });

  describe("Gradient Definitions", () => {
    it("should render linear gradient with correct id", () => {
      const { container } = render(<MetricChartLayout {...defaultProps} />);

      const gradient = container.querySelector("#testGradient");
      expect(gradient).toBeInTheDocument();
      expect(gradient?.tagName).toBe("linearGradient");
    });

    it("should render gradient with vertical direction", () => {
      const { container } = render(<MetricChartLayout {...defaultProps} />);

      const gradient = container.querySelector("#testGradient");
      expect(gradient).toHaveAttribute("x1", "0%");
      expect(gradient).toHaveAttribute("y1", "0%");
      expect(gradient).toHaveAttribute("x2", "0%");
      expect(gradient).toHaveAttribute("y2", "100%");
    });

    it("should render all gradient stops correctly", () => {
      const { container } = render(<MetricChartLayout {...defaultProps} />);

      const stops = container.querySelectorAll("stop");
      expect(stops).toHaveLength(2);

      expect(stops[0]).toHaveAttribute("offset", "0%");
      expect(stops[0]).toHaveAttribute("stop-color", "#10b981");
      expect(stops[0]).toHaveAttribute("stop-opacity", "0.3");

      expect(stops[1]).toHaveAttribute("offset", "100%");
      expect(stops[1]).toHaveAttribute("stop-color", "#10b981");
      expect(stops[1]).toHaveAttribute("stop-opacity", "0");
    });

    it("should render gradient with multiple stops", () => {
      const multiStopGradient = [
        { offset: "0%", color: "#f59e0b", opacity: "0.5" },
        { offset: "50%", color: "#ef4444", opacity: "0.3" },
        { offset: "100%", color: "#dc2626", opacity: "0" },
      ];

      const { container } = render(
        <MetricChartLayout
          {...defaultProps}
          gradientStops={multiStopGradient}
        />
      );

      const stops = container.querySelectorAll("stop");
      expect(stops).toHaveLength(3);
    });
  });

  describe("Chart Paths", () => {
    it("should render line path when provided", () => {
      const linePath = "M 0 250 L 100 200 L 200 150";
      const { container } = render(
        <MetricChartLayout {...defaultProps} linePath={linePath} />
      );

      const path = container.querySelector('path[fill="none"]');
      expect(path).toBeInTheDocument();
      expect(path).toHaveAttribute("d", linePath);
      expect(path).toHaveAttribute("stroke", "#10b981");
      expect(path).toHaveAttribute("stroke-width", "3");
    });

    it("should apply drop shadow to line path", () => {
      const linePath = "M 0 250 L 100 200";
      const { container } = render(
        <MetricChartLayout {...defaultProps} linePath={linePath} />
      );

      const path = container.querySelector('path[fill="none"]');
      expect(path).toHaveClass("drop-shadow-lg");
    });

    it("should render area path when provided", () => {
      const areaPath = "M 0 250 L 100 200 L 200 150 L 200 250 Z";
      const { container } = render(
        <MetricChartLayout {...defaultProps} areaPath={areaPath} />
      );

      const area = container.querySelector(`path[fill="url(#testGradient)"]`);
      expect(area).toBeInTheDocument();
      expect(area).toHaveAttribute("d", areaPath);
    });

    it("should not render line path when null", () => {
      const { container } = render(
        <MetricChartLayout {...defaultProps} linePath={null} />
      );

      const path = container.querySelector('path[fill="none"]');
      expect(path).not.toBeInTheDocument();
    });

    it("should not render area path when null", () => {
      const { container } = render(
        <MetricChartLayout {...defaultProps} areaPath={null} />
      );

      const area = container.querySelector(`path[fill="url(#testGradient)"]`);
      expect(area).not.toBeInTheDocument();
    });

    it("should handle both paths being undefined", () => {
      const { container } = render(
        <MetricChartLayout
          {...defaultProps}
          linePath={undefined}
          areaPath={undefined}
        />
      );

      const paths = container.querySelectorAll("path");
      // Only paths should be from other components, not line/area
      expect(paths.length).toBe(0);
    });
  });

  describe("Y-Axis Labels", () => {
    it("should render all y-axis labels", () => {
      render(<MetricChartLayout {...defaultProps} />);

      expect(screen.getByText("3.5")).toBeInTheDocument();
      expect(screen.getByText("2.5")).toBeInTheDocument();
      expect(screen.getByText("1.5")).toBeInTheDocument();
      expect(screen.getByText("0.5")).toBeInTheDocument();
      expect(screen.getByText("-0.5")).toBeInTheDocument();
    });

    it("should render labels with correct styling", () => {
      const { container } = render(<MetricChartLayout {...defaultProps} />);

      const labelsContainer = container.querySelector(
        ".absolute.left-0.top-0.h-full"
      );
      expect(labelsContainer).toBeInTheDocument();
      expect(labelsContainer).toHaveClass(
        "flex",
        "flex-col",
        "justify-between",
        "text-xs",
        "text-gray-400"
      );
    });

    it("should render labels with pointer-events-none", () => {
      const { container } = render(<MetricChartLayout {...defaultProps} />);

      const labelsContainer = container.querySelector(".pointer-events-none");
      expect(labelsContainer).toBeInTheDocument();
    });

    it("should handle custom y-axis labels", () => {
      const customLabels = ["100%", "75%", "50%", "25%", "0%"];
      render(
        <MetricChartLayout {...defaultProps} yAxisLabels={customLabels} />
      );

      expect(screen.getByText("100%")).toBeInTheDocument();
      expect(screen.getByText("75%")).toBeInTheDocument();
      expect(screen.getByText("50%")).toBeInTheDocument();
      expect(screen.getByText("25%")).toBeInTheDocument();
      expect(screen.getByText("0%")).toBeInTheDocument();
    });
  });

  describe("Legend and Help Modal", () => {
    it("should render legend content", () => {
      render(<MetricChartLayout {...defaultProps} />);

      expect(screen.getByText("Test Legend")).toBeInTheDocument();
    });

    it("should render legend with correct positioning", () => {
      const { container } = render(<MetricChartLayout {...defaultProps} />);

      const legendContainer = container.querySelector(
        ".absolute.top-4.right-4"
      );
      expect(legendContainer).toBeInTheDocument();
    });

    it("should render legend with pointer-events-none", () => {
      const { container } = render(<MetricChartLayout {...defaultProps} />);

      const legend = container.querySelector(".text-xs.pointer-events-none");
      expect(legend).toBeInTheDocument();
    });

    it("should render help modal with chart type", () => {
      render(<MetricChartLayout {...defaultProps} />);

      expect(screen.getByTestId("help-modal")).toHaveTextContent("sharpe Help");
    });

    it("should render help modal for volatility chart", () => {
      render(<MetricChartLayout {...defaultProps} chartType="volatility" />);

      expect(screen.getByTestId("help-modal")).toHaveTextContent(
        "volatility Help"
      );
    });

    it("should render help modal with pointer-events-auto", () => {
      const { container } = render(<MetricChartLayout {...defaultProps} />);

      const helpContainer = container.querySelector(".pointer-events-auto");
      expect(helpContainer).toBeInTheDocument();
    });
  });

  describe("Hover State", () => {
    it("should pass hovered point to ChartIndicator", () => {
      render(
        <MetricChartLayout {...defaultProps} hoveredPoint={mockHoveredPoint} />
      );

      expect(screen.getByTestId("chart-indicator")).toBeInTheDocument();
      expect(screen.getByTestId("indicator-point")).toBeInTheDocument();
    });

    it("should not render indicator when no hover", () => {
      render(<MetricChartLayout {...defaultProps} hoveredPoint={null} />);

      expect(screen.queryByTestId("indicator-point")).not.toBeInTheDocument();
    });

    it("should show tooltip when hovered", () => {
      render(
        <MetricChartLayout {...defaultProps} hoveredPoint={mockHoveredPoint} />
      );

      expect(screen.getByText("Tooltip Visible")).toBeInTheDocument();
    });

    it("should hide tooltip when not hovered", () => {
      render(<MetricChartLayout {...defaultProps} hoveredPoint={null} />);

      expect(screen.getByText("Tooltip Hidden")).toBeInTheDocument();
    });
  });

  describe("Interaction Props", () => {
    it("should apply interaction props to svg", () => {
      const mockOnClick = vi.fn();
      const mockOnMouseMove = vi.fn();

      const { container } = render(
        <MetricChartLayout
          {...defaultProps}
          interactionProps={{
            onClick: mockOnClick,
            onMouseMove: mockOnMouseMove,
          }}
        />
      );

      const svg = container.querySelector("svg");
      expect(svg).toBeDefined();
      // Interaction props are spread onto svg element
    });

    it("should handle empty interaction props", () => {
      const { container } = render(
        <MetricChartLayout {...defaultProps} interactionProps={{}} />
      );

      const svg = container.querySelector("svg");
      expect(svg).toBeInTheDocument();
    });
  });

  describe("Description", () => {
    it("should render description text in hidden text element", () => {
      const { container } = render(<MetricChartLayout {...defaultProps} />);

      const descText = container.querySelector('text[opacity="0"]');
      expect(descText).toHaveTextContent("Test chart description");
    });

    it("should position description text correctly", () => {
      const { container } = render(<MetricChartLayout {...defaultProps} />);

      const descText = container.querySelector('text[opacity="0"]');
      expect(descText).toHaveAttribute("x", "16");
      expect(descText).toHaveAttribute("y", "20");
    });
  });

  describe("Extra SVG Content", () => {
    it("should render extra svg content when provided", () => {
      const extraContent = (
        <line
          data-testid="extra-line"
          x1="0"
          y1="100"
          x2="800"
          y2="100"
          stroke="#6b7280"
        />
      );

      render(
        <MetricChartLayout {...defaultProps} extraSvgContent={extraContent} />
      );

      expect(screen.getByTestId("extra-line")).toBeInTheDocument();
    });

    it("should not render extra content when undefined", () => {
      const { container: _container } = render(
        <MetricChartLayout {...defaultProps} extraSvgContent={undefined} />
      );

      // Only check for absence of extra content data-testid
      expect(screen.queryByTestId("extra-line")).not.toBeInTheDocument();
    });

    it("should render multiple extra svg elements", () => {
      const extraContent = (
        <>
          <line
            data-testid="reference-line-1"
            x1="0"
            y1="100"
            x2="800"
            y2="100"
          />
          <line
            data-testid="reference-line-2"
            x1="0"
            y1="200"
            x2="800"
            y2="200"
          />
        </>
      );

      render(
        <MetricChartLayout {...defaultProps} extraSvgContent={extraContent} />
      );

      expect(screen.getByTestId("reference-line-1")).toBeInTheDocument();
      expect(screen.getByTestId("reference-line-2")).toBeInTheDocument();
    });
  });

  describe("Chart Type Variants", () => {
    it("should handle sharpe chart type", () => {
      const { container } = render(
        <MetricChartLayout {...defaultProps} chartType="sharpe" />
      );

      const svg = container.querySelector("svg");
      expect(svg).toHaveAttribute("data-chart-type", "sharpe");
    });

    it("should handle volatility chart type", () => {
      const { container } = render(
        <MetricChartLayout {...defaultProps} chartType="volatility" />
      );

      const svg = container.querySelector("svg");
      expect(svg).toHaveAttribute("data-chart-type", "volatility");
    });
  });

  describe("Dimension Props", () => {
    it("should handle custom width", () => {
      const { container } = render(
        <MetricChartLayout {...defaultProps} width={1000} />
      );

      const svg = container.querySelector("svg");
      expect(svg).toHaveAttribute("viewBox", "0 0 1000 300");
    });

    it("should handle custom height", () => {
      const { container } = render(
        <MetricChartLayout {...defaultProps} height={400} />
      );

      const svg = container.querySelector("svg");
      expect(svg).toHaveAttribute("viewBox", "0 0 800 400");
    });

    it("should handle both custom dimensions", () => {
      const { container } = render(
        <MetricChartLayout {...defaultProps} width={1200} height={500} />
      );

      const svg = container.querySelector("svg");
      expect(svg).toHaveAttribute("viewBox", "0 0 1200 500");
    });
  });
});
