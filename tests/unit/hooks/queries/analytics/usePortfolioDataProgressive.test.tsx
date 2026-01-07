import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { usePortfolioDataProgressive } from "@/hooks/queries/analytics/usePortfolioDataProgressive";
import { useLandingPageData } from "@/hooks/queries/analytics/usePortfolioQuery";
import { useRegimeHistory } from "@/hooks/queries/market/useRegimeHistoryQuery";
import { useSentimentData } from "@/hooks/queries/market/useSentimentQuery";
import * as Transformers from "@/lib/portfolio/portfolioTransformers";

// Mock dependencies
vi.mock("@/hooks/queries/market/useRegimeHistoryQuery");
vi.mock("@/hooks/queries/market/useSentimentQuery");
vi.mock("@/hooks/queries/analytics/usePortfolioQuery");
vi.mock("@/lib/portfolio/portfolioTransformers", async () => {
  const actual = await vi.importActual("@/lib/portfolio/portfolioTransformers");
  return {
    ...actual,
    extractBalanceData: vi.fn(),
    extractCompositionData: vi.fn(),
    combineStrategyData: vi.fn(),
    extractSentimentData: vi.fn(),
  };
});
vi.mock("@/adapters/walletPortfolioDataAdapter", () => ({
  transformToWalletPortfolioDataWithDirection: vi.fn(),
}));

describe("usePortfolioDataProgressive", () => {
  const mockLandingQuery = {
    data: { some: "landingData" },
    isLoading: false,
    error: null,
    refetch: vi.fn(),
  };
  const mockSentimentQuery = {
    data: { some: "sentimentData" },
    isLoading: false,
    error: null,
    refetch: vi.fn(),
  };
  const mockRegimeQuery = {
    data: { some: "regimeData" },
    isLoading: false,
    error: null,
    refetch: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useLandingPageData).mockReturnValue(mockLandingQuery as any);
    vi.mocked(useSentimentData).mockReturnValue(mockSentimentQuery as any);
    vi.mocked(useRegimeHistory).mockReturnValue(mockRegimeQuery as any);

    vi.mocked(Transformers.extractBalanceData).mockReturnValue(
      "balanceData" as any
    );
    vi.mocked(Transformers.extractCompositionData).mockReturnValue(
      "compositionData" as any
    );
    vi.mocked(Transformers.combineStrategyData).mockReturnValue(
      "strategyData" as any
    );
    vi.mocked(Transformers.extractSentimentData).mockReturnValue(
      "sentimentSectionData" as any
    );
  });

  it("should return sections with data when queries succeed", () => {
    const { result } = renderHook(() => usePortfolioDataProgressive("user1"));

    expect(result.current.sections.balance.data).toBe("balanceData");
    expect(result.current.sections.composition.data).toBe("compositionData");
    expect(result.current.sections.strategy.data).toBe("strategyData");
    expect(result.current.sections.sentiment.data).toBe("sentimentSectionData");

    expect(Transformers.extractBalanceData).toHaveBeenCalledWith(
      mockLandingQuery.data
    );
    expect(Transformers.extractCompositionData).toHaveBeenCalledWith(
      mockLandingQuery.data
    );
    expect(Transformers.combineStrategyData).toHaveBeenCalledWith(
      mockLandingQuery.data,
      mockSentimentQuery.data,
      mockRegimeQuery.data
    );
    expect(Transformers.extractSentimentData).toHaveBeenCalledWith(
      mockSentimentQuery.data
    );
  });

  it("should handle loading states", () => {
    vi.mocked(useLandingPageData).mockReturnValue({
      ...mockLandingQuery,
      isLoading: true,
    } as any);

    const { result } = renderHook(() => usePortfolioDataProgressive("user1"));

    expect(result.current.isLoading).toBe(true);
    expect(result.current.sections.balance.isLoading).toBe(true);
    expect(result.current.sections.composition.isLoading).toBe(true);
    expect(result.current.sections.strategy.isLoading).toBe(true);
    // Sentiment is independent, should not be loading if its query isn't
    expect(result.current.sections.sentiment.isLoading).toBe(false);
  });

  it("should handle sentiment loading", () => {
    vi.mocked(useLandingPageData).mockReturnValue({
      ...mockLandingQuery,
      isLoading: false,
    } as any);
    vi.mocked(useSentimentData).mockReturnValue({
      ...mockSentimentQuery,
      isLoading: true,
    } as any);

    const { result } = renderHook(() => usePortfolioDataProgressive("user1"));

    expect(result.current.isLoading).toBe(true); // Overall loading is OR
    expect(result.current.sections.balance.isLoading).toBe(false);
    expect(result.current.sections.composition.isLoading).toBe(false);
    expect(result.current.sections.strategy.isLoading).toBe(true); // Strategy depends on sentiment
    expect(result.current.sections.sentiment.isLoading).toBe(true);
  });

  it("should handle error states", () => {
    const error = new Error("Landing failed");
    vi.mocked(useLandingPageData).mockReturnValue({
      ...mockLandingQuery,
      data: null,
      error,
      isLoading: false,
    } as any);

    const { result } = renderHook(() => usePortfolioDataProgressive("user1"));

    expect(result.current.error).toBe(error);
    expect(result.current.sections.balance.error).toBe(error);
    expect(result.current.sections.balance.data).toBeNull();
  });

  it("should call all refetches on refetchAll", async () => {
    const { result } = renderHook(() => usePortfolioDataProgressive("user1"));

    await result.current.refetch();

    expect(mockLandingQuery.refetch).toHaveBeenCalled();
    expect(mockSentimentQuery.refetch).toHaveBeenCalled();
    expect(mockRegimeQuery.refetch).toHaveBeenCalled();
  });

  it("should disable landing page query when ETL is in progress", () => {
    renderHook(() => usePortfolioDataProgressive("user1", true));
    expect(useLandingPageData).toHaveBeenCalledWith("user1", true);
  });
});
