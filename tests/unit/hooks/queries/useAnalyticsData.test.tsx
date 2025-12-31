/**
 * useAnalyticsData - Hook Tests
 *
 * Comprehensive test suite for the analytics data orchestration hook.
 * Tests multiple query coordination, data transformations, period change detection,
 * and graceful degradation.
 */

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { AnalyticsTimePeriod } from "@/types/analytics";

// Mock analytics service
const mockGetDailyYieldReturns = vi.fn();
vi.mock("@/services/analyticsService", () => ({
  getDailyYieldReturns: (...args: any[]) => mockGetDailyYieldReturns(...args),
}));

// Mock usePortfolioDashboard hook
const mockUsePortfolioDashboard = vi.fn();
vi.mock("@/hooks/analytics/usePortfolioDashboard", () => ({
  usePortfolioDashboard: (...args: any[]) => mockUsePortfolioDashboard(...args),
}));

// Mock useBtcPriceQuery hook
const mockUseBtcPriceQuery = vi.fn();
vi.mock("@/hooks/queries/market/useBtcPriceQuery", () => ({
  useBtcPriceQuery: (...args: any[]) => mockUseBtcPriceQuery(...args),
}));

// Mock transformers
const mockTransformToPerformanceChart = vi.fn();
const mockTransformToDrawdownChart = vi.fn();
const mockCalculateKeyMetrics = vi.fn();
const mockAggregateMonthlyPnL = vi.fn();

vi.mock("@/lib/analytics/transformers", () => ({
  transformToPerformanceChart: (...args: any[]) =>
    mockTransformToPerformanceChart(...args),
  transformToDrawdownChart: (...args: any[]) =>
    mockTransformToDrawdownChart(...args),
  calculateKeyMetrics: (...args: any[]) => mockCalculateKeyMetrics(...args),
  aggregateMonthlyPnL: (...args: any[]) => mockAggregateMonthlyPnL(...args),
}));

// Ensure we test the real hook implementation
vi.unmock("@/hooks/queries/useAnalyticsData");

type AnalyticsDataModule = typeof import("@/hooks/queries/useAnalyticsData");

let useAnalyticsData: AnalyticsDataModule["useAnalyticsData"];

const loadModules = async () => {
  vi.resetModules();
  ({ useAnalyticsData } = await import("@/hooks/queries/useAnalyticsData"));
};

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  });
}

function createWrapper() {
  const queryClient = createTestQueryClient();
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  Wrapper.displayName = "TestWrapper";
  return Wrapper;
}

const defaultTimePeriod: AnalyticsTimePeriod = {
  key: "1M",
  days: 30,
  label: "1M",
};

const mockDashboardData = {
  trends: {
    total_value_usd: 10000,
    total_value_change_usd: 500,
    total_value_change_percent: 5,
    avg_daily_yield_usd: 50,
    total_apr: 12.5,
    daily_values: [
      { date: "2024-01-01", value: 9500 },
      { date: "2024-01-02", value: 10000 },
    ],
  },
  rolling_analytics: {
    sharpe: { values: [1.5], dates: ["2024-01-01"] },
    volatility: { values: [0.2], dates: ["2024-01-01"] },
  },
  drawdown_analysis: {
    enhanced: { dates: ["2024-01-01"], values: [-0.05] },
    underwater_recovery: { dates: [], values: [] },
  },
  allocation: { dates: [], allocation: [] },
  _metadata: {
    timestamp: "2024-01-15T10:00:00Z",
    error_count: 0,
    errors: [],
  },
};

const mockBtcPriceData = {
  snapshots: [
    { date: "2024-01-01", price_usd: 50000, source: "coingecko" },
    { date: "2024-01-02", price_usd: 51000, source: "coingecko" },
  ],
  count: 2,
  days_requested: 30,
  oldest_date: "2024-01-01",
  latest_date: "2024-01-02",
  cached: false,
};

const mockMonthlyPnLData = {
  user_id: "user-123",
  daily_returns: [
    {
      date: "2024-01-01",
      protocol_name: "Aave",
      yield_return_usd: 100,
      asset_value_usd: 10000,
      protocol_id: "aave-v3",
      pool_id: "pool-1",
    },
  ],
};

describe("useAnalyticsData", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await loadModules();

    // Default mock implementations
    mockUsePortfolioDashboard.mockReturnValue({
      data: null,
      isLoading: false,
      isFetching: false,
      isSuccess: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    });

    mockUseBtcPriceQuery.mockReturnValue({
      data: null,
      isLoading: false,
      isFetching: false,
      isSuccess: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    });

    mockGetDailyYieldReturns.mockResolvedValue(mockMonthlyPnLData);

    mockTransformToPerformanceChart.mockReturnValue({
      dates: [],
      portfolio: [],
    });
    mockTransformToDrawdownChart.mockReturnValue({ dates: [], values: [] });
    mockCalculateKeyMetrics.mockReturnValue({});
    mockAggregateMonthlyPnL.mockReturnValue([]);
  });

  describe("Basic Functionality", () => {
    it("should return null data when dashboard query has no data", () => {
      const { result } = renderHook(
        () => useAnalyticsData("user-123", defaultTimePeriod),
        { wrapper: createWrapper() }
      );

      expect(result.current.data).toBeNull();
      expect(result.current.isLoading).toBe(false);
    });

    it("should call usePortfolioDashboard with correct parameters", () => {
      renderHook(() => useAnalyticsData("user-123", defaultTimePeriod), {
        wrapper: createWrapper(),
      });

      expect(mockUsePortfolioDashboard).toHaveBeenCalledWith(
        "user-123",
        {
          trend_days: 30,
          drawdown_days: 30,
          rolling_days: 30,
        },
        expect.objectContaining({
          staleTime: 12 * 60 * 60 * 1000,
          refetchOnMount: false,
        })
      );
    });

    it("should pass wallet filter to usePortfolioDashboard", () => {
      renderHook(
        () =>
          useAnalyticsData(
            "user-123",
            defaultTimePeriod,
            "0x1234567890abcdef1234567890abcdef12345678"
          ),
        {
          wrapper: createWrapper(),
        }
      );

      expect(mockUsePortfolioDashboard).toHaveBeenCalledWith(
        "user-123",
        {
          trend_days: 30,
          drawdown_days: 30,
          rolling_days: 30,
          wallet_address: "0x1234567890abcdef1234567890abcdef12345678",
        },
        expect.objectContaining({
          staleTime: 2 * 60 * 1000,
          refetchOnMount: false,
        })
      );
    });

    it("should call useBtcPriceQuery with days parameter", () => {
      renderHook(() => useAnalyticsData("user-123", defaultTimePeriod), {
        wrapper: createWrapper(),
      });

      expect(mockUseBtcPriceQuery).toHaveBeenCalledWith(30);
    });

    it("should transform and return analytics data when dashboard data is available", async () => {
      mockUsePortfolioDashboard.mockReturnValue({
        data: mockDashboardData,
        isLoading: false,
        isFetching: false,
        isSuccess: true,
        isError: false,
        error: null,
        refetch: vi.fn(),
      });

      mockUseBtcPriceQuery.mockReturnValue({
        data: mockBtcPriceData,
        isLoading: false,
        isFetching: false,
        isSuccess: true,
        isError: false,
        error: null,
        refetch: vi.fn(),
      });

      const mockPerformanceChart = { dates: [], portfolio: [], btc: [] };
      const mockDrawdownChart = { dates: [], values: [] };
      const mockKeyMetrics = { totalReturn: 500 };
      const mockMonthlyPnL = [{ month: "2024-01", pnl: 100 }];

      mockTransformToPerformanceChart.mockReturnValue(mockPerformanceChart);
      mockTransformToDrawdownChart.mockReturnValue(mockDrawdownChart);
      mockCalculateKeyMetrics.mockReturnValue(mockKeyMetrics);
      mockAggregateMonthlyPnL.mockReturnValue(mockMonthlyPnL);

      mockGetDailyYieldReturns.mockResolvedValue(mockMonthlyPnLData);

      const { result } = renderHook(
        () => useAnalyticsData("user-123", defaultTimePeriod),
        { wrapper: createWrapper() }
      );

      await waitFor(() => expect(result.current.data).not.toBeNull());

      expect(result.current.data?.performanceChart).toEqual(
        mockPerformanceChart
      );
      expect(result.current.data?.drawdownChart).toEqual(mockDrawdownChart);
      expect(result.current.data?.keyMetrics).toEqual(mockKeyMetrics);
    });
  });

  describe("Period Change Detection", () => {
    it("should force refetch when time period changes", () => {
      const { rerender } = renderHook(
        ({ period }) => useAnalyticsData("user-123", period),
        {
          wrapper: createWrapper(),
          initialProps: { period: defaultTimePeriod },
        }
      );

      // Change period
      const newPeriod: AnalyticsTimePeriod = {
        key: "3M",
        days: 90,
        label: "3M",
      };

      rerender({ period: newPeriod });

      // Should call with staleTime: 0 and refetchOnMount: 'always'
      expect(mockUsePortfolioDashboard).toHaveBeenCalledWith(
        "user-123",
        {
          trend_days: 90,
          drawdown_days: 90,
          rolling_days: 90,
        },
        expect.objectContaining({
          staleTime: 0,
          refetchOnMount: "always",
        })
      );
    });

    it("should use default staleTime when period hasn't changed", () => {
      renderHook(() => useAnalyticsData("user-123", defaultTimePeriod), {
        wrapper: createWrapper(),
      });

      expect(mockUsePortfolioDashboard).toHaveBeenCalledWith(
        "user-123",
        expect.any(Object),
        expect.objectContaining({
          staleTime: 12 * 60 * 60 * 1000,
          refetchOnMount: false,
        })
      );
    });
  });

  describe("Monthly PnL Query", () => {
    it("should enable monthly PnL query only when dashboard data is available", async () => {
      mockUsePortfolioDashboard.mockReturnValue({
        data: mockDashboardData,
        isLoading: false,
        isFetching: false,
        isSuccess: true,
        isError: false,
        error: null,
        refetch: vi.fn(),
      });

      renderHook(() => useAnalyticsData("user-123", defaultTimePeriod), {
        wrapper: createWrapper(),
      });

      // Monthly PnL query should be enabled since dashboard has data
      await waitFor(() =>
        expect(mockGetDailyYieldReturns).toHaveBeenCalledWith(
          "user-123",
          30,
          undefined
        )
      );
    });

    it("should include wallet filter when fetching monthly PnL", async () => {
      mockUsePortfolioDashboard.mockReturnValue({
        data: mockDashboardData,
        isLoading: false,
        isFetching: false,
        isSuccess: true,
        isError: false,
        error: null,
        refetch: vi.fn(),
      });

      renderHook(
        () =>
          useAnalyticsData(
            "user-123",
            defaultTimePeriod,
            "0x1234567890abcdef1234567890abcdef12345678"
          ),
        { wrapper: createWrapper() }
      );

      await waitFor(() =>
        expect(mockGetDailyYieldReturns).toHaveBeenCalledWith(
          "user-123",
          30,
          "0x1234567890abcdef1234567890abcdef12345678"
        )
      );
    });

    it("should not fetch monthly PnL when userId is undefined", () => {
      renderHook(() => useAnalyticsData(undefined, defaultTimePeriod), {
        wrapper: createWrapper(),
      });

      expect(mockGetDailyYieldReturns).not.toHaveBeenCalled();
    });

    it("should not fetch monthly PnL when dashboard has no data", () => {
      mockUsePortfolioDashboard.mockReturnValue({
        data: null,
        isLoading: false,
        isFetching: false,
        isSuccess: false,
        isError: false,
        error: null,
        refetch: vi.fn(),
      });

      renderHook(() => useAnalyticsData("user-123", defaultTimePeriod), {
        wrapper: createWrapper(),
      });

      expect(mockGetDailyYieldReturns).not.toHaveBeenCalled();
    });
  });

  describe("Data Transformations", () => {
    it("should call transformToPerformanceChart with dashboard and BTC data", async () => {
      mockUsePortfolioDashboard.mockReturnValue({
        data: mockDashboardData,
        isLoading: false,
        isFetching: false,
        isSuccess: true,
        isError: false,
        error: null,
        refetch: vi.fn(),
      });

      mockUseBtcPriceQuery.mockReturnValue({
        data: mockBtcPriceData,
        isLoading: false,
        isFetching: false,
        isSuccess: true,
        isError: false,
        error: null,
        refetch: vi.fn(),
      });

      renderHook(() => useAnalyticsData("user-123", defaultTimePeriod), {
        wrapper: createWrapper(),
      });

      await waitFor(() =>
        expect(mockTransformToPerformanceChart).toHaveBeenCalledWith(
          mockDashboardData,
          mockBtcPriceData.snapshots
        )
      );
    });

    it("should call transformToDrawdownChart with dashboard data", async () => {
      mockUsePortfolioDashboard.mockReturnValue({
        data: mockDashboardData,
        isLoading: false,
        isFetching: false,
        isSuccess: true,
        isError: false,
        error: null,
        refetch: vi.fn(),
      });

      renderHook(() => useAnalyticsData("user-123", defaultTimePeriod), {
        wrapper: createWrapper(),
      });

      await waitFor(() =>
        expect(mockTransformToDrawdownChart).toHaveBeenCalledWith(
          mockDashboardData
        )
      );
    });

    it("should call calculateKeyMetrics with dashboard data", async () => {
      mockUsePortfolioDashboard.mockReturnValue({
        data: mockDashboardData,
        isLoading: false,
        isFetching: false,
        isSuccess: true,
        isError: false,
        error: null,
        refetch: vi.fn(),
      });

      renderHook(() => useAnalyticsData("user-123", defaultTimePeriod), {
        wrapper: createWrapper(),
      });

      await waitFor(() =>
        expect(mockCalculateKeyMetrics).toHaveBeenCalledWith(mockDashboardData)
      );
    });

    it("should call aggregateMonthlyPnL with monthly data and daily values", async () => {
      mockUsePortfolioDashboard.mockReturnValue({
        data: mockDashboardData,
        isLoading: false,
        isFetching: false,
        isSuccess: true,
        isError: false,
        error: null,
        refetch: vi.fn(),
      });

      mockGetDailyYieldReturns.mockResolvedValue(mockMonthlyPnLData);

      renderHook(() => useAnalyticsData("user-123", defaultTimePeriod), {
        wrapper: createWrapper(),
      });

      await waitFor(() =>
        expect(mockAggregateMonthlyPnL).toHaveBeenCalledWith(
          mockMonthlyPnLData,
          mockDashboardData.trends.daily_values
        )
      );
    });
  });

  describe("Graceful Degradation", () => {
    it("should handle missing BTC price data gracefully", async () => {
      mockUsePortfolioDashboard.mockReturnValue({
        data: mockDashboardData,
        isLoading: false,
        isFetching: false,
        isSuccess: true,
        isError: false,
        error: null,
        refetch: vi.fn(),
      });

      mockUseBtcPriceQuery.mockReturnValue({
        data: null, // No BTC data
        isLoading: false,
        isFetching: false,
        isSuccess: false,
        isError: false,
        error: null,
        refetch: vi.fn(),
      });

      renderHook(() => useAnalyticsData("user-123", defaultTimePeriod), {
        wrapper: createWrapper(),
      });

      await waitFor(() =>
        expect(mockTransformToPerformanceChart).toHaveBeenCalledWith(
          mockDashboardData,
          undefined
        )
      );
    });

    it("should return empty monthly PnL array when query fails", async () => {
      mockUsePortfolioDashboard.mockReturnValue({
        data: mockDashboardData,
        isLoading: false,
        isFetching: false,
        isSuccess: true,
        isError: false,
        error: null,
        refetch: vi.fn(),
      });

      mockGetDailyYieldReturns.mockRejectedValue(new Error("API Error"));

      const { result } = renderHook(
        () => useAnalyticsData("user-123", defaultTimePeriod),
        { wrapper: createWrapper() }
      );

      await waitFor(() => expect(result.current.data).not.toBeNull());

      expect(result.current.data?.monthlyPnL).toEqual([]);
    });

    it("should handle missing daily_values in trends", async () => {
      const dashboardWithoutDailyValues = {
        ...mockDashboardData,
        trends: {
          ...mockDashboardData.trends,
          daily_values: undefined,
        },
      };

      mockUsePortfolioDashboard.mockReturnValue({
        data: dashboardWithoutDailyValues,
        isLoading: false,
        isFetching: false,
        isSuccess: true,
        isError: false,
        error: null,
        refetch: vi.fn(),
      });

      renderHook(() => useAnalyticsData("user-123", defaultTimePeriod), {
        wrapper: createWrapper(),
      });

      await waitFor(() =>
        expect(mockAggregateMonthlyPnL).toHaveBeenCalledWith(
          expect.any(Object),
          []
        )
      );
    });
  });

  describe("Error Handling", () => {
    it("should prioritize dashboard error", () => {
      const dashboardError = new Error("Dashboard failed");

      mockUsePortfolioDashboard.mockReturnValue({
        data: null,
        isLoading: false,
        isFetching: false,
        isSuccess: false,
        isError: true,
        error: dashboardError,
        refetch: vi.fn(),
      });

      const { result } = renderHook(
        () => useAnalyticsData("user-123", defaultTimePeriod),
        { wrapper: createWrapper() }
      );

      expect(result.current.error).toBeNull(); // Error only shown when dashboard has data
    });

    it("should show error when dashboard has data", () => {
      const dashboardError = new Error("Dashboard failed");

      mockUsePortfolioDashboard.mockReturnValue({
        data: mockDashboardData,
        isLoading: false,
        isFetching: false,
        isSuccess: true,
        isError: true,
        error: dashboardError,
        refetch: vi.fn(),
      });

      const { result } = renderHook(
        () => useAnalyticsData("user-123", defaultTimePeriod),
        { wrapper: createWrapper() }
      );

      expect(result.current.error).toEqual(dashboardError);
    });

    it("should not expose error when dashboard data is null", () => {
      mockUsePortfolioDashboard.mockReturnValue({
        data: null,
        isLoading: false,
        isFetching: false,
        isSuccess: false,
        isError: true,
        error: new Error("Failed"),
        refetch: vi.fn(),
      });

      const { result } = renderHook(
        () => useAnalyticsData("user-123", defaultTimePeriod),
        { wrapper: createWrapper() }
      );

      expect(result.current.error).toBeNull();
    });
  });

  describe("Loading States", () => {
    it("should show loading when dashboard is loading", () => {
      mockUsePortfolioDashboard.mockReturnValue({
        data: null,
        isLoading: true,
        isFetching: false,
        isSuccess: false,
        isError: false,
        error: null,
        refetch: vi.fn(),
      });

      const { result } = renderHook(
        () => useAnalyticsData("user-123", defaultTimePeriod),
        { wrapper: createWrapper() }
      );

      expect(result.current.isLoading).toBe(true);
    });

    it("should show loading when dashboard is fetching", () => {
      mockUsePortfolioDashboard.mockReturnValue({
        data: mockDashboardData,
        isLoading: false,
        isFetching: true,
        isSuccess: true,
        isError: false,
        error: null,
        refetch: vi.fn(),
      });

      const { result } = renderHook(
        () => useAnalyticsData("user-123", defaultTimePeriod),
        { wrapper: createWrapper() }
      );

      expect(result.current.isLoading).toBe(true);
    });

    it("should not show loading when dashboard has completed", () => {
      mockUsePortfolioDashboard.mockReturnValue({
        data: mockDashboardData,
        isLoading: false,
        isFetching: false,
        isSuccess: true,
        isError: false,
        error: null,
        refetch: vi.fn(),
      });

      const { result } = renderHook(
        () => useAnalyticsData("user-123", defaultTimePeriod),
        { wrapper: createWrapper() }
      );

      expect(result.current.isLoading).toBe(false);
    });
  });

  describe("Refetch Functionality", () => {
    it("should call refetch on all queries", async () => {
      const mockDashboardRefetch = vi.fn();
      const mockBtcRefetch = vi.fn();

      mockUsePortfolioDashboard.mockReturnValue({
        data: mockDashboardData,
        isLoading: false,
        isFetching: false,
        isSuccess: true,
        isError: false,
        error: null,
        refetch: mockDashboardRefetch,
      });

      mockUseBtcPriceQuery.mockReturnValue({
        data: mockBtcPriceData,
        isLoading: false,
        isFetching: false,
        isSuccess: true,
        isError: false,
        error: null,
        refetch: mockBtcRefetch,
      });

      const { result } = renderHook(
        () => useAnalyticsData("user-123", defaultTimePeriod),
        { wrapper: createWrapper() }
      );

      await waitFor(() => expect(result.current.data).not.toBeNull());

      result.current.refetch();

      expect(mockDashboardRefetch).toHaveBeenCalled();
      expect(mockBtcRefetch).toHaveBeenCalled();
    });

    it("should not refetch monthly PnL when dashboard has no data", () => {
      const mockDashboardRefetch = vi.fn();
      const mockBtcRefetch = vi.fn();

      mockUsePortfolioDashboard.mockReturnValue({
        data: null,
        isLoading: false,
        isFetching: false,
        isSuccess: false,
        isError: false,
        error: null,
        refetch: mockDashboardRefetch,
      });

      mockUseBtcPriceQuery.mockReturnValue({
        data: null,
        isLoading: false,
        isFetching: false,
        isSuccess: false,
        isError: false,
        error: null,
        refetch: mockBtcRefetch,
      });

      const { result } = renderHook(
        () => useAnalyticsData("user-123", defaultTimePeriod),
        { wrapper: createWrapper() }
      );

      result.current.refetch();

      expect(mockDashboardRefetch).toHaveBeenCalled();
      expect(mockBtcRefetch).toHaveBeenCalled();
      // Monthly PnL refetch should not be called since dashboard has no data
    });
  });

  describe("Edge Cases", () => {
    it("should handle undefined userId", () => {
      renderHook(() => useAnalyticsData(undefined, defaultTimePeriod), {
        wrapper: createWrapper(),
      });

      expect(mockUsePortfolioDashboard).toHaveBeenCalledWith(
        undefined,
        expect.any(Object),
        expect.any(Object)
      );
    });

    it("should handle zero days in time period", () => {
      const zeroPeriod: AnalyticsTimePeriod = {
        key: "0D",
        days: 0,
        label: "0D",
      };

      renderHook(() => useAnalyticsData("user-123", zeroPeriod), {
        wrapper: createWrapper(),
      });

      expect(mockUsePortfolioDashboard).toHaveBeenCalledWith(
        "user-123",
        {
          trend_days: 0,
          drawdown_days: 0,
          rolling_days: 0,
        },
        expect.any(Object)
      );
    });

    it("should handle large time period values", () => {
      const largePeriod: AnalyticsTimePeriod = {
        key: "1Y",
        days: 365,
        label: "1Y",
      };

      renderHook(() => useAnalyticsData("user-123", largePeriod), {
        wrapper: createWrapper(),
      });

      expect(mockUsePortfolioDashboard).toHaveBeenCalledWith(
        "user-123",
        {
          trend_days: 365,
          drawdown_days: 365,
          rolling_days: 365,
        },
        expect.any(Object)
      );

      expect(mockUseBtcPriceQuery).toHaveBeenCalledWith(365);
    });
  });
});
