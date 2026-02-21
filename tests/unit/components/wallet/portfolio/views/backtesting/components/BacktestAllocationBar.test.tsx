import { beforeEach, describe, expect, it, vi } from "vitest";

import { mapBacktestToUnified } from "@/components/wallet/portfolio/components/allocation";
import { BacktestAllocationBar } from "@/components/wallet/portfolio/views/backtesting/components/BacktestAllocationBar";
import { getStrategyColor } from "@/components/wallet/portfolio/views/backtesting/utils/strategyDisplay";

import { render, screen } from "../../../../../../../test-utils";

// Mock allocation utilities
vi.mock("@/components/wallet/portfolio/components/allocation", () => ({
  mapBacktestToUnified: vi.fn(),
  UnifiedAllocationBar: (props: {
    testIdPrefix: string;
    segments: unknown[];
  }) => (
    <div data-testid={props.testIdPrefix}>{props.segments.length} segments</div>
  ),
}));

// Mock strategy display utilities
vi.mock(
  "@/components/wallet/portfolio/views/backtesting/utils/strategyDisplay",
  () => ({
    getStrategyColor: vi.fn(() => "#ff0000"),
  })
);

const mockedMapBacktestToUnified = vi.mocked(mapBacktestToUnified);
const mockedGetStrategyColor = vi.mocked(getStrategyColor);

describe("BacktestAllocationBar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns null when segments are empty", () => {
    mockedMapBacktestToUnified.mockReturnValue([]);

    render(
      <BacktestAllocationBar
        displayName="Test Strategy"
        constituents={{ spot: 5000, lp: 3000, stable: 2000 }}
      />
    );

    // The component should not render when segments are empty
    expect(screen.queryByText("Test Strategy")).not.toBeInTheDocument();
    expect(screen.queryByTestId(/^backtest-/)).not.toBeInTheDocument();
  });

  it("renders display name", () => {
    mockedMapBacktestToUnified.mockReturnValue([
      { id: "BTC", label: "BTC", percentage: 50, color: "#f7931a" },
    ]);

    render(
      <BacktestAllocationBar
        displayName="AWP Portfolio"
        constituents={{ spot: 5000, lp: 3000, stable: 2000 }}
      />
    );

    expect(screen.getByText("AWP Portfolio")).toBeInTheDocument();
  });

  it("renders color indicator when strategyId is provided", () => {
    mockedMapBacktestToUnified.mockReturnValue([
      { id: "BTC", label: "BTC", percentage: 50, color: "#f7931a" },
    ]);
    mockedGetStrategyColor.mockReturnValue("#3b82f6");

    const { container } = render(
      <BacktestAllocationBar
        displayName="AWP Portfolio"
        constituents={{ spot: 5000, lp: 3000, stable: 2000 }}
        strategyId="awp"
        index={0}
      />
    );

    const colorIndicator = container.querySelector(
      ".w-2.h-2.rounded-full.shrink-0"
    );
    expect(colorIndicator).toBeInTheDocument();
    expect(colorIndicator).toHaveStyle({ backgroundColor: "#3b82f6" });
  });

  it("does not render color indicator when strategyId is undefined", () => {
    mockedMapBacktestToUnified.mockReturnValue([
      { id: "BTC", label: "BTC", percentage: 50, color: "#f7931a" },
    ]);

    const { container } = render(
      <BacktestAllocationBar
        displayName="Custom Portfolio"
        constituents={{ spot: 5000, lp: 3000, stable: 2000 }}
      />
    );

    const colorIndicator = container.querySelector(
      ".w-2.h-2.rounded-full.shrink-0"
    );
    expect(colorIndicator).not.toBeInTheDocument();
  });

  it("calls getStrategyColor with correct parameters", () => {
    mockedMapBacktestToUnified.mockReturnValue([
      { id: "BTC", label: "BTC", percentage: 50, color: "#f7931a" },
    ]);
    mockedGetStrategyColor.mockReturnValue("#10b981");

    render(
      <BacktestAllocationBar
        displayName="Momentum"
        constituents={{ spot: 10000, lp: 0, stable: 0 }}
        strategyId="momentum"
        index={2}
      />
    );

    expect(mockedGetStrategyColor).toHaveBeenCalledWith("momentum", 2);
  });

  it("renders UnifiedAllocationBar with correct testIdPrefix when strategyId provided", () => {
    mockedMapBacktestToUnified.mockReturnValue([
      { id: "BTC", label: "BTC", percentage: 60, color: "#f7931a" },
      { id: "ETH", label: "ETH", percentage: 40, color: "#627eea" },
    ]);

    render(
      <BacktestAllocationBar
        displayName="AWP"
        constituents={{ spot: 6000, lp: 2000, stable: 2000 }}
        strategyId="awp"
        index={0}
      />
    );

    expect(screen.getByTestId("backtest-awp")).toBeInTheDocument();
    expect(screen.getByText("2 segments")).toBeInTheDocument();
  });

  it("renders UnifiedAllocationBar with default testIdPrefix when strategyId is undefined", () => {
    mockedMapBacktestToUnified.mockReturnValue([
      { id: "BTC", label: "BTC", percentage: 100, color: "#f7931a" },
    ]);

    render(
      <BacktestAllocationBar
        displayName="Custom"
        constituents={{ spot: 10000, lp: 0, stable: 0 }}
      />
    );

    expect(screen.getByTestId("backtest-default")).toBeInTheDocument();
    expect(screen.getByText("1 segments")).toBeInTheDocument();
  });

  it("renders spot breakdown when provided", () => {
    mockedMapBacktestToUnified.mockReturnValue([
      { id: "BTC", label: "BTC", percentage: 50, color: "#f7931a" },
    ]);

    render(
      <BacktestAllocationBar
        displayName="AWP"
        constituents={{ spot: 5000, lp: 3000, stable: 2000 }}
        strategyId="awp"
        spotBreakdown="BTC 0.5 | ETH 0.3 | USDT 0.2"
      />
    );

    expect(
      screen.getByText("Spot: BTC 0.5 | ETH 0.3 | USDT 0.2")
    ).toBeInTheDocument();
  });

  it("does not render spot breakdown when not provided", () => {
    mockedMapBacktestToUnified.mockReturnValue([
      { id: "BTC", label: "BTC", percentage: 50, color: "#f7931a" },
    ]);

    render(
      <BacktestAllocationBar
        displayName="AWP"
        constituents={{ spot: 5000, lp: 3000, stable: 2000 }}
        strategyId="awp"
      />
    );

    expect(screen.queryByText(/Spot:/)).not.toBeInTheDocument();
  });

  it("does not render spot breakdown when explicitly null", () => {
    mockedMapBacktestToUnified.mockReturnValue([
      { id: "BTC", label: "BTC", percentage: 50, color: "#f7931a" },
    ]);

    render(
      <BacktestAllocationBar
        displayName="AWP"
        constituents={{ spot: 5000, lp: 3000, stable: 2000 }}
        strategyId="awp"
        spotBreakdown={null}
      />
    );

    expect(screen.queryByText(/Spot:/)).not.toBeInTheDocument();
  });

  it("recalculates segments when constituents change", () => {
    mockedMapBacktestToUnified.mockReturnValue([
      { id: "BTC", label: "BTC", percentage: 70, color: "#f7931a" },
    ]);

    const { rerender } = render(
      <BacktestAllocationBar
        displayName="AWP"
        constituents={{ spot: 7000, lp: 1500, stable: 1500 }}
      />
    );

    expect(mockedMapBacktestToUnified).toHaveBeenCalledTimes(1);

    // Rerender with different constituents
    rerender(
      <BacktestAllocationBar
        displayName="AWP"
        constituents={{ spot: 5000, lp: 3000, stable: 2000 }}
      />
    );

    // Should call mapping function again
    expect(mockedMapBacktestToUnified).toHaveBeenCalledTimes(2);
  });

  it("renders complete component with all props", () => {
    mockedMapBacktestToUnified.mockReturnValue([
      { id: "BTC", label: "BTC", percentage: 60, color: "#f7931a" },
      { id: "ETH", label: "ETH", percentage: 40, color: "#627eea" },
    ]);
    mockedGetStrategyColor.mockReturnValue("#3b82f6");

    const { container } = render(
      <BacktestAllocationBar
        displayName="AWP Portfolio"
        constituents={{ spot: 6000, lp: 2000, stable: 2000 }}
        strategyId="awp"
        index={0}
        spotBreakdown="BTC 0.6 | ETH 0.4"
      />
    );

    // Check all elements are present
    expect(screen.getByText("AWP Portfolio")).toBeInTheDocument();
    expect(
      container.querySelector(".w-2.h-2.rounded-full.shrink-0")
    ).toBeInTheDocument();
    expect(screen.getByTestId("backtest-awp")).toBeInTheDocument();
    expect(screen.getByText("Spot: BTC 0.6 | ETH 0.4")).toBeInTheDocument();
  });
});
