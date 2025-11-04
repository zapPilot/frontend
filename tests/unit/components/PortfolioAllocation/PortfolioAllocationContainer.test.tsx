import { beforeEach, describe, expect, it, vi } from "vitest";

import { PortfolioAllocationContainer } from "../../../../src/components/PortfolioAllocation/PortfolioAllocationContainer";
import type { AssetCategory } from "../../../../src/components/PortfolioAllocation/types";
import { act, render, waitFor } from "../../../test-utils";

const componentMocks = vi.hoisted(() => ({
  EnhancedOverview: vi.fn(() => <div data-testid="enhanced-overview-mock" />),
  SwapControls: vi.fn(() => <div data-testid="swap-controls-mock" />),
}));

vi.mock("../../../../src/components/PortfolioAllocation/components", () => ({
  EnhancedOverview: componentMocks.EnhancedOverview,
  SwapControls: componentMocks.SwapControls,
}));

vi.mock("../../../../src/components/PortfolioAllocation/hooks", () => ({
  usePortfolioData: vi.fn(() => ({
    processedCategories: [
      {
        id: "growth",
        name: "Growth",
        color: "#00ff00",
        isExcluded: false,
        totalAllocationPercentage: 60,
        activeAllocationPercentage: 60,
        totalValue: 60000,
        protocols: [],
      },
    ],
    chartData: [],
  })),
  useRebalanceData: vi.fn(() => null),
}));

describe("PortfolioAllocationContainer", () => {
  const assetCategories: AssetCategory[] = [
    {
      id: "growth",
      name: "Growth",
      color: "#00ff00",
      protocols: [],
    },
  ];

  beforeEach(() => {
    componentMocks.EnhancedOverview.mockClear();
    componentMocks.SwapControls.mockClear();
  });

  it("disables zap action until token and amount are provided", async () => {
    render(
      <PortfolioAllocationContainer
        assetCategories={assetCategories}
        operationMode="zapIn"
        excludedCategoryIds={[]}
        onToggleCategoryExclusion={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(componentMocks.EnhancedOverview).toHaveBeenCalled();
    });

    const initialProps = componentMocks.EnhancedOverview.mock.calls.at(-1)?.[0];
    expect(initialProps?.actionEnabled).toBe(false);
    expect(initialProps?.actionDisabledReason).toContain(
      "select a token to zap in"
    );
    expect(initialProps?.actionDisabledReason).toContain("enter an amount");

    const initialSwapControlsProps = (initialProps?.swapControls as any).props;
    await act(async () => {
      initialSwapControlsProps.onSwapSettingsChange({
        ...initialSwapControlsProps.swapSettings,
        fromToken: {
          address: "0xToken",
          symbol: "USDC",
          name: "USD Coin",
          decimals: 6,
          chainId: 1,
          balance: 100,
        },
      });
    });

    await waitFor(() => {
      const props = componentMocks.EnhancedOverview.mock.calls.at(-1)?.[0];
      expect(props.actionEnabled).toBe(false);
      expect(props.actionDisabledReason).toBe("Please enter an amount.");
    });

    const updatedSwapControlsProps = (
      componentMocks.EnhancedOverview.mock.calls.at(-1)?.[0].swapControls as any
    ).props;
    await act(async () => {
      updatedSwapControlsProps.onSwapSettingsChange({
        ...updatedSwapControlsProps.swapSettings,
        amount: "5",
      });
    });

    await waitFor(() => {
      const props = componentMocks.EnhancedOverview.mock.calls.at(-1)?.[0];
      expect(props.actionEnabled).toBe(true);
      expect(props.actionDisabledReason).toBeUndefined();
    });
  });
});
