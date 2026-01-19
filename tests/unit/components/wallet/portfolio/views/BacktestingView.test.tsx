import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  BacktestingView,
  calculatePercentages,
  CustomTooltip,
} from "@/components/wallet/portfolio/views/BacktestingView";
import { useBacktestMutation } from "@/hooks/mutations/useBacktestMutation";

// Mock framer-motion
vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, className, ...props }: any) => (
      <div className={className} data-testid="motion-div" {...props}>
        {children}
      </div>
    ),
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// Mock useBacktestMutation
vi.mock("@/hooks/mutations/useBacktestMutation", () => ({
  useBacktestMutation: vi.fn(),
}));

// Mock Recharts
vi.mock("recharts", () => ({
  ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
  ComposedChart: () => <div data-testid="composed-chart" />,
  Area: () => null,
  Scatter: () => null,
  CartesianGrid: () => null,
  XAxis: () => null,
  YAxis: () => null,
  Tooltip: () => null,
}));

describe("BacktestingView", () => {
  const mockMutate = vi.fn();

  const defaultMock = {
    mutate: mockMutate,
    data: null,
    isPending: false,
    error: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useBacktestMutation).mockReturnValue(defaultMock as any);
  });

  it("renders initial empty state", () => {
    render(<BacktestingView />);

    expect(screen.getByText("DCA Strategy Comparison")).toBeInTheDocument();
    expect(screen.getByText("Ready to Compare Strategies")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Run Backtest/i })
    ).toBeInTheDocument();
  });

  it("triggers backtest on button click", () => {
    render(<BacktestingView />);

    const runButton = screen.getByRole("button", { name: /Run Backtest/i });
    fireEvent.click(runButton);

    expect(mockMutate).toHaveBeenCalled();
  });

  it("shows loading state when pending", () => {
    vi.mocked(useBacktestMutation).mockReturnValue({
      ...defaultMock,
      isPending: true,
    } as any);

    render(<BacktestingView />);

    expect(screen.getByText("Running...")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Running.../i })).toBeDisabled();
  });

  it("displays error message", () => {
    const error = new Error("Test API Error");
    vi.mocked(useBacktestMutation).mockReturnValue({
      ...defaultMock,
      error,
    } as any);

    render(<BacktestingView />);

    expect(screen.getByText("Test API Error")).toBeInTheDocument();
  });

  it("displays results when data is present", () => {
    const mockData = {
      summary: {
        regime_roi_percent: 15.5,
        normal_roi_percent: 5.2,
        regime_final_value: 12000,
        normal_final_value: 10500,
        total_days: 90,
        regime_trade_count: 5,
        sharpe_ratio: 1.2,
        max_drawdown: 10,
        winning_trades: 3,
        losing_trades: 2,
      },
      history: [],
    };

    vi.mocked(useBacktestMutation).mockReturnValue({
      ...defaultMock,
      data: mockData,
    } as any);

    render(<BacktestingView />);

    expect(screen.getByText("Regime Strategy ROI")).toBeInTheDocument();
    expect(screen.getByText("15.5%")).toBeInTheDocument();
    expect(screen.getByText("vs +5.2% Normal DCA")).toBeInTheDocument();

    expect(screen.getByText("Final Value")).toBeInTheDocument();
    // Locale string matching might be tricky, checking simplified partial
    expect(screen.getByText("$12,000")).toBeInTheDocument();

    expect(screen.getByTestId("composed-chart")).toBeInTheDocument();
  });

  describe("calculatePercentages", () => {
    it("calculates percentages correctly for normal case", () => {
      const result = calculatePercentages({
        spot: 60,
        stable: 30,
        lp: 10,
      });

      expect(result.spot).toBeCloseTo(60, 5);
      expect(result.stable).toBeCloseTo(30, 5);
      expect(result.lp).toBeCloseTo(10, 5);
      expect(result.spot + result.stable + result.lp).toBeCloseTo(100, 5);
    });

    it("returns all zeros when total is zero", () => {
      const result = calculatePercentages({
        spot: 0,
        stable: 0,
        lp: 0,
      });

      expect(result).toEqual({ spot: 0, stable: 0, lp: 0 });
    });

    it("handles single constituent (100% spot)", () => {
      const result = calculatePercentages({
        spot: 100,
        stable: 0,
        lp: 0,
      });

      expect(result.spot).toBe(100);
      expect(result.stable).toBe(0);
      expect(result.lp).toBe(0);
      expect(result.spot + result.stable + result.lp).toBe(100);
    });

    it("handles two constituents 50/50 split", () => {
      const result = calculatePercentages({
        spot: 50,
        stable: 50,
        lp: 0,
      });

      expect(result.spot).toBe(50);
      expect(result.stable).toBe(50);
      expect(result.lp).toBe(0);
      expect(result.spot + result.stable + result.lp).toBe(100);
    });

    it("calculates uneven split correctly", () => {
      const result = calculatePercentages({
        spot: 1000,
        stable: 500,
        lp: 500,
      });

      expect(result.spot).toBeCloseTo(50, 5);
      expect(result.stable).toBeCloseTo(25, 5);
      expect(result.lp).toBeCloseTo(25, 5);
      expect(result.spot + result.stable + result.lp).toBeCloseTo(100, 5);
    });

    it("handles very small values", () => {
      const result = calculatePercentages({
        spot: 0.01,
        stable: 0.01,
        lp: 0.01,
      });

      expect(result.spot).toBeCloseTo(33.333, 1);
      expect(result.stable).toBeCloseTo(33.333, 1);
      expect(result.lp).toBeCloseTo(33.333, 1);
      expect(result.spot + result.stable + result.lp).toBeCloseTo(100, 1);
    });

    it("handles large values", () => {
      const result = calculatePercentages({
        spot: 1000000,
        stable: 500000,
        lp: 500000,
      });

      expect(result.spot).toBeCloseTo(50, 5);
      expect(result.stable).toBeCloseTo(25, 5);
      expect(result.lp).toBeCloseTo(25, 5);
      expect(result.spot + result.stable + result.lp).toBeCloseTo(100, 5);
    });
  });

  describe("CustomTooltip - Portfolio Constituent Ratios", () => {
    // Helper function to create mock payload
    const createTooltipPayload = (options: {
      label?: string | number;
      sentiment?: string | null;
      smartConstituents?: { spot: number; stable: number; lp: number } | null;
      classicConstituents?: { spot: number; stable: number; lp: number } | null;
      chartEntries?: Array<{ name: string; value: number | null; color?: string }>;
    }) => {
      const {
        label = "2024-01-01",
        sentiment = null,
        smartConstituents = null,
        classicConstituents = null,
        chartEntries = [
          { name: "Regime Strategy", value: 10000, color: "#3b82f6" },
          { name: "Normal DCA", value: 9500, color: "#4b5563" },
        ],
      } = options;

      const payloadData: any = {
        sentiment_label: sentiment,
        strategies: {},
      };

      if (smartConstituents) {
        payloadData.strategies.smart_dca = {
          portfolio_constituant: smartConstituents,
        };
      }

      if (classicConstituents) {
        payloadData.strategies.dca_classic = {
          portfolio_constituant: classicConstituents,
        };
      }

      const payload = chartEntries.map((entry) => ({
        name: entry.name,
        value: entry.value,
        color: entry.color,
        payload: payloadData,
      }));

      return { label, payload, active: true };
    };

    it("renders constituent ratios section when both strategies have data", () => {
      const { payload, label, active } = createTooltipPayload({
        smartConstituents: { spot: 60, stable: 30, lp: 10 },
        classicConstituents: { spot: 90, stable: 10, lp: 0 },
      });

      render(<CustomTooltip active={active} payload={payload} label={label} />);

      expect(screen.getByText("Normal DCA")).toBeInTheDocument();
      expect(screen.getByText("Regime Strategy")).toBeInTheDocument();
      expect(screen.getByText(/Spot: 90\.0%/)).toBeInTheDocument();
      expect(screen.getByText(/Spot: 60\.0%/)).toBeInTheDocument();
    });

    it("shows only one strategy when other is missing", () => {
      const { payload, label, active } = createTooltipPayload({
        smartConstituents: { spot: 60, stable: 30, lp: 10 },
        classicConstituents: null,
      });

      render(<CustomTooltip active={active} payload={payload} label={label} />);

      expect(screen.getByText("Regime Strategy")).toBeInTheDocument();
      expect(screen.queryByText("Normal DCA")).not.toBeInTheDocument();
    });

    it("does not render section when no constituent data", () => {
      const { payload, label, active } = createTooltipPayload({
        smartConstituents: null,
        classicConstituents: null,
      });

      render(<CustomTooltip active={active} payload={payload} label={label} />);

      expect(screen.queryByText("Normal DCA")).not.toBeInTheDocument();
      expect(screen.queryByText("Regime Strategy")).not.toBeInTheDocument();
    });

    it("handles zero values (no bars rendered for 0%)", () => {
      const { payload, label, active } = createTooltipPayload({
        classicConstituents: { spot: 100, stable: 0, lp: 0 },
      });

      render(<CustomTooltip active={active} payload={payload} label={label} />);

      // Should show percentages text even if some are 0%
      expect(screen.getByText(/Spot: 100\.0%/)).toBeInTheDocument();
      expect(screen.getByText(/Stable: 0\.0%/)).toBeInTheDocument();
      expect(screen.getByText(/LP: 0\.0%/)).toBeInTheDocument();
    });

    it("displays correct percentage values below bars", () => {
      const { payload, label, active } = createTooltipPayload({
        classicConstituents: { spot: 50, stable: 30, lp: 20 },
      });

      render(<CustomTooltip active={active} payload={payload} label={label} />);

      expect(screen.getByText(/Spot: 50\.0%/)).toBeInTheDocument();
      expect(screen.getByText(/Stable: 30\.0%/)).toBeInTheDocument();
      expect(screen.getByText(/LP: 20\.0%/)).toBeInTheDocument();
    });

    it("preserves existing tooltip functionality (portfolio values)", () => {
      const { payload, label, active } = createTooltipPayload({
        chartEntries: [
          { name: "Regime Strategy", value: 10000, color: "#3b82f6" },
          { name: "Normal DCA", value: 9500, color: "#4b5563" },
        ],
        smartConstituents: { spot: 60, stable: 30, lp: 10 },
      });

      render(<CustomTooltip active={active} payload={payload} label={label} />);

      // Should show portfolio values
      expect(screen.getByText(/Regime Strategy: \$10,000/)).toBeInTheDocument();
      expect(screen.getByText(/Normal DCA: \$9,500/)).toBeInTheDocument();

      // Should also show constituent ratios
      expect(screen.getByText("Regime Strategy")).toBeInTheDocument();
    });

    it("preserves signal rendering", () => {
      const { payload, label, active } = createTooltipPayload({
        chartEntries: [
          { name: "Buy Spot", value: 10000, color: "#22c55e" },
          { name: "Regime Strategy", value: 10000, color: "#3b82f6" },
        ],
        smartConstituents: { spot: 60, stable: 30, lp: 10 },
      });

      render(<CustomTooltip active={active} payload={payload} label={label} />);

      expect(screen.getByText("Buy Spot: Signal")).toBeInTheDocument();
      expect(screen.getByText("Regime Strategy")).toBeInTheDocument();
    });

    it("does not render when inactive", () => {
      const { payload, label } = createTooltipPayload({
        smartConstituents: { spot: 60, stable: 30, lp: 10 },
      });

      const { container } = render(
        <CustomTooltip active={false} payload={payload} label={label} />
      );

      expect(container.firstChild).toBeNull();
    });

    it("does not render when payload is empty", () => {
      const { label } = createTooltipPayload({
        smartConstituents: { spot: 60, stable: 30, lp: 10 },
      });

      const { container } = render(
        <CustomTooltip active={true} payload={[]} label={label} />
      );

      expect(container.firstChild).toBeNull();
    });

    it("handles sentiment label correctly", () => {
      const { payload, label, active } = createTooltipPayload({
        sentiment: "greed",
        smartConstituents: { spot: 60, stable: 30, lp: 10 },
      });

      render(<CustomTooltip active={active} payload={payload} label={label} />);

      expect(screen.getByText(/(Greed)/)).toBeInTheDocument();
    });
  });
});
