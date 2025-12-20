/**
 * Unit tests for usePortfolioData.ts
 *
 * Tests React Query hook integration with:
 * - Parallel query execution (landing + sentiment + regime)
 * - Regime history integration
 * - Error handling (regime errors don't block UI)
 * - Data transformation with directional fields
 * - Loading states
 * - Graceful degradation when regime data unavailable
 */

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  transformToWalletPortfolioDataWithDirection,
  type WalletPortfolioDataWithDirection,
} from "@/adapters/walletPortfolioDataAdapter";
import { usePortfolioData } from "@/hooks/queries/usePortfolioData";
import { useLandingPageData } from "@/hooks/queries/usePortfolioQuery";
import type { LandingPageResponse } from "@/services/analyticsService";
// Import mocked modules for type-safe mocking
import {
  type RegimeHistoryData,
  useRegimeHistory,
} from "@/services/regimeHistoryService";
import {
  type MarketSentimentData,
  useSentimentData,
} from "@/services/sentimentService";

// Mock all dependencies
vi.mock("@/services/regimeHistoryService", () => ({
  useRegimeHistory: vi.fn(),
}));

vi.mock("@/services/sentimentService", () => ({
  useSentimentData: vi.fn(),
}));

vi.mock("@/hooks/queries/usePortfolioQuery", () => ({
  useLandingPageData: vi.fn(),
}));

vi.mock("@/adapters/walletPortfolioDataAdapter", () => ({
  transformToWalletPortfolioDataWithDirection: vi.fn(),
}));

describe("usePortfolioData", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();

    // Create fresh query client for each test
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          gcTime: 0,
        },
      },
    });
  });

  const wrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);

  // ============================================================================
  // Mock Data Factories
  // ============================================================================

  const createMockLandingData = (): LandingPageResponse => ({
    total_assets_usd: 50000,
    total_debt_usd: 0,
    total_net_usd: 50000,
    net_portfolio_value: 50000,
    weighted_apr: 8.5,
    estimated_monthly_income: 350,
    portfolio_roi: {
      recommended_roi: 12.4,
      recommended_period: "365d",
      recommended_yearly_roi: 12.4,
      estimated_yearly_pnl_usd: 6200,
      windows: {
        "7d": { value: 2.1, data_points: 7 },
        "30d": { value: 8.3, data_points: 30 },
      },
    },
    portfolio_allocation: {
      btc: {
        total_value: 20000,
        percentage_of_portfolio: 40,
        wallet_tokens_value: 20000,
        other_sources_value: 0,
      },
      eth: {
        total_value: 15000,
        percentage_of_portfolio: 30,
        wallet_tokens_value: 15000,
        other_sources_value: 0,
      },
      others: {
        total_value: 5000,
        percentage_of_portfolio: 10,
        wallet_tokens_value: 5000,
        other_sources_value: 0,
      },
      stablecoins: {
        total_value: 10000,
        percentage_of_portfolio: 20,
        wallet_tokens_value: 10000,
        other_sources_value: 0,
      },
    },
    wallet_token_summary: {
      total_value_usd: 50000,
      token_count: 10,
      apr_30d: null,
    },
    category_summary_debt: {
      btc: 0,
      eth: 0,
      stablecoins: 0,
      others: 0,
    },
    pool_details: [],
    total_positions: 5,
    protocols_count: 3,
    chains_count: 2,
    wallet_count: 1,
    last_updated: "2025-01-16T00:00:00Z",
    apr_coverage: {
      matched_pools: 5,
      total_pools: 5,
      coverage_percentage: 100,
      matched_asset_value_usd: 50000,
    },
  });

  const createMockSentimentData = (): MarketSentimentData => ({
    value: 65,
    status: "Greed",
    timestamp: "2025-01-16T00:00:00Z",
    quote: {
      quote: "Market showing strong bullish sentiment",
      author: "Market Analysis",
      sentiment: "Greed",
    },
  });

  const createMockRegimeHistoryData = (): RegimeHistoryData => ({
    currentRegime: "g",
    previousRegime: "n",
    direction: "fromLeft",
    duration: {
      milliseconds: 86400000,
      seconds: 86400,
      minutes: 1440,
      hours: 24,
      days: 1,
      human_readable: "1 day",
    },
    transitions: [],
    timestamp: "2025-01-16T00:00:00Z",
    cached: false,
  });

  const createMockPortfolioData = (): WalletPortfolioDataWithDirection => ({
    balance: 50000,
    roi: 12.4,
    roiChange7d: 2.1,
    roiChange30d: 8.3,
    sentimentValue: 65,
    sentimentStatus: "Greed",
    sentimentQuote: "Market showing strong bullish sentiment",
    currentRegime: "g",
    previousRegime: "n",
    strategyDirection: "fromLeft",
    regimeDuration: {
      milliseconds: 86400000,
      seconds: 86400,
      minutes: 1440,
      hours: 24,
      days: 1,
      human_readable: "1 day",
    },
    currentAllocation: {
      crypto: 80,
      stable: 20,
      constituents: { crypto: [], stable: [] },
      simplifiedCrypto: [],
    },
    targetAllocation: {
      crypto: 75,
      stable: 25,
    },
    delta: 5,
    positions: 5,
    protocols: 3,
    chains: 2,
    isLoading: false,
    hasError: false,
  });

  // ============================================================================
  // Parallel Query Execution Tests
  // ============================================================================

  describe("parallel query execution", () => {
    it("should fetch landing, sentiment, and regime data in parallel", async () => {
      const mockLanding = createMockLandingData();
      const mockSentiment = createMockSentimentData();
      const mockRegime = createMockRegimeHistoryData();
      const mockPortfolioData = createMockPortfolioData();

      vi.mocked(useLandingPageData).mockReturnValue({
        data: mockLanding,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      } as any);

      vi.mocked(useSentimentData).mockReturnValue({
        data: mockSentiment,
        isLoading: false,
        error: null,
      } as any);

      vi.mocked(useRegimeHistory).mockReturnValue({
        data: mockRegime,
        isLoading: false,
        error: null,
      } as any);

      vi.mocked(transformToWalletPortfolioDataWithDirection).mockReturnValue(
        mockPortfolioData
      );

      const { result } = renderHook(() => usePortfolioData("0xUSER123"), {
        wrapper,
      });

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      // All hooks should be called
      expect(useLandingPageData).toHaveBeenCalledWith("0xUSER123");
      expect(useSentimentData).toHaveBeenCalled();
      expect(useRegimeHistory).toHaveBeenCalled();

      // Transform should be called with all data
      expect(transformToWalletPortfolioDataWithDirection).toHaveBeenCalledWith(
        mockLanding,
        mockSentiment,
        mockRegime
      );

      expect(result.current.data).toEqual(mockPortfolioData);
      expect(result.current.error).toBeNull();
    });

    it("should wait for both landing and sentiment before completing", async () => {
      // Landing is loading
      vi.mocked(useLandingPageData).mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
        refetch: vi.fn(),
      } as any);

      // Sentiment is ready
      vi.mocked(useSentimentData).mockReturnValue({
        data: createMockSentimentData(),
        isLoading: false,
        error: null,
      } as any);

      vi.mocked(useRegimeHistory).mockReturnValue({
        data: createMockRegimeHistoryData(),
        isLoading: false,
        error: null,
      } as any);

      const { result } = renderHook(() => usePortfolioData("0xUSER123"), {
        wrapper,
      });

      // Should still be loading because landing is not ready
      expect(result.current.isLoading).toBe(true);
      expect(result.current.data).toBeNull();
    });

    it("should not wait for regime history to complete loading", async () => {
      const mockLanding = createMockLandingData();
      const mockSentiment = createMockSentimentData();
      const mockPortfolioData = createMockPortfolioData();

      // Landing and sentiment are ready
      vi.mocked(useLandingPageData).mockReturnValue({
        data: mockLanding,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      } as any);

      vi.mocked(useSentimentData).mockReturnValue({
        data: mockSentiment,
        isLoading: false,
        error: null,
      } as any);

      // Regime is still loading
      vi.mocked(useRegimeHistory).mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
      } as any);

      vi.mocked(transformToWalletPortfolioDataWithDirection).mockReturnValue(
        mockPortfolioData
      );

      const { result } = renderHook(() => usePortfolioData("0xUSER123"), {
        wrapper,
      });

      // Should not be loading because regime is optional
      expect(result.current.isLoading).toBe(false);

      // Transform should be called with null regime data
      expect(transformToWalletPortfolioDataWithDirection).toHaveBeenCalledWith(
        mockLanding,
        mockSentiment,
        null
      );
    });
  });

  // ============================================================================
  // Loading State Tests
  // ============================================================================

  describe("loading states", () => {
    it("should be loading when landing data is loading", () => {
      vi.mocked(useLandingPageData).mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
        refetch: vi.fn(),
      } as any);

      vi.mocked(useSentimentData).mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null,
      } as any);

      vi.mocked(useRegimeHistory).mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null,
      } as any);

      const { result } = renderHook(() => usePortfolioData("0xUSER123"), {
        wrapper,
      });

      expect(result.current.isLoading).toBe(true);
      expect(result.current.data).toBeNull();
    });

    it("should not be loading when only sentiment data is loading", () => {
      const mockLanding = createMockLandingData();

      vi.mocked(useLandingPageData).mockReturnValue({
        data: mockLanding,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      } as any);

      vi.mocked(useSentimentData).mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
      } as any);

      vi.mocked(useRegimeHistory).mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null,
      } as any);

      vi.mocked(transformToWalletPortfolioDataWithDirection).mockReturnValue(
        createMockPortfolioData()
      );

      const { result } = renderHook(() => usePortfolioData("0xUSER123"), {
        wrapper,
      });

      // Sentiment is optional - loading should be false
      expect(result.current.isLoading).toBe(false);
    });

    it("should not be loading when only regime history is loading", () => {
      const mockLanding = createMockLandingData();
      const mockSentiment = createMockSentimentData();

      vi.mocked(useLandingPageData).mockReturnValue({
        data: mockLanding,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      } as any);

      vi.mocked(useSentimentData).mockReturnValue({
        data: mockSentiment,
        isLoading: false,
        error: null,
      } as any);

      vi.mocked(useRegimeHistory).mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
      } as any);

      vi.mocked(transformToWalletPortfolioDataWithDirection).mockReturnValue(
        createMockPortfolioData()
      );

      const { result } = renderHook(() => usePortfolioData("0xUSER123"), {
        wrapper,
      });

      expect(result.current.isLoading).toBe(false);
    });
  });

  // ============================================================================
  // Error Handling Tests
  // ============================================================================

  describe("error handling", () => {
    it("should return error when landing data fails", () => {
      const error = new Error("Landing data fetch failed");

      vi.mocked(useLandingPageData).mockReturnValue({
        data: undefined,
        isLoading: false,
        error,
        refetch: vi.fn(),
      } as any);

      vi.mocked(useSentimentData).mockReturnValue({
        data: createMockSentimentData(),
        isLoading: false,
        error: null,
      } as any);

      vi.mocked(useRegimeHistory).mockReturnValue({
        data: createMockRegimeHistoryData(),
        isLoading: false,
        error: null,
      } as any);

      const { result } = renderHook(() => usePortfolioData("0xUSER123"), {
        wrapper,
      });

      expect(result.current.error).toBe(error);
      expect(result.current.data).toBeNull();
    });

    it("should NOT return error when sentiment data fails", () => {
      const mockLanding = createMockLandingData();
      const mockRegimeHistory = createMockRegimeHistoryData();
      const mockPortfolioData = createMockPortfolioData();
      const sentimentError = new Error("Sentiment data fetch failed");

      vi.mocked(useLandingPageData).mockReturnValue({
        data: mockLanding,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      } as any);

      vi.mocked(useSentimentData).mockReturnValue({
        data: undefined,
        isLoading: false,
        error: sentimentError,
      } as any);

      vi.mocked(useRegimeHistory).mockReturnValue({
        data: mockRegimeHistory,
        isLoading: false,
        error: null,
      } as any);

      vi.mocked(transformToWalletPortfolioDataWithDirection).mockReturnValue(
        mockPortfolioData
      );

      const { result } = renderHook(() => usePortfolioData("0xUSER123"), {
        wrapper,
      });

      // Sentiment errors are gracefully handled - should not block UI
      expect(result.current.error).toBeNull();
      expect(result.current.data).toBe(mockPortfolioData);
    });

    it("should NOT return error when regime history fails", () => {
      const mockLanding = createMockLandingData();
      const mockSentiment = createMockSentimentData();
      const mockPortfolioData = createMockPortfolioData();
      const regimeError = new Error("Regime history fetch failed");

      vi.mocked(useLandingPageData).mockReturnValue({
        data: mockLanding,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      } as any);

      vi.mocked(useSentimentData).mockReturnValue({
        data: mockSentiment,
        isLoading: false,
        error: null,
      } as any);

      vi.mocked(useRegimeHistory).mockReturnValue({
        data: createMockRegimeHistoryData(),
        isLoading: false,
        error: regimeError,
      } as any);

      vi.mocked(transformToWalletPortfolioDataWithDirection).mockReturnValue(
        mockPortfolioData
      );

      const { result } = renderHook(() => usePortfolioData("0xUSER123"), {
        wrapper,
      });

      // Should not have error - regime errors are silently handled
      expect(result.current.error).toBeNull();
      expect(result.current.data).toEqual(mockPortfolioData);
    });
  });

  // ============================================================================
  // Data Transformation Tests
  // ============================================================================

  describe("data transformation", () => {
    it("should transform data with all three sources available", () => {
      const mockLanding = createMockLandingData();
      const mockSentiment = createMockSentimentData();
      const mockRegime = createMockRegimeHistoryData();
      const mockPortfolioData = createMockPortfolioData();

      vi.mocked(useLandingPageData).mockReturnValue({
        data: mockLanding,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      } as any);

      vi.mocked(useSentimentData).mockReturnValue({
        data: mockSentiment,
        isLoading: false,
        error: null,
      } as any);

      vi.mocked(useRegimeHistory).mockReturnValue({
        data: mockRegime,
        isLoading: false,
        error: null,
      } as any);

      vi.mocked(transformToWalletPortfolioDataWithDirection).mockReturnValue(
        mockPortfolioData
      );

      renderHook(() => usePortfolioData("0xUSER123"), { wrapper });

      expect(transformToWalletPortfolioDataWithDirection).toHaveBeenCalledWith(
        mockLanding,
        mockSentiment,
        mockRegime
      );
    });

    it("should transform with null sentiment data", () => {
      const mockLanding = createMockLandingData();
      const mockRegime = createMockRegimeHistoryData();

      vi.mocked(useLandingPageData).mockReturnValue({
        data: mockLanding,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      } as any);

      vi.mocked(useSentimentData).mockReturnValue({
        data: null,
        isLoading: false,
        error: null,
      } as any);

      vi.mocked(useRegimeHistory).mockReturnValue({
        data: mockRegime,
        isLoading: false,
        error: null,
      } as any);

      vi.mocked(transformToWalletPortfolioDataWithDirection).mockReturnValue(
        createMockPortfolioData()
      );

      renderHook(() => usePortfolioData("0xUSER123"), { wrapper });

      expect(transformToWalletPortfolioDataWithDirection).toHaveBeenCalledWith(
        mockLanding,
        null,
        mockRegime
      );
    });

    it("should transform with null regime data", () => {
      const mockLanding = createMockLandingData();
      const mockSentiment = createMockSentimentData();

      vi.mocked(useLandingPageData).mockReturnValue({
        data: mockLanding,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      } as any);

      vi.mocked(useSentimentData).mockReturnValue({
        data: mockSentiment,
        isLoading: false,
        error: null,
      } as any);

      vi.mocked(useRegimeHistory).mockReturnValue({
        data: null,
        isLoading: false,
        error: null,
      } as any);

      vi.mocked(transformToWalletPortfolioDataWithDirection).mockReturnValue(
        createMockPortfolioData()
      );

      renderHook(() => usePortfolioData("0xUSER123"), { wrapper });

      expect(transformToWalletPortfolioDataWithDirection).toHaveBeenCalledWith(
        mockLanding,
        mockSentiment,
        null
      );
    });
  });

  // ============================================================================
  // Refetch Tests
  // ============================================================================

  describe("refetch functionality", () => {
    it("should expose refetch function from landing query", () => {
      const mockRefetch = vi.fn();

      vi.mocked(useLandingPageData).mockReturnValue({
        data: createMockLandingData(),
        isLoading: false,
        error: null,
        refetch: mockRefetch,
      } as any);

      vi.mocked(useSentimentData).mockReturnValue({
        data: createMockSentimentData(),
        isLoading: false,
        error: null,
      } as any);

      vi.mocked(useRegimeHistory).mockReturnValue({
        data: createMockRegimeHistoryData(),
        isLoading: false,
        error: null,
      } as any);

      vi.mocked(transformToWalletPortfolioDataWithDirection).mockReturnValue(
        createMockPortfolioData()
      );

      const { result } = renderHook(() => usePortfolioData("0xUSER123"), {
        wrapper,
      });

      expect(result.current.refetch).toBe(mockRefetch);
    });

    it("should call refetch when invoked", () => {
      const mockRefetch = vi.fn();

      vi.mocked(useLandingPageData).mockReturnValue({
        data: createMockLandingData(),
        isLoading: false,
        error: null,
        refetch: mockRefetch,
      } as any);

      vi.mocked(useSentimentData).mockReturnValue({
        data: createMockSentimentData(),
        isLoading: false,
        error: null,
      } as any);

      vi.mocked(useRegimeHistory).mockReturnValue({
        data: createMockRegimeHistoryData(),
        isLoading: false,
        error: null,
      } as any);

      vi.mocked(transformToWalletPortfolioDataWithDirection).mockReturnValue(
        createMockPortfolioData()
      );

      const { result } = renderHook(() => usePortfolioData("0xUSER123"), {
        wrapper,
      });

      result.current.refetch();

      expect(mockRefetch).toHaveBeenCalled();
    });
  });

  // ============================================================================
  // Edge Cases
  // ============================================================================

  describe("edge cases", () => {
    it("should return null data when landing data is not available", () => {
      vi.mocked(useLandingPageData).mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      } as any);

      vi.mocked(useSentimentData).mockReturnValue({
        data: createMockSentimentData(),
        isLoading: false,
        error: null,
      } as any);

      vi.mocked(useRegimeHistory).mockReturnValue({
        data: createMockRegimeHistoryData(),
        isLoading: false,
        error: null,
      } as any);

      const { result } = renderHook(() => usePortfolioData("0xUSER123"), {
        wrapper,
      });

      expect(result.current.data).toBeNull();
      expect(
        transformToWalletPortfolioDataWithDirection
      ).not.toHaveBeenCalled();
    });

    it("should handle rapid userId changes", () => {
      const mockLanding = createMockLandingData();

      vi.mocked(useLandingPageData).mockReturnValue({
        data: mockLanding,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      } as any);

      vi.mocked(useSentimentData).mockReturnValue({
        data: createMockSentimentData(),
        isLoading: false,
        error: null,
      } as any);

      vi.mocked(useRegimeHistory).mockReturnValue({
        data: createMockRegimeHistoryData(),
        isLoading: false,
        error: null,
      } as any);

      vi.mocked(transformToWalletPortfolioDataWithDirection).mockReturnValue(
        createMockPortfolioData()
      );

      const { rerender } = renderHook(
        ({ userId }) => usePortfolioData(userId),
        {
          wrapper,
          initialProps: { userId: "0xUSER1" },
        }
      );

      expect(useLandingPageData).toHaveBeenCalledWith("0xUSER1");

      // Change userId
      rerender({ userId: "0xUSER2" });

      expect(useLandingPageData).toHaveBeenCalledWith("0xUSER2");
    });
  });
});
