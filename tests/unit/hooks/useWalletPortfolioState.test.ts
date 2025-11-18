import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react";
import { createElement, type ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import * as UserContext from "@/contexts/UserContext";
import * as usePortfolioQuery from "@/hooks/queries/usePortfolioQuery";
import * as usePortfolioState from "@/hooks/usePortfolioState";
import { useWalletPortfolioState } from "@/hooks/useWalletPortfolioState";
import * as useWalletPortfolioTransform from "@/hooks/useWalletPortfolioTransform";

// Mock dependencies
vi.mock("@/contexts/UserContext");
vi.mock("@/hooks/queries/usePortfolioQuery");
vi.mock("@/hooks/usePortfolioState");
vi.mock("@/hooks/useWalletPortfolioTransform");

// Test data
const mockLandingPageData = {
  total_assets_usd: 10000,
  total_debt_usd: 2000,
  total_net_usd: 8000,
  weighted_apr: 0.05,
  estimated_monthly_income: 400,
  portfolio_roi: {
    recommended_roi: 0.08,
    recommended_yearly_roi: 0.096,
    estimated_yearly_pnl_usd: 768,
    windows: {
      "7d": { value: 0.02, data_points: 7 },
      "30d": { value: 0.05, data_points: 30 },
    },
  },
  portfolio_allocation: {
    btc: 0.3,
    eth: 0.4,
    stablecoins: 0.2,
    others: 0.1,
  },
  pool_details: [],
};

const mockYieldSummaryData = {
  user_id: "test-user-123",
  windows: {
    "7d": {
      period: {
        start_date: "2025-01-09",
        end_date: "2025-01-16",
        days: 7,
      },
      average_daily_yield_usd: 13.33,
      median_daily_yield_usd: 12.5,
      total_yield_usd: 93.33,
      statistics: {
        outliers_removed: 0,
        filtered_days: 7,
      },
      protocol_breakdown: [],
    },
  },
};

const mockTransformData = {
  pieChartData: [
    { id: "btc", label: "Bitcoin", value: 3000, percentage: 30 },
    { id: "eth", label: "Ethereum", value: 4000, percentage: 40 },
    { id: "stablecoins", label: "Stablecoins", value: 2000, percentage: 20 },
    { id: "others", label: "Others", value: 1000, percentage: 10 },
  ],
  categorySummaries: [],
  debtCategorySummaries: [],
  portfolioMetrics: {
    totalAssets: 10000,
    totalDebt: 2000,
    netWorth: 8000,
  },
  hasZeroData: false,
};

const mockPortfolioState = {
  isLoading: false,
  isRetrying: false,
  error: null,
  isEmpty: false,
  showEmptyState: false,
  showConnectPrompt: false,
};

// Helper to create wrapper with QueryClient
function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  const Wrapper = ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children);

  Wrapper.displayName = "WalletPortfolioStateTestWrapper";

  return Wrapper;
}

describe("useWalletPortfolioState", () => {
  beforeEach(() => {
    // Reset all mocks before each test
    vi.clearAllMocks();

    // Setup default mock implementations
    vi.mocked(UserContext.useUser).mockReturnValue({
      userInfo: { userId: "test-user-123", walletAddress: "0x123" },
      isConnected: true,
      connectWallet: vi.fn(),
      disconnectWallet: vi.fn(),
      error: null,
      isLoading: false,
    });

    vi.mocked(usePortfolioQuery.useLandingPageData).mockReturnValue({
      data: mockLandingPageData,
      isLoading: false,
      isRefetching: false,
      error: null,
      refetch: vi.fn().mockResolvedValue({ data: mockLandingPageData }),
    } as any);

    vi.mocked(usePortfolioQuery.useYieldSummaryData).mockReturnValue({
      data: mockYieldSummaryData,
      isLoading: false,
      isRefetching: false,
      error: null,
      refetch: vi.fn(),
    } as any);

    vi.mocked(
      useWalletPortfolioTransform.useWalletPortfolioTransform
    ).mockReturnValue(mockTransformData);

    vi.mocked(usePortfolioState.usePortfolioState).mockReturnValue(
      mockPortfolioState
    );
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("User Identity Resolution", () => {
    it("should resolve userId from connected user when no urlUserId provided", () => {
      const { result } = renderHook(() => useWalletPortfolioState(), {
        wrapper: createWrapper(),
      });

      expect(result.current.resolvedUserId).toBe("test-user-123");
      expect(result.current.isVisitorMode).toBe(false);
    });

    it("should use urlUserId when provided", () => {
      const { result } = renderHook(
        () => useWalletPortfolioState({ urlUserId: "other-user-456" }),
        { wrapper: createWrapper() }
      );

      expect(result.current.resolvedUserId).toBe("other-user-456");
    });

    it("should return null userId when not connected and no urlUserId", () => {
      vi.mocked(UserContext.useUser).mockReturnValue({
        userInfo: null,
        isConnected: false,
        connectWallet: vi.fn(),
        disconnectWallet: vi.fn(),
        error: null,
        isLoading: false,
      });

      const { result } = renderHook(() => useWalletPortfolioState(), {
        wrapper: createWrapper(),
      });

      expect(result.current.resolvedUserId).toBe(null);
    });
  });

  describe("Visitor Mode Detection", () => {
    it("should be visitor mode when not connected", () => {
      vi.mocked(UserContext.useUser).mockReturnValue({
        userInfo: null,
        isConnected: false,
        connectWallet: vi.fn(),
        disconnectWallet: vi.fn(),
        error: null,
        isLoading: false,
      });

      const { result } = renderHook(
        () => useWalletPortfolioState({ urlUserId: "other-user" }),
        { wrapper: createWrapper() }
      );

      expect(result.current.isVisitorMode).toBe(true);
    });

    it("should be visitor mode when viewing different user's portfolio", () => {
      const { result } = renderHook(
        () => useWalletPortfolioState({ urlUserId: "other-user-456" }),
        { wrapper: createWrapper() }
      );

      expect(result.current.isVisitorMode).toBe(true);
    });

    it("should NOT be visitor mode when viewing own portfolio via URL", () => {
      const { result } = renderHook(
        () => useWalletPortfolioState({ urlUserId: "test-user-123" }),
        { wrapper: createWrapper() }
      );

      expect(result.current.isVisitorMode).toBe(false);
    });

    it("should NOT be visitor mode when connected and no urlUserId", () => {
      const { result } = renderHook(() => useWalletPortfolioState(), {
        wrapper: createWrapper(),
      });

      expect(result.current.isVisitorMode).toBe(false);
    });
  });

  describe("Data Loading - Progressive Loading", () => {
    it("should load landing page data and yield data in parallel", () => {
      const { result } = renderHook(() => useWalletPortfolioState(), {
        wrapper: createWrapper(),
      });

      // Both queries should be called with the same userId
      expect(usePortfolioQuery.useLandingPageData).toHaveBeenCalledWith(
        "test-user-123"
      );
      expect(usePortfolioQuery.useYieldSummaryData).toHaveBeenCalledWith(
        "test-user-123"
      );

      // Data should be available
      expect(result.current.landingPageData).toEqual(mockLandingPageData);
      expect(result.current.yieldSummaryData).toEqual(mockYieldSummaryData);
    });

    it("should expose separate loading states for landing and yield data", () => {
      vi.mocked(usePortfolioQuery.useLandingPageData).mockReturnValue({
        data: undefined,
        isLoading: true,
        isRefetching: false,
        error: null,
        refetch: vi.fn(),
      } as any);

      vi.mocked(usePortfolioQuery.useYieldSummaryData).mockReturnValue({
        data: undefined,
        isLoading: true,
        isRefetching: false,
        error: null,
        refetch: vi.fn(),
      } as any);

      const { result } = renderHook(() => useWalletPortfolioState(), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLandingLoading).toBe(true);
      expect(result.current.isYieldLoading).toBe(true);
    });

    it("should handle landing page loaded while yield still loading", () => {
      vi.mocked(usePortfolioQuery.useLandingPageData).mockReturnValue({
        data: mockLandingPageData,
        isLoading: false, // Loaded
        isRefetching: false,
        error: null,
        refetch: vi.fn(),
      } as any);

      vi.mocked(usePortfolioQuery.useYieldSummaryData).mockReturnValue({
        data: undefined,
        isLoading: true, // Still loading
        isRefetching: false,
        error: null,
        refetch: vi.fn(),
      } as any);

      const { result } = renderHook(() => useWalletPortfolioState(), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLandingLoading).toBe(false);
      expect(result.current.isYieldLoading).toBe(true);
      expect(result.current.landingPageData).toEqual(mockLandingPageData);
      expect(result.current.yieldSummaryData).toBeUndefined();
    });
  });

  describe("Data Transformation", () => {
    it("should transform landing page data into chart and metrics", () => {
      const { result } = renderHook(() => useWalletPortfolioState(), {
        wrapper: createWrapper(),
      });

      expect(
        useWalletPortfolioTransform.useWalletPortfolioTransform
      ).toHaveBeenCalledWith(mockLandingPageData);

      expect(result.current.pieChartData).toEqual(
        mockTransformData.pieChartData
      );
      expect(result.current.categorySummaries).toEqual(
        mockTransformData.categorySummaries
      );
      expect(result.current.portfolioMetrics).toEqual(
        mockTransformData.portfolioMetrics
      );
    });

    it("should handle undefined landing page data", () => {
      vi.mocked(usePortfolioQuery.useLandingPageData).mockReturnValue({
        data: undefined,
        isLoading: true,
        isRefetching: false,
        error: null,
        refetch: vi.fn(),
      } as any);

      renderHook(() => useWalletPortfolioState(), {
        wrapper: createWrapper(),
      });

      expect(
        useWalletPortfolioTransform.useWalletPortfolioTransform
      ).toHaveBeenCalledWith(undefined);
    });
  });

  describe("Action Gating in Visitor Mode", () => {
    it("should gate action handlers when in visitor mode", () => {
      const onOptimize = vi.fn();
      const onZapIn = vi.fn();
      const onZapOut = vi.fn();

      const { result } = renderHook(
        () =>
          useWalletPortfolioState({
            urlUserId: "other-user-456", // Different user = visitor mode
            onOptimizeClick: onOptimize,
            onZapInClick: onZapIn,
            onZapOutClick: onZapOut,
          }),
        { wrapper: createWrapper() }
      );

      expect(result.current.isVisitorMode).toBe(true);
      expect(result.current.onOptimizeClick).toBeUndefined();
      expect(result.current.onZapInClick).toBeUndefined();
      expect(result.current.onZapOutClick).toBeUndefined();
    });

    it("should expose action handlers when NOT in visitor mode", () => {
      const onOptimize = vi.fn();
      const onZapIn = vi.fn();
      const onZapOut = vi.fn();

      const { result } = renderHook(
        () =>
          useWalletPortfolioState({
            onOptimizeClick: onOptimize,
            onZapInClick: onZapIn,
            onZapOutClick: onZapOut,
          }),
        { wrapper: createWrapper() }
      );

      expect(result.current.isVisitorMode).toBe(false);
      expect(result.current.onOptimizeClick).toBe(onOptimize);
      expect(result.current.onZapInClick).toBe(onZapIn);
      expect(result.current.onZapOutClick).toBe(onZapOut);
    });

    it("should NOT gate category click handler (available in visitor mode)", () => {
      const onCategoryClick = vi.fn();

      const { result } = renderHook(
        () =>
          useWalletPortfolioState({
            urlUserId: "other-user-456", // Visitor mode
            onCategoryClick,
          }),
        { wrapper: createWrapper() }
      );

      expect(result.current.isVisitorMode).toBe(true);
      expect(result.current.onCategoryClick).toBe(onCategoryClick);
    });
  });

  describe("View Toggles", () => {
    it("should toggle balance visibility", () => {
      const { result } = renderHook(() => useWalletPortfolioState(), {
        wrapper: createWrapper(),
      });

      expect(result.current.balanceHidden).toBe(false);

      // Toggle balance
      act(() => {
        result.current.toggleBalanceVisibility();
      });

      expect(result.current.balanceHidden).toBe(true);
    });

    it("should call onToggleBalance callback when toggling", () => {
      const onToggleBalance = vi.fn();

      const { result } = renderHook(
        () => useWalletPortfolioState({ onToggleBalance }),
        { wrapper: createWrapper() }
      );

      act(() => {
        result.current.toggleBalanceVisibility();
      });

      expect(onToggleBalance).toHaveBeenCalledTimes(1);
    });

    it("should toggle category expansion", () => {
      const { result } = renderHook(() => useWalletPortfolioState(), {
        wrapper: createWrapper(),
      });

      expect(result.current.expandedCategory).toBe(null);

      // Expand category
      act(() => {
        result.current.toggleCategoryExpansion("btc");
      });
      expect(result.current.expandedCategory).toBe("btc");

      // Collapse same category
      act(() => {
        result.current.toggleCategoryExpansion("btc");
      });
      expect(result.current.expandedCategory).toBe(null);

      // Expand different category
      act(() => {
        result.current.toggleCategoryExpansion("eth");
      });
      expect(result.current.expandedCategory).toBe("eth");
    });

    it("should call onCategoryClick callback when toggling", () => {
      const onCategoryClick = vi.fn();

      const { result } = renderHook(
        () => useWalletPortfolioState({ onCategoryClick }),
        { wrapper: createWrapper() }
      );

      act(() => {
        result.current.toggleCategoryExpansion("btc");
      });

      expect(onCategoryClick).toHaveBeenCalledWith("btc");
    });
  });

  describe("Wallet Manager Modal", () => {
    it("should manage wallet manager open/close state", () => {
      const { result } = renderHook(() => useWalletPortfolioState(), {
        wrapper: createWrapper(),
      });

      expect(result.current.isWalletManagerOpen).toBe(false);

      // Open modal
      act(() => {
        result.current.openWalletManager();
      });
      expect(result.current.isWalletManagerOpen).toBe(true);

      // Close modal
      act(() => {
        result.current.closeWalletManager();
      });
      expect(result.current.isWalletManagerOpen).toBe(false);
    });
  });

  describe("Bundle Context Pass-Through", () => {
    it("should pass through bundle context when provided", () => {
      const { result } = renderHook(
        () =>
          useWalletPortfolioState({
            isOwnBundle: true,
            bundleUserName: "JohnDoe",
            bundleUrl: "https://app.zappilot.com/bundle?userId=test-user-123",
          }),
        { wrapper: createWrapper() }
      );

      expect(result.current.isOwnBundle).toBe(true);
      expect(result.current.bundleUserName).toBe("JohnDoe");
      expect(result.current.bundleUrl).toBe(
        "https://app.zappilot.com/bundle?userId=test-user-123"
      );
    });

    it("should omit bundle context when not provided", () => {
      const { result } = renderHook(() => useWalletPortfolioState(), {
        wrapper: createWrapper(),
      });

      expect(result.current.isOwnBundle).toBeUndefined();
      expect(result.current.bundleUserName).toBeUndefined();
      expect(result.current.bundleUrl).toBeUndefined();
    });
  });

  describe("Retry Functionality", () => {
    it("should expose refetch function for retry", async () => {
      const mockRefetch = vi
        .fn()
        .mockResolvedValue({ data: mockLandingPageData });

      vi.mocked(usePortfolioQuery.useLandingPageData).mockReturnValue({
        data: mockLandingPageData,
        isLoading: false,
        isRefetching: false,
        error: null,
        refetch: mockRefetch,
      } as any);

      const { result } = renderHook(() => useWalletPortfolioState(), {
        wrapper: createWrapper(),
      });

      await result.current.onRetry();

      expect(mockRefetch).toHaveBeenCalledTimes(1);
    });
  });

  describe("Portfolio State Integration", () => {
    it("should pass correct parameters to usePortfolioState", () => {
      vi.mocked(usePortfolioQuery.useLandingPageData).mockReturnValue({
        data: mockLandingPageData,
        isLoading: true,
        isRefetching: false,
        error: new Error("API Error"),
        refetch: vi.fn(),
      } as any);

      vi.mocked(
        useWalletPortfolioTransform.useWalletPortfolioTransform
      ).mockReturnValue({
        ...mockTransformData,
        hasZeroData: true,
      });

      const { result: _result } = renderHook(() => useWalletPortfolioState(), {
        wrapper: createWrapper(),
      });

      expect(usePortfolioState.usePortfolioState).toHaveBeenCalledWith({
        isConnected: true,
        isLoading: true,
        isRetrying: false,
        error: "API Error",
        landingPageData: mockLandingPageData,
        hasZeroData: true,
      });
    });

    it("should expose portfolio state from usePortfolioState hook", () => {
      const customPortfolioState = {
        isLoading: false,
        isRetrying: false,
        error: "Custom error",
        isEmpty: true,
        showEmptyState: true,
        showConnectPrompt: false,
      };

      vi.mocked(usePortfolioState.usePortfolioState).mockReturnValue(
        customPortfolioState
      );

      const { result } = renderHook(() => useWalletPortfolioState(), {
        wrapper: createWrapper(),
      });

      expect(result.current.portfolioState).toEqual(customPortfolioState);
    });
  });

  describe("Edge Cases", () => {
    it("should handle null userInfo when not connected", () => {
      vi.mocked(UserContext.useUser).mockReturnValue({
        userInfo: null,
        isConnected: false,
        connectWallet: vi.fn(),
        disconnectWallet: vi.fn(),
        error: null,
        isLoading: false,
      });

      const { result } = renderHook(() => useWalletPortfolioState(), {
        wrapper: createWrapper(),
      });

      expect(result.current.resolvedUserId).toBe(null);
      expect(result.current.isVisitorMode).toBe(true);
    });

    it("should handle API errors gracefully", () => {
      const apiError = new Error("Network Error");

      vi.mocked(usePortfolioQuery.useLandingPageData).mockReturnValue({
        data: undefined,
        isLoading: false,
        isRefetching: false,
        error: apiError,
        refetch: vi.fn(),
      } as any);

      const { result: _result } = renderHook(() => useWalletPortfolioState(), {
        wrapper: createWrapper(),
      });

      expect(usePortfolioState.usePortfolioState).toHaveBeenCalledWith(
        expect.objectContaining({
          error: "Network Error",
        })
      );
    });

    it("should handle undefined callbacks gracefully", () => {
      const { result } = renderHook(() => useWalletPortfolioState({}), {
        wrapper: createWrapper(),
      });

      // Should not throw when calling these
      expect(() => {
        act(() => {
          result.current.toggleBalanceVisibility();
          result.current.toggleCategoryExpansion("btc");
        });
      }).not.toThrow();

      // Optional callbacks should be undefined
      expect(result.current.onOptimizeClick).toBeUndefined();
      expect(result.current.onZapInClick).toBeUndefined();
      expect(result.current.onZapOutClick).toBeUndefined();
      expect(result.current.onCategoryClick).toBeUndefined();
    });
  });
});
