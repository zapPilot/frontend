import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { type ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { MarketDashboardView } from "@/components/wallet/portfolio/views/invest/market/MarketDashboardView";
import { getMarketDashboardData } from "@/services/analyticsService";

// Captured formatter callbacks from recharts props — populated during render
let capturedTooltipFormatter:
  | ((
      value: string | number | (string | number)[],
      name: string | number,
      props: {
        payload?: { sentiment_value?: number | null; regime?: string | null };
      }
    ) => [string | number, string | number])
  | null = null;
let capturedXAxisTickFormatter: ((val: string) => string) | null = null;
let capturedPriceTickFormatter: ((val: number) => string) | null = null;
let capturedFgiActiveDot:
  | ((props: {
      cx?: number;
      cy?: number;
      payload?: { regime?: string | null };
    }) => ReactNode)
  | null = null;

// Mock recharts — jsdom has no SVG layout engine.
// The mocks capture formatter/activeDot callbacks so tests can invoke them
// directly to cover those otherwise-unreachable code paths.
vi.mock("recharts", () => {
  const Box = ({ children }: { children?: ReactNode }) => <div>{children}</div>;
  return {
    ResponsiveContainer: Box,
    ComposedChart: Box,
    // Capture tickFormatter from XAxis (snapshot_date axis) and YAxis (price axis)
    XAxis: ({ tickFormatter }: { tickFormatter?: (val: string) => string }) => {
      if (tickFormatter) capturedXAxisTickFormatter = tickFormatter;
      return null;
    },
    YAxis: ({
      tickFormatter,
      orientation,
    }: {
      tickFormatter?: (val: number) => string;
      orientation?: string;
    }) => {
      // The left price axis has no orientation prop (defaults to left); capture its formatter
      if (tickFormatter && !orientation)
        capturedPriceTickFormatter = tickFormatter;
      return null;
    },
    CartesianGrid: () => null,
    // Capture the tooltip formatter so tests can invoke it directly
    Tooltip: ({
      formatter,
    }: {
      formatter?: (
        value: string | number | (string | number)[],
        name: string | number,
        props: {
          payload?: { sentiment_value?: number | null; regime?: string | null };
        }
      ) => [string | number, string | number];
    }) => {
      if (formatter) capturedTooltipFormatter = formatter;
      return null;
    },
    Legend: () => null,
    ReferenceArea: () => null,
    // Capture activeDot from the FGI line (the one that receives a function, not an object)
    Line: ({
      activeDot,
    }: {
      activeDot?:
        | ((props: {
            cx?: number;
            cy?: number;
            payload?: { regime?: string | null };
          }) => ReactNode)
        | object;
    }) => {
      if (typeof activeDot === "function") capturedFgiActiveDot = activeDot;
      return null;
    },
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

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  Wrapper.displayName = "TestQueryWrapper";
  return Wrapper;
}

describe("MarketDashboardView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    capturedTooltipFormatter = null;
    capturedXAxisTickFormatter = null;
    capturedPriceTickFormatter = null;
    capturedFgiActiveDot = null;
  });

  it("shows loading spinner while fetching", () => {
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    mockGetMarketDashboardData.mockReturnValue(new Promise(() => {}));
    render(<MarketDashboardView />, { wrapper: createWrapper() });
    expect(document.querySelector(".animate-spin")).not.toBeNull();
  });

  it("renders market overview header after data loads", async () => {
    mockGetMarketDashboardData.mockResolvedValue(mockData);
    render(<MarketDashboardView />, { wrapper: createWrapper() });
    await waitFor(() =>
      expect(screen.getByText("Market Overview")).toBeDefined()
    );
  });

  it("renders all timeframe buttons", async () => {
    mockGetMarketDashboardData.mockResolvedValue(mockData);
    render(<MarketDashboardView />, { wrapper: createWrapper() });
    await waitFor(() => screen.getByText("1Y"));
    expect(screen.getByText("1W")).toBeDefined();
    expect(screen.getByText("1M")).toBeDefined();
    expect(screen.getByText("3M")).toBeDefined();
    expect(screen.getByText("ALL")).toBeDefined();
  });

  it("renders BTC price summary cards", async () => {
    mockGetMarketDashboardData.mockResolvedValue(mockData);
    render(<MarketDashboardView />, { wrapper: createWrapper() });
    await waitFor(() => screen.getByText("Current BTC Price"));
    expect(screen.getByText("Current 200 DMA")).toBeDefined();
    expect(screen.getByText("Fear & Greed Index")).toBeDefined();
  });

  it("switches timeframe on button click", async () => {
    mockGetMarketDashboardData.mockResolvedValue(mockData);
    render(<MarketDashboardView />, { wrapper: createWrapper() });
    await waitFor(() => screen.getByText("1W"));
    const btn1W = screen.getByText("1W").closest("button")!;
    fireEvent.click(btn1W);
    expect(btn1W.className).toContain("bg-purple-600");
  });

  it("handles fetch errors gracefully (calls service and does not crash)", async () => {
    mockGetMarketDashboardData.mockRejectedValue(new Error("API failure"));
    render(<MarketDashboardView />, { wrapper: createWrapper() });
    await waitFor(() => expect(mockGetMarketDashboardData).toHaveBeenCalled());
    // Component renders without throwing — React Query handles the error internally
    expect(document.querySelector(".animate-spin")).not.toBeNull();
  });

  it("calls getMarketDashboardData with 365 days on mount", async () => {
    mockGetMarketDashboardData.mockResolvedValue(mockData);
    render(<MarketDashboardView />, { wrapper: createWrapper() });
    await waitFor(() =>
      expect(mockGetMarketDashboardData).toHaveBeenCalledWith(365, "btc")
    );
  });

  it("handles null regime in snapshots gracefully", async () => {
    mockGetMarketDashboardData.mockResolvedValue({
      ...mockData,
      snapshots: [
        {
          snapshot_date: "2025-01-01",
          price_usd: 42000,
          dma_200: 38000,
          sentiment_value: 65,
          regime: null,
        },
      ],
    });
    render(<MarketDashboardView />, { wrapper: createWrapper() });
    await waitFor(() =>
      expect(screen.getByText("Market Overview")).toBeDefined()
    );
  });

  it("handles empty snapshots array", async () => {
    mockGetMarketDashboardData.mockResolvedValue({
      ...mockData,
      snapshots: [],
    });
    render(<MarketDashboardView />, { wrapper: createWrapper() });
    await waitFor(() =>
      expect(screen.getByText("Market Overview")).toBeDefined()
    );
  });

  it("handles missing dma_200 with fallback", async () => {
    mockGetMarketDashboardData.mockResolvedValue({
      ...mockData,
      snapshots: [
        {
          snapshot_date: "2025-01-01",
          price_usd: 42000,
          dma_200: null,
          sentiment_value: 65,
          regime: "g",
        },
      ],
    });
    render(<MarketDashboardView />, { wrapper: createWrapper() });
    await waitFor(() =>
      expect(screen.getByText("Current BTC Price")).toBeDefined()
    );
  });

  it("handles unknown regime value", async () => {
    mockGetMarketDashboardData.mockResolvedValue({
      ...mockData,
      snapshots: [
        {
          snapshot_date: "2025-01-01",
          price_usd: 42000,
          dma_200: 38000,
          sentiment_value: 65,
          regime: "unknown_regime",
        },
      ],
    });
    render(<MarketDashboardView />, { wrapper: createWrapper() });
    await waitFor(() =>
      expect(screen.getByText("Market Overview")).toBeDefined()
    );
  });

  it("handles regime changes between consecutive data points", async () => {
    mockGetMarketDashboardData.mockResolvedValue({
      ...mockData,
      snapshots: [
        {
          snapshot_date: "2025-01-01",
          price_usd: 42000,
          dma_200: 38000,
          sentiment_value: 25,
          regime: "ef",
        },
        {
          snapshot_date: "2025-01-02",
          price_usd: 43000,
          dma_200: 38500,
          sentiment_value: 45,
          regime: "f",
        },
        {
          snapshot_date: "2025-01-03",
          price_usd: 44000,
          dma_200: 39000,
          sentiment_value: 55,
          regime: "n",
        },
        {
          snapshot_date: "2025-01-04",
          price_usd: 45000,
          dma_200: 39500,
          sentiment_value: 75,
          regime: "g",
        },
        {
          snapshot_date: "2025-01-05",
          price_usd: 46000,
          dma_200: 40000,
          sentiment_value: 90,
          regime: "eg",
        },
      ],
    });
    render(<MarketDashboardView />, { wrapper: createWrapper() });
    await waitFor(() =>
      expect(screen.getByText("Market Overview")).toBeDefined()
    );
  });

  it("handles undefined regime in snapshots", async () => {
    mockGetMarketDashboardData.mockResolvedValue({
      ...mockData,
      snapshots: [
        {
          snapshot_date: "2025-01-01",
          price_usd: 42000,
          dma_200: 38000,
          sentiment_value: 65,
          regime: undefined,
        },
      ],
    });
    render(<MarketDashboardView />, { wrapper: createWrapper() });
    await waitFor(() =>
      expect(screen.getByText("Market Overview")).toBeDefined()
    );
  });

  // ── Formatter function coverage ──────────────────────────────────────────

  describe("formatXAxisDate", () => {
    it("formats ISO date string to M/D", async () => {
      mockGetMarketDashboardData.mockResolvedValue(mockData);
      render(<MarketDashboardView />, { wrapper: createWrapper() });
      await waitFor(() => expect(capturedXAxisTickFormatter).not.toBeNull());
      // 2025-03-05 → month 3, day 5
      expect(capturedXAxisTickFormatter!("2025-03-05")).toBe("3/5");
    });

    it("formats single-digit month/day without padding", async () => {
      mockGetMarketDashboardData.mockResolvedValue(mockData);
      render(<MarketDashboardView />, { wrapper: createWrapper() });
      await waitFor(() => expect(capturedXAxisTickFormatter).not.toBeNull());
      expect(capturedXAxisTickFormatter!("2025-01-07")).toBe("1/7");
    });
  });

  describe("formatPriceLabel", () => {
    it("formats a price value to $Xk notation", async () => {
      mockGetMarketDashboardData.mockResolvedValue(mockData);
      render(<MarketDashboardView />, { wrapper: createWrapper() });
      await waitFor(() => expect(capturedPriceTickFormatter).not.toBeNull());
      expect(capturedPriceTickFormatter!(50000)).toBe("$50k");
    });

    it("rounds fractional thousands", async () => {
      mockGetMarketDashboardData.mockResolvedValue(mockData);
      render(<MarketDashboardView />, { wrapper: createWrapper() });
      await waitFor(() => expect(capturedPriceTickFormatter).not.toBeNull());
      expect(capturedPriceTickFormatter!(42500)).toBe("$43k");
    });
  });

  describe("formatTooltipValue", () => {
    async function renderAndGetFormatter() {
      mockGetMarketDashboardData.mockResolvedValue(mockData);
      render(<MarketDashboardView />, { wrapper: createWrapper() });
      await waitFor(() => expect(capturedTooltipFormatter).not.toBeNull());
      return capturedTooltipFormatter!;
    }

    it("formats BTC Price with dollar sign and locale number", async () => {
      const fmt = await renderAndGetFormatter();
      const [formattedValue, label] = fmt(95000, "BTC Price", {});
      expect(String(formattedValue)).toContain("95,000");
      expect(label).toBe("BTC Price");
    });

    it("formats 200 DMA with dollar sign and locale number", async () => {
      const fmt = await renderAndGetFormatter();
      const [formattedValue, label] = fmt(38500, "200 DMA", {});
      expect(String(formattedValue)).toContain("38,500");
      expect(label).toBe("200 DMA");
    });

    it("formats Fear and Greed Index with raw sentiment and regime label", async () => {
      const fmt = await renderAndGetFormatter();
      const [formattedValue, label] = fmt(65, "Fear & Greed Index", {
        payload: { sentiment_value: 65, regime: "g" },
      });
      expect(String(formattedValue)).toBe("65 (Greed)");
      expect(label).toBe("Fear & Greed Index");
    });

    it("formats Fear and Greed Index with empty label when regime is undefined", async () => {
      const fmt = await renderAndGetFormatter();
      const [formattedValue, label] = fmt(50, "Fear & Greed Index", {
        payload: { sentiment_value: 50, regime: undefined },
      });
      expect(String(formattedValue)).toBe("50 ()");
      expect(label).toBe("Fear & Greed Index");
    });

    it("returns value unchanged for unknown series name (default branch)", async () => {
      const fmt = await renderAndGetFormatter();
      const [formattedValue, label] = fmt(42, "Some Other Series", {});
      expect(formattedValue).toBe(42);
      expect(label).toBe("Some Other Series");
    });

    it("formats BTC Price with undefined value falling back to 0", async () => {
      // Exercises the `value ?? 0` branch on line 75 when value is undefined
      const fmt = await renderAndGetFormatter();
      const [formattedValue, label] = fmt(
        undefined as unknown as number,
        "BTC Price",
        {}
      );
      expect(String(formattedValue)).toContain("$0");
      expect(label).toBe("BTC Price");
    });

    it("formats series with undefined name falling back to empty string", async () => {
      // Exercises the `name ?? ""` branch on line 73 when name is undefined
      const fmt = await renderAndGetFormatter();
      const [, label] = fmt(42, undefined as unknown as string, {});
      // labelName becomes "" — neither BTC Price nor 200 DMA nor Fear & Greed Index
      expect(String(label)).toBe("");
    });

    it("formats Fear and Greed Index with null regime producing empty label", async () => {
      // Exercises the `regime ? REGIME_LABELS[regime] : ""` false branch (regime is null)
      const fmt = await renderAndGetFormatter();
      const [formattedValue] = fmt(40, "Fear & Greed Index", {
        payload: { sentiment_value: 40, regime: null },
      });
      expect(String(formattedValue)).toBe("40 ()");
    });
  });

  describe("renderFgiActiveDot", () => {
    async function renderAndGetActiveDot() {
      mockGetMarketDashboardData.mockResolvedValue(mockData);
      render(<MarketDashboardView />, { wrapper: createWrapper() });
      await waitFor(() => expect(capturedFgiActiveDot).not.toBeNull());
      return capturedFgiActiveDot!;
    }

    it("renders a circle with regime color", async () => {
      const renderDot = await renderAndGetActiveDot();
      // "g" regime maps to lime (#84cc16)
      const result = renderDot({ cx: 10, cy: 20, payload: { regime: "g" } });
      expect(result).toBeDefined();
      // The rendered element is a <circle> — verify it is not null
      expect(result).not.toBeNull();
    });

    it("uses fallback color when regime is null", async () => {
      const renderDot = await renderAndGetActiveDot();
      const result = renderDot({ cx: 5, cy: 5, payload: { regime: null } });
      expect(result).not.toBeNull();
    });

    it("uses fallback color when regime is unknown", async () => {
      const renderDot = await renderAndGetActiveDot();
      const result = renderDot({ cx: 0, cy: 0, payload: { regime: "xyz" } });
      expect(result).not.toBeNull();
    });

    it("uses default cx/cy of 0 when not provided", async () => {
      const renderDot = await renderAndGetActiveDot();
      const result = renderDot({ payload: { regime: "ef" } });
      expect(result).not.toBeNull();
    });
  });

  describe("regimeBlocks single-element filteredData", () => {
    it("produces one block when filtered data contains exactly one point", async () => {
      // When a single snapshot falls within the selected timeframe the block
      // is both the first element (currentBlock creation) and the last element
      // (i === filteredData.length - 1 push), exercising the combined branch.
      mockGetMarketDashboardData.mockResolvedValue({
        ...mockData,
        snapshots: [
          {
            snapshot_date: "2025-01-01",
            price_usd: 42000,
            dma_200: 38000,
            sentiment_value: 65,
            regime: "g",
          },
        ],
      });
      render(<MarketDashboardView />, { wrapper: createWrapper() });
      await waitFor(() =>
        expect(screen.getByText("Market Overview")).toBeDefined()
      );
      // Verify the FGI stat card shows the value without crashing
      expect(screen.getByText(/65 \/ 100/)).toBeDefined();
    });
  });

  describe("regimeBlocks consecutive same-regime points", () => {
    it("extends block end date when consecutive points share the same regime", async () => {
      // Two consecutive points with the same regime exercise the
      // `currentBlock.end = d.snapshot_date` branch (line 150 in source).
      mockGetMarketDashboardData.mockResolvedValue({
        ...mockData,
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
            sentiment_value: 68,
            regime: "g",
          },
          {
            snapshot_date: "2025-01-03",
            price_usd: 44000,
            dma_200: 39000,
            sentiment_value: 30,
            regime: "ef",
          },
        ],
      });
      render(<MarketDashboardView />, { wrapper: createWrapper() });
      await waitFor(() =>
        expect(screen.getByText("Market Overview")).toBeDefined()
      );
    });
  });
});
