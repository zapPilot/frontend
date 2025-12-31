import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { usePortfolioDataProgressive } from "@/hooks/queries/analytics/usePortfolioDataProgressive";
import { useLandingPageData } from "@/hooks/queries/analytics/usePortfolioQuery";
import { useRegimeHistory } from "@/hooks/queries/market/useRegimeHistoryQuery";
import { useSentimentData } from "@/hooks/queries/market/useSentimentQuery";

// Mock dependencies
vi.mock("@/hooks/queries/analytics/usePortfolioQuery", () => ({
  useLandingPageData: vi.fn(),
}));

vi.mock("@/hooks/queries/market/useRegimeHistoryQuery", () => ({
  useRegimeHistory: vi.fn(),
}));

vi.mock("@/hooks/queries/market/useSentimentQuery", () => ({
  useSentimentData: vi.fn(),
}));

vi.mock("@/adapters/portfolio/allocationAdapter", () => ({
  calculateAllocation: vi.fn(() => ({ crypto: 50, stable: 50, defi: 0 })),
  calculateDelta: vi.fn(() => 0),
}));

vi.mock("@/adapters/portfolio/regimeAdapter", () => ({
  getRegimeStrategyInfo: vi.fn(() => ({
    strategyDirection: "Hold",
    previousRegime: null,
  })),
  getTargetAllocation: vi.fn(() => ({ crypto: 60, stable: 40, defi: 0 })),
}));

vi.mock("@/adapters/portfolio/sentimentAdapter", () => ({
  processSentimentData: vi.fn(() => ({
    regime: "Neutral",
    status: "Stable",
    quote: "Hold steady",
    value: 50,
  })),
}));

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

describe("usePortfolioDataProgressive", () => {
  const mockLandingPageData = {
    net_portfolio_value: 1000,
    portfolio_roi: { recommended_yearly_roi: 0.1 },
    pool_details: [{}, {}], // 2 items
    last_updated: "2024-01-01",
  };

  const mockSentimentData = {
    value: 50,
    status: "Neutral",
    quote: { quote: "Foo" },
  };

  const mockRegimeData = {
    // dummy data
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Default happy path mocks
    vi.mocked(useLandingPageData).mockReturnValue({
      data: mockLandingPageData,
      isLoading: false,
      error: null,
    } as any);

    vi.mocked(useSentimentData).mockReturnValue({
      data: mockSentimentData,
      isLoading: false,
      error: null,
    } as any);

    vi.mocked(useRegimeHistory).mockReturnValue({
      data: mockRegimeData,
      isLoading: false,
      error: null,
    } as any);
  });

  it("should return fully populated data structure", () => {
    const { result } = renderHook(() => usePortfolioDataProgressive("0x123"), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.sections.balance.data?.balance).toBe(1000);
    expect(result.current.sections.composition.data?.positions).toBe(2);
    expect(result.current.unifiedData).not.toBeNull();
  });

  it("should handle null/undefined values in landing page data (branch coverage)", () => {
    vi.mocked(useLandingPageData).mockReturnValue({
      data: {
        ...mockLandingPageData,
        net_portfolio_value: undefined, // Test null coalescing
        portfolio_roi: null, // Test optional chaining
        pool_details: null, // Test null coalescing for arrays
      },
      isLoading: false,
      error: null,
    } as any);

    const { result } = renderHook(() => usePortfolioDataProgressive("0x123"), {
      wrapper: createWrapper(),
    });

    // Check balance default
    expect(result.current.sections.balance.data?.balance).toBe(0);
    // Check ROI default
    expect(result.current.sections.balance.data?.roi).toBe(0);
    // Check positions default
    expect(result.current.sections.composition.data?.positions).toBe(0);
    // Check protocols/chains extraction doesn't crash
    expect(result.current.sections.composition.data?.protocols).toBeDefined();
  });

  it("should aggregate loading states", () => {
    vi.mocked(useLandingPageData).mockReturnValue({ isLoading: true } as any);
    vi.mocked(useSentimentData).mockReturnValue({ isLoading: false } as any);
    vi.mocked(useRegimeHistory).mockReturnValue({ isLoading: false } as any);

    const { result } = renderHook(() => usePortfolioDataProgressive("0x123"), {
      wrapper: createWrapper(),
    });
    expect(result.current.isLoading).toBe(true);
    // Strategy depends on landing, so it should be loading
    expect(result.current.sections.strategy.isLoading).toBe(true);
  });

  it("should aggregate errors", () => {
    vi.mocked(useLandingPageData).mockReturnValue({
      error: new Error("Fail"),
    } as any);

    const { result } = renderHook(() => usePortfolioDataProgressive("0x123"), {
      wrapper: createWrapper(),
    });
    expect(result.current.error).toEqual(new Error("Fail"));
  });

  it("should handle missing data gracefully (return null sections)", () => {
    vi.mocked(useLandingPageData).mockReturnValue({ data: null } as any);
    vi.mocked(useSentimentData).mockReturnValue({ data: null } as any);
    vi.mocked(useRegimeHistory).mockReturnValue({ data: null } as any);

    const { result } = renderHook(() => usePortfolioDataProgressive("0x123"), {
      wrapper: createWrapper(),
    });

    expect(result.current.sections.balance.data).toBeNull();
    expect(result.current.sections.strategy.data).toBeNull();
    expect(result.current.unifiedData).toBeNull();
  });

  it("should refetch all queries", async () => {
    const refetchLanding = vi.fn();
    const refetchSentiment = vi.fn();
    const refetchRegime = vi.fn();

    vi.mocked(useLandingPageData).mockReturnValue({
      refetch: refetchLanding,
    } as any);
    vi.mocked(useSentimentData).mockReturnValue({
      refetch: refetchSentiment,
    } as any);
    vi.mocked(useRegimeHistory).mockReturnValue({
      refetch: refetchRegime,
    } as any);

    const { result } = renderHook(() => usePortfolioDataProgressive("0x123"), {
      wrapper: createWrapper(),
    });

    await result.current.refetch();

    expect(refetchLanding).toHaveBeenCalled();
    expect(refetchSentiment).toHaveBeenCalled();
    expect(refetchRegime).toHaveBeenCalled();
  });
});
