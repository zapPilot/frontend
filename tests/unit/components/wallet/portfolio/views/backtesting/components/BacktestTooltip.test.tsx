import { beforeEach, describe, expect, it, vi } from "vitest";

import { BacktestTooltip } from "@/components/wallet/portfolio/views/backtesting/components/BacktestTooltip";
import { useBacktestTooltipData } from "@/components/wallet/portfolio/views/backtesting/hooks/useBacktestTooltipData";

import { render, screen } from "../../../../../../../test-utils";

// Mock the hook
vi.mock(
  "@/components/wallet/portfolio/views/backtesting/hooks/useBacktestTooltipData",
  () => ({
    useBacktestTooltipData: vi.fn(),
  })
);

// Mock utilities
vi.mock("@/utils", () => ({
  formatCurrency: vi.fn((val: number) =>
    val.toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  ),
}));

// Mock BacktestAllocationBar
vi.mock(
  "@/components/wallet/portfolio/views/backtesting/components/BacktestAllocationBar",
  () => ({
    BacktestAllocationBar: (props: {
      strategyId?: string;
      displayName: string;
    }) => (
      <div data-testid={`allocation-${props.strategyId ?? "default"}`}>
        {props.displayName}
      </div>
    ),
  })
);

const mockedUseBacktestTooltipData = vi.mocked(useBacktestTooltipData);

/**
 * Factory function to create mock tooltip data
 *
 * @param overrides - Optional overrides for the tooltip data
 * @returns Mock tooltip data object
 */
function createTooltipData(overrides: Record<string, unknown> = {}) {
  return {
    dateStr: "1/15/2025",
    btcPrice: 42000,
    sections: {
      strategies: [],
      events: [],
      signals: [],
      allocations: [],
    },
    ...overrides,
  };
}

describe("BacktestTooltip", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns null when active is false", () => {
    mockedUseBacktestTooltipData.mockReturnValue(null);

    render(<BacktestTooltip active={false} payload={[]} label="" />);

    // The component should not render the tooltip content
    expect(screen.queryByText(/BTC Price:/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Signals/i)).not.toBeInTheDocument();
  });

  it("returns null when data is null", () => {
    mockedUseBacktestTooltipData.mockReturnValue(null);

    render(<BacktestTooltip active={true} payload={[]} label="" />);

    // The component should not render the tooltip content
    expect(screen.queryByText(/BTC Price:/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Signals/i)).not.toBeInTheDocument();
  });

  it("renders date string", () => {
    mockedUseBacktestTooltipData.mockReturnValue(
      createTooltipData() as ReturnType<typeof useBacktestTooltipData>
    );

    render(<BacktestTooltip active={true} payload={[]} label="" />);

    expect(screen.getByText("1/15/2025")).toBeInTheDocument();
  });

  it("renders BTC price when provided", () => {
    mockedUseBacktestTooltipData.mockReturnValue(
      createTooltipData({ btcPrice: 42000 }) as ReturnType<
        typeof useBacktestTooltipData
      >
    );

    render(<BacktestTooltip active={true} payload={[]} label="" />);

    expect(screen.getByText(/BTC Price:/)).toBeInTheDocument();
    expect(screen.getByText(/\$42,000\.00/)).toBeInTheDocument();
  });

  it("does not render BTC price section when btcPrice is undefined", () => {
    mockedUseBacktestTooltipData.mockReturnValue(
      createTooltipData({ btcPrice: undefined }) as ReturnType<
        typeof useBacktestTooltipData
      >
    );

    render(<BacktestTooltip active={true} payload={[]} label="" />);

    expect(screen.queryByText(/BTC Price:/)).not.toBeInTheDocument();
  });

  it("renders strategy items with name and value", () => {
    mockedUseBacktestTooltipData.mockReturnValue(
      createTooltipData({
        sections: {
          strategies: [
            { name: "AWP", value: 10000, color: "#3b82f6" },
            { name: "Momentum", value: 5000, color: "#10b981" },
          ],
          events: [],
          signals: [],
          allocations: [],
        },
      }) as ReturnType<typeof useBacktestTooltipData>
    );

    render(<BacktestTooltip active={true} payload={[]} label="" />);

    expect(screen.getByText(/AWP: \$10,000/)).toBeInTheDocument();
    expect(screen.getByText(/Momentum: \$5,000/)).toBeInTheDocument();
  });

  it("renders event items with strategy names in parentheses", () => {
    mockedUseBacktestTooltipData.mockReturnValue(
      createTooltipData({
        sections: {
          strategies: [],
          events: [
            {
              name: "Rebalance",
              strategies: ["AWP", "Momentum"],
              color: "#f59e0b",
            },
            { name: "Signal Fired", strategies: ["AWP"], color: "#ef4444" },
          ],
          signals: [],
          allocations: [],
        },
      }) as ReturnType<typeof useBacktestTooltipData>
    );

    render(<BacktestTooltip active={true} payload={[]} label="" />);

    expect(screen.getByText("Rebalance (AWP, Momentum)")).toBeInTheDocument();
    expect(screen.getByText("Signal Fired (AWP)")).toBeInTheDocument();
  });

  it("renders event items without parentheses when strategies array is empty", () => {
    mockedUseBacktestTooltipData.mockReturnValue(
      createTooltipData({
        sections: {
          strategies: [],
          events: [
            {
              name: "Market Event",
              strategies: [],
              color: "#8b5cf6",
            },
          ],
          signals: [],
          allocations: [],
        },
      }) as ReturnType<typeof useBacktestTooltipData>
    );

    render(<BacktestTooltip active={true} payload={[]} label="" />);

    expect(screen.getByText("Market Event")).toBeInTheDocument();
    expect(screen.queryByText(/\(/)).not.toBeInTheDocument();
  });

  it("renders signals section with header when signals present", () => {
    mockedUseBacktestTooltipData.mockReturnValue(
      createTooltipData({
        sections: {
          strategies: [],
          events: [],
          signals: [
            { name: "RSI", value: "72.5", color: "#3b82f6" },
            { name: "MACD", value: "BUY", color: "#10b981" },
          ],
          allocations: [],
        },
      }) as ReturnType<typeof useBacktestTooltipData>
    );

    render(<BacktestTooltip active={true} payload={[]} label="" />);

    expect(screen.getByText("Signals")).toBeInTheDocument();
    expect(screen.getByText("RSI")).toBeInTheDocument();
    expect(screen.getByText("72.5")).toBeInTheDocument();
    expect(screen.getByText("MACD")).toBeInTheDocument();
    expect(screen.getByText("BUY")).toBeInTheDocument();
  });

  it("does not render signals section when empty", () => {
    mockedUseBacktestTooltipData.mockReturnValue(
      createTooltipData({
        sections: {
          strategies: [],
          events: [],
          signals: [],
          allocations: [],
        },
      }) as ReturnType<typeof useBacktestTooltipData>
    );

    render(<BacktestTooltip active={true} payload={[]} label="" />);

    expect(screen.queryByText("Signals")).not.toBeInTheDocument();
  });

  it("renders allocation bars when allocations present", () => {
    mockedUseBacktestTooltipData.mockReturnValue(
      createTooltipData({
        sections: {
          strategies: [],
          events: [],
          signals: [],
          allocations: [
            {
              id: "awp",
              displayName: "AWP Portfolio",
              constituents: { BTC: 0.6, ETH: 0.4 },
              index: 0,
              spotBreakdown: null,
            },
            {
              id: "momentum",
              displayName: "Momentum",
              constituents: { BTC: 1.0 },
              index: 1,
              spotBreakdown: "BTC 0.5 | ETH 0.3",
            },
          ],
        },
      }) as ReturnType<typeof useBacktestTooltipData>
    );

    render(<BacktestTooltip active={true} payload={[]} label="" />);

    expect(screen.getByTestId("allocation-awp")).toBeInTheDocument();
    expect(screen.getByTestId("allocation-momentum")).toBeInTheDocument();
    expect(screen.getByText("AWP Portfolio")).toBeInTheDocument();
    expect(screen.getByText("Momentum")).toBeInTheDocument();
  });

  it("does not render allocations section when empty", () => {
    mockedUseBacktestTooltipData.mockReturnValue(
      createTooltipData({
        sections: {
          strategies: [],
          events: [],
          signals: [],
          allocations: [],
        },
      }) as ReturnType<typeof useBacktestTooltipData>
    );

    const { container } = render(
      <BacktestTooltip active={true} payload={[]} label="" />
    );

    expect(
      container.querySelector('[data-testid^="allocation-"]')
    ).not.toBeInTheDocument();
  });

  it("renders multiple sections together", () => {
    mockedUseBacktestTooltipData.mockReturnValue(
      createTooltipData({
        dateStr: "2/1/2025",
        btcPrice: 45000,
        sections: {
          strategies: [{ name: "AWP", value: 12000, color: "#3b82f6" }],
          events: [
            {
              name: "Rebalance",
              strategies: ["AWP"],
              color: "#f59e0b",
            },
          ],
          signals: [{ name: "Trend", value: "UP", color: "#10b981" }],
          allocations: [
            {
              id: "awp",
              displayName: "AWP",
              constituents: { BTC: 0.7, ETH: 0.3 },
              index: 0,
              spotBreakdown: null,
            },
          ],
        },
      }) as ReturnType<typeof useBacktestTooltipData>
    );

    render(<BacktestTooltip active={true} payload={[]} label="" />);

    expect(screen.getByText("2/1/2025")).toBeInTheDocument();
    expect(screen.getByText(/\$45,000\.00/)).toBeInTheDocument();
    expect(screen.getByText(/AWP: \$12,000/)).toBeInTheDocument();
    expect(screen.getByText("Rebalance (AWP)")).toBeInTheDocument();
    expect(screen.getByText("Signals")).toBeInTheDocument();
    expect(screen.getByText("Trend")).toBeInTheDocument();
    expect(screen.getByTestId("allocation-awp")).toBeInTheDocument();
  });
});
