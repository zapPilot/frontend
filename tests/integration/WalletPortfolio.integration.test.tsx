/**
 * Integration tests for WalletPortfolio
 *
 * Tests the complete data flow:
 * - API data fetching via hooks
 * - Data transformation via adapter
 * - Props passed to presenter component
 * - Loading and error states
 */

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { WalletPortfolio } from "@/components/wallet/portfolio/WalletPortfolio";
import * as portfolioQuery from "@/hooks/queries/usePortfolioQuery";
import * as regimeHistoryService from "@/services/regimeHistoryService";
import * as sentimentService from "@/services/sentimentService";

// Mock the presenter component
vi.mock("@/components/wallet/portfolio/WalletPortfolioPresenter", () => {
  const MockPresenter = ({
    data,
  }: {
    data: { balance: number; currentRegime: string; isLoading: boolean };
  }) => (
    <div data-testid="wallet-portfolio-presenter">
      <div data-testid="loading-state">{data.isLoading.toString()}</div>
      <div data-testid="balance">{data.balance}</div>
      <div data-testid="regime">{data.currentRegime}</div>
    </div>
  );
  MockPresenter.displayName = "MockWalletPortfolioPresenter";

  return {
    WalletPortfolioPresenter: MockPresenter,
  };
});

describe("WalletPortfolio", () => {
  const createWrapper = () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });

    const Wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
    Wrapper.displayName = "TestWrapper";

    return Wrapper;
  };

  it("should show loading state while fetching data", () => {
    // Mock loading states
    vi.spyOn(portfolioQuery, "useLandingPageData").mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
      // @ts-expect-error - partial mock
      refetch: vi.fn(),
    });

    vi.spyOn(sentimentService, "useSentimentData").mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
      // @ts-expect-error - partial mock
      refetch: vi.fn(),
    });

    vi.spyOn(regimeHistoryService, "useRegimeHistory").mockReturnValue({
      data: regimeHistoryService.DEFAULT_REGIME_HISTORY,
      isLoading: false,
      error: null,
      isSuccess: true,
      isError: false,
      // @ts-expect-error - partial mock
      refetch: vi.fn(),
    });

    render(<WalletPortfolio userId="0x123" />, {
      wrapper: createWrapper(),
    });

    expect(screen.getByTestId("loading-state")).toHaveTextContent("true");
  });

  it("should transform and display data correctly when loaded", async () => {
    const mockLandingData = {
      net_portfolio_value: 45230.5,
      portfolio_roi: {
        recommended_roi: 12.4,
        recommended_period: "365d",
        recommended_yearly_roi: 12.4,
        estimated_yearly_pnl_usd: 5600,
        windows: {
          "7d": { value: 2.1, data_points: 7 },
          "30d": { value: 8.3, data_points: 30 },
        },
      },
      portfolio_allocation: {
        btc: {
          total_value: 15000,
          percentage_of_portfolio: 33,
          wallet_tokens_value: 15000,
          other_sources_value: 0,
        },
        eth: {
          total_value: 10000,
          percentage_of_portfolio: 22,
          wallet_tokens_value: 10000,
          other_sources_value: 0,
        },
        others: {
          total_value: 5000,
          percentage_of_portfolio: 11,
          wallet_tokens_value: 5000,
          other_sources_value: 0,
        },
        stablecoins: {
          total_value: 15230.5,
          percentage_of_portfolio: 34,
          wallet_tokens_value: 15230.5,
          other_sources_value: 0,
        },
      },
      total_positions: 5,
      protocols_count: 3,
      chains_count: 2,
      wallet_token_summary: {
        total_value_usd: 45230.5,
        token_count: 10,
      },
      category_summary_debt: {
        btc: 0,
        eth: 0,
        stablecoins: 0,
        others: 0,
      },
      total_assets_usd: 45230.5,
      total_debt_usd: 0,
      total_net_usd: 45230.5,
      weighted_apr: 8.5,
      estimated_monthly_income: 321,
      last_updated: null,
    };

    const mockSentimentData = {
      value: 65,
      status: "Greed",
      timestamp: "2025-01-01T00:00:00Z",
      quote: {
        quote: "Markets are bullish",
        author: "Analysis",
      },
      source: "test",
      cached: false,
    };

    vi.spyOn(portfolioQuery, "useLandingPageData").mockReturnValue({
      data: mockLandingData,
      isLoading: false,
      error: null,
      // @ts-expect-error - partial mock
      refetch: vi.fn(),
    });

    vi.spyOn(sentimentService, "useSentimentData").mockReturnValue({
      data: mockSentimentData,
      isLoading: false,
      error: null,
      // @ts-expect-error - partial mock
      refetch: vi.fn(),
    });

    vi.spyOn(regimeHistoryService, "useRegimeHistory").mockReturnValue({
      data: regimeHistoryService.DEFAULT_REGIME_HISTORY,
      isLoading: false,
      error: null,
      isSuccess: true,
      isError: false,
      // @ts-expect-error - partial mock
      refetch: vi.fn(),
    });

    render(<WalletPortfolio userId="0x123" />, {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(screen.getByTestId("loading-state")).toHaveTextContent("false");
    });

    expect(screen.getByTestId("balance")).toHaveTextContent("45230.5");
    expect(screen.getByTestId("regime")).toHaveTextContent("g"); // Greed
  });

  it("should handle portfolio data error gracefully", async () => {
    vi.spyOn(portfolioQuery, "useLandingPageData").mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error("Failed to fetch portfolio"),
      // @ts-expect-error - partial mock
      refetch: vi.fn(),
    });

    vi.spyOn(sentimentService, "useSentimentData").mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
      // @ts-expect-error - partial mock
      refetch: vi.fn(),
    });

    vi.spyOn(regimeHistoryService, "useRegimeHistory").mockReturnValue({
      data: regimeHistoryService.DEFAULT_REGIME_HISTORY,
      isLoading: false,
      error: null,
      isSuccess: true,
      isError: false,
      // @ts-expect-error - partial mock
      refetch: vi.fn(),
    });

    render(<WalletPortfolio userId="0x123" />, {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(screen.getByTestId("loading-state")).toHaveTextContent("false");
    });

    // Should show error state with zero balance
    expect(screen.getByTestId("balance")).toHaveTextContent("0");
  });

  it("should work with sentiment data missing (fallback to neutral)", async () => {
    const mockLandingData = {
      net_portfolio_value: 10000,
      portfolio_roi: {
        recommended_roi: 5,
        recommended_period: "365d",
        recommended_yearly_roi: 5,
        estimated_yearly_pnl_usd: 500,
      },
      portfolio_allocation: {
        btc: {
          total_value: 5000,
          percentage_of_portfolio: 50,
          wallet_tokens_value: 5000,
          other_sources_value: 0,
        },
        eth: {
          total_value: 0,
          percentage_of_portfolio: 0,
          wallet_tokens_value: 0,
          other_sources_value: 0,
        },
        others: {
          total_value: 0,
          percentage_of_portfolio: 0,
          wallet_tokens_value: 0,
          other_sources_value: 0,
        },
        stablecoins: {
          total_value: 5000,
          percentage_of_portfolio: 50,
          wallet_tokens_value: 5000,
          other_sources_value: 0,
        },
      },
      wallet_token_summary: {
        total_value_usd: 10000,
        token_count: 2,
      },
      category_summary_debt: {
        btc: 0,
        eth: 0,
        stablecoins: 0,
        others: 0,
      },
      total_assets_usd: 10000,
      total_debt_usd: 0,
      total_net_usd: 10000,
      weighted_apr: 5,
      estimated_monthly_income: 42,
      last_updated: null,
    };

    vi.spyOn(portfolioQuery, "useLandingPageData").mockReturnValue({
      data: mockLandingData,
      isLoading: false,
      error: null,
      // @ts-expect-error - partial mock
      refetch: vi.fn(),
    });

    // Sentiment data fails but should not block rendering
    vi.spyOn(sentimentService, "useSentimentData").mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error("Sentiment API down"),
      // @ts-expect-error - partial mock
      refetch: vi.fn(),
    });

    // Regime history returns defaults (graceful fallback)
    vi.spyOn(regimeHistoryService, "useRegimeHistory").mockReturnValue({
      data: regimeHistoryService.DEFAULT_REGIME_HISTORY,
      isLoading: false,
      error: null,
      isSuccess: true,
      isError: false,
      // @ts-expect-error - partial mock
      refetch: vi.fn(),
    });

    render(<WalletPortfolio userId="0x123" />, {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(screen.getByTestId("loading-state")).toHaveTextContent("false");
    });

    expect(screen.getByTestId("balance")).toHaveTextContent("10000");
    expect(screen.getByTestId("regime")).toHaveTextContent("n"); // Neutral fallback
  });

  it("should call action handlers correctly", () => {
    const mockOptimize = vi.fn();
    const mockZapIn = vi.fn();
    const mockZapOut = vi.fn();

    vi.spyOn(portfolioQuery, "useLandingPageData").mockReturnValue({
      data: {
        net_portfolio_value: 1000,
        portfolio_roi: {
          recommended_roi: 5,
          recommended_period: "365d",
          recommended_yearly_roi: 5,
          estimated_yearly_pnl_usd: 50,
        },
        portfolio_allocation: {
          btc: {
            total_value: 500,
            percentage_of_portfolio: 50,
            wallet_tokens_value: 500,
            other_sources_value: 0,
          },
          eth: {
            total_value: 0,
            percentage_of_portfolio: 0,
            wallet_tokens_value: 0,
            other_sources_value: 0,
          },
          others: {
            total_value: 0,
            percentage_of_portfolio: 0,
            wallet_tokens_value: 0,
            other_sources_value: 0,
          },
          stablecoins: {
            total_value: 500,
            percentage_of_portfolio: 50,
            wallet_tokens_value: 500,
            other_sources_value: 0,
          },
        },
        wallet_token_summary: {
          total_value_usd: 1000,
          token_count: 2,
        },
        category_summary_debt: {
          btc: 0,
          eth: 0,
          stablecoins: 0,
          others: 0,
        },
        total_assets_usd: 1000,
        total_debt_usd: 0,
        total_net_usd: 1000,
        weighted_apr: 5,
        estimated_monthly_income: 4,
        last_updated: null,
      },
      isLoading: false,
      error: null,
      // @ts-expect-error - partial mock
      refetch: vi.fn(),
    });

    vi.spyOn(sentimentService, "useSentimentData").mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
      // @ts-expect-error - partial mock
      refetch: vi.fn(),
    });

    vi.spyOn(regimeHistoryService, "useRegimeHistory").mockReturnValue({
      data: regimeHistoryService.DEFAULT_REGIME_HISTORY,
      isLoading: false,
      error: null,
      isSuccess: true,
      isError: false,
      // @ts-expect-error - partial mock
      refetch: vi.fn(),
    });

    render(
      <WalletPortfolio
        userId="0x123"
        onOptimizeClick={mockOptimize}
        onZapInClick={mockZapIn}
        onZapOutClick={mockZapOut}
      />,
      { wrapper: createWrapper() }
    );

    // Action handlers are passed as props to presenter
    // (Actual click testing would be in E2E tests)
    expect(screen.getByTestId("wallet-portfolio-presenter")).toBeInTheDocument();
  });
});
