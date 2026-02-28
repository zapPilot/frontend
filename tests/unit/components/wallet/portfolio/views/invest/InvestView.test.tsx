import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { InvestView } from "@/components/wallet/portfolio/views/invest/InvestView";

// Mock child views to avoid deep dependency chains
vi.mock(
  "@/components/wallet/portfolio/views/invest/trading/TradingView",
  () => ({
    TradingView: ({ userId }: { userId: string | undefined }) => (
      <div data-testid="trading-view">{userId ?? "no-user"}</div>
    ),
  })
);

vi.mock("@/components/wallet/portfolio/views/BacktestingView", () => ({
  BacktestingView: () => <div data-testid="backtesting-view" />,
}));

vi.mock(
  "@/components/wallet/portfolio/views/invest/market/MarketDashboardView",
  () => ({
    MarketDashboardView: () => <div data-testid="market-dashboard-view" />,
  })
);

describe("InvestView", () => {
  it("renders trading tab by default", () => {
    render(<InvestView userId="0xabc" />);

    expect(screen.getByTestId("trading-view")).toBeDefined();
    expect(screen.getByText("0xabc")).toBeDefined();
  });

  it("renders all three tab buttons", () => {
    render(<InvestView userId="0xabc" />);

    expect(screen.getByText("market data")).toBeDefined();
    expect(screen.getByText("trading")).toBeDefined();
    expect(screen.getByText("backtesting")).toBeDefined();
  });

  it("switches to market tab on click", () => {
    render(<InvestView userId="0xabc" />);

    fireEvent.click(screen.getByText("market data"));

    expect(screen.getByTestId("market-dashboard-view")).toBeDefined();
    expect(screen.queryByTestId("trading-view")).toBeNull();
  });

  it("switches to backtesting tab on click", () => {
    render(<InvestView userId="0xabc" />);

    fireEvent.click(screen.getByText("backtesting"));

    expect(screen.getByTestId("backtesting-view")).toBeDefined();
    expect(screen.queryByTestId("trading-view")).toBeNull();
  });

  it("switches back to trading tab", () => {
    render(<InvestView userId="0xabc" />);

    fireEvent.click(screen.getByText("backtesting"));
    fireEvent.click(screen.getByText("trading"));

    expect(screen.getByTestId("trading-view")).toBeDefined();
    expect(screen.queryByTestId("backtesting-view")).toBeNull();
  });

  it("passes undefined userId to TradingView", () => {
    render(<InvestView userId={undefined} />);

    expect(screen.getByText("no-user")).toBeDefined();
  });

  it("applies active style to the selected tab", () => {
    render(<InvestView userId="0xabc" />);

    const tradingBtn = screen.getByText("trading").closest("button");
    expect(tradingBtn?.className).toContain("text-white");
  });
});
