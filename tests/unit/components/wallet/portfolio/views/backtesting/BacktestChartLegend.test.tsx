import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { BacktestChartLegend } from "@/components/wallet/portfolio/views/backtesting/components/BacktestChartLegend";

describe("BacktestChartLegend", () => {
  it("renders grouped legends for strategy, indicators, and events", () => {
    render(
      <BacktestChartLegend
        sortedStrategyIds={["dca_classic", "dma_gated_fgi_default"]}
      />
    );

    expect(screen.getByText("Strategy")).toBeInTheDocument();
    expect(screen.getByText("Indicators")).toBeInTheDocument();
    expect(screen.getByText("Events")).toBeInTheDocument();
  });

  it("includes DMA-first strategy and event labels", () => {
    render(
      <BacktestChartLegend
        sortedStrategyIds={["dca_classic", "dma_gated_fgi_default"]}
      />
    );

    expect(screen.getByText("DCA Classic")).toBeInTheDocument();
    expect(screen.getByText("DMA Gated FGI Default")).toBeInTheDocument();
    expect(screen.getByText("Sentiment")).toBeInTheDocument();
    expect(screen.getByText("DMA 200")).toBeInTheDocument();
    expect(screen.getByText("Buy Spot")).toBeInTheDocument();
    expect(screen.getByText("Sell Spot")).toBeInTheDocument();
  });
});
