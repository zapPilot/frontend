import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { BacktestingView } from "@/components/wallet/portfolio/views/BacktestingView";
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
  AreaChart: () => <div data-testid="area-chart" />,
  Area: () => null,
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

    expect(screen.getByTestId("area-chart")).toBeInTheDocument();
  });
});
