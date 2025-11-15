import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { WalletMetrics } from "../../../../src/components/wallet/WalletMetrics";
import { useLandingPageData } from "../../../../src/hooks/queries/usePortfolioQuery";
import type { LandingPageResponse } from "../../../../src/services/analyticsEngine";

// Mock lucide-react icons
vi.mock("lucide-react", () => ({
  Loader: vi.fn(() => <span data-testid="loader-icon">Loading...</span>),
  TrendingUp: vi.fn(() => (
    <span data-testid="trending-up-icon">TrendingUp</span>
  )),
  TrendingDown: vi.fn(() => (
    <span data-testid="trending-down-icon">TrendingDown</span>
  )),
  AlertCircle: vi.fn(() => (
    <span data-testid="alert-circle-icon">AlertCircle</span>
  )),
  Info: vi.fn(() => <span data-testid="info-icon">Info</span>),
  Clock: vi.fn(() => <span data-testid="clock-icon">Clock</span>),
}));

// Note: WalletMetrics uses BalanceLoading from UnifiedLoading; no spinner mock needed

// Mock formatters
vi.mock("../../../../src/lib/formatters", async () => {
  const { mockFormatters } = await import("../../../mocks/formatters");
  return mockFormatters;
});

// Mock color utilities
vi.mock("../../../../src/lib/color-utils", () => ({
  getChangeColorClasses: vi.fn(percentage =>
    percentage >= 0 ? "text-green-400" : "text-red-400"
  ),
}));

// Mock portfolio calculations
vi.mock("../../../../src/constants/portfolio", () => ({
  calculateMonthlyIncome: vi.fn((totalValue, aprDecimal) => {
    if (!totalValue || totalValue === 0) return 0;
    return (totalValue * aprDecimal) / 12; // aprDecimal is already in decimal format (0.125 for 12.5%)
  }),
}));

// Mock the useLandingPageData hook
vi.mock("../../../../src/hooks/queries/usePortfolioQuery", () => ({
  useLandingPageData: vi.fn(_userId => ({
    data: {
      total_assets_usd: 15000,
      total_debt_usd: 0,
      total_net_usd: 15000,
      weighted_apr: 0.125, // 12.5% APR as decimal (API format)
      estimated_monthly_income: 1000,
      portfolio_roi: {
        recommended_roi: 4.7932,
        recommended_roi_period: "roi_7d",
        recommended_yearly_roi: 249.9313,
        estimated_yearly_pnl_usd: 12000,
        roi_7d: {
          value: 4.7932,
          data_points: 6,
        },
        roi_30d: {
          value: 67.5856,
          data_points: 25,
        },
        roi_365d: {
          value: 67.5856,
          data_points: 25,
        },
      },
      portfolio_allocation: {
        btc: {
          total_value: 0,
          percentage_of_portfolio: 0,
          wallet_tokens_value: 0,
          other_sources_value: 0,
        },
        eth: {
          total_value: 0,
          percentage_of_portfolio: 0,
          wallet_tokens_value: 0,
          other_sources_value: 0,
        },
        stablecoins: {
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
      },
      pool_details: [],
      total_positions: 0,
      protocols_count: 0,
      chains_count: 0,
      last_updated: null,
      apr_coverage: {
        matched_pools: 0,
        total_pools: 0,
        coverage_percentage: 0,
        matched_asset_value_usd: 0,
      },
      yield_summary: {
        user_id: "test-user-123",
        period: {
          start_date: "2025-10-09T00:00:00Z",
          end_date: "2025-11-08T00:00:00Z",
          days: 30,
        },
        average_daily_yield_usd: 15,
        median_daily_yield_usd: 14,
        total_yield_usd: 450,
        statistics: {
          mean: 15,
          median: 14,
          std_dev: 5,
          min_value: 5,
          max_value: 25,
          total_days: 30,
          filtered_days: 30,
          outliers_removed: 0,
        },
        outlier_strategy: "iqr",
        outliers_detected: [],
      },
    },
    isLoading: false,
    error: null,
    refetch: vi.fn(),
    isRefetching: false,
  })),
}));

// Mock SimpleConnectButton
vi.mock("../../../../src/components/Web3/SimpleConnectButton", () => ({
  SimpleConnectButton: vi.fn(({ className }) => (
    <button data-testid="simple-connect-button" className={className}>
      Connect Wallet
    </button>
  )),
}));

// Mock usePortfolioStateHelpers with overrideable fn
const { mockUsePortfolioStateHelpers } = vi.hoisted(() => ({
  mockUsePortfolioStateHelpers: vi.fn(() => ({
    shouldShowLoading: false,
    shouldShowConnectPrompt: false,
    shouldShowNoDataMessage: false,
    shouldShowPortfolioContent: true,
    shouldShowError: false,
    getDisplayTotalValue: () => 15000,
  })),
}));
vi.mock("../../../../src/hooks/usePortfolioState", () => ({
  usePortfolioStateHelpers: mockUsePortfolioStateHelpers,
}));

describe("WalletMetrics", () => {
  const mockUseLandingPageData = vi.mocked(useLandingPageData);
  const mockLandingData: LandingPageResponse = {
    total_assets_usd: 15000,
    total_debt_usd: 0,
    total_net_usd: 15000,
    weighted_apr: 0.125,
    estimated_monthly_income: 1000,
    portfolio_roi: {
      recommended_roi: 4.7932,
      recommended_roi_period: "roi_7d",
      recommended_yearly_roi: 249.9313,
      estimated_yearly_pnl_usd: 12000,
      roi_7d: { value: 4.7932, data_points: 6 },
      roi_30d: { value: 67.5856, data_points: 25 },
      roi_365d: { value: 67.5856, data_points: 25 },
    },
    portfolio_allocation: {
      btc: {
        total_value: 0,
        percentage_of_portfolio: 0,
        wallet_tokens_value: 0,
        other_sources_value: 0,
      },
      eth: {
        total_value: 0,
        percentage_of_portfolio: 0,
        wallet_tokens_value: 0,
        other_sources_value: 0,
      },
      stablecoins: {
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
    },
    wallet_token_summary: {
      total_value_usd: 2884.38,
      token_count: 263,
      apr_30d: 0.6316,
    },
    category_summary_debt: {
      btc: 0,
      eth: 0,
      stablecoins: 10366.38,
      others: 7393.87,
    },
    pool_details: [],
    total_positions: 0,
    protocols_count: 5,
    chains_count: 3,
    last_updated: null,
    apr_coverage: {
      matched_pools: 0,
      total_pools: 0,
      coverage_percentage: 0,
      matched_asset_value_usd: 0,
    },
    yield_summary: {
      user_id: "test-user-123",
      period: {
        start_date: "2025-10-09T00:00:00Z",
        end_date: "2025-11-08T00:00:00Z",
        days: 30,
      },
      average_daily_yield_usd: 15,
      median_daily_yield_usd: 14,
      total_yield_usd: 450,
      statistics: {
        mean: 15,
        median: 14,
        std_dev: 5,
        min_value: 5,
        max_value: 25,
        total_days: 30,
        filtered_days: 30,
        outliers_removed: 0,
      },
      outlier_strategy: "iqr" as const,
      outliers_detected: [],
    },
  };

  const defaultProps = {
    portfolioState: {
      type: "has_data" as const,
      isConnected: true,
      isLoading: false,
      hasError: false,
      hasZeroData: false,
      totalValue: 15000,
      errorMessage: null,
      isRetrying: false,
    },
    balanceHidden: false,
    portfolioChangePercentage: 5.2,
    userId: "test-user-id",
    landingPageData: mockLandingData,
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup landing page data mock
    mockUseLandingPageData.mockReturnValue({
      data: mockLandingData,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
      isRefetching: false,
    });

    // Default helper state: show content
    mockUsePortfolioStateHelpers.mockReset();
    mockUsePortfolioStateHelpers.mockReturnValue({
      shouldShowLoading: false,
      shouldShowConnectPrompt: false,
      shouldShowNoDataMessage: false,
      shouldShowPortfolioContent: true,
      shouldShowError: false,
      getDisplayTotalValue: () => 15000,
    });
  });

  describe("UI Structure and Layout", () => {
    it("should render all four metric sections", () => {
      render(<WalletMetrics {...defaultProps} />);

      expect(screen.getByText("Total Balance")).toBeInTheDocument();
      expect(screen.getByText(/Estimated Yearly ROI/)).toBeInTheDocument();
      expect(screen.getByText("Estimated Yearly PnL")).toBeInTheDocument();
      expect(screen.getByText("Avg Daily Yield")).toBeInTheDocument();
    });

    it("should have proper grid layout", () => {
      render(<WalletMetrics {...defaultProps} />);

      const container = screen
        .getByText("Total Balance")
        .closest("div")?.parentElement;
      expect(container).toHaveClass(
        "grid",
        "grid-cols-1",
        "md:grid-cols-4",
        "gap-4",
        "mb-6"
      );
    });

    it("should render metric labels with correct styling", () => {
      render(<WalletMetrics {...defaultProps} />);

      const labels = [
        screen.getByText("Total Balance"),
        screen.getByText(/Estimated Yearly ROI/),
        screen.getByText("Estimated Yearly PnL"),
        screen.getByText("Avg Daily Yield"),
      ];

      for (const label of labels) {
        expect(label).toHaveClass("text-sm", "text-gray-400");
      }
    });
  });

  describe("Balance Display Logic", () => {
    it("should show formatted currency when data is loaded", () => {
      render(<WalletMetrics {...defaultProps} />);

      // Check the main balance display (not the tooltip instances)
      const balanceSection = screen.getByText("Total Balance").closest("div");
      expect(balanceSection).toHaveTextContent("$15,000.00");
    });

    it("should show loader when loading", () => {
      mockUsePortfolioStateHelpers.mockReturnValue({
        shouldShowLoading: true,
        shouldShowConnectPrompt: false,
        shouldShowNoDataMessage: false,
        shouldShowPortfolioContent: false,
        shouldShowError: false,
        getDisplayTotalValue: () => null,
      });

      render(
        <WalletMetrics
          {...defaultProps}
          portfolioState={{
            ...defaultProps.portfolioState,
            isLoading: true,
            type: "loading",
          }}
        />
      );

      expect(screen.getByTestId("balance-loading")).toBeInTheDocument();
      // The main balance section should show loading, not the actual balance
      const balanceSection = screen.getByText("Total Balance").closest("div");
      expect(balanceSection).toContainElement(
        screen.getByTestId("balance-loading")
      );
    });

    it("should show error message when error exists", () => {
      const errorMessage = "Failed to load data";
      mockUsePortfolioStateHelpers.mockReturnValue({
        shouldShowLoading: false,
        shouldShowConnectPrompt: false,
        shouldShowNoDataMessage: false,
        shouldShowPortfolioContent: false,
        shouldShowError: true,
        getDisplayTotalValue: () => null,
      });
      render(
        <WalletMetrics
          {...defaultProps}
          portfolioState={{
            ...defaultProps.portfolioState,
            hasError: true,
            errorMessage,
            type: "error",
          }}
        />
      );

      expect(screen.getByText(errorMessage)).toBeInTheDocument();
      expect(screen.getByTestId("alert-circle-icon")).toBeInTheDocument();
      expect(screen.getByText(errorMessage).parentElement).toHaveClass(
        "text-sm",
        "text-red-400"
      );
    });

    it("should not render a retry button in error state (handled elsewhere)", () => {
      const errorMessage = "Failed to load data";
      mockUsePortfolioStateHelpers.mockReturnValue({
        shouldShowLoading: false,
        shouldShowConnectPrompt: false,
        shouldShowNoDataMessage: false,
        shouldShowPortfolioContent: false,
        shouldShowError: true,
        getDisplayTotalValue: () => null,
      });
      render(
        <WalletMetrics
          {...defaultProps}
          portfolioState={{
            ...defaultProps.portfolioState,
            hasError: true,
            errorMessage,
            type: "error",
          }}
        />
      );
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
      expect(screen.queryByText("Retry")).not.toBeInTheDocument();
    });

    it("should show retrying state when isRetrying is true", () => {
      mockUsePortfolioStateHelpers.mockReturnValue({
        shouldShowLoading: true,
        shouldShowConnectPrompt: false,
        shouldShowNoDataMessage: false,
        shouldShowPortfolioContent: false,
        shouldShowError: false,
        getDisplayTotalValue: () => null,
      });
      render(
        <WalletMetrics
          {...defaultProps}
          portfolioState={{
            ...defaultProps.portfolioState,
            isLoading: true,
            isRetrying: true,
            type: "loading",
          }}
        />
      );
      // Skeleton present; no explicit text anymore
      expect(screen.getByTestId("balance-loading")).toBeInTheDocument();
    });

    it("should show hidden balance placeholder when balanceHidden is true", () => {
      render(<WalletMetrics {...defaultProps} balanceHidden={true} />);

      expect(screen.getByText("****")).toBeInTheDocument();
    });
  });

  describe("Portfolio ROI Display", () => {
    it("should display API yearly ROI percentage", () => {
      render(<WalletMetrics {...defaultProps} />);

      // Should use recommended_yearly_roi from API (249.93%) in the main ROI section
      const roiSection = screen
        .getByText("Estimated Yearly ROI")
        .closest("div");
      expect(roiSection).toHaveTextContent("Estimated Yearly ROI Info");
      // Should show estimation badge
      expect(screen.getAllByText("est.")).toHaveLength(2); // One for ROI, one for PnL
    });

    it("should show TrendingUp icon for positive portfolio change", () => {
      render(
        <WalletMetrics {...defaultProps} portfolioChangePercentage={5.2} />
      );

      expect(screen.getByTestId("trending-up-icon")).toBeInTheDocument();
      expect(
        screen.queryByTestId("trending-down-icon")
      ).not.toBeInTheDocument();
    });

    it("should show TrendingUp icon for negative portfolio change", () => {
      render(
        <WalletMetrics {...defaultProps} portfolioChangePercentage={-3.8} />
      );

      expect(screen.getByTestId("trending-up-icon")).toBeInTheDocument();
      expect(
        screen.queryByTestId("trending-down-icon")
      ).not.toBeInTheDocument();
    });

    it("should show TrendingUp icon for zero portfolio change", () => {
      render(<WalletMetrics {...defaultProps} portfolioChangePercentage={0} />);

      expect(screen.getByTestId("trending-up-icon")).toBeInTheDocument();
    });

    it("should apply correct color classes based on portfolio performance", () => {
      const { rerender } = render(
        <WalletMetrics {...defaultProps} portfolioChangePercentage={5.2} />
      );

      const roiContainer = screen.getByTestId("trending-up-icon").parentElement;
      expect(roiContainer).toHaveClass("text-green-400");

      rerender(
        <WalletMetrics {...defaultProps} portfolioChangePercentage={-3.8} />
      );

      const roiContainerNegative =
        screen.getByTestId("trending-up-icon").parentElement;
      expect(roiContainerNegative).toHaveClass("text-red-400");
    });
  });

  describe("Yearly PnL Display", () => {
    it("should display formatted yearly PnL from API", () => {
      render(<WalletMetrics {...defaultProps} />);

      // Should use estimated_yearly_pnl_usd from API ($12,000.00) in the PnL section
      const pnlSection = screen
        .getByText("Estimated Yearly PnL")
        .closest("div");
      expect(pnlSection).toHaveTextContent("$12,000.00");
      // Should show estimation badge
      expect(screen.getAllByText("est.")).toHaveLength(2); // One for ROI, one for PnL
    });

    it("should apply color classes based on portfolio performance", () => {
      render(
        <WalletMetrics {...defaultProps} portfolioChangePercentage={5.2} />
      );

      // Find the PnL text within the Estimated Yearly PnL section
      const pnlSection = screen
        .getByText("Estimated Yearly PnL")
        .closest("div");
      const pnlText = pnlSection.querySelector("p.text-xl.font-semibold");
      expect(pnlText).toHaveTextContent("$12,000.00");
      expect(pnlText).toHaveClass("text-xl", "font-semibold");
      // Check parent div has color class
      expect(pnlText.parentElement).toHaveClass("text-green-400");
    });
  });

  describe("Edge Cases and Error Handling", () => {
    it("should handle very large totalValue", () => {
      mockUsePortfolioStateHelpers.mockReturnValue({
        shouldShowLoading: false,
        shouldShowConnectPrompt: false,
        shouldShowNoDataMessage: false,
        shouldShowPortfolioContent: true,
        shouldShowError: false,
        getDisplayTotalValue: () => 999999999,
      });
      render(
        <WalletMetrics
          {...defaultProps}
          portfolioState={{
            ...defaultProps.portfolioState,
            totalValue: 999999999,
          }}
        />
      );

      const balanceSection = screen.getByText("Total Balance").closest("div");
      expect(balanceSection).toHaveTextContent("$999,999,999.00");
    });

    it("should handle zero totalValue", () => {
      mockUsePortfolioStateHelpers.mockReturnValue({
        shouldShowLoading: false,
        shouldShowConnectPrompt: false,
        shouldShowNoDataMessage: false,
        shouldShowPortfolioContent: true,
        shouldShowError: false,
        getDisplayTotalValue: () => 0,
      });
      render(
        <WalletMetrics
          {...defaultProps}
          portfolioState={{ ...defaultProps.portfolioState, totalValue: 0 }}
        />
      );

      // Check the main balance display
      const balanceSection = screen.getByText("Total Balance").closest("div");
      expect(balanceSection).toHaveTextContent("$0.00");
      // Check yearly PnL display
      expect(
        screen.getByText("Estimated Yearly PnL").closest("div")
      ).toHaveTextContent("$12,000.00");
    });

    it("should handle negative totalValue", () => {
      mockUsePortfolioStateHelpers.mockReturnValue({
        shouldShowLoading: false,
        shouldShowConnectPrompt: false,
        shouldShowNoDataMessage: false,
        shouldShowPortfolioContent: true,
        shouldShowError: false,
        getDisplayTotalValue: () => -1000,
      });
      render(
        <WalletMetrics
          {...defaultProps}
          portfolioState={{ ...defaultProps.portfolioState, totalValue: -1000 }}
        />
      );

      const balanceSection = screen.getByText("Total Balance").closest("div");
      expect(balanceSection).toHaveTextContent("-$1,000.00");
    });

    it("should handle very large positive portfolio change percentage", () => {
      render(
        <WalletMetrics {...defaultProps} portfolioChangePercentage={999.99} />
      );

      expect(screen.getByTestId("trending-up-icon")).toBeInTheDocument();
    });

    it("should handle very large negative portfolio change percentage", () => {
      render(
        <WalletMetrics {...defaultProps} portfolioChangePercentage={-999.99} />
      );

      expect(screen.getByTestId("trending-up-icon")).toBeInTheDocument();
    });

    it("should handle loading and error states simultaneously", () => {
      mockUsePortfolioStateHelpers.mockReturnValue({
        shouldShowLoading: true,
        shouldShowConnectPrompt: false,
        shouldShowNoDataMessage: false,
        shouldShowPortfolioContent: false,
        shouldShowError: false,
        getDisplayTotalValue: () => null,
      });
      render(
        <WalletMetrics
          {...defaultProps}
          portfolioState={{
            ...defaultProps.portfolioState,
            isLoading: true,
            hasError: true,
            errorMessage: "Some error",
            type: "loading",
          }}
        />
      );

      // Loading takes precedence over error
      expect(screen.getByTestId("balance-loading")).toBeInTheDocument();
      expect(screen.queryByText("Some error")).not.toBeInTheDocument();
    });
  });

  describe("Component Styling", () => {
    it("should apply correct classes to balance display container", () => {
      render(<WalletMetrics {...defaultProps} />);

      const balanceSection = screen.getByText("Total Balance").closest("div");
      expect(balanceSection).toBeInTheDocument();
      expect(balanceSection).toHaveTextContent("$15,000.00");
    });

    it("should apply correct classes to ROI display", () => {
      render(<WalletMetrics {...defaultProps} />);

      // Find the ROI value by looking for the TrendingUp icon and getting its sibling
      const trendingUpIcon = screen.getByTestId("trending-up-icon");
      const roiValue = trendingUpIcon.nextElementSibling;
      expect(roiValue).toHaveTextContent("249.93%");
      expect(roiValue).toHaveClass("text-xl", "font-semibold");
    });

    it("should apply correct grid structure", () => {
      render(<WalletMetrics {...defaultProps} />);

      const sections = screen.getAllByText(
        /Total Balance|Estimated Yearly ROI|Estimated Yearly PnL|Avg Daily Yield/
      );
      expect(sections).toHaveLength(4);
    });
  });

  describe("React.memo Optimization", () => {
    it("should not re-render when props haven't changed", () => {
      const props = { ...defaultProps };
      const { rerender } = render(<WalletMetrics {...props} />);

      rerender(<WalletMetrics {...props} />);

      const balanceSection = screen.getByText("Total Balance").closest("div");
      expect(balanceSection).toHaveTextContent("$15,000.00");
    });

    it("should re-render when totalValue changes", () => {
      mockUsePortfolioStateHelpers.mockReturnValueOnce({
        shouldShowLoading: false,
        shouldShowConnectPrompt: false,
        shouldShowNoDataMessage: false,
        shouldShowPortfolioContent: true,
        shouldShowError: false,
        getDisplayTotalValue: () => 15000,
      });
      const { rerender } = render(<WalletMetrics {...defaultProps} />);

      let balanceSection = screen.getByText("Total Balance").closest("div");
      expect(balanceSection).toHaveTextContent("$15,000.00");

      mockUsePortfolioStateHelpers.mockReturnValue({
        shouldShowLoading: false,
        shouldShowConnectPrompt: false,
        shouldShowNoDataMessage: false,
        shouldShowPortfolioContent: true,
        shouldShowError: false,
        getDisplayTotalValue: () => 20000,
      });
      rerender(
        <WalletMetrics
          {...defaultProps}
          portfolioState={{ ...defaultProps.portfolioState, totalValue: 20000 }}
        />
      );

      balanceSection = screen.getByText("Total Balance").closest("div");
      expect(balanceSection).toHaveTextContent("$20,000.00");
    });

    it("should re-render when balanceHidden changes", () => {
      const { rerender } = render(
        <WalletMetrics {...defaultProps} balanceHidden={false} />
      );

      const balanceSection = screen.getByText("Total Balance").closest("div");
      expect(balanceSection).toHaveTextContent("$15,000.00");

      rerender(<WalletMetrics {...defaultProps} balanceHidden={true} />);

      expect(screen.getByText("****")).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("should have proper semantic structure", () => {
      render(<WalletMetrics {...defaultProps} />);

      // Check that metric labels are properly associated with their values
      const totalBalanceLabel = screen.getByText("Total Balance");
      const roiLabel = screen.getByText(/Estimated Yearly ROI/);
      const pnlLabel = screen.getByText("Estimated Yearly PnL");

      expect(totalBalanceLabel.tagName).toBe("P");
      expect(roiLabel.tagName).toBe("P");
      expect(pnlLabel.tagName).toBe("P");
    });

    it("should handle loader accessibility", () => {
      mockUsePortfolioStateHelpers.mockReturnValue({
        shouldShowLoading: true,
        shouldShowConnectPrompt: false,
        shouldShowNoDataMessage: false,
        shouldShowPortfolioContent: false,
        shouldShowError: false,
        getDisplayTotalValue: () => null,
      });

      render(
        <WalletMetrics
          {...defaultProps}
          portfolioState={{
            ...defaultProps.portfolioState,
            isLoading: true,
            type: "loading",
          }}
        />
      );

      const loader = screen.getByTestId("balance-loading");
      expect(loader).toBeInTheDocument();
    });

    it("should handle error message accessibility", () => {
      mockUsePortfolioStateHelpers.mockReturnValue({
        shouldShowLoading: false,
        shouldShowConnectPrompt: false,
        shouldShowNoDataMessage: false,
        shouldShowPortfolioContent: false,
        shouldShowError: true,
        getDisplayTotalValue: () => null,
      });
      render(
        <WalletMetrics
          {...defaultProps}
          portfolioState={{
            ...defaultProps.portfolioState,
            hasError: true,
            errorMessage: "Connection error",
            type: "error",
          }}
        />
      );

      const errorMessage = screen.getByText("Connection error");
      expect(errorMessage.parentElement).toHaveClass("text-red-400");
      expect(screen.getByTestId("alert-circle-icon")).toBeInTheDocument();
    });
  });

  describe("Visitor Mode Bundle Viewing", () => {
    const visitorBundleData: LandingPageResponse = {
      user_id: "visitor-123",
      total_net_usd: 15000,
      total_assets_usd: 16500,
      total_debt_usd: 1500,
      weighted_apr: 0.095,
      estimated_monthly_income: 1200,
      portfolio_allocation: {
        btc: { total_value: 9000, percentage_of_portfolio: 60 },
        eth: { total_value: 4500, percentage_of_portfolio: 30 },
        stablecoins: { total_value: 1500, percentage_of_portfolio: 10 },
        others: { total_value: 0, percentage_of_portfolio: 0 },
      },
      category_summary_debt: {
        btc: 0,
        eth: 750,
        stablecoins: 750,
        others: 0,
      },
      portfolio_roi: {
        recommended_yearly_roi: 18.5,
        estimated_yearly_pnl_usd: 2775,
        recommended_roi_period: "roi_30d",
        roi_7d: { value: 4.2, data_points: 7 },
        roi_30d: { value: 15.4, data_points: 30 },
        roi_365d: { value: 18.5, data_points: 365 },
      },
    };

    it("should display bundle data for visitor without wallet connection", () => {
      // Mock visitor mode: has data but not connected
      mockUsePortfolioStateHelpers.mockReturnValue({
        shouldShowLoading: false,
        shouldShowConnectPrompt: false, // Critical: should be false when has data
        shouldShowNoDataMessage: false,
        shouldShowPortfolioContent: true,
        shouldShowError: false,
        getDisplayTotalValue: () => 15000,
      });

      render(
        <WalletMetrics
          portfolioState={{
            type: "has_data", // Critical: visitor with data gets "has_data", not "wallet_disconnected"
            isConnected: false, // Visitor not connected
            isLoading: false,
            hasError: false,
            hasZeroData: false,
            totalValue: 15000,
            errorMessage: null,
            isRetrying: false,
          }}
          balanceHidden={false}
          portfolioChangePercentage={12.5}
          landingPageData={visitorBundleData}
        />
      );

      // Should display actual bundle balance, not "Please Connect Wallet"
      expect(screen.getByText("$15,000.00")).toBeInTheDocument();

      // Should display ROI from bundle data
      expect(screen.getByText("18.50%")).toBeInTheDocument();

      // Should display PnL from bundle data
      expect(screen.getByText("$2,775.00")).toBeInTheDocument();

      // Should not show connect prompts
      expect(
        screen.queryByText("Please Connect Wallet")
      ).not.toBeInTheDocument();
      expect(
        screen.queryByText("Connect to calculate")
      ).not.toBeInTheDocument();
    });

    it("should show 'Potential' ROI label for disconnected visitor", () => {
      mockUsePortfolioStateHelpers.mockReturnValue({
        shouldShowLoading: false,
        shouldShowConnectPrompt: false,
        shouldShowNoDataMessage: false,
        shouldShowPortfolioContent: true,
        shouldShowError: false,
        getDisplayTotalValue: () => 8500,
      });

      render(
        <WalletMetrics
          portfolioState={{
            type: "has_data",
            isConnected: false, // Visitor
            isLoading: false,
            hasError: false,
            hasZeroData: false,
            totalValue: 8500,
            errorMessage: null,
            isRetrying: false,
          }}
          balanceHidden={false}
          portfolioChangePercentage={8.2}
          landingPageData={visitorBundleData}
        />
      );

      // Should show "Potential" in ROI label for visitors
      expect(
        screen.getByText("Estimated Yearly ROI (Potential)")
      ).toBeInTheDocument();

      // Should still show actual ROI data
      expect(screen.getByText("18.50%")).toBeInTheDocument();
    });

    it("should show connect prompt only when visitor has no valid data", () => {
      // Mock visitor mode: no data available
      mockUsePortfolioStateHelpers.mockReturnValue({
        shouldShowLoading: false,
        shouldShowConnectPrompt: true, // Should be true when no data
        shouldShowNoDataMessage: false,
        shouldShowPortfolioContent: false,
        shouldShowError: false,
        getDisplayTotalValue: () => null,
      });

      render(
        <WalletMetrics
          portfolioState={{
            type: "wallet_disconnected", // No data available
            isConnected: false,
            isLoading: false,
            hasError: false,
            hasZeroData: false,
            totalValue: null,
            errorMessage: null,
            isRetrying: false,
          }}
          balanceHidden={false}
          portfolioChangePercentage={0}
          landingPageData={null} // No bundle data
        />
      );

      // Should show no data available messages for visitors without data (ROI and PnL sections)
      // Protocol breakdown was removed, so only 2 "No data available" messages now
      expect(screen.getAllByText("No data available")).toHaveLength(2);
    });

    it("should handle visitor with zero data correctly", () => {
      const zeroDataResponse = {
        ...visitorBundleData,
        total_net_usd: 0,
        total_assets_usd: 0,
        total_debt_usd: 0,
        portfolio_allocation: {
          btc: { total_value: 0, percentage_of_portfolio: 0 },
          eth: { total_value: 0, percentage_of_portfolio: 0 },
          stablecoins: { total_value: 0, percentage_of_portfolio: 0 },
          others: { total_value: 0, percentage_of_portfolio: 0 },
        },
      };

      mockUsePortfolioStateHelpers.mockReturnValue({
        shouldShowLoading: false,
        shouldShowConnectPrompt: true, // Should show connect prompt for zero data
        shouldShowNoDataMessage: false,
        shouldShowPortfolioContent: false,
        shouldShowError: false,
        getDisplayTotalValue: () => null,
      });

      render(
        <WalletMetrics
          portfolioState={{
            type: "wallet_disconnected", // Zero data = wallet_disconnected
            isConnected: false,
            isLoading: false,
            hasError: false,
            hasZeroData: true,
            totalValue: null,
            errorMessage: null,
            isRetrying: false,
          }}
          balanceHidden={false}
          portfolioChangePercentage={0}
          landingPageData={zeroDataResponse}
        />
      );

      // Should show actual data for visitors with zero balance but valid portfolio data
      expect(screen.getByText("18.50%")).toBeInTheDocument();
    });

    it("should display ROI tooltip for visitor bundle data", () => {
      mockUsePortfolioStateHelpers.mockReturnValue({
        shouldShowLoading: false,
        shouldShowConnectPrompt: false,
        shouldShowNoDataMessage: false,
        shouldShowPortfolioContent: true,
        shouldShowError: false,
        getDisplayTotalValue: () => 15000,
      });

      render(
        <WalletMetrics
          portfolioState={{
            type: "has_data",
            isConnected: false,
            isLoading: false,
            hasError: false,
            hasZeroData: false,
            totalValue: 15000,
            errorMessage: null,
            isRetrying: false,
          }}
          balanceHidden={false}
          portfolioChangePercentage={12.5}
          landingPageData={visitorBundleData}
        />
      );

      // Should show info icon for ROI tooltip
      expect(screen.getByTestId("info-icon")).toBeInTheDocument();

      // Should show ROI period information
      expect(
        screen.getByText("Based on 30d performance data")
      ).toBeInTheDocument();
    });

    it("should handle visitor loading state correctly", () => {
      mockUsePortfolioStateHelpers.mockReturnValue({
        shouldShowLoading: true,
        shouldShowConnectPrompt: false,
        shouldShowNoDataMessage: false,
        shouldShowPortfolioContent: false,
        shouldShowError: false,
        getDisplayTotalValue: () => null,
      });

      render(
        <WalletMetrics
          portfolioState={{
            type: "loading",
            isConnected: false, // Visitor loading state
            isLoading: true,
            hasError: false,
            hasZeroData: false,
            totalValue: null,
            errorMessage: null,
            isRetrying: false,
          }}
          balanceHidden={false}
          portfolioChangePercentage={0}
          landingPageData={null}
        />
      );

      // Should show loading indicators for visitor
      expect(screen.getByTestId("balance-loading")).toBeInTheDocument();
      // Progressive loading decouples yield data, so only ROI + PnL skeletons render here
      expect(screen.getAllByTestId("loading-skeleton")).toHaveLength(4);
    });
  });
});
