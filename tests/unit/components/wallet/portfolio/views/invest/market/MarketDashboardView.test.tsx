import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { type ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { MarketDashboardView } from "@/components/wallet/portfolio/views/invest/market/MarketDashboardView";
import { getMarketDashboardData } from "@/services/analyticsService";

// Mock recharts — jsdom has no SVG layout engine
vi.mock("recharts", () => {
  const Box = ({ children }: { children?: ReactNode }) => <div>{children}</div>;
  return {
    ResponsiveContainer: Box,
    ComposedChart: Box,
    Line: () => null,
    XAxis: () => null,
    YAxis: () => null,
    CartesianGrid: () => null,
    Tooltip: () => null,
    Legend: () => null,
    ReferenceArea: () => null,
  };
});

// Mock the analytics service
vi.mock("@/services/analyticsService", () => ({
  getMarketDashboardData: vi.fn(),
}));

const mockGetMarketDashboardData = vi.mocked(getMarketDashboardData);

const mockData = {
  snapshots: [
    {
      snapshot_date: "2025-01-01",
      price_usd: 42000,
      dma_200: 38000,
      sentiment_value: 65,
      regime: "g",
    },
    {
      snapshot_date: "2025-01-02",
      price_usd: 43000,
      dma_200: 38500,
      sentiment_value: 70,
      regime: "eg",
    },
  ],
  count: 2,
  token_symbol: "btc",
  days_requested: 365,
  timestamp: "2025-01-02T12:00:00Z",
};

describe("MarketDashboardView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows loading spinner while fetching", () => {
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    mockGetMarketDashboardData.mockReturnValue(new Promise(() => {}));
    render(<MarketDashboardView />);
    expect(document.querySelector(".animate-spin")).not.toBeNull();
  });

  it("renders market overview header after data loads", async () => {
    mockGetMarketDashboardData.mockResolvedValue(mockData);
    render(<MarketDashboardView />);
    await waitFor(() =>
      expect(screen.getByText("Market Overview")).toBeDefined()
    );
  });

  it("renders all timeframe buttons", async () => {
    mockGetMarketDashboardData.mockResolvedValue(mockData);
    render(<MarketDashboardView />);
    await waitFor(() => screen.getByText("1Y"));
    expect(screen.getByText("1W")).toBeDefined();
    expect(screen.getByText("1M")).toBeDefined();
    expect(screen.getByText("3M")).toBeDefined();
    expect(screen.getByText("ALL")).toBeDefined();
  });

  it("renders BTC price summary cards", async () => {
    mockGetMarketDashboardData.mockResolvedValue(mockData);
    render(<MarketDashboardView />);
    await waitFor(() => screen.getByText("Current BTC Price"));
    expect(screen.getByText("Current 200 DMA")).toBeDefined();
    expect(screen.getByText("Fear & Greed Index")).toBeDefined();
  });

  it("switches timeframe on button click", async () => {
    mockGetMarketDashboardData.mockResolvedValue(mockData);
    render(<MarketDashboardView />);
    await waitFor(() => screen.getByText("1W"));
    const btn1W = screen.getByText("1W").closest("button")!;
    fireEvent.click(btn1W);
    expect(btn1W.className).toContain("bg-purple-600");
  });

  it("handles fetch errors gracefully (stays in non-loading state)", async () => {
    mockGetMarketDashboardData.mockRejectedValue(new Error("API failure"));
    render(<MarketDashboardView />);
    await waitFor(() =>
      expect(document.querySelector(".animate-spin")).toBeNull()
    );
  });

  it("calls getMarketDashboardData with 365 days on mount", async () => {
    mockGetMarketDashboardData.mockResolvedValue(mockData);
    render(<MarketDashboardView />);
    await waitFor(() =>
      expect(mockGetMarketDashboardData).toHaveBeenCalledWith(365)
    );
  });
});
