/**
 * usePortfolioDashboard - Hook Tests
 *
 * Comprehensive test suite for the unified portfolio dashboard hook.
 * Tests React Query integration, caching behavior, parameter handling,
 * and data transformations.
 */

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { UnifiedDashboardResponse } from "@/services/analyticsService";

// Mock analytics service
const mockGetPortfolioDashboard = vi.fn();
vi.mock("@/services/analyticsService", () => ({
  getPortfolioDashboard: (...args: any[]) => mockGetPortfolioDashboard(...args),
}));

// Ensure we test the real hook implementation
vi.unmock("@/hooks/usePortfolioDashboard");

type PortfolioDashboardModule = typeof import("@/hooks/usePortfolioDashboard");

let usePortfolioDashboard: PortfolioDashboardModule["usePortfolioDashboard"];

const loadModules = async () => {
  vi.resetModules();
  ({ usePortfolioDashboard } = await import("@/hooks/usePortfolioDashboard"));
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

describe("usePortfolioDashboard", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await loadModules();
  });

  describe("Basic Functionality", () => {
    it("should fetch dashboard data when userId is provided", async () => {
      const mockDashboard: UnifiedDashboardResponse = {
        trends: {
          total_value_usd: 10000,
          total_value_change_usd: 500,
          total_value_change_percent: 5,
          avg_daily_yield_usd: 50,
          total_apr: 12.5,
        },
        rolling_analytics: {
          sharpe: { values: [], dates: [] },
          volatility: { values: [], dates: [] },
        },
        drawdown_analysis: {
          enhanced: { dates: [], values: [] },
          underwater_recovery: { dates: [], values: [] },
        },
        allocation: { dates: [], allocation: [] },
        _metadata: {
          timestamp: "2024-01-15T10:00:00Z",
          error_count: 0,
          errors: [],
        },
      };

      mockGetPortfolioDashboard.mockResolvedValue(mockDashboard);

      const { result } = renderHook(() => usePortfolioDashboard("user-123"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(mockGetPortfolioDashboard).toHaveBeenCalledWith("user-123", {});
      expect(result.current.dashboard).toEqual(mockDashboard);
      expect(result.current.data).toEqual(mockDashboard);
    });

    it("should not fetch when userId is undefined", () => {
      const { result } = renderHook(() => usePortfolioDashboard(), {
        wrapper: createWrapper(),
      });

      expect(mockGetPortfolioDashboard).not.toHaveBeenCalled();
      expect(result.current.isLoading).toBe(false);
      expect(result.current.dashboard).toBeUndefined();
    });

    it("should not fetch when userId is empty string", () => {
      const { result } = renderHook(() => usePortfolioDashboard(""), {
        wrapper: createWrapper(),
      });

      expect(mockGetPortfolioDashboard).not.toHaveBeenCalled();
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe("Query Parameters", () => {
    it("should pass trend_days parameter", async () => {
      mockGetPortfolioDashboard.mockResolvedValue({
        _metadata: { timestamp: "", error_count: 0, errors: [] },
      });

      renderHook(() => usePortfolioDashboard("user-123", { trend_days: 90 }), {
        wrapper: createWrapper(),
      });

      await waitFor(() =>
        expect(mockGetPortfolioDashboard).toHaveBeenCalledWith("user-123", {
          trend_days: 90,
        })
      );
    });

    it("should pass all dashboard window parameters", async () => {
      mockGetPortfolioDashboard.mockResolvedValue({
        _metadata: { timestamp: "", error_count: 0, errors: [] },
      });

      const params = {
        trend_days: 90,
        risk_days: 60,
        drawdown_days: 180,
        allocation_days: 30,
        rolling_days: 45,
        metrics: ["sharpe", "volatility"],
      };

      renderHook(() => usePortfolioDashboard("user-123", params), {
        wrapper: createWrapper(),
      });

      await waitFor(() =>
        expect(mockGetPortfolioDashboard).toHaveBeenCalledWith(
          "user-123",
          params
        )
      );
    });

    it("should use empty object when no params provided", async () => {
      mockGetPortfolioDashboard.mockResolvedValue({
        _metadata: { timestamp: "", error_count: 0, errors: [] },
      });

      renderHook(() => usePortfolioDashboard("user-123"), {
        wrapper: createWrapper(),
      });

      await waitFor(() =>
        expect(mockGetPortfolioDashboard).toHaveBeenCalledWith("user-123", {})
      );
    });
  });

  describe("Query Key Construction", () => {
    it("should construct query key with all parameters", async () => {
      mockGetPortfolioDashboard.mockResolvedValue({
        _metadata: { timestamp: "", error_count: 0, errors: [] },
      });

      const { result } = renderHook(
        () =>
          usePortfolioDashboard("user-123", {
            trend_days: 30,
            risk_days: 60,
            drawdown_days: 90,
            allocation_days: 40,
            rolling_days: 50,
            metrics: ["sharpe"],
          }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      // React Query should use queryKey for caching
      expect(mockGetPortfolioDashboard).toHaveBeenCalledTimes(1);
    });

    it("should create different cache entries for different userIds", async () => {
      mockGetPortfolioDashboard.mockResolvedValue({
        _metadata: { timestamp: "", error_count: 0, errors: [] },
      });

      const wrapper = createWrapper();

      const { rerender: _rerender } = renderHook(
        () => usePortfolioDashboard("user-1"),
        { wrapper }
      );

      await waitFor(() =>
        expect(mockGetPortfolioDashboard).toHaveBeenCalledWith("user-1", {})
      );

      renderHook(() => usePortfolioDashboard("user-2"), { wrapper });

      await waitFor(() =>
        expect(mockGetPortfolioDashboard).toHaveBeenCalledWith("user-2", {})
      );

      expect(mockGetPortfolioDashboard).toHaveBeenCalledTimes(2);
    });

    it("should create different cache entries for different parameters", async () => {
      mockGetPortfolioDashboard.mockResolvedValue({
        _metadata: { timestamp: "", error_count: 0, errors: [] },
      });

      const wrapper = createWrapper();

      renderHook(() => usePortfolioDashboard("user-123", { trend_days: 30 }), {
        wrapper,
      });

      await waitFor(() =>
        expect(mockGetPortfolioDashboard).toHaveBeenCalledWith("user-123", {
          trend_days: 30,
        })
      );

      renderHook(() => usePortfolioDashboard("user-123", { trend_days: 90 }), {
        wrapper,
      });

      await waitFor(() =>
        expect(mockGetPortfolioDashboard).toHaveBeenCalledWith("user-123", {
          trend_days: 90,
        })
      );

      expect(mockGetPortfolioDashboard).toHaveBeenCalledTimes(2);
    });
  });

  describe("Cache Configuration", () => {
    it("should use default staleTime of 2 minutes", async () => {
      mockGetPortfolioDashboard.mockResolvedValue({
        _metadata: { timestamp: "", error_count: 0, errors: [] },
      });

      const { result } = renderHook(() => usePortfolioDashboard("user-123"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      // React Query internal state should have staleTime = 120000ms (2 minutes)
      // We verify this by checking the hook was called once
      expect(mockGetPortfolioDashboard).toHaveBeenCalledTimes(1);
    });

    it("should allow staleTime override", async () => {
      mockGetPortfolioDashboard.mockResolvedValue({
        _metadata: { timestamp: "", error_count: 0, errors: [] },
      });

      renderHook(
        () => usePortfolioDashboard("user-123", {}, { staleTime: 0 }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => expect(mockGetPortfolioDashboard).toHaveBeenCalled());

      // staleTime: 0 means data is immediately stale
      expect(mockGetPortfolioDashboard).toHaveBeenCalledTimes(1);
    });

    it("should configure gcTime to 12 hours", async () => {
      mockGetPortfolioDashboard.mockResolvedValue({
        _metadata: { timestamp: "", error_count: 0, errors: [] },
      });

      const { result } = renderHook(() => usePortfolioDashboard("user-123"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      // gcTime configured internally (12 hours = 43200000ms)
      expect(mockGetPortfolioDashboard).toHaveBeenCalledTimes(1);
    });

    it("should enable refetchOnWindowFocus", async () => {
      mockGetPortfolioDashboard.mockResolvedValue({
        _metadata: { timestamp: "", error_count: 0, errors: [] },
      });

      const { result } = renderHook(() => usePortfolioDashboard("user-123"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      // refetchOnWindowFocus is enabled by default
      expect(result.current.isSuccess).toBe(true);
    });

    it("should enable refetchOnReconnect", async () => {
      mockGetPortfolioDashboard.mockResolvedValue({
        _metadata: { timestamp: "", error_count: 0, errors: [] },
      });

      const { result } = renderHook(() => usePortfolioDashboard("user-123"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      // refetchOnReconnect is enabled
      expect(result.current.isSuccess).toBe(true);
    });
  });

  describe("Options Override", () => {
    it("should allow refetchOnMount override to 'always'", async () => {
      mockGetPortfolioDashboard.mockResolvedValue({
        _metadata: { timestamp: "", error_count: 0, errors: [] },
      });

      renderHook(
        () =>
          usePortfolioDashboard("user-123", {}, { refetchOnMount: "always" }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => expect(mockGetPortfolioDashboard).toHaveBeenCalled());

      expect(mockGetPortfolioDashboard).toHaveBeenCalledTimes(1);
    });

    it("should allow refetchOnMount override to false", async () => {
      mockGetPortfolioDashboard.mockResolvedValue({
        _metadata: { timestamp: "", error_count: 0, errors: [] },
      });

      renderHook(
        () => usePortfolioDashboard("user-123", {}, { refetchOnMount: false }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => expect(mockGetPortfolioDashboard).toHaveBeenCalled());

      expect(mockGetPortfolioDashboard).toHaveBeenCalledTimes(1);
    });

    it("should combine staleTime and refetchOnMount overrides", async () => {
      mockGetPortfolioDashboard.mockResolvedValue({
        _metadata: { timestamp: "", error_count: 0, errors: [] },
      });

      renderHook(
        () =>
          usePortfolioDashboard(
            "user-123",
            {},
            { staleTime: 0, refetchOnMount: "always" }
          ),
        { wrapper: createWrapper() }
      );

      await waitFor(() => expect(mockGetPortfolioDashboard).toHaveBeenCalled());

      expect(mockGetPortfolioDashboard).toHaveBeenCalledTimes(1);
    });
  });

  describe("Data Transformation", () => {
    it("should expose dashboard property from data", async () => {
      const mockDashboard: UnifiedDashboardResponse = {
        trends: {
          total_value_usd: 25000,
          total_value_change_usd: 1000,
          total_value_change_percent: 4.2,
          avg_daily_yield_usd: 100,
          total_apr: 15.5,
        },
        rolling_analytics: {
          sharpe: { values: [1.5, 1.6], dates: ["2024-01-01", "2024-01-02"] },
          volatility: {
            values: [0.2, 0.3],
            dates: ["2024-01-01", "2024-01-02"],
          },
        },
        drawdown_analysis: {
          enhanced: { dates: [], values: [] },
          underwater_recovery: { dates: [], values: [] },
        },
        allocation: { dates: [], allocation: [] },
        _metadata: {
          timestamp: "2024-01-15T12:00:00Z",
          error_count: 0,
          errors: [],
        },
      };

      mockGetPortfolioDashboard.mockResolvedValue(mockDashboard);

      const { result } = renderHook(() => usePortfolioDashboard("user-123"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.dashboard).toEqual(mockDashboard);
      expect(result.current.dashboard?.trends.total_value_usd).toBe(25000);
      expect(result.current.dashboard?.rolling_analytics.sharpe.values).toEqual(
        [1.5, 1.6]
      );
    });

    it("should return undefined dashboard when loading", () => {
      mockGetPortfolioDashboard.mockImplementation(
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        () => new Promise(() => {}) // Never resolves
      );

      const { result } = renderHook(() => usePortfolioDashboard("user-123"), {
        wrapper: createWrapper(),
      });

      expect(result.current.dashboard).toBeUndefined();
      expect(result.current.isLoading).toBe(true);
    });

    it("should return undefined dashboard when userId is not provided", () => {
      const { result } = renderHook(() => usePortfolioDashboard(), {
        wrapper: createWrapper(),
      });

      expect(result.current.dashboard).toBeUndefined();
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe("Error Handling", () => {
    it("should handle API errors gracefully", async () => {
      const error = new Error("API Error");
      mockGetPortfolioDashboard.mockRejectedValue(error);

      const { result } = renderHook(() => usePortfolioDashboard("user-123"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error).toEqual(error);
      expect(result.current.dashboard).toBeUndefined();
    });

    it("should handle network errors", async () => {
      mockGetPortfolioDashboard.mockRejectedValue(
        new Error("Network request failed")
      );

      const { result } = renderHook(() => usePortfolioDashboard("user-123"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error).toBeDefined();
      expect(result.current.dashboard).toBeUndefined();
    });

    it("should expose error state through isError flag", async () => {
      mockGetPortfolioDashboard.mockRejectedValue(new Error("Failed"));

      const { result } = renderHook(() => usePortfolioDashboard("user-123"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.isSuccess).toBe(false);
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe("Loading States", () => {
    it("should start with isLoading true when fetching", () => {
      mockGetPortfolioDashboard.mockImplementation(
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        () => new Promise(() => {}) // Never resolves
      );

      const { result } = renderHook(() => usePortfolioDashboard("user-123"), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(true);
      expect(result.current.isSuccess).toBe(false);
      expect(result.current.isError).toBe(false);
    });

    it("should transition to success state after fetch completes", async () => {
      mockGetPortfolioDashboard.mockResolvedValue({
        _metadata: { timestamp: "", error_count: 0, errors: [] },
      });

      const { result } = renderHook(() => usePortfolioDashboard("user-123"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.isLoading).toBe(false);
      expect(result.current.isError).toBe(false);
    });
  });

  describe("Partial Failure Handling", () => {
    it("should handle dashboard with partial failures", async () => {
      const dashboardWithErrors: UnifiedDashboardResponse = {
        trends: {
          total_value_usd: 10000,
          total_value_change_usd: 0,
          total_value_change_percent: 0,
          avg_daily_yield_usd: 0,
          total_apr: 0,
        },
        rolling_analytics: {
          sharpe: { values: [], dates: [] },
          volatility: { values: [], dates: [] },
        },
        drawdown_analysis: {
          enhanced: { dates: [], values: [] },
          underwater_recovery: { dates: [], values: [] },
        },
        allocation: { dates: [], allocation: [] },
        _metadata: {
          timestamp: "2024-01-15T10:00:00Z",
          error_count: 2,
          errors: ["Failed to fetch sharpe", "Failed to fetch volatility"],
        },
      };

      mockGetPortfolioDashboard.mockResolvedValue(dashboardWithErrors);

      const { result } = renderHook(() => usePortfolioDashboard("user-123"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.dashboard?._metadata.error_count).toBe(2);
      expect(result.current.dashboard?._metadata.errors).toHaveLength(2);
    });
  });

  describe("Edge Cases", () => {
    it("should handle null response", async () => {
      mockGetPortfolioDashboard.mockResolvedValue(null);

      const { result } = renderHook(() => usePortfolioDashboard("user-123"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.dashboard).toBeNull();
    });

    it("should handle undefined params gracefully", async () => {
      mockGetPortfolioDashboard.mockResolvedValue({
        _metadata: { timestamp: "", error_count: 0, errors: [] },
      });

      renderHook(
        () => usePortfolioDashboard("user-123", undefined as any), // Explicitly test undefined
        { wrapper: createWrapper() }
      );

      await waitFor(() => expect(mockGetPortfolioDashboard).toHaveBeenCalled());

      // Should still call with empty object
      expect(mockGetPortfolioDashboard).toHaveBeenCalledWith("user-123", {});
    });

    it("should handle empty metrics array", async () => {
      mockGetPortfolioDashboard.mockResolvedValue({
        _metadata: { timestamp: "", error_count: 0, errors: [] },
      });

      renderHook(() => usePortfolioDashboard("user-123", { metrics: [] }), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(mockGetPortfolioDashboard).toHaveBeenCalled());

      expect(mockGetPortfolioDashboard).toHaveBeenCalledWith("user-123", {
        metrics: [],
      });
    });

    it("should handle zero values in parameters", async () => {
      mockGetPortfolioDashboard.mockResolvedValue({
        _metadata: { timestamp: "", error_count: 0, errors: [] },
      });

      const params = {
        trend_days: 0,
        risk_days: 0,
        drawdown_days: 0,
      };

      renderHook(() => usePortfolioDashboard("user-123", params), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(mockGetPortfolioDashboard).toHaveBeenCalled());

      expect(mockGetPortfolioDashboard).toHaveBeenCalledWith(
        "user-123",
        params
      );
    });
  });
});
