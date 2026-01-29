import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { BacktestingView } from "@/components/wallet/portfolio/views/BacktestingView";
import { useBacktestMutation } from "@/hooks/mutations/useBacktestMutation";

// Mock useBacktestMutation
vi.mock("@/hooks/mutations/useBacktestMutation", () => ({
  useBacktestMutation: vi.fn(),
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

  it("renders the JSON editor and run button", () => {
    render(<BacktestingView />);

    expect(screen.getByText("DCA Strategy Comparison")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Run Backtest/i })
    ).toBeInTheDocument();
    expect(screen.getByText("Request Payload (v3)")).toBeInTheDocument();
    expect(screen.getByRole("textbox")).toBeInTheDocument();
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

  it("displays error message from API", () => {
    vi.mocked(useBacktestMutation).mockReturnValue({
      ...defaultMock,
      error: new Error("Test API Error"),
    } as any);

    render(<BacktestingView />);

    expect(screen.getByText("Test API Error")).toBeInTheDocument();
  });

  it("displays results when data is present", () => {
    const mockData = {
      strategies: {
        dca_classic: {
          strategy_id: "dca_classic",
          display_name: "DCA Classic",
          roi_percent: 5.2,
          final_value: 10500,
          total_invested: 10000,
          trade_count: 0,
          max_drawdown_percent: 5,
          parameters: {},
        },
        simple_regime: {
          strategy_id: "simple_regime",
          display_name: "Simple Regime",
          roi_percent: 15.5,
          final_value: 12000,
          total_invested: 10000,
          trade_count: 5,
          max_drawdown_percent: 10,
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

    vi.mocked(useBacktestMutation).mockReturnValue({
      ...defaultMock,
      data: mockData,
    } as any);

    render(<BacktestingView />);

    expect(screen.getByText("ROI")).toBeInTheDocument();
    expect(screen.getByText("+15.5%")).toBeInTheDocument();
    expect(screen.getByText("+5.2%")).toBeInTheDocument();
    expect(screen.getByTestId("composed-chart")).toBeInTheDocument();
  });
});
