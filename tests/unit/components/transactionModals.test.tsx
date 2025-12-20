import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";

import { AmountInput } from "@/components/wallet/portfolio/modals/components/AmountInput";
import { ChainSelector } from "@/components/wallet/portfolio/modals/components/ChainSelector";
import { StrategySlider } from "@/components/wallet/portfolio/modals/components/StrategySlider";

describe("Transaction modal building blocks", () => {
  it("selects a chain", () => {
    const chains = [
      { chainId: 1, name: "Ethereum", symbol: "ETH", isActive: true },
      { chainId: 137, name: "Polygon", symbol: "MATIC", isActive: true },
    ];
    const onSelect = vi.fn();

    render(
      <ChainSelector chains={chains} selectedChainId={1} onSelect={onSelect} />
    );

    fireEvent.click(screen.getByTestId("chain-card-137"));
    expect(onSelect).toHaveBeenCalledWith(137);
  });

  it("applies quick preset percentages in AmountInput", () => {
    const onChange = vi.fn();
    render(
      <AmountInput
        value="0"
        onChange={onChange}
        max="200"
        token={{
          address: "0xusdc",
          chainId: 1,
          name: "USD Coin",
          symbol: "USDC",
          decimals: 6,
          usdPrice: 1,
        }}
      />
    );

    fireEvent.click(screen.getByTestId("preset-50"));
    expect(onChange).toHaveBeenCalledWith("100.00");
  });

  it("updates strategy slider via preset", () => {
    const onChange = vi.fn();
    render(
      <StrategySlider
        value={50}
        onChange={onChange}
        currentAllocation={{ crypto: 60, stable: 40 }}
        targetAllocation={{ crypto: 80, stable: 20 }}
        previewAllocation={{ crypto: 70, stable: 30 }}
      />
    );

    fireEvent.click(screen.getByTestId("preset-100"));
    expect(onChange).toHaveBeenCalledWith(100);

    const slider = screen.getByTestId("strategy-slider") as HTMLInputElement;
    expect(slider.value).toBe("50");
  });
});
