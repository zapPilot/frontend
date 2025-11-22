/**
 * Integration tests for useChartData hook
 *
 * Tests comprehensive data transformations for 5 chart types powered by the
 * unified dashboard endpoint:
 * 1. Stacked Portfolio (DeFi + Wallet breakdown)
 * 2. Allocation History (BTC, ETH, Stablecoins, Altcoins)
 * 3. Drawdown & Recovery Analysis
 * 4. Sharpe Ratio (Risk-adjusted returns)
 * 5. Volatility Tracking
 *
 * Coverage includes:
 * - Happy path transformations
 * - Edge cases (empty data, malformed responses)
 * - Loading and error states
 * - Data override functionality
 * - Memoization validation
 */

import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useChartData } from "../../src/components/PortfolioChart/hooks/useChartData";
import type {
  DrawdownOverridePoint,
  SharpeOverridePoint,
} from "../../src/components/PortfolioChart/types";
import * as usePortfolioDashboard from "../../src/hooks/usePortfolioDashboard";
import type { UnifiedDashboardResponse } from "../../src/services/analyticsService";
import type {
  AssetAllocationPoint,
  PortfolioDataPoint,
} from "../../src/types/portfolio";
import { createMockArray, generateDateSeries } from "./helpers/mock-factories";
import { MOCK_BASE_DATE } from "./helpers/test-constants";
import { createQueryWrapper, setupMockCleanup } from "./helpers/test-setup";

// Mock unified dashboard hook
vi.mock("../../src/hooks/usePortfolioDashboard", () => ({
  usePortfolioDashboard: vi.fn(() => ({
    dashboard: undefined,
    data: undefined,
    isLoading: false,
    error: null,
  })),
}));

// Mock portfolio analytics utilities with deterministic behaviour
vi.mock("../../src/lib/portfolio-analytics", async () => {
  const actual = await vi.importActual("../../src/lib/portfolio-analytics");
  return {
    ...actual,
    calculateDrawdownData: vi.fn((data: PortfolioDataPoint[]) => {
      if (!data || data.length === 0) return [];

      let peak = data[0]?.value || 0;
      return data.map(point => {
        const currentValue = point.value || 0;
        if (currentValue > peak) peak = currentValue;
        const drawdown = peak > 0 ? ((peak - currentValue) / peak) * 100 : 0;
        return { date: point.date, drawdown };
      });
    }),
  };
});

setupMockCleanup();

const createWrapper = () => createQueryWrapper().QueryWrapper;

const createMockPortfolioData = (days = 30): PortfolioDataPoint[] => {
  const dateSeries = generateDateSeries(MOCK_BASE_DATE, days);

  return createMockArray(days, index => {
    const baseValue = 10_000 + index * 150;
    return {
      date: dateSeries[index],
      value: baseValue,
      pnl: index * 10,
      categories: [
        { sourceType: "defi", value: baseValue * 0.6 },
        { sourceType: "wallet", value: baseValue * 0.4 },
      ],
    } satisfies PortfolioDataPoint;
  });
};

const createMockDashboard = (): UnifiedDashboardResponse => ({
  user_id: "test-user",
  parameters: {
    trend_days: 30,
    risk_days: 30,
    drawdown_days: 90,
    allocation_days: 40,
    rolling_days: 40,
  },
  trends: {
    period: {
      start_date: "2025-01-01",
      end_date: "2025-01-30",
      days: 30,
    },
    daily_values: [],
    summary: {
      current_value_usd: 0,
      start_value_usd: 0,
      change_usd: 0,
      change_pct: 0,
    },
  },
  risk_metrics: {
    volatility: {
      period: {
        start_date: "2025-01-01",
        end_date: "2025-01-30",
        days: 30,
      },
      volatility_pct: 0,
      annualized_volatility_pct: 0,
      interpretation: "",
      summary: {
        avg_volatility: 0,
        max_volatility: 0,
        min_volatility: 0,
      },
    },
    sharpe_ratio: {
      period: {
        start_date: "2025-01-01",
        end_date: "2025-01-30",
        days: 30,
      },
      sharpe_ratio: 0,
      interpretation: "",
      summary: {
        avg_sharpe: 0,
        statistical_reliability: "",
      },
    },
    max_drawdown: {
      period: {
        start_date: "2025-01-01",
        end_date: "2025-01-30",
        days: 30,
      },
      max_drawdown_pct: 0,
      peak_date: "2025-01-01",
      trough_date: "2025-01-01",
      recovery_date: null,
      summary: {
        current_drawdown_pct: 0,
        is_recovered: true,
      },
    },
  },
  drawdown_analysis: {
    enhanced: {
      period: {
        start_date: "2025-01-01",
        end_date: "2025-01-30",
        days: 30,
      },
      period_info: {
        start_date: "2025-01-01",
        end_date: "2025-01-30",
        timezone: "UTC",
        label: "Last 30 Days",
      },
      drawdown_data: [],
      summary: {
        max_drawdown_pct: 0,
        current_drawdown_pct: 0,
        peak_value: 0,
        current_value: 0,
      },
    },
    underwater_recovery: {
      period: {
        start_date: "2025-01-01",
        end_date: "2025-01-30",
        days: 30,
      },
      period_info: {
        start_date: "2025-01-01",
        end_date: "2025-01-30",
        timezone: "UTC",
        label: "Last 30 Days",
      },
      underwater_data: [],
      summary: {
        total_underwater_days: 0,
        underwater_percentage: 0,
        recovery_points: 0,
        current_underwater_pct: 0,
        is_currently_underwater: false,
      },
    },
  },
  allocation: {
    allocations: [],
    summary: {
      unique_dates: 0,
      unique_protocols: 0,
      unique_chains: 0,
    },
  },
  rolling_analytics: {
    sharpe: {
      period: {
        start_date: "2025-01-01",
        end_date: "2025-01-30",
        days: 30,
      },
      rolling_sharpe_data: [],
      summary: {
        latest_sharpe_ratio: 0,
        avg_sharpe_ratio: 0,
        reliable_data_points: 0,
        statistical_reliability: "",
      },
      educational_context: {
        title: "Sharpe Ratio",
        summary: "Measures excess return per unit of risk",
        highlights: ["Values above 1 suggest good performance"],
        links: [
          {
            label: "Sharpe Ratio Guide",
            url: "https://example.com/sharpe-ratio",
          },
        ],
      },
    },
    volatility: {
      period: {
        start_date: "2025-01-01",
        end_date: "2025-01-30",
        days: 30,
      },
      rolling_volatility_data: [],
      summary: {
        latest_daily_volatility: 0,
        latest_annualized_volatility: 0,
        avg_daily_volatility: 0,
        avg_annualized_volatility: 0,
      },
      educational_context: {
        title: "Volatility",
        summary: "Tracks dispersion of portfolio returns",
        highlights: ["High volatility can indicate increased portfolio risk"],
        links: [
          {
            label: "Volatility Primer",
            url: "https://example.com/volatility",
          },
        ],
      },
    },
  },
  _metadata: {
    success_count: 1,
    error_count: 0,
    success_rate: 1,
    errors: {},
  },
});

const createDashboardHookReturn = (
  dashboard?: UnifiedDashboardResponse,
  overrides: Partial<
    ReturnType<typeof usePortfolioDashboard.usePortfolioDashboard>
  > = {}
) => ({
  dashboard,
  data: dashboard,
  isLoading: false,
  error: null,
  status: dashboard ? "success" : "idle",
  fetchStatus: "idle",
  refetch: vi.fn(),
  ...overrides,
});

const setDashboardResponse = (
  dashboard?: UnifiedDashboardResponse,
  overrides: Partial<
    ReturnType<typeof usePortfolioDashboard.usePortfolioDashboard>
  > = {}
) => {
  vi.mocked(usePortfolioDashboard.usePortfolioDashboard).mockReturnValue(
    createDashboardHookReturn(dashboard, overrides)
  );
};

beforeEach(() => {
  vi.clearAllMocks();
  setDashboardResponse();
});

describe("useChartData - Data Transformations", () => {
  it("transforms stacked portfolio data correctly", () => {
    const mockData = createMockPortfolioData(30);
    const dashboard = createMockDashboard();
    dashboard.trends.daily_values = mockData.map(point => ({
      date: point.date,
      total_value_usd: point.value ?? 0,
      change_percentage: 0,
      categories: [
        {
          category: "btc",
          source_type: "defi",
          value_usd: (point.value ?? 0) * 0.6,
          pnl_usd: 0,
        },
        {
          category: "stablecoins",
          source_type: "wallet",
          value_usd: (point.value ?? 0) * 0.4,
          pnl_usd: 0,
        },
      ],
      protocols: [],
    }));

    setDashboardResponse(dashboard);

    const { result } = renderHook(() => useChartData("test-user", "1M"), {
      wrapper: createWrapper(),
    });

    expect(result.current.stackedPortfolioData).toHaveLength(30);

    const firstPoint = result.current.stackedPortfolioData[0];
    expect(firstPoint).toMatchObject({
      date: expect.any(String),
      value: expect.any(Number),
      defiValue: expect.any(Number),
      walletValue: expect.any(Number),
      stackedTotalValue: expect.any(Number),
    });

    for (const point of result.current.stackedPortfolioData) {
      const sum = point.defiValue + point.walletValue;
      expect(sum).toBeCloseTo(point.stackedTotalValue, 2);
    }
  });

  it("transforms allocation history correctly", () => {
    const dashboard = createMockDashboard();
    const dateSeries = generateDateSeries(MOCK_BASE_DATE, 10);
    dashboard.allocation.allocations = dateSeries.flatMap((date, index) => {
      const offset = (index % 3) * 5;
      return [
        {
          date,
          category: "btc",
          category_value_usd: 0,
          total_portfolio_value_usd: 0,
          allocation_percentage: 30 + offset,
        },
        {
          date,
          category: "eth",
          category_value_usd: 0,
          total_portfolio_value_usd: 0,
          allocation_percentage: 25 + offset / 2,
        },
        {
          date,
          category: "stablecoins",
          category_value_usd: 0,
          total_portfolio_value_usd: 0,
          allocation_percentage: 25 - offset / 2,
        },
        {
          date,
          category: "others",
          category_value_usd: 0,
          total_portfolio_value_usd: 0,
          allocation_percentage: 20 - offset,
        },
      ];
    });

    setDashboardResponse(dashboard);

    const { result } = renderHook(() => useChartData("test-user", "1M"), {
      wrapper: createWrapper(),
    });

    expect(result.current.allocationHistory.length).toBeGreaterThan(0);

    const firstPoint = result.current.allocationHistory[0];
    expect(firstPoint).toMatchObject({
      date: expect.any(String),
      btc: expect.any(Number),
      eth: expect.any(Number),
      stablecoin: expect.any(Number),
      altcoin: expect.any(Number),
    });

    for (const point of result.current.allocationHistory) {
      const total = point.btc + point.eth + point.stablecoin + point.altcoin;
      expect(total).toBeCloseTo(100, 1);
    }
  });

  it("calculates drawdown data correctly", () => {
    const dashboard = createMockDashboard();
    dashboard.drawdown_analysis.enhanced.drawdown_data = [
      {
        date: "2025-01-01",
        portfolio_value_usd: 10000,
        running_peak_usd: 10000,
        drawdown_pct: 0,
      },
      {
        date: "2025-01-02",
        portfolio_value_usd: 11000,
        running_peak_usd: 11000,
        drawdown_pct: 0,
      },
      {
        date: "2025-01-03",
        portfolio_value_usd: 9900,
        running_peak_usd: 11000,
        drawdown_pct: 10,
      },
      {
        date: "2025-01-04",
        portfolio_value_usd: 10500,
        running_peak_usd: 11000,
        drawdown_pct: 4.5,
      },
    ];

    setDashboardResponse(dashboard);

    const { result } = renderHook(() => useChartData("test-user", "1M"), {
      wrapper: createWrapper(),
    });

    expect(result.current.drawdownRecoveryData).toHaveLength(4);
    expect(result.current.drawdownRecoveryData[2].drawdown).toBeCloseTo(10, 1);
  });

  it("calculates Sharpe ratio data correctly", () => {
    const dashboard = createMockDashboard();
    dashboard.rolling_analytics.sharpe.rolling_sharpe_data = [
      {
        date: "2025-01-01",
        rolling_sharpe_ratio: 1.2,
        is_statistically_reliable: true,
      },
      {
        date: "2025-01-02",
        rolling_sharpe_ratio: 1.5,
        is_statistically_reliable: true,
      },
      {
        date: "2025-01-03",
        rolling_sharpe_ratio: 1.8,
        is_statistically_reliable: true,
      },
    ];

    setDashboardResponse(dashboard);

    const { result } = renderHook(() => useChartData("test-user", "1M"), {
      wrapper: createWrapper(),
    });

    expect(result.current.sharpeData).toHaveLength(3);
    expect(result.current.sharpeData[0]).toMatchObject({
      date: "2025-01-01",
      sharpe: 1.2,
    });
  });

  it("calculates volatility data correctly", () => {
    const dashboard = createMockDashboard();
    dashboard.rolling_analytics.volatility.rolling_volatility_data = [
      {
        date: "2025-01-01",
        rolling_volatility_pct: 15.5,
        annualized_volatility_pct: 15.5,
      },
      {
        date: "2025-01-02",
        rolling_volatility_pct: 18.2,
        annualized_volatility_pct: 18.2,
      },
      {
        date: "2025-01-03",
        rolling_volatility_pct: 2.1,
        annualized_volatility_pct: 12.1,
      },
    ];

    setDashboardResponse(dashboard);

    const { result } = renderHook(() => useChartData("test-user", "1M"), {
      wrapper: createWrapper(),
    });

    expect(result.current.volatilityData).toHaveLength(3);
    expect(result.current.volatilityData[0].volatility).toBe(15.5);
    expect(result.current.volatilityData[2].volatility).toBe(12.1);
  });

  it("calculates drawdown recovery insights correctly", () => {
    const dashboard = createMockDashboard();
    dashboard.drawdown_analysis.enhanced.drawdown_data = [
      {
        date: "2025-01-01",
        drawdown_pct: 0,
        portfolio_value: 10000,
        peak_value: 10000,
      },
      {
        date: "2025-01-10",
        drawdown_pct: -6.2,
        portfolio_value: 9380,
        peak_value: 10000,
      },
      {
        date: "2025-01-20",
        drawdown_pct: 0,
        portfolio_value: 10200,
        peak_value: 10200,
      },
    ];

    setDashboardResponse(dashboard);

    const { result } = renderHook(() => useChartData("test-user", "1M"), {
      wrapper: createWrapper(),
    });

    expect(result.current.drawdownRecoveryData).toHaveLength(3);
    expect(result.current.drawdownRecoveryData[1]).toMatchObject({
      drawdown: -6.2,
      isRecoveryPoint: false,
    });
    expect(
      result.current.drawdownRecoveryData.find(point => point.isRecoveryPoint)
    ).toBeTruthy();

    expect(result.current.drawdownRecoverySummary).toMatchObject({
      totalRecoveries: 1,
      currentStatus: "At Peak",
    });
  });
});

describe("useChartData - Edge Cases", () => {
  it("handles empty data gracefully", () => {
    setDashboardResponse(createMockDashboard());

    const { result } = renderHook(() => useChartData("test-user", "1M"), {
      wrapper: createWrapper(),
    });

    expect(result.current.stackedPortfolioData).toEqual([]);
    expect(result.current.allocationHistory).toEqual([]);
    expect(result.current.currentValue).toBe(0);
    expect(result.current.totalReturn).toBe(0);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("handles missing userId", () => {
    const { result } = renderHook(() => useChartData(undefined, "1M"), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.stackedPortfolioData).toEqual([]);
  });

  it("handles API errors", () => {
    const errorMessage = "Failed to fetch portfolio data";

    const { result } = renderHook(
      () => useChartData("test-user", "1M", undefined, false, errorMessage),
      { wrapper: createWrapper() }
    );

    expect(result.current.error).toBe(errorMessage);
    expect(result.current.isLoading).toBe(false);
  });

  it("handles malformed API responses", () => {
    const dashboard = createMockDashboard();
    dashboard.trends.daily_values = [
      // Missing protocols/chains should be handled gracefully
      {
        date: "2025-01-01",
        total_value_usd: 10_000,
        change_percentage: 0,
        categories: [],
        protocols: [],
      },
      // Partially malformed entry
      {
        date: "2025-01-02",
        total_value_usd: NaN,
        change_percentage: 0,
        categories: [],
        protocols: [],
      },
    ];

    setDashboardResponse(dashboard);

    const { result } = renderHook(() => useChartData("test-user", "1M"), {
      wrapper: createWrapper(),
    });

    expect(result.current.stackedPortfolioData.length).toBe(2);
    for (const point of result.current.stackedPortfolioData) {
      expect(Number.isFinite(point.defiValue)).toBe(true);
      expect(Number.isFinite(point.walletValue)).toBe(true);
    }
  });

  it("handles data overrides correctly", () => {
    const overrideData: PortfolioDataPoint[] = [
      { date: "2025-01-01", value: 5000, pnl: 0 },
      { date: "2025-01-02", value: 5500, pnl: 500 },
    ];

    const overrideSharpe: SharpeOverridePoint[] = [
      { date: "2025-01-01", rolling_sharpe_ratio: 2.5 },
    ];

    const { result } = renderHook(
      () =>
        useChartData("test-user", "1M", {
          portfolioData: overrideData,
          sharpeData: overrideSharpe,
        }),
      { wrapper: createWrapper() }
    );

    expect(result.current.portfolioHistory).toEqual(overrideData);
    expect(result.current.sharpeData).toHaveLength(1);
    expect(result.current.sharpeData[0].sharpe).toBe(2.5);
  });

  it("handles null and undefined values in drawdown data", () => {
    const drawdownOverride: DrawdownOverridePoint[] = [
      { date: "2025-01-01", drawdown_pct: undefined },
      { date: "2025-01-02", drawdown: null as any },
      { date: "2025-01-03", drawdown_pct: 5.5 },
    ];

    const mockPortfolioData: PortfolioDataPoint[] = [
      { date: "2025-01-01", value: 10000, pnl: 0 },
      { date: "2025-01-02", value: 10500, pnl: 500 },
      { date: "2025-01-03", value: 11000, pnl: 1000 },
    ];

    const { result } = renderHook(
      () =>
        useChartData("test-user", "1M", {
          portfolioData: mockPortfolioData,
          drawdownData: drawdownOverride,
        }),
      { wrapper: createWrapper() }
    );

    expect(result.current.drawdownRecoveryData).toHaveLength(3);
    expect(result.current.drawdownRecoveryData[0].drawdown).toBe(0);
    expect(result.current.drawdownRecoveryData[1].drawdown).toBe(0);
    expect(result.current.drawdownRecoveryData[2].drawdown).toBe(5.5);
  });

  it("filters out null sharpe ratios", () => {
    const sharpeOverride: SharpeOverridePoint[] = [
      { date: "2025-01-01", rolling_sharpe_ratio: 1.2 },
      { date: "2025-01-02", rolling_sharpe_ratio: undefined },
      { date: "2025-01-03", rolling_sharpe_ratio: null as any },
      { date: "2025-01-04", rolling_sharpe_ratio: 1.8 },
    ];

    const mockPortfolioData: PortfolioDataPoint[] = [
      { date: "2025-01-01", value: 10000, pnl: 0 },
      { date: "2025-01-04", value: 11000, pnl: 1000 },
    ];

    const { result } = renderHook(
      () =>
        useChartData("test-user", "1M", {
          portfolioData: mockPortfolioData,
          sharpeData: sharpeOverride,
        }),
      { wrapper: createWrapper() }
    );

    expect(result.current.sharpeData).toHaveLength(2);
  });

  it("handles allocation data with pre-aggregated format", () => {
    const aggregatedAllocation: AssetAllocationPoint[] = [
      { date: "2025-01-01", btc: 30, eth: 25, stablecoin: 20, altcoin: 25 },
      { date: "2025-01-02", btc: 32, eth: 24, stablecoin: 19, altcoin: 25 },
    ];

    const mockPortfolioData: PortfolioDataPoint[] = [
      { date: "2025-01-01", value: 10000, pnl: 0 },
      { date: "2025-01-02", value: 11000, pnl: 1000 },
    ];

    const { result } = renderHook(
      () =>
        useChartData("test-user", "1M", {
          portfolioData: mockPortfolioData,
          allocationData: aggregatedAllocation,
        }),
      { wrapper: createWrapper() }
    );

    expect(result.current.allocationHistory).toHaveLength(2);
    expect(result.current.allocationHistory[0]).toMatchObject({
      btc: 30,
      eth: 25,
      stablecoin: 20,
      altcoin: 25,
    });
  });
});

describe("useChartData - Loading States", () => {
  it("reports loading while unified dashboard fetches", () => {
    setDashboardResponse(undefined, { isLoading: true });

    const { result } = renderHook(() => useChartData("test-user", "1M"), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(true);
  });

  it("only shows loaded when dashboard completes", async () => {
    const dashboard = createMockDashboard();
    dashboard.trends.daily_values = createMockPortfolioData(10).map(point => ({
      date: point.date,
      total_value_usd: point.value ?? 0,
      change_percentage: 0,
      categories: [],
      protocols: [],
    }));

    setDashboardResponse(dashboard);

    const { result } = renderHook(() => useChartData("test-user", "1M"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
  });

  it("handles external loading state", () => {
    const { result } = renderHook(
      () => useChartData("test-user", "1M", undefined, true),
      { wrapper: createWrapper() }
    );

    expect(result.current.isLoading).toBe(true);
  });

  it("prioritizes error over loading", () => {
    const { result } = renderHook(
      () => useChartData("test-user", "1M", undefined, true, "API Error"),
      { wrapper: createWrapper() }
    );

    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe("API Error");
  });
});

describe("useChartData - Memoization", () => {
  it("memoizes data transformations", () => {
    const dashboard = createMockDashboard();
    dashboard.trends.daily_values = createMockPortfolioData(10).map(point => ({
      date: point.date,
      total_value_usd: point.value ?? 0,
      change_percentage: 0,
      categories: [],
      protocols: [],
    }));

    setDashboardResponse(dashboard);

    const { result, rerender } = renderHook(
      () => useChartData("test-user", "1M"),
      { wrapper: createWrapper() }
    );

    const firstStackedData = result.current.stackedPortfolioData;
    rerender();

    expect(result.current.stackedPortfolioData).toBe(firstStackedData);
  });

  it("recalculates when dependencies change", () => {
    const dashboard = createMockDashboard();
    dashboard.trends.daily_values = createMockPortfolioData(10).map(point => ({
      date: point.date,
      total_value_usd: point.value ?? 0,
      change_percentage: 0,
      categories: [],
      protocols: [],
    }));

    setDashboardResponse(dashboard);

    const { rerender } = renderHook(
      ({ period }) => useChartData("test-user", period),
      {
        wrapper: createWrapper(),
        initialProps: { period: "1M" },
      }
    );

    expect(
      usePortfolioDashboard.usePortfolioDashboard
    ).toHaveBeenLastCalledWith(
      "test-user",
      expect.objectContaining({
        trend_days: 30,
        risk_days: 30,
        drawdown_days: 30,
        allocation_days: 30,
        rolling_days: 30,
      })
    );

    rerender({ period: "3M" });

    expect(
      usePortfolioDashboard.usePortfolioDashboard
    ).toHaveBeenLastCalledWith(
      "test-user",
      expect.objectContaining({
        trend_days: 90,
        risk_days: 90,
        drawdown_days: 90,
        allocation_days: 90,
        rolling_days: 90,
      })
    );
  });
});

describe("useChartData - Portfolio Metrics", () => {
  it("calculates portfolio metrics correctly", () => {
    const mockData: PortfolioDataPoint[] = [
      { date: "2025-01-01", value: 10000, pnl: 0 },
      { date: "2025-01-02", value: 11000, pnl: 1000 },
      { date: "2025-01-03", value: 12000, pnl: 2000 },
    ];

    const dashboard = createMockDashboard();
    dashboard.trends.daily_values = mockData.map(point => ({
      date: point.date,
      total_value_usd: point.value ?? 0,
      change_percentage: 0,
      categories: [],
      protocols: [],
    }));

    setDashboardResponse(dashboard);

    const { result } = renderHook(() => useChartData("test-user", "1M"), {
      wrapper: createWrapper(),
    });

    expect(result.current.firstValue).toBe(10000);
    expect(result.current.currentValue).toBe(12000);
    expect(result.current.totalReturn).toBe(20);
    expect(result.current.isPositive).toBe(true);
  });

  it("handles negative returns correctly", () => {
    const mockData: PortfolioDataPoint[] = [
      { date: "2025-01-01", value: 10000, pnl: 0 },
      { date: "2025-01-02", value: 9000, pnl: -1000 },
    ];

    const dashboard = createMockDashboard();
    dashboard.trends.daily_values = mockData.map(point => ({
      date: point.date,
      total_value_usd: point.value ?? 0,
      change_percentage: 0,
      categories: [],
      protocols: [],
    }));

    setDashboardResponse(dashboard);

    const { result } = renderHook(() => useChartData("test-user", "1M"), {
      wrapper: createWrapper(),
    });

    expect(result.current.totalReturn).toBe(-10);
    expect(result.current.isPositive).toBe(false);
  });
});
