import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { usePortfolioDataProgressive } from "@/hooks/queries/analytics/usePortfolioDataProgressive";
import { logger } from "@/utils/logger";

const mockUseLandingPageData = vi.fn();
const mockUseSentimentData = vi.fn();
const mockUseRegimeHistory = vi.fn();
const mockTransformToWallet = vi.fn();

vi.mock("@/hooks/queries/analytics/usePortfolioQuery", () => ({
  useLandingPageData: (...args: unknown[]) => mockUseLandingPageData(...args),
}));

vi.mock("@/hooks/queries/market/useSentimentQuery", () => ({
  useSentimentData: () => mockUseSentimentData(),
}));

vi.mock("@/hooks/queries/market/useRegimeHistoryQuery", () => ({
  useRegimeHistory: () => mockUseRegimeHistory(),
}));

vi.mock("@/adapters/walletPortfolioDataAdapter", () => ({
  transformToWalletPortfolioDataWithDirection: (...args: unknown[]) =>
    mockTransformToWallet(...args),
}));

vi.mock("@/lib/portfolio/portfolioTransformers", () => ({
  extractBalanceData: vi.fn(() => null),
  extractCompositionData: vi.fn(() => null),
  combineStrategyData: vi.fn(() => null),
  extractSentimentData: vi.fn(() => null),
}));

vi.mock("@/lib/portfolio/sectionHelpers", () => ({
  createSectionState: vi.fn(() => ({
    data: null,
    isLoading: false,
    error: null,
  })),
}));

vi.mock("@/utils/logger", () => ({
  logger: { debug: vi.fn() },
}));

describe("usePortfolioDataProgressive", () => {
  const defaultQueryResult = {
    data: null,
    isLoading: false,
    error: null,
    refetch: vi.fn(),
    isFetching: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseLandingPageData.mockReturnValue(defaultQueryResult);
    mockUseSentimentData.mockReturnValue(defaultQueryResult);
    mockUseRegimeHistory.mockReturnValue(defaultQueryResult);
    mockTransformToWallet.mockReturnValue({ balance: 0 });
  });

  it("returns null unifiedData when landing data is null", () => {
    const { result } = renderHook(() => usePortfolioDataProgressive("user1"));
    expect(result.current.unifiedData).toBeNull();
  });

  it("builds unifiedData when landing data exists", () => {
    const landingData = { portfolios: [] };
    mockUseLandingPageData.mockReturnValue({
      ...defaultQueryResult,
      data: landingData,
    });
    const { result } = renderHook(() => usePortfolioDataProgressive("user1"));
    expect(mockTransformToWallet).toHaveBeenCalledWith(landingData, null, null);
    expect(result.current.unifiedData).toEqual({ balance: 0 });
  });

  it("passes sentiment and regime data to transform when available", () => {
    const landingData = { portfolios: [] };
    const sentimentData = { value: 65 };
    const regimeData = { regime: "g" };
    mockUseLandingPageData.mockReturnValue({
      ...defaultQueryResult,
      data: landingData,
    });
    mockUseSentimentData.mockReturnValue({
      ...defaultQueryResult,
      data: sentimentData,
    });
    mockUseRegimeHistory.mockReturnValue({
      ...defaultQueryResult,
      data: regimeData,
    });
    const { result } = renderHook(() => usePortfolioDataProgressive("user1"));
    expect(mockTransformToWallet).toHaveBeenCalledWith(
      landingData,
      sentimentData,
      regimeData
    );
    expect(result.current.unifiedData).toBeDefined();
  });

  it("returns true for isLoading when landing is loading", () => {
    mockUseLandingPageData.mockReturnValue({
      ...defaultQueryResult,
      isLoading: true,
    });
    const { result } = renderHook(() => usePortfolioDataProgressive("user1"));
    expect(result.current.isLoading).toBe(true);
  });

  it("returns true for isLoading when sentiment is loading", () => {
    mockUseSentimentData.mockReturnValue({
      ...defaultQueryResult,
      isLoading: true,
    });
    const { result } = renderHook(() => usePortfolioDataProgressive("user1"));
    expect(result.current.isLoading).toBe(true);
  });

  it("returns true for isLoading when regime is loading", () => {
    mockUseRegimeHistory.mockReturnValue({
      ...defaultQueryResult,
      isLoading: true,
    });
    const { result } = renderHook(() => usePortfolioDataProgressive("user1"));
    expect(result.current.isLoading).toBe(true);
  });

  it("returns false for isLoading when nothing is loading", () => {
    const { result } = renderHook(() => usePortfolioDataProgressive("user1"));
    expect(result.current.isLoading).toBe(false);
  });

  it("returns landing error as priority", () => {
    const landingError = new Error("Landing failed");
    mockUseLandingPageData.mockReturnValue({
      ...defaultQueryResult,
      error: landingError,
    });
    const { result } = renderHook(() => usePortfolioDataProgressive("user1"));
    expect(result.current.error).toBe(landingError);
  });

  it("returns sentiment error when no landing error", () => {
    const sentimentError = new Error("Sentiment failed");
    mockUseSentimentData.mockReturnValue({
      ...defaultQueryResult,
      error: sentimentError,
    });
    const { result } = renderHook(() => usePortfolioDataProgressive("user1"));
    expect(result.current.error).toBe(sentimentError);
  });

  it("returns regime error when no other errors", () => {
    const regimeError = new Error("Regime failed");
    mockUseRegimeHistory.mockReturnValue({
      ...defaultQueryResult,
      error: regimeError,
    });
    const { result } = renderHook(() => usePortfolioDataProgressive("user1"));
    expect(result.current.error).toBe(regimeError);
  });

  it("returns null error when no errors", () => {
    const { result } = renderHook(() => usePortfolioDataProgressive("user1"));
    expect(result.current.error).toBeNull();
  });

  it("calls refetchAll which triggers all query refetches", async () => {
    const mockRefetchLanding = vi.fn().mockResolvedValue(undefined);
    const mockRefetchSentiment = vi.fn().mockResolvedValue(undefined);
    const mockRefetchRegime = vi.fn().mockResolvedValue(undefined);
    mockUseLandingPageData.mockReturnValue({
      ...defaultQueryResult,
      refetch: mockRefetchLanding,
    });
    mockUseSentimentData.mockReturnValue({
      ...defaultQueryResult,
      refetch: mockRefetchSentiment,
    });
    mockUseRegimeHistory.mockReturnValue({
      ...defaultQueryResult,
      refetch: mockRefetchRegime,
    });

    const { result } = renderHook(() => usePortfolioDataProgressive("user1"));
    await result.current.refetch();

    expect(mockRefetchLanding).toHaveBeenCalled();
    expect(mockRefetchSentiment).toHaveBeenCalled();
    expect(mockRefetchRegime).toHaveBeenCalled();
  });

  it("passes isEtlInProgress to useLandingPageData", () => {
    renderHook(() => usePortfolioDataProgressive("user1", true));
    expect(mockUseLandingPageData).toHaveBeenCalledWith("user1", true);
  });

  it("logs query states including error messages", () => {
    const landingError = new Error("Landing error msg");
    mockUseLandingPageData.mockReturnValue({
      ...defaultQueryResult,
      error: landingError,
    });
    renderHook(() => usePortfolioDataProgressive("user1"));
    expect(logger.debug).toHaveBeenCalled();
  });
});
