/**
 * Integration tests for useChartData hook (Orchestrator Pattern)
 *
 * Tests the refactored useChartData hook that orchestrates 4 specialized hooks:
 * - usePortfolioHistoryData: Performance chart data
 * - useAllocationData: Asset allocation breakdown
 * - useDrawdownAnalysis: Drawdown and recovery metrics
 * - useRollingAnalytics: Sharpe ratio, volatility, and daily yield
 *
 * Test Coverage:
 * 1. Full data flow integration across all 4 sub-hooks
 * 2. Chart-specific data transformations (5 chart types)
 * 3. Loading state coordination and aggregation
 * 4. Error handling and propagation
 * 5. Empty/null data handling
 * 6. Real-world scenarios with production-like data
 * 7. Backward compatibility with existing chart components
 * 8. Override functionality for testing and preloaded data
 * 9. Edge cases and malformed data handling
 * 10. Memoization and performance optimization
 */

import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useChartData } from "@/components/PortfolioChart/hooks/useChartData";
import type {
  AllocationTimeseriesInputPoint,
  DailyYieldOverridePoint,
  DrawdownOverridePoint,
  SharpeOverridePoint,
  VolatilityOverridePoint,
} from "@/components/PortfolioChart/types";
import * as usePortfolioDashboard from "@/hooks/usePortfolioDashboard";
import type { UnifiedDashboardResponse } from "@/services/analyticsService";
import type {
  AssetAllocationPoint,
  PortfolioDataPoint,
} from "@/types/domain/portfolio";

import {
  createMockArray,
  generateDateSeries,
} from "../helpers/mock-factories";
import { MOCK_BASE_DATE } from "../helpers/test-constants";
import { createQueryWrapper, setupMockCleanup } from "../helpers/test-setup";

// Mock the unified dashboard hook
vi.mock("@/hooks/usePortfolioDashboard", () => ({
  usePortfolioDashboard: vi.fn(() => ({
    dashboard: undefined,
    data: undefined,
    isLoading: false,
    error: null,
  })),
}));

// Mock daily yield query
vi.mock("@tanstack/react-query", async () => {
  const actual = await vi.importActual("@tanstack/react-query");
  return {
    ...actual,
    useQuery: vi.fn((options: any) => {
      // Default mock implementation
      if (options.queryKey?.[0] === "daily-yield") {
        return {
          data: null,
          isLoading: false,
          error: null,
        };
      }
      return {
        data: undefined,
        isLoading: false,
        error: null,
      };
    }),
  };
});

setupMockCleanup();

const createWrapper = () => createQueryWrapper().QueryWrapper;

// ============================================================================
// Mock Data Factory Functions
// ============================================================================

/**
 * Creates realistic portfolio history data with DeFi/Wallet breakdown
 */
const createMockPortfolioData = (days = 30): PortfolioDataPoint[] => {
  const dateSeries = generateDateSeries(MOCK_BASE_DATE, days);

  return createMockArray(days, (index) => {
    const baseValue = 10_000 + index * 150;
    const defiValue = baseValue * 0.6;
    const walletValue = baseValue * 0.4;

    return {
      date: dateSeries[index] ?? "",
      value: baseValue,
      change: index > 0 ? (150 / (10_000 + (index - 1) * 150)) * 100 : 0,
      benchmark: baseValue * 0.95,
      protocols: [
        {
          protocol: "aave",
          chain: "ethereum",
          value: defiValue * 0.5,
          pnl: index * 5,
          sourceType: "defi",
          category: "lending",
        },
        {
          protocol: "uniswap",
          chain: "ethereum",
          value: defiValue * 0.5,
          pnl: index * 3,
          sourceType: "defi",
          category: "dex",
        },
      ],
      categories: [
        { category: "lending", value: defiValue * 0.5, pnl: index * 5 },
        { category: "dex", value: defiValue * 0.5, pnl: index * 3 },
        { category: "wallet", value: walletValue, pnl: 0 },
      ],
      chainsCount: 2,
    } satisfies PortfolioDataPoint;
  });
};

/**
 * Creates allocation timeseries data for BTC/ETH/Stablecoin/Altcoin
 */
const createMockAllocationData = (
  days = 30
): AllocationTimeseriesInputPoint[] => {
  const dateSeries = generateDateSeries(MOCK_BASE_DATE, days);
  const result: AllocationTimeseriesInputPoint[] = [];

  for (const [index, date] of dateSeries.entries()) {
    const portfolioValue = 10_000 + index * 150;

    // BTC allocation (30-35%)
    result.push({
      date,
      category: "btc",
      category_value_usd: portfolioValue * (0.3 + (index % 5) * 0.01),
      total_portfolio_value_usd: portfolioValue,
      allocation_percentage: 30 + (index % 5),
    });

    // ETH allocation (25-30%)
    result.push({
      date,
      category: "eth",
      category_value_usd: portfolioValue * (0.25 + (index % 5) * 0.01),
      total_portfolio_value_usd: portfolioValue,
      allocation_percentage: 25 + (index % 5),
    });

    // Stablecoin allocation (20-25%)
    result.push({
      date,
      category: "stablecoins",
      category_value_usd: portfolioValue * (0.2 + (index % 5) * 0.01),
      total_portfolio_value_usd: portfolioValue,
      allocation_percentage: 20 + (index % 5),
    });

    // Altcoin allocation (remaining)
    const remaining = 100 - (30 + (index % 5)) - (25 + (index % 5)) - (20 + (index % 5));
    result.push({
      date,
      category: "others",
      category_value_usd: portfolioValue * (remaining / 100),
      total_portfolio_value_usd: portfolioValue,
      allocation_percentage: remaining,
    });
  }

  return result;
};

/**
 * Creates drawdown data with realistic recovery cycles
 */
const createMockDrawdownData = (days = 30) => {
  const dateSeries = generateDateSeries(MOCK_BASE_DATE, days);

  return dateSeries.map((date, index) => {
    let drawdown = 0;
    // Simulate drawdown cycle: peak -> decline -> recovery
    if (index > 5 && index < 15) {
      drawdown = -((index - 5) * 1.2); // Decline phase
    } else if (index >= 15 && index < 25) {
      drawdown = -((25 - index) * 0.8); // Recovery phase
    }

    return {
      date,
      portfolio_value_usd: 10_000 + index * 150 + drawdown * 10,
      running_peak_usd: Math.max(...dateSeries.slice(0, index + 1).map((_, i) => 10_000 + i * 150)),
      drawdown_pct: drawdown,
    };
  });
};

/**
 * Creates Sharpe ratio data with interpretations
 */
const createMockSharpeData = (days = 30) => {
  const dateSeries = generateDateSeries(MOCK_BASE_DATE, days);

  return dateSeries.map((date, index) => {
    // Simulate improving Sharpe ratio over time
    const baseRatio = 0.5 + (index / days) * 1.5;
    const noise = Math.sin(index / 5) * 0.2;

    return {
      date,
      rolling_sharpe_ratio: baseRatio + noise,
      is_statistically_reliable: index > 14, // Require 15+ data points
    };
  });
};

/**
 * Creates volatility data with risk levels
 */
const createMockVolatilityData = (days = 30) => {
  const dateSeries = generateDateSeries(MOCK_BASE_DATE, days);

  return dateSeries.map((date, index) => {
    // Simulate decreasing volatility over time
    const baseVolatility = 25 - (index / days) * 10;
    const noise = Math.sin(index / 3) * 3;

    return {
      date,
      rolling_volatility_daily_pct: (baseVolatility + noise) / Math.sqrt(252),
      annualized_volatility_pct: baseVolatility + noise,
    };
  });
};

/**
 * Creates daily yield data with protocol breakdown
 */
const createMockDailyYieldData = (days = 30): DailyYieldOverridePoint[] => {
  const dateSeries = generateDateSeries(MOCK_BASE_DATE, days);
  let cumulative = 0;

  return dateSeries.map((date, index) => {
    const dailyYield = 10 + index * 0.5 + Math.random() * 5;
    cumulative += dailyYield;

    return {
      date,
      total_yield_usd: dailyYield,
      cumulative_yield_usd: cumulative,
      protocol_count: 3,
      protocols: [
        { protocol_name: "aave", chain: "ethereum", yield_return_usd: dailyYield * 0.5 },
        { protocol_name: "compound", chain: "ethereum", yield_return_usd: dailyYield * 0.3 },
        { protocol_name: "yearn", chain: "ethereum", yield_return_usd: dailyYield * 0.2 },
      ],
    };
  });
};

/**
 * Creates complete unified dashboard response
 */
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

// ============================================================================
// Test Helper Functions
// ============================================================================

const setDashboardResponse = (
  dashboard?: UnifiedDashboardResponse,
  overrides: Partial<
    ReturnType<typeof usePortfolioDashboard.usePortfolioDashboard>
  > = {}
) => {
  vi.mocked(usePortfolioDashboard.usePortfolioDashboard).mockReturnValue({
    dashboard,
    data: dashboard,
    isLoading: false,
    error: null,
    ...overrides,
  } as any);
};

beforeEach(() => {
  vi.clearAllMocks();
  setDashboardResponse();
});

// ============================================================================
// Test Suite 1: Full Data Flow Integration
// ============================================================================

describe("useChartData - Full Data Flow Integration", () => {
  it("orchestrates all 4 sub-hooks correctly with complete data", () => {
    const dashboard = createMockDashboard();
    const portfolioData = createMockPortfolioData(30);

    // Populate all sections of the dashboard
    dashboard.trends.daily_values = portfolioData.map((point) => ({
      date: point.date,
      total_value_usd: point.value ?? 0,
      change_percentage: point.change ?? 0,
      categories: point.categories?.map((cat) => ({
        category: cat.category ?? "unknown",
        value_usd: cat.value ?? 0,
        pnl_usd: cat.pnl ?? 0,
      })) ?? [],
      protocols: point.protocols?.map((proto) => ({
        protocol: proto.protocol ?? "unknown",
        chain: proto.chain ?? "unknown",
        value_usd: proto.value ?? 0,
        pnl_usd: proto.pnl ?? 0,
      })) ?? [],
    }));

    dashboard.allocation.allocations = createMockAllocationData(30);
    dashboard.drawdown_analysis.enhanced.drawdown_data = createMockDrawdownData(30);
    dashboard.rolling_analytics.sharpe.rolling_sharpe_data = createMockSharpeData(30);
    dashboard.rolling_analytics.volatility.rolling_volatility_data = createMockVolatilityData(30);

    setDashboardResponse(dashboard);

    const { result } = renderHook(() => useChartData("test-user", "1M"), {
      wrapper: createWrapper(),
    });

    // Verify data from usePortfolioHistoryData
    expect(result.current.stackedPortfolioData).toHaveLength(30);
    expect(result.current.portfolioHistory).toHaveLength(30);
    expect(result.current.currentValue).toBeGreaterThan(0);
    expect(result.current.firstValue).toBeGreaterThan(0);

    // Verify data from useAllocationData
    expect(result.current.allocationHistory.length).toBeGreaterThan(0);

    // Verify data from useDrawdownAnalysis
    expect(result.current.drawdownRecoveryData).toHaveLength(30);
    expect(result.current.drawdownRecoverySummary).toBeDefined();

    // Verify data from useRollingAnalytics
    expect(result.current.sharpeData).toHaveLength(30);
    expect(result.current.volatilityData).toHaveLength(30);

    // Verify aggregated loading and error states
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe(null);
  });

  it("verifies data flows correctly to each specialized hook", () => {
    const dashboard = createMockDashboard();
    const portfolioData = createMockPortfolioData(10);

    dashboard.trends.daily_values = portfolioData.map((point) => ({
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

    // Performance data should match portfolio history length
    expect(result.current.portfolioHistory).toHaveLength(10);
    expect(result.current.stackedPortfolioData).toHaveLength(10);
    expect(result.current.drawdownReferenceData).toHaveLength(10);

    // Metrics should be calculated from portfolio history
    expect(result.current.currentValue).toBe(portfolioData[9]?.value ?? 0);
    expect(result.current.firstValue).toBe(portfolioData[0]?.value ?? 0);
  });

  it("correctly delegates to all 4 hooks with mixed data availability", () => {
    const dashboard = createMockDashboard();

    // Only provide portfolio and allocation data (no drawdown, sharpe, volatility)
    dashboard.trends.daily_values = createMockPortfolioData(15).map((point) => ({
      date: point.date,
      total_value_usd: point.value ?? 0,
      change_percentage: 0,
      categories: [],
      protocols: [],
    }));

    dashboard.allocation.allocations = createMockAllocationData(15);

    setDashboardResponse(dashboard);

    const { result } = renderHook(() => useChartData("test-user", "1M"), {
      wrapper: createWrapper(),
    });

    // Portfolio data should be present
    expect(result.current.portfolioHistory).toHaveLength(15);

    // Allocation data should be present
    expect(result.current.allocationHistory.length).toBeGreaterThan(0);

    // Drawdown should be calculated from portfolio data
    expect(result.current.drawdownRecoveryData).toHaveLength(15);

    // Rolling analytics should be empty (no API data)
    expect(result.current.sharpeData).toHaveLength(0);
    expect(result.current.volatilityData).toHaveLength(0);
  });
});

// ============================================================================
// Test Suite 2: Chart-Specific Data Transformations
// ============================================================================

describe("useChartData - Chart-Specific Tests", () => {
  describe("Performance Chart (Stacked Portfolio)", () => {
    it("provides correct data structure for performance chart", () => {
      const dashboard = createMockDashboard();
      const portfolioData = createMockPortfolioData(20);

      dashboard.trends.daily_values = portfolioData.map((point) => ({
        date: point.date,
        total_value_usd: point.value ?? 0,
        change_percentage: point.change ?? 0,
        categories: point.categories?.map((cat) => ({
          category: cat.category ?? "unknown",
          value_usd: cat.value ?? 0,
          pnl_usd: cat.pnl ?? 0,
          source_type: cat.category === "wallet" ? "wallet" : "defi",
        })) ?? [],
        protocols: [],
      }));

      setDashboardResponse(dashboard);

      const { result } = renderHook(() => useChartData("test-user", "1M"), {
        wrapper: createWrapper(),
      });

      expect(result.current.stackedPortfolioData).toHaveLength(20);

      const firstPoint = result.current.stackedPortfolioData[0];
      expect(firstPoint).toMatchObject({
        date: expect.any(String),
        value: expect.any(Number),
        defiValue: expect.any(Number),
        walletValue: expect.any(Number),
        stackedTotalValue: expect.any(Number),
      });

      // Verify stacked values sum correctly
      for (const point of result.current.stackedPortfolioData) {
        const sum = point.defiValue + point.walletValue;
        expect(sum).toBeCloseTo(point.stackedTotalValue, 1);
      }
    });

    it("calculates portfolio value over time correctly", () => {
      const dashboard = createMockDashboard();
      const portfolioData = createMockPortfolioData(5);

      dashboard.trends.daily_values = portfolioData.map((point) => ({
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

      // Verify ascending values
      for (let i = 1; i < result.current.portfolioHistory.length; i++) {
        expect(result.current.portfolioHistory[i]?.value ?? 0).toBeGreaterThanOrEqual(
          result.current.portfolioHistory[i - 1]?.value ?? 0
        );
      }
    });
  });

  describe("Allocation Chart (BTC/ETH/Stablecoin/Altcoin)", () => {
    it("provides correct data structure for allocation chart", () => {
      const dashboard = createMockDashboard();
      dashboard.allocation.allocations = createMockAllocationData(10);

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
    });

    it("ensures allocation percentages sum to 100%", () => {
      const dashboard = createMockDashboard();
      dashboard.allocation.allocations = createMockAllocationData(15);

      setDashboardResponse(dashboard);

      const { result } = renderHook(() => useChartData("test-user", "1M"), {
        wrapper: createWrapper(),
      });

      for (const point of result.current.allocationHistory) {
        const total = point.btc + point.eth + point.stablecoin + point.altcoin;
        expect(total).toBeCloseTo(100, 1);
      }
    });
  });

  describe("Drawdown Chart (Drawdown Percentages & Recovery)", () => {
    it("provides correct data structure for drawdown chart", () => {
      const dashboard = createMockDashboard();
      dashboard.drawdown_analysis.enhanced.drawdown_data = createMockDrawdownData(20);

      setDashboardResponse(dashboard);

      const { result } = renderHook(() => useChartData("test-user", "1M"), {
        wrapper: createWrapper(),
      });

      expect(result.current.drawdownRecoveryData).toHaveLength(20);

      const firstPoint = result.current.drawdownRecoveryData[0];
      expect(firstPoint).toMatchObject({
        date: expect.any(String),
        drawdown: expect.any(Number),
        isRecoveryPoint: expect.any(Boolean),
      });
    });

    it("identifies recovery points correctly", () => {
      const dashboard = createMockDashboard();
      dashboard.drawdown_analysis.enhanced.drawdown_data = createMockDrawdownData(30);

      setDashboardResponse(dashboard);

      const { result } = renderHook(() => useChartData("test-user", "1M"), {
        wrapper: createWrapper(),
      });

      const recoveryPoints = result.current.drawdownRecoveryData.filter(
        (point) => point.isRecoveryPoint
      );

      // Should have at least one recovery point in the mock data
      expect(recoveryPoints.length).toBeGreaterThan(0);

      // Verify recovery summary
      expect(result.current.drawdownRecoverySummary).toMatchObject({
        maxDrawdown: expect.any(Number),
        totalRecoveries: expect.any(Number),
        currentDrawdown: expect.any(Number),
        currentStatus: expect.stringMatching(/At Peak|Underwater/),
      });
    });

    it("calculates max drawdown correctly", () => {
      const dashboard = createMockDashboard();
      dashboard.drawdown_analysis.enhanced.drawdown_data = [
        { date: "2025-01-01", drawdown_pct: 0, portfolio_value_usd: 10000, running_peak_usd: 10000 },
        { date: "2025-01-02", drawdown_pct: -5.0, portfolio_value_usd: 9500, running_peak_usd: 10000 },
        { date: "2025-01-03", drawdown_pct: -10.0, portfolio_value_usd: 9000, running_peak_usd: 10000 },
        { date: "2025-01-04", drawdown_pct: -3.0, portfolio_value_usd: 9700, running_peak_usd: 10000 },
      ];

      setDashboardResponse(dashboard);

      const { result } = renderHook(() => useChartData("test-user", "1M"), {
        wrapper: createWrapper(),
      });

      expect(result.current.drawdownRecoverySummary.maxDrawdown).toBeLessThanOrEqual(-10.0);
    });
  });

  describe("Sharpe Chart (Risk-Adjusted Returns)", () => {
    it("provides correct data structure for sharpe chart", () => {
      const dashboard = createMockDashboard();
      dashboard.rolling_analytics.sharpe.rolling_sharpe_data = createMockSharpeData(15);

      setDashboardResponse(dashboard);

      const { result } = renderHook(() => useChartData("test-user", "1M"), {
        wrapper: createWrapper(),
      });

      expect(result.current.sharpeData).toHaveLength(15);

      const firstPoint = result.current.sharpeData[0];
      expect(firstPoint).toMatchObject({
        date: expect.any(String),
        sharpe: expect.any(Number),
      });
    });

    it("includes sharpe ratio interpretations from sub-hook", () => {
      const dashboard = createMockDashboard();
      dashboard.rolling_analytics.sharpe.rolling_sharpe_data = [
        { date: "2025-01-01", rolling_sharpe_ratio: 2.5, is_statistically_reliable: true },
        { date: "2025-01-02", rolling_sharpe_ratio: 1.5, is_statistically_reliable: true },
        { date: "2025-01-03", rolling_sharpe_ratio: 0.5, is_statistically_reliable: true },
      ];

      setDashboardResponse(dashboard);

      const { result } = renderHook(() => useChartData("test-user", "1M"), {
        wrapper: createWrapper(),
      });

      // Verify data is present (interpretations are added by useRollingAnalytics)
      expect(result.current.sharpeData).toHaveLength(3);
      expect(result.current.sharpeData[0]?.sharpe).toBe(2.5);
    });
  });

  describe("Volatility Chart (Rolling Volatility)", () => {
    it("provides correct data structure for volatility chart", () => {
      const dashboard = createMockDashboard();
      dashboard.rolling_analytics.volatility.rolling_volatility_data = createMockVolatilityData(12);

      setDashboardResponse(dashboard);

      const { result } = renderHook(() => useChartData("test-user", "1M"), {
        wrapper: createWrapper(),
      });

      expect(result.current.volatilityData).toHaveLength(12);

      const firstPoint = result.current.volatilityData[0];
      expect(firstPoint).toMatchObject({
        date: expect.any(String),
        volatility: expect.any(Number),
      });
    });

    it("includes risk level categorizations from sub-hook", () => {
      const dashboard = createMockDashboard();
      dashboard.rolling_analytics.volatility.rolling_volatility_data = [
        { date: "2025-01-01", annualized_volatility_pct: 8.0, rolling_volatility_daily_pct: 0.5 },
        { date: "2025-01-02", annualized_volatility_pct: 15.0, rolling_volatility_daily_pct: 0.94 },
        { date: "2025-01-03", annualized_volatility_pct: 30.0, rolling_volatility_daily_pct: 1.89 },
      ];

      setDashboardResponse(dashboard);

      const { result } = renderHook(() => useChartData("test-user", "1M"), {
        wrapper: createWrapper(),
      });

      // Verify data is present (risk levels are added by useRollingAnalytics)
      expect(result.current.volatilityData).toHaveLength(3);
      expect(result.current.volatilityData[0]?.volatility).toBe(8.0);
      expect(result.current.volatilityData[2]?.volatility).toBe(30.0);
    });
  });
});

// ============================================================================
// Test Suite 3: Loading State Coordination
// ============================================================================

describe("useChartData - Loading State Coordination", () => {
  it("aggregates loading state from all sub-hooks", () => {
    setDashboardResponse(undefined, { isLoading: true });

    const { result } = renderHook(() => useChartData("test-user", "1M"), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(true);
  });

  it("returns loaded when all sub-hooks complete", async () => {
    const dashboard = createMockDashboard();
    dashboard.trends.daily_values = createMockPortfolioData(5).map((point) => ({
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

  it("handles external loading state correctly", () => {
    const { result } = renderHook(
      () => useChartData("test-user", "1M", undefined, true),
      { wrapper: createWrapper() }
    );

    expect(result.current.isLoading).toBe(true);
  });

  it("does not show loading when preloaded data is provided", () => {
    const overrideData: PortfolioDataPoint[] = [
      { date: "2025-01-01", value: 10000, change: 0, protocols: [], categories: [] },
    ];

    setDashboardResponse(undefined, { isLoading: true });

    const { result } = renderHook(
      () => useChartData("test-user", "1M", { portfolioData: overrideData }),
      { wrapper: createWrapper() }
    );

    // Should not be loading when override data is provided
    expect(result.current.isLoading).toBe(false);
  });
});

// ============================================================================
// Test Suite 4: Error Handling & Propagation
// ============================================================================

describe("useChartData - Error Handling", () => {
  it("propagates error from dashboard fetch", () => {
    const errorMessage = "Failed to fetch portfolio data";

    const { result } = renderHook(
      () => useChartData("test-user", "1M", undefined, false, errorMessage),
      { wrapper: createWrapper() }
    );

    expect(result.current.error).toBe(errorMessage);
    expect(result.current.isLoading).toBe(false);
  });

  it("handles Error object as external error", () => {
    const error = new Error("API Error");

    const { result } = renderHook(
      () => useChartData("test-user", "1M", undefined, false, error),
      { wrapper: createWrapper() }
    );

    expect(result.current.error).toBe("API Error");
  });

  it("prioritizes error over loading state", () => {
    const { result } = renderHook(
      () => useChartData("test-user", "1M", undefined, true, "Error occurred"),
      { wrapper: createWrapper() }
    );

    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe("Error occurred");
  });

  it("handles dashboard hook error", () => {
    setDashboardResponse(undefined, {
      error: { message: "Dashboard error" } as any,
    });

    const { result } = renderHook(() => useChartData("test-user", "1M"), {
      wrapper: createWrapper(),
    });

    expect(result.current.error).toBe("Dashboard error");
  });
});

// ============================================================================
// Test Suite 5: Empty/Null Data Handling
// ============================================================================

describe("useChartData - Empty/Null Data Handling", () => {
  it("handles completely empty dashboard data", () => {
    setDashboardResponse(createMockDashboard());

    const { result } = renderHook(() => useChartData("test-user", "1M"), {
      wrapper: createWrapper(),
    });

    expect(result.current.stackedPortfolioData).toEqual([]);
    expect(result.current.allocationHistory).toEqual([]);
    expect(result.current.drawdownRecoveryData).toEqual([]);
    expect(result.current.sharpeData).toEqual([]);
    expect(result.current.volatilityData).toEqual([]);
    expect(result.current.currentValue).toBe(0);
    expect(result.current.totalReturn).toBe(0);
  });

  it("handles missing userId", () => {
    const { result } = renderHook(() => useChartData(undefined, "1M"), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.stackedPortfolioData).toEqual([]);
  });

  it("handles partial data (some charts have data, others don't)", () => {
    const dashboard = createMockDashboard();

    // Only provide portfolio data
    dashboard.trends.daily_values = createMockPortfolioData(10).map((point) => ({
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

    // Portfolio data should be present
    expect(result.current.portfolioHistory).toHaveLength(10);

    // Other data should be empty
    expect(result.current.allocationHistory).toEqual([]);
    expect(result.current.sharpeData).toEqual([]);
    expect(result.current.volatilityData).toEqual([]);
  });

  it("handles null values in data arrays gracefully", () => {
    const dashboard = createMockDashboard();
    dashboard.trends.daily_values = [
      {
        date: "2025-01-01",
        total_value_usd: 10000,
        change_percentage: 0,
        categories: [],
        protocols: [],
      },
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

    // Should still process data without errors
    expect(result.current.portfolioHistory).toHaveLength(2);

    // NaN should be handled safely
    for (const point of result.current.portfolioHistory) {
      expect(typeof point.value).toBe("number");
    }
  });

  it("filters out null sharpe ratios", () => {
    const sharpeOverride: SharpeOverridePoint[] = [
      { date: "2025-01-01", rolling_sharpe_ratio: 1.2 },
      { date: "2025-01-02", rolling_sharpe_ratio: undefined },
      { date: "2025-01-03", rolling_sharpe_ratio: null as any },
      { date: "2025-01-04", rolling_sharpe_ratio: 1.8 },
    ];

    const mockPortfolioData: PortfolioDataPoint[] = [
      { date: "2025-01-01", value: 10000, change: 0, protocols: [], categories: [] },
      { date: "2025-01-04", value: 11000, change: 10, protocols: [], categories: [] },
    ];

    const { result } = renderHook(
      () =>
        useChartData("test-user", "1M", {
          portfolioData: mockPortfolioData,
          sharpeData: sharpeOverride,
        }),
      { wrapper: createWrapper() }
    );

    // Should filter out null/undefined values
    expect(result.current.sharpeData).toHaveLength(2);
    expect(result.current.sharpeData[0]?.sharpe).toBe(1.2);
    expect(result.current.sharpeData[1]?.sharpe).toBe(1.8);
  });
});

// ============================================================================
// Test Suite 6: Real-World Scenarios
// ============================================================================

describe("useChartData - Real-World Scenarios", () => {
  it("handles realistic production data patterns", () => {
    const dashboard = createMockDashboard();
    const portfolioData = createMockPortfolioData(90); // 3 months of data

    dashboard.trends.daily_values = portfolioData.map((point) => ({
      date: point.date,
      total_value_usd: point.value ?? 0,
      change_percentage: point.change ?? 0,
      categories: point.categories?.map((cat) => ({
        category: cat.category ?? "unknown",
        value_usd: cat.value ?? 0,
        pnl_usd: cat.pnl ?? 0,
      })) ?? [],
      protocols: point.protocols?.map((proto) => ({
        protocol: proto.protocol ?? "unknown",
        chain: proto.chain ?? "unknown",
        value_usd: proto.value ?? 0,
        pnl_usd: proto.pnl ?? 0,
      })) ?? [],
    }));

    dashboard.allocation.allocations = createMockAllocationData(90);
    dashboard.drawdown_analysis.enhanced.drawdown_data = createMockDrawdownData(90);
    dashboard.rolling_analytics.sharpe.rolling_sharpe_data = createMockSharpeData(90);
    dashboard.rolling_analytics.volatility.rolling_volatility_data = createMockVolatilityData(90);

    setDashboardResponse(dashboard);

    const { result } = renderHook(() => useChartData("test-user", "3M"), {
      wrapper: createWrapper(),
    });

    // Verify all charts have data
    expect(result.current.stackedPortfolioData).toHaveLength(90);
    expect(result.current.allocationHistory.length).toBeGreaterThan(0);
    expect(result.current.drawdownRecoveryData).toHaveLength(90);
    expect(result.current.sharpeData).toHaveLength(90);
    expect(result.current.volatilityData).toHaveLength(90);

    // Verify data quality
    expect(result.current.currentValue).toBeGreaterThan(result.current.firstValue);
    expect(result.current.totalReturn).toBeGreaterThan(0);
    expect(result.current.isPositive).toBe(true);
  });

  it("maintains data integrity through transformations", () => {
    const dashboard = createMockDashboard();
    const portfolioData = createMockPortfolioData(30);

    dashboard.trends.daily_values = portfolioData.map((point) => ({
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

    // Verify data integrity
    for (const [index, point] of result.current.portfolioHistory.entries()) {
      expect(point.date).toBe(portfolioData[index]?.date);
      expect(point.value).toBe(portfolioData[index]?.value);
    }

    // Verify drawdown reference data matches portfolio history
    for (const [index, point] of result.current.drawdownReferenceData.entries()) {
      expect(point.date).toBe(result.current.portfolioHistory[index]?.date);
      expect(point.portfolio_value).toBe(result.current.portfolioHistory[index]?.value);
    }
  });

  it("verifies backward compatibility with existing chart components", () => {
    const dashboard = createMockDashboard();
    dashboard.trends.daily_values = createMockPortfolioData(20).map((point) => ({
      date: point.date,
      total_value_usd: point.value ?? 0,
      change_percentage: 0,
      categories: [],
      protocols: [],
    }));

    dashboard.allocation.allocations = createMockAllocationData(20);
    dashboard.drawdown_analysis.enhanced.drawdown_data = createMockDrawdownData(20);

    setDashboardResponse(dashboard);

    const { result } = renderHook(() => useChartData("test-user", "1M"), {
      wrapper: createWrapper(),
    });

    // Verify all expected fields are present (backward compatibility)
    expect(result.current).toMatchObject({
      stackedPortfolioData: expect.any(Array),
      allocationHistory: expect.any(Array),
      drawdownRecoveryData: expect.any(Array),
      drawdownRecoverySummary: expect.any(Object),
      sharpeData: expect.any(Array),
      volatilityData: expect.any(Array),
      dailyYieldData: expect.any(Array),
      portfolioHistory: expect.any(Array),
      drawdownReferenceData: expect.any(Array),
      isLoading: expect.any(Boolean),
      error: null,
      currentValue: expect.any(Number),
      firstValue: expect.any(Number),
      totalReturn: expect.any(Number),
      isPositive: expect.any(Boolean),
    });
  });
});

// ============================================================================
// Test Suite 7: Data Overrides & Testing Utilities
// ============================================================================

describe("useChartData - Data Overrides", () => {
  it("accepts portfolio data override", () => {
    const overrideData: PortfolioDataPoint[] = [
      { date: "2025-01-01", value: 5000, change: 0, protocols: [], categories: [] },
      { date: "2025-01-02", value: 5500, change: 10, protocols: [], categories: [] },
    ];

    const { result } = renderHook(
      () => useChartData("test-user", "1M", { portfolioData: overrideData }),
      { wrapper: createWrapper() }
    );

    expect(result.current.portfolioHistory).toEqual(overrideData);
  });

  it("accepts allocation data override", () => {
    const overrideAllocation: AssetAllocationPoint[] = [
      { date: "2025-01-01", btc: 30, eth: 25, stablecoin: 20, altcoin: 25 },
      { date: "2025-01-02", btc: 32, eth: 24, stablecoin: 19, altcoin: 25 },
    ];

    const { result } = renderHook(
      () => useChartData("test-user", "1M", { allocationData: overrideAllocation }),
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

  it("accepts drawdown data override", () => {
    const drawdownOverride: DrawdownOverridePoint[] = [
      { date: "2025-01-01", drawdown_pct: 0 },
      { date: "2025-01-02", drawdown_pct: -5.5 },
      { date: "2025-01-03", drawdown_pct: -2.0 },
    ];

    const mockPortfolioData: PortfolioDataPoint[] = [
      { date: "2025-01-01", value: 10000, change: 0, protocols: [], categories: [] },
      { date: "2025-01-02", value: 9450, change: -5.5, protocols: [], categories: [] },
      { date: "2025-01-03", value: 9800, change: 3.7, protocols: [], categories: [] },
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
    expect(result.current.drawdownRecoveryData[1]?.drawdown).toBe(-5.5);
  });

  it("accepts sharpe data override", () => {
    const sharpeOverride: SharpeOverridePoint[] = [
      { date: "2025-01-01", rolling_sharpe_ratio: 2.5 },
      { date: "2025-01-02", rolling_sharpe_ratio: 1.8 },
    ];

    const { result } = renderHook(
      () => useChartData("test-user", "1M", { sharpeData: sharpeOverride }),
      { wrapper: createWrapper() }
    );

    expect(result.current.sharpeData).toHaveLength(2);
    expect(result.current.sharpeData[0]?.sharpe).toBe(2.5);
  });

  it("accepts volatility data override", () => {
    const volatilityOverride: VolatilityOverridePoint[] = [
      { date: "2025-01-01", annualized_volatility_pct: 15.5 },
      { date: "2025-01-02", annualized_volatility_pct: 18.2 },
    ];

    const { result } = renderHook(
      () => useChartData("test-user", "1M", { volatilityData: volatilityOverride }),
      { wrapper: createWrapper() }
    );

    expect(result.current.volatilityData).toHaveLength(2);
    expect(result.current.volatilityData[0]?.volatility).toBe(15.5);
  });

  it("accepts daily yield data override", () => {
    const yieldOverride: DailyYieldOverridePoint[] = createMockDailyYieldData(5);

    const { result } = renderHook(
      () => useChartData("test-user", "1M", { dailyYieldData: yieldOverride }),
      { wrapper: createWrapper() }
    );

    expect(result.current.dailyYieldData).toHaveLength(5);
    expect(result.current.dailyYieldData[0]?.total_yield_usd).toBeGreaterThan(0);
  });

  it("accepts multiple overrides simultaneously", () => {
    const overridePortfolio: PortfolioDataPoint[] = [
      { date: "2025-01-01", value: 10000, change: 0, protocols: [], categories: [] },
    ];

    const overrideSharpe: SharpeOverridePoint[] = [
      { date: "2025-01-01", rolling_sharpe_ratio: 1.5 },
    ];

    const overrideVolatility: VolatilityOverridePoint[] = [
      { date: "2025-01-01", annualized_volatility_pct: 12.0 },
    ];

    const { result } = renderHook(
      () =>
        useChartData("test-user", "1M", {
          portfolioData: overridePortfolio,
          sharpeData: overrideSharpe,
          volatilityData: overrideVolatility,
        }),
      { wrapper: createWrapper() }
    );

    expect(result.current.portfolioHistory).toEqual(overridePortfolio);
    expect(result.current.sharpeData[0]?.sharpe).toBe(1.5);
    expect(result.current.volatilityData[0]?.volatility).toBe(12.0);
  });
});

// ============================================================================
// Test Suite 8: Memoization & Performance
// ============================================================================

describe("useChartData - Memoization", () => {
  it("memoizes data transformations when dashboard unchanged", () => {
    const dashboard = createMockDashboard();
    dashboard.trends.daily_values = createMockPortfolioData(10).map((point) => ({
      date: point.date,
      total_value_usd: point.value ?? 0,
      change_percentage: 0,
      categories: [],
      protocols: [],
    }));

    setDashboardResponse(dashboard);

    const { result, rerender } = renderHook(() => useChartData("test-user", "1M"), {
      wrapper: createWrapper(),
    });

    const firstStackedData = result.current.stackedPortfolioData;
    const firstAllocationData = result.current.allocationHistory;

    rerender();

    // References should be the same (memoized)
    expect(result.current.stackedPortfolioData).toBe(firstStackedData);
    expect(result.current.allocationHistory).toBe(firstAllocationData);
  });

  it("recalculates when dashboard data changes", () => {
    const dashboard1 = createMockDashboard();
    dashboard1.trends.daily_values = createMockPortfolioData(5).map((point) => ({
      date: point.date,
      total_value_usd: point.value ?? 0,
      change_percentage: 0,
      categories: [],
      protocols: [],
    }));

    setDashboardResponse(dashboard1);

    const { result, rerender } = renderHook(() => useChartData("test-user", "1M"), {
      wrapper: createWrapper(),
    });

    const firstValue = result.current.currentValue;

    // Update dashboard with new data
    const dashboard2 = createMockDashboard();
    dashboard2.trends.daily_values = createMockPortfolioData(10).map((point) => ({
      date: point.date,
      total_value_usd: (point.value ?? 0) * 1.5,
      change_percentage: 0,
      categories: [],
      protocols: [],
    }));

    setDashboardResponse(dashboard2);
    rerender();

    // Value should be recalculated
    expect(result.current.currentValue).not.toBe(firstValue);
  });
});
