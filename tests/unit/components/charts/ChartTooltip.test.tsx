import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ChartTooltip } from "@/components/charts/ChartTooltip";

// Mock framer-motion to avoid animation issues
vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, style, ...props }: any) => (
      <div style={style} {...props}>
        {children}
      </div>
    ),
  },
}));

// Mock sub-components to verify correct switching
vi.mock("@/components/charts/tooltipContent", () => ({
  PerformanceTooltip: () => (
    <div data-testid="tooltip-content-performance">Performance</div>
  ),
  AllocationTooltip: () => (
    <div data-testid="tooltip-content-allocation">Allocation</div>
  ),
  DrawdownTooltip: () => (
    <div data-testid="tooltip-content-drawdown">Drawdown</div>
  ),
  SharpeTooltip: () => <div data-testid="tooltip-content-sharpe">Sharpe</div>,
  VolatilityTooltip: () => (
    <div data-testid="tooltip-content-volatility">Volatility</div>
  ),
  DailyYieldTooltip: () => <div data-testid="tooltip-content-yield">Yield</div>,
}));

describe("ChartTooltip", () => {
  const defaultProps = {
    chartWidth: 800,
    chartHeight: 300,
  };

  it("should not render when hoveredPoint is null", () => {
    const { container } = render(<ChartTooltip hoveredPoint={null} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("should render correct content for 'performance' chart", () => {
    render(
      <ChartTooltip
        {...defaultProps}
        hoveredPoint={{
          chartType: "performance",
          x: 100,
          y: 100,
          date: "2024-01-01",
          value: 100,
        }}
      />
    );
    expect(
      screen.getByTestId("tooltip-content-performance")
    ).toBeInTheDocument();
  });

  it("should render correct content for 'asset-allocation' chart", () => {
    render(
      <ChartTooltip
        {...defaultProps}
        hoveredPoint={{
          chartType: "asset-allocation",
          x: 100,
          y: 100,
          date: "2024-01-01",
          btc: 50,
          eth: 50,
          stablecoin: 0,
          altcoin: 0,
        }}
      />
    );
    expect(
      screen.getByTestId("tooltip-content-allocation")
    ).toBeInTheDocument();
  });

  it("should render correct content for 'drawdown-recovery' chart", () => {
    render(
      <ChartTooltip
        {...defaultProps}
        hoveredPoint={{
          chartType: "drawdown-recovery",
          x: 100,
          y: 100,
          date: "2024-01-01",
          value: -10,
        }}
      />
    );
    expect(screen.getByTestId("tooltip-content-drawdown")).toBeInTheDocument();
  });

  it("should render correct content for 'sharpe' chart", () => {
    render(
      <ChartTooltip
        {...defaultProps}
        hoveredPoint={{
          chartType: "sharpe",
          x: 100,
          y: 100,
          date: "2024-01-01",
          value: 2.5,
        }}
      />
    );
    expect(screen.getByTestId("tooltip-content-sharpe")).toBeInTheDocument();
  });

  it("should render correct content for 'volatility' chart", () => {
    render(
      <ChartTooltip
        {...defaultProps}
        hoveredPoint={{
          chartType: "volatility",
          x: 100,
          y: 100,
          date: "2024-01-01",
          value: 15,
        }}
      />
    );
    expect(
      screen.getByTestId("tooltip-content-volatility")
    ).toBeInTheDocument();
  });

  it("should render correct content for 'daily-yield' chart", () => {
    render(
      <ChartTooltip
        {...defaultProps}
        hoveredPoint={{
          chartType: "daily-yield",
          x: 100,
          y: 100,
          date: "2024-01-01",
          value: 0.5,
        }}
      />
    );
    expect(screen.getByTestId("tooltip-content-yield")).toBeInTheDocument();
  });

  // Positioning Tests
  // Default tooltip size mock: 180x120 (TOOLTIP_MIN_WIDTH/HEIGHT)

  it("should position correctly in the middle (left aligned, top aligned)", () => {
    render(
      <ChartTooltip
        {...defaultProps}
        hoveredPoint={{
          chartType: "performance",
          x: 400, // Middle of 800
          y: 200, // Safer Y to avoid top flip. pointerY=200. top=180. 180-120=60 > 12.
          date: "2024-01-01",
          value: 100,
        }}
      />
    );

    // pointerY = 200. top = 180. translateY = -100%.
    const tooltip = screen.getByTestId("chart-tooltip");
    expect(tooltip).toHaveStyle({
      left: "400px",
      top: "180px",
      transform: "translate(-50%, -100%)",
    });
  });

  it("should clamp to left edge", () => {
    render(
      <ChartTooltip
        {...defaultProps}
        hoveredPoint={{
          chartType: "performance",
          x: 10, // Near left edge
          y: 200, // Safe Y
          date: "2024-01-01",
          value: 100,
        }}
      />
    );

    // pointerX = 10. left - halfWidth (90) < 12.
    // left = 12. translateX = 0.
    const tooltip = screen.getByTestId("chart-tooltip");
    expect(tooltip).toHaveStyle({
      left: "12px",
      transform: "translate(0, -100%)",
    });
  });

  it("should clamp to right edge", () => {
    render(
      <ChartTooltip
        {...defaultProps}
        hoveredPoint={{
          chartType: "performance",
          x: 790, // Near right edge
          y: 200, // Safe Y
          date: "2024-01-01",
          value: 100,
        }}
      />
    );

    // pointerX = 790. left + 90 > 788. left = 788. translateX = -100%.
    const tooltip = screen.getByTestId("chart-tooltip");
    expect(tooltip).toHaveStyle({
      left: "788px",
      transform: "translate(-100%, -100%)",
    });
  });

  it("should flip to bottom if too close to top", () => {
    render(
      <ChartTooltip
        {...defaultProps}
        hoveredPoint={{
          chartType: "performance",
          x: 400,
          y: 20, // Near top
          date: "2024-01-01",
          value: 100,
        }}
      />
    );

    // pointerY = 20. top = 0. 0 - 120 < 12. Flip.
    // top = min(20+20, 300-12) = 40. translateY = 0.
    const tooltip = screen.getByTestId("chart-tooltip");
    expect(tooltip).toHaveStyle({
      top: "40px",
      transform: "translate(-50%, 0)",
    });
  });

  it("should avoid top legend for specific chart types", () => {
    render(
      <ChartTooltip
        {...defaultProps}
        hoveredPoint={{
          chartType: "performance",
          x: 400,
          y: 60,
          date: "2024-01-01",
          value: 100,
        }}
      />
    );

    // Y=60. pointerY=60. top=40.
    // Edge check: 40 - 120 = -80 < 12. FLIP.
    // top = 80. translateY = 0.
    // Since it flipped to 0, the Legend check (translateY === "-100%") is skipped.
    // But result is correct: it avoids top area.
    const tooltip = screen.getByTestId("chart-tooltip");
    expect(tooltip).toHaveStyle({
      top: "80px",
      transform: "translate(-50%, 0)",
    });
  });

  it("should trigger legend avoidance when valid space exists but legend overlaps", () => {
    render(
      <ChartTooltip
        {...defaultProps}
        hoveredPoint={{
          chartType: "performance",
          x: 400,
          y: 190,
          date: "2024-01-01",
          value: 100,
        }}
      />
    );

    // Y=190. top=170. translateY=-100%.
    // Edge: 170-120=50 > 12. OK.
    // Legend: 170 < 180 (60+120). True.
    // Flip. top = max(190+20, 60) = 210. translateY = 0.

    const tooltip = screen.getByTestId("chart-tooltip");
    expect(tooltip).toHaveStyle({
      top: "210px",
      transform: "translate(-50%, 0)",
    });
  });
});
