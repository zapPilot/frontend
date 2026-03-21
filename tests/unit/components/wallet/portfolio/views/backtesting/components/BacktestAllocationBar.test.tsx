import { beforeEach, describe, expect, it, vi } from "vitest";

import { BacktestAllocationBar } from "@/components/wallet/portfolio/views/backtesting/components/BacktestAllocationBar";
import { getStrategyColor } from "@/components/wallet/portfolio/views/backtesting/utils/strategyDisplay";

import { render, screen } from "../../../../../../../test-utils";

vi.mock("@/components/wallet/portfolio/components/allocation", () => ({
  UnifiedAllocationBar: (props: {
    testIdPrefix: string;
    segments: { label: string; percentage: number }[];
  }) => (
    <div data-testid={props.testIdPrefix}>
      {props.segments
        .map(segment => `${segment.label}:${segment.percentage}`)
        .join("|")}
    </div>
  ),
}));

vi.mock(
  "@/components/wallet/portfolio/views/backtesting/utils/strategyDisplay",
  () => ({
    getStrategyColor: vi.fn(() => "#ff0000"),
  })
);

const mockedGetStrategyColor = vi.mocked(getStrategyColor);

describe("BacktestAllocationBar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns null when both spot and stable allocations are zero", () => {
    render(
      <BacktestAllocationBar
        displayName="Test Strategy"
        allocation={{ spot: 0, stable: 0 }}
      />
    );

    expect(screen.queryByText("Test Strategy")).not.toBeInTheDocument();
    expect(screen.queryByTestId(/^backtest-/)).not.toBeInTheDocument();
  });

  it("renders display name and the mapped allocation segments", () => {
    render(
      <BacktestAllocationBar
        displayName="AWP Portfolio"
        allocation={{ spot: 0.6, stable: 0.4 }}
      />
    );

    expect(screen.getByText("AWP Portfolio")).toBeInTheDocument();
    expect(screen.getByTestId("backtest-default")).toHaveTextContent(
      "SPOT:60|STABLE:40"
    );
  });

  it("renders dynamic spot asset labels when provided", () => {
    render(
      <BacktestAllocationBar
        displayName="ETH Rotation"
        allocation={{ spot: 0.75, stable: 0.25 }}
        spotAssetLabel="ETH"
      />
    );

    expect(screen.getByTestId("backtest-default")).toHaveTextContent(
      "ETH:75|STABLE:25"
    );
  });

  it("renders a strategy color indicator when strategyId is provided", () => {
    mockedGetStrategyColor.mockReturnValue("#3b82f6");

    const { container } = render(
      <BacktestAllocationBar
        displayName="Momentum"
        allocation={{ spot: 1, stable: 0 }}
        strategyId="momentum"
        index={2}
      />
    );

    expect(mockedGetStrategyColor).toHaveBeenCalledWith("momentum", 2);
    expect(
      container.querySelector(".w-2.h-2.rounded-full.shrink-0")
    ).toHaveStyle({ backgroundColor: "#3b82f6" });
    expect(screen.getByTestId("backtest-momentum")).toBeInTheDocument();
  });

  it("omits the color indicator when strategyId is absent", () => {
    const { container } = render(
      <BacktestAllocationBar
        displayName="Custom"
        allocation={{ spot: 0.5, stable: 0.5 }}
      />
    );

    expect(
      container.querySelector(".w-2.h-2.rounded-full.shrink-0")
    ).not.toBeInTheDocument();
  });

  it("filters out zero-percentage segments", () => {
    render(
      <BacktestAllocationBar
        displayName="Spot Only"
        allocation={{ spot: 1, stable: 0 }}
        strategyId="spot_only"
      />
    );

    expect(screen.getByTestId("backtest-spot_only")).toHaveTextContent(
      "SPOT:100"
    );
    expect(screen.getByTestId("backtest-spot_only")).not.toHaveTextContent(
      "STABLE"
    );
  });
});
