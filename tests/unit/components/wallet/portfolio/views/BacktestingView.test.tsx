import { act, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { BacktestingView } from "@/components/wallet/portfolio/views/BacktestingView";
import { useBacktestMutation } from "@/hooks/mutations/useBacktestMutation";
import * as backtestingService from "@/services/backtestingService";
import * as strategyService from "@/services/strategyService";

// Mock useBacktestMutation
vi.mock("@/hooks/mutations/useBacktestMutation", () => ({
  useBacktestMutation: vi.fn(),
}));

// Mock the backtesting service
vi.mock("@/services/backtestingService", () => ({
  getBacktestingStrategiesV3: vi.fn(),
  runBacktest: vi.fn(),
}));

// Mock the strategy service
vi.mock("@/services/strategyService", () => ({
  getStrategyConfigs: vi.fn(),
}));

// Mock Recharts (BacktestChart dependency)
vi.mock("recharts", () => ({
  ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
  ComposedChart: ({ children }: any) => (
    <div data-testid="composed-chart">{children}</div>
  ),
  Area: () => null,
  Scatter: () => null,
  Line: () => null,
  CartesianGrid: () => null,
  XAxis: () => null,
  YAxis: () => null,
  Tooltip: () => null,
}));

// Mock framer-motion
vi.mock("framer-motion", () => ({
  AnimatePresence: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
  motion: {
    div: vi.fn(
      ({
        children,
        initial,
        animate,
        exit,
        ...props
      }: {
        children: React.ReactNode;
        initial?: any;
        animate?: any;
        exit?: any;
        [key: string]: any;
      }) => <div {...props}>{children}</div>
    ),
  },
}));

// ── Mock data ───────────────────────────────────────────────────────

const mockBacktestData = {
  strategies: {
    dca_classic: {
      strategy_id: "dca_classic",
      display_name: "DCA Classic",
      roi_percent: 5.2,
      final_value: 10500,
      total_invested: 10000,
      trade_count: 0,
      max_drawdown_percent: -5,
      calmar_ratio: 1.04,
      sharpe_ratio: 0.8,
      sortino_ratio: 1.1,
      volatility: 0.12,
      beta: 0.95,
      parameters: {},
    },
    simple_regime: {
      strategy_id: "simple_regime",
      display_name: "Simple Regime",
      roi_percent: 15.5,
      final_value: 12000,
      total_invested: 10000,
      trade_count: 5,
      max_drawdown_percent: -10,
      calmar_ratio: 1.55,
      sharpe_ratio: 1.2,
      sortino_ratio: 1.6,
      volatility: 0.18,
      beta: 1.1,
      parameters: {},
    },
  },
  timeline: [
    {
      date: "2024-01-01",
      token_price: { btc: 40000 },
      sentiment: 50,
      sentiment_label: "neutral",
      strategies: {
        dca_classic: {
          portfolio_value: 10000,
          portfolio_constituant: { spot: 5000, stable: 5000, lp: 0 },
          event: "buy",
          metrics: { signal: "dca", metadata: {} },
        },
        simple_regime: {
          portfolio_value: 10000,
          portfolio_constituant: { spot: 5000, stable: 5000, lp: 0 },
          event: null,
          metrics: { signal: "fear", metadata: {} },
        },
      },
    },
  ],
};

// ── Tests ────────────────────────────────────────────────────────────

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
    vi.mocked(backtestingService.getBacktestingStrategiesV3).mockResolvedValue({
      catalog_version: "3.0.0",
      strategies: [],
    });
    vi.mocked(strategyService.getStrategyConfigs).mockResolvedValue({
      presets: [],
      backtest_defaults: { days: 500, total_capital: 10000 },
    });
  });

  it("renders heading and description", async () => {
    await act(async () => {
      render(<BacktestingView />);
    });

    expect(screen.getByText("Strategy Simulator")).toBeInTheDocument();
    expect(
      screen.getByText(
        /Compare Normal DCA vs Regime-Based Strategy performance over time/
      )
    ).toBeInTheDocument();
  });

  it("shows empty state when no backtest data", async () => {
    await act(async () => {
      render(<BacktestingView />);
    });

    expect(screen.getByText("Ready to Compare Strategies")).toBeInTheDocument();
  });

  it("shows loading state when pending", async () => {
    vi.mocked(useBacktestMutation).mockReturnValue({
      ...defaultMock,
      isPending: true,
    } as any);

    await act(async () => {
      render(<BacktestingView />);
    });

    expect(
      screen.getByRole("status", {
        name: /Running backtest simulation/i,
      })
    ).toBeInTheDocument();
  });

  it("displays error message from API", async () => {
    vi.mocked(useBacktestMutation).mockReturnValue({
      ...defaultMock,
      error: new Error("Test API Error"),
    } as any);

    await act(async () => {
      render(<BacktestingView />);
    });

    expect(screen.getByText("Test API Error")).toBeInTheDocument();
  });

  it("displays terminal display with results", async () => {
    vi.mocked(useBacktestMutation).mockReturnValue({
      ...defaultMock,
      data: mockBacktestData,
    } as any);

    await act(async () => {
      render(<BacktestingView />);
    });

    // Hero metrics for the primary strategy (simple_regime)
    expect(screen.getByText("ROI")).toBeInTheDocument();
    expect(screen.getByText("+15.5%")).toBeInTheDocument();
    expect(screen.getByText("CALMAR")).toBeInTheDocument();
    expect(screen.getByText("MAX DRAWDOWN")).toBeInTheDocument();
    expect(screen.getByTestId("composed-chart")).toBeInTheDocument();
  });

  it("auto-runs backtest on mount", async () => {
    await act(async () => {
      render(<BacktestingView />);
    });

    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalled();
    });
  });

  it("renders days and capital inputs when data present", async () => {
    vi.mocked(useBacktestMutation).mockReturnValue({
      ...defaultMock,
      data: mockBacktestData,
    } as any);

    await act(async () => {
      render(<BacktestingView />);
    });

    const daysInput = screen.getByDisplayValue("500");

    expect(daysInput).toBeInTheDocument();
    expect(daysInput).toHaveAttribute("type", "number");
  });

  it("renders [RUN] button when data present", async () => {
    vi.mocked(useBacktestMutation).mockReturnValue({
      ...defaultMock,
      data: mockBacktestData,
    } as any);

    await act(async () => {
      render(<BacktestingView />);
    });

    const runButton = screen.getByText("[RUN]");
    expect(runButton).toBeInTheDocument();
    expect(runButton.tagName).toBe("BUTTON");
  });

  it("shows loading state when pending even with data", async () => {
    vi.mocked(useBacktestMutation).mockReturnValue({
      ...defaultMock,
      data: mockBacktestData,
      isPending: true,
    } as any);

    await act(async () => {
      render(<BacktestingView />);
    });

    // isPending takes priority over data — loading state shown
    expect(
      screen.getByRole("status", {
        name: /Running backtest simulation/i,
      })
    ).toBeInTheDocument();
    expect(screen.queryByText("[RUN]")).not.toBeInTheDocument();
  });

  it("displays non-Error failures with generic message", async () => {
    vi.mocked(useBacktestMutation).mockReturnValue({
      ...defaultMock,
      error: "some string error",
    } as any);

    await act(async () => {
      render(<BacktestingView />);
    });

    expect(screen.getByText("Failed to run backtest")).toBeInTheDocument();
  });
});
