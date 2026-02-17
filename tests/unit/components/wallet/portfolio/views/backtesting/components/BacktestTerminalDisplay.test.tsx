import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { BacktestTerminalDisplay } from "@/components/wallet/portfolio/views/backtesting/components/BacktestTerminalDisplay";
import type { BacktestResponse } from "@/types/backtesting";

// Mock framer-motion
vi.mock("framer-motion", () => ({
  AnimatePresence: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
  motion: {
    div: ({
      children,
      ...props
    }: {
      children: React.ReactNode;
      [key: string]: unknown;
    }) => <div {...props}>{children}</div>,
  },
}));

// Mock constants
vi.mock("@/components/wallet/portfolio/views/backtesting/constants", () => ({
  DEFAULT_DAYS: 500,
  SIGNAL_PROVIDER_OPTIONS: [
    { value: "", label: "None" },
    { value: "fgi", label: "FGI" },
  ],
  PACING_POLICY_OPTIONS: [
    { value: "fgi_exponential", label: "FGI Exp" },
    { value: "linear", label: "Linear" },
  ],
}));

// Mock chart helpers
vi.mock(
  "@/components/wallet/portfolio/views/backtesting/utils/chartHelpers",
  () => ({
    getPrimaryStrategyId: vi.fn((ids: string[]) => ids[0] || null),
  })
);

// Mock JSON configuration helpers
vi.mock(
  "@/components/wallet/portfolio/views/backtesting/utils/jsonConfigurationHelpers",
  () => ({
    parseJsonField: vi.fn(
      (_json: string, _field: string, fallback: number) => fallback
    ),
    parseRegimeParam: vi.fn(
      (_json: string, _param: string, fallback: string) => fallback
    ),
    updateJsonField: vi.fn(
      (_json: string, _field: string, value: number) => `{"days":${value}}`
    ),
    updateRegimeParam: vi.fn(
      (_json: string, _param: string, value: string) =>
        `{"regime_params":{"${_param}":"${value}"}}`
    ),
  })
);

// Mock BacktestChart
vi.mock(
  "@/components/wallet/portfolio/views/backtesting/components/BacktestChart",
  () => ({
    BacktestChart: () => <div data-testid="backtest-chart" />,
  })
);

// Mock backtestTerminalMetrics
vi.mock(
  "@/components/wallet/portfolio/views/backtesting/components/backtestTerminalMetrics",
  () => ({
    createHeroMetrics: vi.fn(regime =>
      regime
        ? [
            {
              label: "Total Return",
              value: "+25.5%",
              bar: "████████",
              color: "text-emerald-400",
            },
            {
              label: "Sharpe Ratio",
              value: "1.85",
              bar: "██████",
              color: "text-emerald-400",
            },
            {
              label: "Win Rate",
              value: "62%",
              bar: "█████",
              color: "text-emerald-400",
            },
          ]
        : []
    ),
    createSecondaryMetrics: vi.fn(regime =>
      regime
        ? [
            { label: "Max DD", value: "-12.3%" },
            { label: "Vol", value: "18.5%" },
            { label: "Trades", value: "142" },
          ]
        : []
    ),
  })
);

describe("BacktestTerminalDisplay", () => {
  const mockOnRun = vi.fn();
  const mockOnEditorValueChange = vi.fn();

  const defaultProps = {
    summary: null,
    sortedStrategyIds: [],
    actualDays: 500,
    chartData: [],
    yAxisDomain: [0, 100] as [number, number],
    isPending: false,
    onRun: mockOnRun,
    editorValue: '{"days":500}',
    onEditorValueChange: mockOnEditorValueChange,
  };

  const mockSummary: { strategies: BacktestResponse["strategies"] } = {
    strategies: {
      regime_dynamic: {
        regime: "regime_dynamic",
        total_return: 0.255,
        sharpe_ratio: 1.85,
        max_drawdown: -0.123,
        win_rate: 0.62,
        total_trades: 142,
        volatility: 0.185,
        sortino_ratio: 2.1,
        calmar_ratio: 1.5,
        avg_win: 0.025,
        avg_loss: -0.015,
        profit_factor: 1.8,
      },
    },
  };

  it("renders command prompt bar with all elements", () => {
    render(<BacktestTerminalDisplay {...defaultProps} />);

    expect(screen.getByText("$")).toBeDefined();
    expect(screen.getByText("backtest")).toBeDefined();
    expect(screen.getByText("--days")).toBeDefined();
    expect(screen.getByText("--signal")).toBeDefined();
    expect(screen.getByText("--pacing")).toBeDefined();
    expect(screen.getByRole("button", { name: /RUN/i })).toBeDefined();
  });

  it("shows [RUN] when not pending", () => {
    render(<BacktestTerminalDisplay {...defaultProps} isPending={false} />);

    const button = screen.getByRole("button", { name: /RUN/i });
    expect(button.textContent).toBe("[RUN]");
  });

  it("shows [...] when pending", () => {
    render(<BacktestTerminalDisplay {...defaultProps} isPending={true} />);

    const button = screen.getByRole("button");
    expect(button.textContent).toBe("[...]");
  });

  it("disables run button when isPending", () => {
    render(<BacktestTerminalDisplay {...defaultProps} isPending={true} />);

    const button = screen.getByRole("button");
    expect(button.getAttribute("disabled")).not.toBeNull();
  });

  it("enables run button when not isPending", () => {
    render(<BacktestTerminalDisplay {...defaultProps} isPending={false} />);

    const button = screen.getByRole("button", { name: /RUN/i });
    expect(button.getAttribute("disabled")).toBeNull();
  });

  it("calls onRun when run button clicked", () => {
    render(<BacktestTerminalDisplay {...defaultProps} />);

    const button = screen.getByRole("button", { name: /RUN/i });
    fireEvent.click(button);

    expect(mockOnRun).toHaveBeenCalledOnce();
  });

  it("handleDaysChange: calls onEditorValueChange with updateJsonField result", async () => {
    const { updateJsonField } = await import(
      "@/components/wallet/portfolio/views/backtesting/utils/jsonConfigurationHelpers"
    );

    render(<BacktestTerminalDisplay {...defaultProps} />);

    const daysInput = screen.getByRole("spinbutton");
    fireEvent.change(daysInput, { target: { value: "365" } });

    expect(updateJsonField).toHaveBeenCalledWith('{"days":500}', "days", 365);
    expect(mockOnEditorValueChange).toHaveBeenCalledWith('{"days":365}');
  });

  it("handleSignalChange: calls onEditorValueChange with updateRegimeParam result", async () => {
    const { updateRegimeParam } = await import(
      "@/components/wallet/portfolio/views/backtesting/utils/jsonConfigurationHelpers"
    );

    render(<BacktestTerminalDisplay {...defaultProps} />);

    const selects = screen.getAllByRole("combobox");
    const signalSelect = selects[0];
    fireEvent.change(signalSelect, { target: { value: "fgi" } });

    expect(updateRegimeParam).toHaveBeenCalledWith(
      '{"days":500}',
      "signal_provider",
      "fgi"
    );
    expect(mockOnEditorValueChange).toHaveBeenCalledWith(
      '{"regime_params":{"signal_provider":"fgi"}}'
    );
  });

  it("handlePacingChange: calls onEditorValueChange with updateRegimeParam result", async () => {
    const { updateRegimeParam } = await import(
      "@/components/wallet/portfolio/views/backtesting/utils/jsonConfigurationHelpers"
    );

    render(<BacktestTerminalDisplay {...defaultProps} />);

    const selects = screen.getAllByRole("combobox");
    const pacingSelect = selects[1];
    fireEvent.change(pacingSelect, { target: { value: "linear" } });

    expect(updateRegimeParam).toHaveBeenCalledWith(
      '{"days":500}',
      "pacing_policy",
      "linear"
    );
    expect(mockOnEditorValueChange).toHaveBeenCalledWith(
      '{"regime_params":{"pacing_policy":"linear"}}'
    );
  });

  it("shows hero metrics when summary has a matching strategy", () => {
    render(
      <BacktestTerminalDisplay
        {...defaultProps}
        summary={mockSummary}
        sortedStrategyIds={["regime_dynamic"]}
      />
    );

    expect(screen.getByText("Total Return")).toBeDefined();
    expect(screen.getByText("+25.5%")).toBeDefined();
    expect(screen.getByText("Sharpe Ratio")).toBeDefined();
    expect(screen.getByText("1.85")).toBeDefined();
    expect(screen.getByText("Win Rate")).toBeDefined();
    expect(screen.getByText("62%")).toBeDefined();
  });

  it("hides hero metrics when summary is null", () => {
    render(<BacktestTerminalDisplay {...defaultProps} summary={null} />);

    expect(screen.queryByText("Total Return")).toBeNull();
    expect(screen.queryByText("Sharpe Ratio")).toBeNull();
    expect(screen.queryByText("Win Rate")).toBeNull();
  });

  it("hides hero metrics when sortedStrategyIds is empty", () => {
    render(
      <BacktestTerminalDisplay
        {...defaultProps}
        summary={mockSummary}
        sortedStrategyIds={[]}
      />
    );

    expect(screen.queryByText("Total Return")).toBeNull();
    expect(screen.queryByText("Sharpe Ratio")).toBeNull();
  });

  it("shows chart when chartData has entries", () => {
    const chartData = [
      { date: "2024-01-01", regime_dynamic: 100 },
      { date: "2024-01-02", regime_dynamic: 105 },
    ];

    render(<BacktestTerminalDisplay {...defaultProps} chartData={chartData} />);

    expect(screen.getByTestId("backtest-chart")).toBeDefined();
  });

  it("hides chart when chartData is empty", () => {
    render(<BacktestTerminalDisplay {...defaultProps} chartData={[]} />);

    expect(screen.queryByTestId("backtest-chart")).toBeNull();
  });

  it("shows toggle prompt when regime exists", () => {
    render(
      <BacktestTerminalDisplay
        {...defaultProps}
        summary={mockSummary}
        sortedStrategyIds={["regime_dynamic"]}
      />
    );

    expect(screen.getByText("show_metrics")).toBeDefined();
    expect(screen.getByText("[y/N]")).toBeDefined();
  });

  it("hides toggle prompt when regime does not exist", () => {
    render(
      <BacktestTerminalDisplay
        {...defaultProps}
        summary={null}
        sortedStrategyIds={[]}
      />
    );

    expect(screen.queryByText("show_metrics")).toBeNull();
  });

  it("toggles secondary metrics when show_metrics button clicked", () => {
    render(
      <BacktestTerminalDisplay
        {...defaultProps}
        summary={mockSummary}
        sortedStrategyIds={["regime_dynamic"]}
      />
    );

    // Initially hidden
    expect(screen.queryByText("Max DD")).toBeNull();
    expect(screen.queryByText("-12.3%")).toBeNull();

    // Click toggle button
    const toggleButton = screen.getByText("show_metrics").closest("button");
    if (!toggleButton) throw new Error("Toggle button not found");
    fireEvent.click(toggleButton);

    // Now visible
    expect(screen.getByText("Max DD")).toBeDefined();
    expect(screen.getByText("-12.3%")).toBeDefined();
    expect(screen.getByText("[Y/n]")).toBeDefined();
  });

  it("shows correct secondary metrics after toggle", () => {
    render(
      <BacktestTerminalDisplay
        {...defaultProps}
        summary={mockSummary}
        sortedStrategyIds={["regime_dynamic"]}
      />
    );

    const toggleButton = screen.getByText("show_metrics").closest("button");
    if (!toggleButton) throw new Error("Toggle button not found");
    fireEvent.click(toggleButton);

    expect(screen.getByText("Max DD")).toBeDefined();
    expect(screen.getByText("-12.3%")).toBeDefined();
    expect(screen.getByText("Vol")).toBeDefined();
    expect(screen.getByText("18.5%")).toBeDefined();
    expect(screen.getByText("Trades")).toBeDefined();
    expect(screen.getByText("142")).toBeDefined();
  });

  it("hides secondary metrics when toggled back to closed state", () => {
    render(
      <BacktestTerminalDisplay
        {...defaultProps}
        summary={mockSummary}
        sortedStrategyIds={["regime_dynamic"]}
      />
    );

    const toggleButton = screen.getByText("show_metrics").closest("button");
    if (!toggleButton) throw new Error("Toggle button not found");

    // Open
    fireEvent.click(toggleButton);
    expect(screen.getByText("Max DD")).toBeDefined();

    // Close
    fireEvent.click(toggleButton);
    expect(screen.queryByText("Max DD")).toBeNull();
    expect(screen.getByText("[y/N]")).toBeDefined();
  });

  it("renders signal provider options correctly", () => {
    render(<BacktestTerminalDisplay {...defaultProps} />);

    const selects = screen.getAllByRole("combobox");
    const signalSelect = selects[0] as HTMLSelectElement;

    const options = Array.from(signalSelect.options).map(opt => ({
      value: opt.value,
      label: opt.textContent,
    }));

    expect(options).toEqual([
      { value: "", label: "None" },
      { value: "fgi", label: "FGI" },
    ]);
  });

  it("renders pacing policy options correctly", () => {
    render(<BacktestTerminalDisplay {...defaultProps} />);

    const selects = screen.getAllByRole("combobox");
    const pacingSelect = selects[1] as HTMLSelectElement;

    const options = Array.from(pacingSelect.options).map(opt => ({
      value: opt.value,
      label: opt.textContent,
    }));

    expect(options).toEqual([
      { value: "fgi_exponential", label: "FGI Exp" },
      { value: "linear", label: "Linear" },
    ]);
  });
});
