import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { BacktestChartLegend } from "@/components/wallet/portfolio/views/backtesting/components/BacktestChartLegend";

describe("BacktestChartLegend", () => {
  it("renders grouped legends for strategy, indicators, and events", () => {
    render(
      <BacktestChartLegend
        sortedStrategyIds={["dca_classic", "simple_regime"]}
      />
    );

    expect(screen.getByText("Strategy")).toBeInTheDocument();
    expect(screen.getByText("Indicators")).toBeInTheDocument();
    expect(screen.getByText("Events")).toBeInTheDocument();
  });

  it("includes strategy entries and indicator/event items in their groups", () => {
    render(
      <BacktestChartLegend
        sortedStrategyIds={["dca_classic", "simple_regime"]}
      />
    );

    expect(screen.getByText("DCA Classic")).toBeInTheDocument();
    expect(screen.getByText("Simple Regime")).toBeInTheDocument();
    expect(screen.getByText("Sentiment")).toBeInTheDocument();
    expect(screen.getByText("DMA 200")).toBeInTheDocument();
    expect(screen.getByText("Buy Spot")).toBeInTheDocument();
    expect(screen.getByText("Sell Spot")).toBeInTheDocument();
    expect(screen.getByText("Buy LP")).toBeInTheDocument();
    expect(screen.getByText("Sell LP")).toBeInTheDocument();
  });
});
