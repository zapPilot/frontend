/**
 * Integration tests for useChartData hook
 *
 * Tests comprehensive data transformations for 6 chart types:
 * 1. Stacked Portfolio (DeFi + Wallet breakdown)
 * 2. Allocation History (BTC, ETH, Stablecoins, Altcoins)
 * 3. Drawdown Analysis
 * 4. Sharpe Ratio (Risk-adjusted returns)
 * 5. Volatility Tracking
 * 6. Underwater Recovery
 *
 * Coverage includes:
 * - Happy path transformations
 * - Edge cases (empty data, malformed responses)
 * - Loading and error states
 * - Data override functionality
 * - Memoization validation
 */

import { describe, it, expect, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useChartData } from "../../src/components/PortfolioChart/hooks/useChartData";
import type {
  PortfolioDataPoint,
  AssetAllocationPoint,
} from "../../src/types/portfolio";
import type {
  AllocationTimeseriesInputPoint,
  DrawdownOverridePoint,
  SharpeOverridePoint,
} from "../../src/components/PortfolioChart/types";

// Mock all data fetching hooks
vi.mock("../../src/hooks/usePortfolioTrends", () => ({
  usePortfolioTrends: vi.fn(() => ({ data: undefined, loading: false })),
}));

vi.mock("../../src/hooks/useAnalyticsData", () => ({
  useAnalyticsData: vi.fn(() => ({ data: undefined, loading: false })),
}));

vi.mock("../../src/hooks/useAllocationTimeseries", () => ({
  useAllocationTimeseries: vi.fn(() => ({ data: undefined, loading: false })),
}));

// Mock analytics service functions
vi.mock("../../src/services/analyticsService", () => ({
  getRollingSharpe: vi.fn(),
  getRollingVolatility: vi.fn(),
  getEnhancedDrawdown: vi.fn(),
  getUnderwaterRecovery: vi.fn(),
}));

// Mock utility functions with actual implementations
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

import * as usePortfolioTrends from "../../src/hooks/usePortfolioTrends";
import * as useAnalyticsData from "../../src/hooks/useAnalyticsData";
import * as useAllocationTimeseries from "../../src/hooks/useAllocationTimeseries";
import { createQueryWrapper, setupMockCleanup } from "./helpers/test-setup";
import { MOCK_BASE_DATE } from "./helpers/test-constants";
import { createMockArray, generateDateSeries } from "./helpers/mock-factories";

setupMockCleanup();

const createWrapper = () => createQueryWrapper().QueryWrapper;

const createMockPortfolioData = (days: number = 30): PortfolioDataPoint[] => {
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

const createMockAllocationData = (
  days: number = 30
): AllocationTimeseriesInputPoint[] => {
  const dateSeries = generateDateSeries(MOCK_BASE_DATE, days);

  return dateSeries.flatMap((date, index) => {
    const offset = (index % 4) * 2;
    return [
      {
        date,
        category: "BTC",
        allocation_percentage: 30 + offset,
      },
      {
        date,
        category: "ETH",
        allocation_percentage: 25 + offset / 2,
      },
      {
        date,
        category: "Stablecoin",
        allocation_percentage: 25 - offset / 2,
      },
      {
        date,
        category: "Uniswap",
        allocation_percentage: 20 - offset,
      },
    ] satisfies AllocationTimeseriesInputPoint[];
  });
};

describe("useChartData - Data Transformations", () => {
  it("transforms stacked portfolio data correctly", () => {
    const mockData = createMockPortfolioData(30);

    vi.mocked(usePortfolioTrends.usePortfolioTrends).mockReturnValue({
      data: mockData,
      loading: false,
    });

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

    // Verify DeFi + Wallet = Total
    result.current.stackedPortfolioData.forEach(point => {
      const sum = point.defiValue + point.walletValue;
      expect(sum).toBeCloseTo(point.stackedTotalValue, 2);
    });
  });

  it("transforms allocation history correctly", () => {
    const mockAllocationData = createMockAllocationData(30);

    vi.mocked(useAllocationTimeseries.useAllocationTimeseries).mockReturnValue({
      data: { allocation_data: mockAllocationData },
      loading: false,
    });

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

    // Verify allocations sum to ~100%
    result.current.allocationHistory.forEach(point => {
      const total = point.btc + point.eth + point.stablecoin + point.altcoin;
      expect(total).toBeCloseTo(100, 1);
    });
  });

  it("calculates drawdown data correctly", () => {
    const mockData: PortfolioDataPoint[] = [
      { date: "2025-01-01", value: 10000, pnl: 0 },
      { date: "2025-01-02", value: 11000, pnl: 1000 }, // New peak
      { date: "2025-01-03", value: 9900, pnl: -100 }, // -10% drawdown
      { date: "2025-01-04", value: 10500, pnl: 500 }, // Recovery
    ];

    vi.mocked(usePortfolioTrends.usePortfolioTrends).mockReturnValue({
      data: mockData,
      loading: false,
    });

    const { result } = renderHook(() => useChartData("test-user", "1M"), {
      wrapper: createWrapper(),
    });

    expect(result.current.drawdownData).toHaveLength(4);

    // Third point should have ~10% drawdown
    const drawdownPoint = result.current.drawdownData[2];
    expect(drawdownPoint.drawdown).toBeCloseTo(10, 1);
  });

  it("calculates Sharpe ratio data correctly", () => {
    const mockSharpeData = {
      rolling_sharpe_data: [
        { date: "2025-01-01", rolling_sharpe_ratio: 1.2 },
        { date: "2025-01-02", rolling_sharpe_ratio: 1.5 },
        { date: "2025-01-03", rolling_sharpe_ratio: 1.8 },
      ],
    };

    vi.mocked(useAnalyticsData.useAnalyticsData).mockReturnValue({
      data: mockSharpeData,
      loading: false,
    });

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
    const mockVolatilityData = {
      rolling_volatility_data: [
        { date: "2025-01-01", annualized_volatility_pct: 15.5 },
        { date: "2025-01-02", annualized_volatility_pct: 18.2 },
        { date: "2025-01-03", rolling_volatility_daily_pct: 2.1 },
      ],
    };

    let callCount = 0;
    vi.mocked(useAnalyticsData.useAnalyticsData).mockImplementation(() => {
      callCount++;
      // Return volatility data on second call (first is sharpe)
      if (callCount === 2) {
        return { data: mockVolatilityData, loading: false };
      }
      return { data: undefined, loading: false };
    });

    const { result } = renderHook(() => useChartData("test-user", "1M"), {
      wrapper: createWrapper(),
    });

    expect(result.current.volatilityData).toHaveLength(3);
    expect(result.current.volatilityData[0].volatility).toBe(15.5);
    expect(result.current.volatilityData[2].volatility).toBe(2.1);
  });

  it("calculates underwater data correctly", () => {
    const mockUnderwaterData = {
      underwater_data: [
        { date: "2025-01-01", underwater_pct: 0, recovery_point: false },
        { date: "2025-01-02", underwater_pct: -5.5, recovery_point: false },
        { date: "2025-01-03", underwater_pct: 0, recovery_point: true },
      ],
    };

    let callCount = 0;
    vi.mocked(useAnalyticsData.useAnalyticsData).mockImplementation(() => {
      callCount++;
      // Return underwater data on fourth call
      if (callCount === 4) {
        return { data: mockUnderwaterData, loading: false };
      }
      return { data: undefined, loading: false };
    });

    const { result } = renderHook(() => useChartData("test-user", "1M"), {
      wrapper: createWrapper(),
    });

    expect(result.current.underwaterData).toHaveLength(3);
    expect(result.current.underwaterData[1]).toMatchObject({
      date: "2025-01-02",
      underwater: -5.5,
    });
    expect(result.current.underwaterData[2]).toMatchObject({
      underwater: 0,
      recovery: true,
    });
  });
});

describe("useChartData - Edge Cases", () => {
  it("handles empty data gracefully", () => {
    vi.mocked(usePortfolioTrends.usePortfolioTrends).mockReturnValue({
      data: [],
      loading: false,
    });

    vi.mocked(useAllocationTimeseries.useAllocationTimeseries).mockReturnValue({
      data: { allocation_data: [] },
      loading: false,
    });

    vi.mocked(useAnalyticsData.useAnalyticsData).mockReturnValue({
      data: undefined,
      loading: false,
    });

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

    // Should not call hooks when userId is missing
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
    const malformedData: any[] = [
      { date: "2025-01-01", value: 0 }, // Missing some fields but has required
      { date: "2025-01-02", value: 10000 }, // Valid entry
    ];

    vi.mocked(usePortfolioTrends.usePortfolioTrends).mockReturnValue({
      data: malformedData,
      loading: false,
    });

    const { result } = renderHook(() => useChartData("test-user", "1M"), {
      wrapper: createWrapper(),
    });

    // Should handle gracefully with safe defaults
    expect(result.current.stackedPortfolioData.length).toBe(2);
    result.current.stackedPortfolioData.forEach(point => {
      expect(point.defiValue).toBeDefined();
      expect(point.walletValue).toBeDefined();
      expect(Number.isFinite(point.defiValue)).toBe(true);
      expect(Number.isFinite(point.walletValue)).toBe(true);
    });
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

    // Need to provide portfolio data when using overrides
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

    expect(result.current.drawdownData).toHaveLength(3);
    expect(result.current.drawdownData[0].drawdown).toBe(0);
    expect(result.current.drawdownData[1].drawdown).toBe(0);
    expect(result.current.drawdownData[2].drawdown).toBe(5.5);
  });

  it("filters out null sharpe ratios", () => {
    const sharpeOverride: SharpeOverridePoint[] = [
      { date: "2025-01-01", rolling_sharpe_ratio: 1.2 },
      { date: "2025-01-02", rolling_sharpe_ratio: undefined },
      { date: "2025-01-03", rolling_sharpe_ratio: null as any },
      { date: "2025-01-04", rolling_sharpe_ratio: 1.8 },
    ];

    // Need to provide portfolio data when using overrides
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

    // Should only include non-null values
    expect(result.current.sharpeData).toHaveLength(2);
  });

  it("handles allocation data with pre-aggregated format", () => {
    const aggregatedAllocation: AssetAllocationPoint[] = [
      { date: "2025-01-01", btc: 30, eth: 25, stablecoin: 20, altcoin: 25 },
      { date: "2025-01-02", btc: 32, eth: 24, stablecoin: 19, altcoin: 25 },
    ];

    // Need to provide portfolio data when using overrides
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
  it("consolidates loading from multiple hooks", () => {
    vi.mocked(usePortfolioTrends.usePortfolioTrends).mockReturnValue({
      data: undefined,
      loading: true,
    });

    const { result } = renderHook(() => useChartData("test-user", "1M"), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(true);
  });

  it("only shows loaded when all hooks complete", async () => {
    vi.mocked(usePortfolioTrends.usePortfolioTrends).mockReturnValue({
      data: createMockPortfolioData(10),
      loading: false,
    });

    vi.mocked(useAnalyticsData.useAnalyticsData).mockReturnValue({
      data: undefined,
      loading: false,
    });

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
    const mockData = createMockPortfolioData(10);

    vi.mocked(usePortfolioTrends.usePortfolioTrends).mockReturnValue({
      data: mockData,
      loading: false,
    });

    const { result, rerender } = renderHook(
      () => useChartData("test-user", "1M"),
      { wrapper: createWrapper() }
    );

    const firstStackedData = result.current.stackedPortfolioData;

    // Rerender without changing props
    rerender();

    // Should return same object reference
    expect(result.current.stackedPortfolioData).toBe(firstStackedData);
  });

  it("recalculates when dependencies change", () => {
    const mockData = createMockPortfolioData(10);

    vi.mocked(usePortfolioTrends.usePortfolioTrends).mockReturnValue({
      data: mockData,
      loading: false,
    });

    const { rerender } = renderHook(
      ({ period }) => useChartData("test-user", period),
      {
        wrapper: createWrapper(),
        initialProps: { period: "1M" },
      }
    );

    expect(usePortfolioTrends.usePortfolioTrends).toHaveBeenLastCalledWith({
      userId: "test-user",
      days: 30,
      enabled: true,
    });

    // Change period
    rerender({ period: "3M" });

    expect(usePortfolioTrends.usePortfolioTrends).toHaveBeenLastCalledWith({
      userId: "test-user",
      days: 90,
      enabled: true,
    });
  });
});

describe("useChartData - Portfolio Metrics", () => {
  it("calculates portfolio metrics correctly", () => {
    const mockData: PortfolioDataPoint[] = [
      { date: "2025-01-01", value: 10000, pnl: 0 },
      { date: "2025-01-02", value: 11000, pnl: 1000 },
      { date: "2025-01-03", value: 12000, pnl: 2000 },
    ];

    vi.mocked(usePortfolioTrends.usePortfolioTrends).mockReturnValue({
      data: mockData,
      loading: false,
    });

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

    vi.mocked(usePortfolioTrends.usePortfolioTrends).mockReturnValue({
      data: mockData,
      loading: false,
    });

    const { result } = renderHook(() => useChartData("test-user", "1M"), {
      wrapper: createWrapper(),
    });

    expect(result.current.totalReturn).toBe(-10);
    expect(result.current.isPositive).toBe(false);
  });
});
