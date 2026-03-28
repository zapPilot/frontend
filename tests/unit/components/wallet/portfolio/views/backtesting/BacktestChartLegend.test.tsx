import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { BacktestChartLegend } from "@/components/wallet/portfolio/views/backtesting/components/BacktestChartLegend";
import type { IndicatorKey } from "@/components/wallet/portfolio/views/backtesting/components/backtestChartLegendData";

const ACTIVE_INDICATORS = new Set<IndicatorKey>([
  "sentiment",
  "btcPrice",
  "dma200",
]);

describe("BacktestChartLegend", () => {
  function noop(): void {
    // noop
  }

  it("renders grouped legends for strategy, indicators, and events", () => {
    render(
      <BacktestChartLegend
        sortedStrategyIds={["dca_classic", "dma_gated_fgi_default"]}
        activeIndicators={ACTIVE_INDICATORS}
        onToggleIndicator={noop}
      />
    );

    expect(screen.getByText("Strategy")).toBeInTheDocument();
    expect(screen.getByText("Market Context")).toBeInTheDocument();
    expect(screen.getByText("Events")).toBeInTheDocument();
  });

  it("includes DMA-first strategy and event labels", () => {
    render(
      <BacktestChartLegend
        sortedStrategyIds={["dca_classic", "dma_gated_fgi_default"]}
        activeIndicators={ACTIVE_INDICATORS}
        onToggleIndicator={noop}
      />
    );

    expect(screen.getByText("DCA Classic")).toBeInTheDocument();
    expect(screen.getByText("DMA Gated FGI Default")).toBeInTheDocument();
    expect(screen.getByText("Sentiment")).toBeInTheDocument();
    expect(screen.getByText("DMA 200")).toBeInTheDocument();
    expect(screen.getByText("Buy Spot")).toBeInTheDocument();
    expect(screen.getByText("Sell Spot")).toBeInTheDocument();
    expect(screen.getByText("Switch to ETH")).toBeInTheDocument();
    expect(screen.getByText("Switch to BTC")).toBeInTheDocument();
  });
});
