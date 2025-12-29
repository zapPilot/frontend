/**
 * Unit tests for usePortfolioDataProgressive hook
 *
 * Tests the progressive portfolio data hook that provides section-specific
 * loading states for independent dashboard rendering.
 */

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook } from "@testing-library/react";
import { type ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { LandingPageResponse } from "@/services/analyticsService";
import type { MarketSentimentData } from "@/services/sentimentService";

// Mock dependencies
vi.mock("@/hooks/queries/usePortfolioQuery", () => ({
  useLandingPageData: vi.fn(),
}));

vi.mock("@/services/sentimentService", () => ({
  useSentimentData: vi.fn(),
}));

vi.mock("@/services/regimeHistoryService", () => ({
  useRegimeHistory: vi.fn(),
}));

// Import after mocks
import * as usePortfolioQuery from "@/hooks/queries/usePortfolioQuery";
import * as regimeService from "@/services/regimeHistoryService";
import * as sentimentService from "@/services/sentimentService";

import { usePortfolioDataProgressive } from "../../../../src/hooks/queries/usePortfolioDataProgressive";

describe("usePortfolioDataProgressive", () => {
  let queryClient: QueryClient;

  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  const createMockLandingData = (): LandingPageResponse => ({
    total_assets_usd: 10000,
    total_debt_usd: 1000,
    total_net_usd: 9000,
    net_portfolio_value: 9000,
    weighted_apr: 8.5,
    estimated_monthly_income: 63.75,
    wallet_count: 2,
    portfolio_roi: {
      recommended_roi: 0.085,
      recommended_period: "30d",
      recommended_yearly_roi: 1.02,
      estimated_yearly_pnl_usd: 918,
      roi_windows: {
        "7d": 0.02,
        "30d": 0.085,
      },
    },
    portfolio_allocation: {
      btc: {
        total_value: 4000,
        percentage_of_portfolio: 44.44,
        wallet_tokens_value: 3000,
        other_sources_value: 1000,
      },
      eth: {
        total_value: 3000,
        percentage_of_portfolio: 33.33,
        wallet_tokens_value: 2000,
        other_sources_value: 1000,
      },
      stablecoins: {
        total_value: 1500,
        percentage_of_portfolio: 16.67,
        wallet_tokens_value: 1500,
        other_sources_value: 0,
      },
      others: {
        total_value: 500,
        percentage_of_portfolio: 5.56,
        wallet_tokens_value: 500,
        other_sources_value: 0,
      },
    },
    wallet_token_summary: {
      total_value_usd: 7000,
      token_count: 15,
      apr_30d: 5.2,
    },
    category_summary_debt: {
      btc: 300,
      eth: 500,
      stablecoins: 200,
      others: 0,
    },
    pool_details: [
      {
        pool_id: "pool-1",
        protocol_name: "Aave",
        chain: "ethereum",
        position_type: "lending",
        token_symbol: "USDC",
        token_value_usd: 1000,
        apr: 5.0,
      },
    ],
    total_positions: 5,
    protocols_count: 3,
    chains_count: 2,
    last_updated: "2025-12-29T12:00:00Z",
    apr_coverage: {
      matched_pools: 4,
      total_pools: 5,
      coverage_percentage: 80,
      matched_asset_value_usd: 8000,
    },
  });

  const createMockSentimentData = (): MarketSentimentData => ({
    value: 65,
    status: "bullish",
    quote: {
      quote: "Market sentiment is positive",
    },
  });

  const createMockRegimeData = () => ({
    regime_history: [
      {
        start_date: "2025-12-01",
        end_date: "2025-12-29",
        regime: "risk_on" as const,
        duration_days: 29,
      },
    ],
    current_regime: "risk_on" as const,
  });

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          gcTime: 0,
        },
      },
    });
    vi.clearAllMocks();
  });

  describe("Section-specific loading states", () => {
    it("should return loading states when queries are pending", () => {
      vi.mocked(usePortfolioQuery.useLandingPageData).mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
        refetch: vi.fn(),
      } as ReturnType<typeof usePortfolioQuery.useLandingPageData>);

      vi.mocked(sentimentService.useSentimentData).mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
        refetch: vi.fn(),
      } as ReturnType<typeof sentimentService.useSentimentData>);

      vi.mocked(regimeService.useRegimeHistory).mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
        refetch: vi.fn(),
      } as ReturnType<typeof regimeService.useRegimeHistory>);

      const { result } = renderHook(
        () => usePortfolioDataProgressive("test-user"),
        { wrapper }
      );

      expect(result.current.isLoading).toBe(true);
      expect(result.current.sections.balance.isLoading).toBe(true);
      expect(result.current.sections.composition.isLoading).toBe(true);
      expect(result.current.sections.strategy.isLoading).toBe(true);
      expect(result.current.sections.sentiment.isLoading).toBe(true);
    });

    it("should populate balance section when landing data is available", () => {
      const mockLanding = createMockLandingData();

      vi.mocked(usePortfolioQuery.useLandingPageData).mockReturnValue({
        data: mockLanding,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      } as ReturnType<typeof usePortfolioQuery.useLandingPageData>);

      vi.mocked(sentimentService.useSentimentData).mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
        refetch: vi.fn(),
      } as ReturnType<typeof sentimentService.useSentimentData>);

      vi.mocked(regimeService.useRegimeHistory).mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
        refetch: vi.fn(),
      } as ReturnType<typeof regimeService.useRegimeHistory>);

      const { result } = renderHook(
        () => usePortfolioDataProgressive("test-user"),
        { wrapper }
      );

      expect(result.current.sections.balance.isLoading).toBe(false);
      expect(result.current.sections.balance.data).toBeDefined();
      expect(result.current.sections.balance.data?.balance).toBe(9000);
      expect(result.current.sections.balance.data?.roi).toBe(1.02);
    });

    it("should populate composition section when landing data is available", () => {
      const mockLanding = createMockLandingData();

      vi.mocked(usePortfolioQuery.useLandingPageData).mockReturnValue({
        data: mockLanding,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      } as ReturnType<typeof usePortfolioQuery.useLandingPageData>);

      vi.mocked(sentimentService.useSentimentData).mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
        refetch: vi.fn(),
      } as ReturnType<typeof sentimentService.useSentimentData>);

      vi.mocked(regimeService.useRegimeHistory).mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
        refetch: vi.fn(),
      } as ReturnType<typeof regimeService.useRegimeHistory>);

      const { result } = renderHook(
        () => usePortfolioDataProgressive("test-user"),
        { wrapper }
      );

      expect(result.current.sections.composition.isLoading).toBe(false);
      expect(result.current.sections.composition.data).toBeDefined();
      // positions = pool_details.length (1 pool in mock)
      expect(result.current.sections.composition.data?.positions).toBe(1);
      // protocols = unique protocol names in pool_details (1 unique: "Aave")
      expect(result.current.sections.composition.data?.protocols).toBe(1);
      // chains = unique chains in pool_details (1 unique: "ethereum")
      expect(result.current.sections.composition.data?.chains).toBe(1);
    });

    it("should populate sentiment section independently", () => {
      const mockSentiment = createMockSentimentData();

      vi.mocked(usePortfolioQuery.useLandingPageData).mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
        refetch: vi.fn(),
      } as ReturnType<typeof usePortfolioQuery.useLandingPageData>);

      vi.mocked(sentimentService.useSentimentData).mockReturnValue({
        data: mockSentiment,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      } as ReturnType<typeof sentimentService.useSentimentData>);

      vi.mocked(regimeService.useRegimeHistory).mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
        refetch: vi.fn(),
      } as ReturnType<typeof regimeService.useRegimeHistory>);

      const { result } = renderHook(
        () => usePortfolioDataProgressive("test-user"),
        { wrapper }
      );

      expect(result.current.sections.sentiment.isLoading).toBe(false);
      expect(result.current.sections.sentiment.data).toBeDefined();
      expect(result.current.sections.sentiment.data?.value).toBe(65);
      expect(result.current.sections.sentiment.data?.status).toBe("bullish");
    });
  });

  describe("Strategy section with combined data", () => {
    it("should populate strategy section when all data is available", () => {
      const mockLanding = createMockLandingData();
      const mockSentiment = createMockSentimentData();
      const mockRegime = createMockRegimeData();

      vi.mocked(usePortfolioQuery.useLandingPageData).mockReturnValue({
        data: mockLanding,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      } as ReturnType<typeof usePortfolioQuery.useLandingPageData>);

      vi.mocked(sentimentService.useSentimentData).mockReturnValue({
        data: mockSentiment,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      } as ReturnType<typeof sentimentService.useSentimentData>);

      vi.mocked(regimeService.useRegimeHistory).mockReturnValue({
        data: mockRegime,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      } as ReturnType<typeof regimeService.useRegimeHistory>);

      const { result } = renderHook(
        () => usePortfolioDataProgressive("test-user"),
        { wrapper }
      );

      expect(result.current.sections.strategy.isLoading).toBe(false);
      expect(result.current.sections.strategy.data).toBeDefined();
      expect(result.current.sections.strategy.data?.hasSentiment).toBe(true);
      expect(result.current.sections.strategy.data?.hasRegimeHistory).toBe(
        true
      );
    });

    it("should handle missing sentiment in strategy section gracefully", () => {
      const mockLanding = createMockLandingData();
      const mockRegime = createMockRegimeData();

      vi.mocked(usePortfolioQuery.useLandingPageData).mockReturnValue({
        data: mockLanding,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      } as ReturnType<typeof usePortfolioQuery.useLandingPageData>);

      vi.mocked(sentimentService.useSentimentData).mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      } as ReturnType<typeof sentimentService.useSentimentData>);

      vi.mocked(regimeService.useRegimeHistory).mockReturnValue({
        data: mockRegime,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      } as ReturnType<typeof regimeService.useRegimeHistory>);

      const { result } = renderHook(
        () => usePortfolioDataProgressive("test-user"),
        { wrapper }
      );

      expect(result.current.sections.strategy.data?.hasSentiment).toBe(false);
      expect(result.current.sections.strategy.data?.sentimentValue).toBeNull();
    });
  });

  describe("Error handling", () => {
    it("should propagate errors from landing query", () => {
      const error = new Error("Failed to fetch landing data");

      vi.mocked(usePortfolioQuery.useLandingPageData).mockReturnValue({
        data: undefined,
        isLoading: false,
        error,
        refetch: vi.fn(),
      } as ReturnType<typeof usePortfolioQuery.useLandingPageData>);

      vi.mocked(sentimentService.useSentimentData).mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      } as ReturnType<typeof sentimentService.useSentimentData>);

      vi.mocked(regimeService.useRegimeHistory).mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      } as ReturnType<typeof regimeService.useRegimeHistory>);

      const { result } = renderHook(
        () => usePortfolioDataProgressive("test-user"),
        { wrapper }
      );

      expect(result.current.error).toEqual(error);
      expect(result.current.sections.balance.error).toEqual(error);
    });
  });

  describe("refetchAll", () => {
    it("should call refetch on all queries", async () => {
      const mockRefetchLanding = vi.fn().mockResolvedValue({});
      const mockRefetchSentiment = vi.fn().mockResolvedValue({});
      const mockRefetchRegime = vi.fn().mockResolvedValue({});

      vi.mocked(usePortfolioQuery.useLandingPageData).mockReturnValue({
        data: createMockLandingData(),
        isLoading: false,
        error: null,
        refetch: mockRefetchLanding,
      } as ReturnType<typeof usePortfolioQuery.useLandingPageData>);

      vi.mocked(sentimentService.useSentimentData).mockReturnValue({
        data: createMockSentimentData(),
        isLoading: false,
        error: null,
        refetch: mockRefetchSentiment,
      } as ReturnType<typeof sentimentService.useSentimentData>);

      vi.mocked(regimeService.useRegimeHistory).mockReturnValue({
        data: createMockRegimeData(),
        isLoading: false,
        error: null,
        refetch: mockRefetchRegime,
      } as ReturnType<typeof regimeService.useRegimeHistory>);

      const { result } = renderHook(
        () => usePortfolioDataProgressive("test-user"),
        { wrapper }
      );

      await result.current.refetch();

      expect(mockRefetchLanding).toHaveBeenCalled();
      expect(mockRefetchSentiment).toHaveBeenCalled();
      expect(mockRefetchRegime).toHaveBeenCalled();
    });
  });

  describe("unifiedData (backward compatibility)", () => {
    it("should provide unifiedData when all data is available", () => {
      const mockLanding = createMockLandingData();
      const mockSentiment = createMockSentimentData();
      const mockRegime = createMockRegimeData();

      vi.mocked(usePortfolioQuery.useLandingPageData).mockReturnValue({
        data: mockLanding,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      } as ReturnType<typeof usePortfolioQuery.useLandingPageData>);

      vi.mocked(sentimentService.useSentimentData).mockReturnValue({
        data: mockSentiment,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      } as ReturnType<typeof sentimentService.useSentimentData>);

      vi.mocked(regimeService.useRegimeHistory).mockReturnValue({
        data: mockRegime,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      } as ReturnType<typeof regimeService.useRegimeHistory>);

      const { result } = renderHook(
        () => usePortfolioDataProgressive("test-user"),
        { wrapper }
      );

      expect(result.current.unifiedData).toBeDefined();
      expect(result.current.unifiedData?.balance).toBe(9000);
    });

    it("should return null for unifiedData when landing data is missing", () => {
      vi.mocked(usePortfolioQuery.useLandingPageData).mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      } as ReturnType<typeof usePortfolioQuery.useLandingPageData>);

      vi.mocked(sentimentService.useSentimentData).mockReturnValue({
        data: createMockSentimentData(),
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      } as ReturnType<typeof sentimentService.useSentimentData>);

      vi.mocked(regimeService.useRegimeHistory).mockReturnValue({
        data: createMockRegimeData(),
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      } as ReturnType<typeof regimeService.useRegimeHistory>);

      const { result } = renderHook(
        () => usePortfolioDataProgressive("test-user"),
        { wrapper }
      );

      expect(result.current.unifiedData).toBeNull();
    });
  });
});
