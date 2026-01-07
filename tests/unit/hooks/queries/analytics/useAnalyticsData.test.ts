// Mock react-query useQuery for the internal monthlyPnLQuery
// Since useAnalyticsData uses useQuery internally for monthlyPnL, we need to mock it.
// However, useQuery is imported from @tanstack/react-query.
// We can mock the module or relying on proper wrapper.
// But wait, usePortfolioDashboard and useBtcPriceQuery are custom hooks, so we mocked them easily.
// monthlyPnLQuery uses raw useQuery.
import { useQuery } from "@tanstack/react-query";
import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { usePortfolioDashboard } from "@/hooks/analytics/usePortfolioDashboard";
import { useAnalyticsData } from "@/hooks/queries/analytics/useAnalyticsData";
import { useBtcPriceQuery } from "@/hooks/queries/market/useBtcPriceQuery";
import * as AnalyticsTransformers from "@/lib/analytics/transformers";

// Mock dependencies
vi.mock("@/hooks/analytics/usePortfolioDashboard");
vi.mock("@/hooks/queries/market/useBtcPriceQuery");
vi.mock("@/services/analyticsService");
vi.mock("@/lib/analytics/transformers", async () => {
  return {
    aggregateMonthlyPnL: vi.fn(),
    calculateKeyMetrics: vi.fn(),
    transformToDrawdownChart: vi.fn(),
    transformToPerformanceChart: vi.fn(),
  };
});
vi.mock("@tanstack/react-query", async () => {
  const actual = await vi.importActual("@tanstack/react-query");
  return {
    ...actual,
    useQuery: vi.fn(),
  };
});

describe("useAnalyticsData", () => {
  const mockDashboardData = { trends: { daily_values: [1, 2] } };
  const mockBtcData = { snapshots: [] };
  const mockPnLData = [{ date: "2024-01", value: 100 }];

  const defaultDashboardQuery = {
    data: null,
    isLoading: false,
    error: null,
    refetch: vi.fn(),
    isFetching: false,
  };

  const defaultBtcQuery = {
    data: null,
    isLoading: false,
    error: null,
    refetch: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(usePortfolioDashboard).mockReturnValue(
      defaultDashboardQuery as any
    );
    vi.mocked(useBtcPriceQuery).mockReturnValue(defaultBtcQuery as any);
    // Default mock for useQuery (monthlyPnL)
    vi.mocked(useQuery).mockReturnValue({
      data: null,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
      isFetching: false,
    } as any);

    vi.mocked(
      AnalyticsTransformers.transformToPerformanceChart
    ).mockReturnValue({} as any);
    vi.mocked(AnalyticsTransformers.transformToDrawdownChart).mockReturnValue(
      [] as any
    );
    vi.mocked(AnalyticsTransformers.calculateKeyMetrics).mockReturnValue(
      {} as any
    );
    vi.mocked(AnalyticsTransformers.aggregateMonthlyPnL).mockReturnValue(
      [] as any
    );
  });

  it("should return loading state when dashboard is loading", () => {
    vi.mocked(usePortfolioDashboard).mockReturnValue({
      ...defaultDashboardQuery,
      isLoading: true,
    } as any);

    const { result } = renderHook(() =>
      useAnalyticsData("user1", { key: "1M", days: 30, label: "1M" })
    );

    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toBeNull();
  });

  it("should transform data when dashboard loads", () => {
    vi.mocked(usePortfolioDashboard).mockReturnValue({
      ...defaultDashboardQuery,
      data: mockDashboardData,
    } as any);

    vi.mocked(useBtcPriceQuery).mockReturnValue({
      ...defaultBtcQuery,
      data: mockBtcData,
    } as any);

    // Mock monthly PnL query success
    vi.mocked(useQuery).mockReturnValue({
      data: mockPnLData,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
      isFetching: false,
    } as any);

    const { result } = renderHook(() =>
      useAnalyticsData("user1", { key: "1M", days: 30, label: "1M" })
    );

    expect(result.current.data).not.toBeNull();
    expect(
      AnalyticsTransformers.transformToPerformanceChart
    ).toHaveBeenCalled();
    expect(AnalyticsTransformers.transformToDrawdownChart).toHaveBeenCalled();
    expect(AnalyticsTransformers.calculateKeyMetrics).toHaveBeenCalled();
    expect(AnalyticsTransformers.aggregateMonthlyPnL).toHaveBeenCalledWith(
      mockPnLData,
      mockDashboardData.trends.daily_values
    );
  });

  it("should handle error states", () => {
    const error = new Error("Dashboard failed");
    vi.mocked(usePortfolioDashboard).mockReturnValue({
      ...defaultDashboardQuery,
      error,
      data: { trends: {} }, // Data might be partial or null, but error takes precedence in hook return if we structured it that way?
      // Actually implementation says: `error: dashboardQuery.data ? error : null`
      // Wait, if NO data, data is null.
      // implementation: `if (!dashboardQuery.data) return null` (inside useMemo)
      // `const error = dashboardQuery.error ?? ...`
      // `return { error: dashboardQuery.data ? error : null }`
      // So if dashboard fails completely (no data), error is null? That seems weird in the implementation, but let's check logic.
      // If data is null, the hook returns `data: null`, `error: null`.
      // Wait, look at code: `error: dashboardQuery.data ? error : null`.
      // So if `dashboardQuery.data` is missing, error is null.
      // This implies the UI handles "no data + no loading" as... empty? or maybe the hook expects data to be present if error is present?
      // Actually, usually `useQuery` returns `data` as `undefined` on error unless `placeholderData` is used.

      // Let's test the current implementation behavior.
    } as any);

    // Case 1: No data, has error.
    {
      vi.mocked(usePortfolioDashboard).mockReturnValue({
        ...defaultDashboardQuery,
        data: null,
        error,
      } as any);
      const { result } = renderHook(() =>
        useAnalyticsData("user1", { key: "1M", days: 30, label: "1M" })
      );
      // Based on code: `error: dashboardQuery.data ? error : null` -> error should be null if data is null.
      expect(result.current.error).toBeNull();
    }

    // Case 2: Has data (cached?), has new error.
    {
      vi.mocked(usePortfolioDashboard).mockReturnValue({
        ...defaultDashboardQuery,
        data: mockDashboardData,
        error,
      } as any);
      const { result } = renderHook(() =>
        useAnalyticsData("user1", { key: "1M", days: 30, label: "1M" })
      );
      expect(result.current.error).toBe(error);
    }
  });

  it("should refetch all queries", () => {
    const mockRefetchDashboard = vi.fn();
    const mockRefetchBtc = vi.fn();
    const mockRefetchPnL = vi.fn();

    vi.mocked(usePortfolioDashboard).mockReturnValue({
      ...defaultDashboardQuery,
      refetch: mockRefetchDashboard,
      data: mockDashboardData, // Needs data to refetch PnL
    } as any);
    vi.mocked(useBtcPriceQuery).mockReturnValue({
      ...defaultBtcQuery,
      refetch: mockRefetchBtc,
    } as any);
    vi.mocked(useQuery).mockReturnValue({
      data: null,
      isLoading: false,
      refetch: mockRefetchPnL,
    } as any);

    const { result } = renderHook(() =>
      useAnalyticsData("user1", { key: "1M", days: 30, label: "1M" })
    );

    result.current.refetch();

    expect(mockRefetchDashboard).toHaveBeenCalled();
    expect(mockRefetchBtc).toHaveBeenCalled();
    expect(mockRefetchPnL).toHaveBeenCalled();
  });
});
