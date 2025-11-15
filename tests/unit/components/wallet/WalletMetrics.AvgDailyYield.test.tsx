/**
 * WalletMetrics - Average Daily Yield Progressive Disclosure Tests
 *
 * Comprehensive test suite for the Average Daily Yield feature with
 * progressive disclosure based on data availability (no_data, insufficient,
 * low_confidence, normal states).
 *
 * @see /Users/chouyasushi/htdocs/all-weather-protocol/frontend/src/components/wallet/WalletMetrics.tsx
 */

import { render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { WalletMetrics } from "@/components/wallet/WalletMetrics";
import type { LandingPageResponse } from "@/services/analyticsService";
import type { PortfolioState } from "@/types/portfolioState";

// Mock formatters - expose the mock function for assertions
const { mockFormatCurrency, mockFormatPercentage } = vi.hoisted(() => ({
  mockFormatCurrency: vi.fn((value: number) => `$${value.toFixed(2)}`),
  mockFormatPercentage: vi.fn((value: number) => `${value.toFixed(2)}%`),
}));

vi.mock("@/lib/formatters", () => ({
  formatCurrency: mockFormatCurrency,
  formatPercentage: mockFormatPercentage,
}));

// Mock useResolvedBalanceVisibility
vi.mock("@/hooks/useResolvedBalanceVisibility", () => ({
  useResolvedBalanceVisibility: () => false,
}));

// Mock usePortfolioStateHelpers
const mockPortfolioHelpers = {
  shouldShowLoading: false,
  shouldShowNoDataMessage: false,
  shouldShowError: false,
  getDisplayTotalValue: () => 10000,
};

vi.mock("@/hooks/usePortfolioState", () => ({
  usePortfolioStateHelpers: () => mockPortfolioHelpers,
}));

// Mock ROI helpers
vi.mock("@/lib/roi", () => ({
  deriveRoiWindowSortScore: () => 0,
  formatRoiWindowLabel: (key: string) => key.replace("roi_", ""),
}));

// =============================================================================
// TEST DATA FACTORIES
// =============================================================================

/**
 * Create a minimal PortfolioState for testing
 */
function createPortfolioState(
  overrides: Partial<PortfolioState> = {}
): PortfolioState {
  return {
    type: "has_data",
    isConnected: true,
    isLoading: false,
    hasError: false,
    hasZeroData: false,
    totalValue: 10000,
    errorMessage: null,
    isRetrying: false,
    ...overrides,
  };
}

/**
 * Create a complete LandingPageResponse with customizable yield_summary
 */
function createLandingPageData(
  yieldSummaryOverrides: Partial<
    NonNullable<LandingPageResponse["yield_summary"]>
  > = {}
): LandingPageResponse {
  const baseData: LandingPageResponse = {
    total_assets_usd: 10000,
    total_debt_usd: 0,
    total_net_usd: 10000,
    weighted_apr: 5.5,
    estimated_monthly_income: 45.83,
    portfolio_roi: {
      recommended_roi: 5.5,
      recommended_period: "roi_30d",
      recommended_yearly_roi: 5.5,
      estimated_yearly_pnl_usd: 550,
      windows: {
        roi_30d: {
          value: 5.5,
          data_points: 30,
          start_balance: 10000,
        },
      },
    },
    portfolio_allocation: {
      btc: {
        total_value: 2500,
        percentage_of_portfolio: 25,
        wallet_tokens_value: 2500,
        other_sources_value: 0,
      },
      eth: {
        total_value: 2500,
        percentage_of_portfolio: 25,
        wallet_tokens_value: 2500,
        other_sources_value: 0,
      },
      stablecoins: {
        total_value: 5000,
        percentage_of_portfolio: 50,
        wallet_tokens_value: 5000,
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
      total_value_usd: 10000,
      token_count: 5,
      apr_30d: 5.5,
    },
    category_summary_debt: {
      btc: 0,
      eth: 0,
      stablecoins: 0,
      others: 0,
    },
    pool_details: [],
    total_positions: 3,
    protocols_count: 2,
    chains_count: 1,
    last_updated: "2025-01-09T12:00:00Z",
    apr_coverage: {
      matched_pools: 3,
      total_pools: 3,
      coverage_percentage: 100,
      matched_asset_value_usd: 10000,
    },
  };

  // Add yield_summary if overrides provided
  if (Object.keys(yieldSummaryOverrides).length > 0) {
    baseData.yield_summary = yieldSummaryOverrides as any;
  }

  return baseData;
}

/**
 * Factory for creating yield_summary with specific filtered_days
 */
function createYieldSummaryWithDays(
  filteredDays: number,
  avgDailyYield = 1.5,
  outliersRemoved = 0
): NonNullable<LandingPageResponse["yield_summary"]> {
  return {
    user_id: "0x123",
    windows: {
      "30d": {
        user_id: "0x123",
        period: {
          start_date: "2025-01-01",
          end_date: "2025-01-09",
          days: filteredDays,
        },
        average_daily_yield_usd: avgDailyYield,
        median_daily_yield_usd: avgDailyYield * 0.95,
        total_yield_usd: avgDailyYield * filteredDays,
        statistics: {
          mean: avgDailyYield,
          median: avgDailyYield * 0.95,
          std_dev: 0.3,
          min_value: 0.8,
          max_value: 2.2,
          total_days: filteredDays,
          filtered_days: filteredDays,
          outliers_removed: outliersRemoved,
        },
        outlier_strategy: "iqr" as const,
        outliers_detected: [],
        protocol_breakdown:
          outliersRemoved > 0
            ? [
                {
                  protocol: "Aave",
                  chain: "Ethereum",
                  window: {
                    total_yield_usd: avgDailyYield * filteredDays * 0.5,
                    average_daily_yield_usd: avgDailyYield * 0.5,
                    data_points: filteredDays,
                    positive_days: Math.floor(filteredDays * 0.7),
                    negative_days: Math.floor(filteredDays * 0.3),
                  },
                  today: {
                    date: "2025-01-09",
                    yield_usd: avgDailyYield * 0.5,
                  },
                },
              ]
            : [],
      },
    },
    recommended_period: "30d",
  };
}

// =============================================================================
// TEST SUITE
// =============================================================================

describe("WalletMetrics - Average Daily Yield Display", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPortfolioHelpers.shouldShowLoading = false;
    mockPortfolioHelpers.shouldShowNoDataMessage = false;
    mockPortfolioHelpers.shouldShowError = false;
  });

  // ===========================================================================
  // STATE: NO DATA (0 days)
  // ===========================================================================

  describe("State: No Data (0 days)", () => {
    it("shows educational message with Clock icon when no yield_summary", () => {
      const portfolioState = createPortfolioState();
      const landingPageData = createLandingPageData(); // No yield_summary

      render(
        <WalletMetrics
          portfolioState={portfolioState}
          portfolioChangePercentage={5.5}
          landingPageData={landingPageData}
        />
      );

      // Should show "Available in 1 day" message
      expect(screen.getByText("Available in 1 day")).toBeInTheDocument();

      // Should show educational text
      expect(
        screen.getByText("After 24 hours of portfolio activity")
      ).toBeInTheDocument();

      // Verify the message has purple styling
      const availableMessage = screen.getByText("Available in 1 day");
      const messageContainer = availableMessage.closest("div");
      expect(messageContainer).toHaveClass("text-purple-400");
    });

    it("shows educational message when average_daily_yield_usd is null", () => {
      const portfolioState = createPortfolioState();
      const landingPageData = createLandingPageData({
        average_daily_yield_usd: null as any,
        statistics: createYieldSummaryWithDays(0).statistics,
      });

      render(
        <WalletMetrics
          portfolioState={portfolioState}
          portfolioChangePercentage={5.5}
          landingPageData={landingPageData}
        />
      );

      expect(screen.getByText("Available in 1 day")).toBeInTheDocument();
      expect(
        screen.getByText("After 24 hours of portfolio activity")
      ).toBeInTheDocument();
    });

    it("shows insufficient state when filtered_days is 0 but has avgDailyYield", () => {
      const portfolioState = createPortfolioState();
      const landingPageData = createLandingPageData(
        createYieldSummaryWithDays(0, 1.5)
      );

      render(
        <WalletMetrics
          portfolioState={portfolioState}
          portfolioChangePercentage={5.5}
          landingPageData={landingPageData}
        />
      );

      // When filtered_days is 0 but avgDailyYield exists, shows insufficient state
      expect(screen.getByText("Preliminary")).toBeInTheDocument();
      expect(screen.getByText("Early estimate (0/7 days)")).toBeInTheDocument();
    });

    it("applies correct styling for no-data state (purple text)", () => {
      const portfolioState = createPortfolioState();
      const landingPageData = createLandingPageData();

      render(
        <WalletMetrics
          portfolioState={portfolioState}
          portfolioChangePercentage={5.5}
          landingPageData={landingPageData}
        />
      );

      const message = screen.getByText("Available in 1 day");
      const messageContainer = message.closest("div");

      expect(messageContainer).toHaveClass("text-purple-400");
    });
  });

  // ===========================================================================
  // STATE: INSUFFICIENT (1-6 days)
  // ===========================================================================

  describe("State: Insufficient (1-6 days)", () => {
    it.each([
      [1, "Early estimate (1/7 days)"],
      [3, "Early estimate (3/7 days)"],
      [6, "Early estimate (6/7 days)"],
    ])(
      "shows value with yellow Preliminary badge for %i days",
      (days, expectedText) => {
        const portfolioState = createPortfolioState();
        const landingPageData = createLandingPageData(
          createYieldSummaryWithDays(days, 123.45)
        );

        render(
          <WalletMetrics
            portfolioState={portfolioState}
            portfolioChangePercentage={5.5}
            landingPageData={landingPageData}
          />
        );

        // Should show formatted value
        expect(mockFormatCurrency).toHaveBeenCalledWith(123.45, {
          smartPrecision: true,
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        });

        // Should show Preliminary badge
        const badge = screen.getByText("Preliminary");
        expect(badge).toBeInTheDocument();
        expect(badge).toHaveClass("bg-yellow-900/20", "text-yellow-400");

        // Should show day count explanation
        expect(screen.getByText(expectedText)).toBeInTheDocument();
      }
    );

    it("shows correct emerald color for value text", () => {
      const portfolioState = createPortfolioState();
      const landingPageData = createLandingPageData(
        createYieldSummaryWithDays(3, 50.0)
      );

      const { container } = render(
        <WalletMetrics
          portfolioState={portfolioState}
          portfolioChangePercentage={5.5}
          landingPageData={landingPageData}
        />
      );

      // Find the value container (parent of the formatted currency text)
      const valueContainer = container.querySelector(".text-emerald-300");
      expect(valueContainer).toBeInTheDocument();
    });

    it("shows outlier info icon even for insufficient data when outliers_removed > 0", () => {
      const portfolioState = createPortfolioState();
      const landingPageData = createLandingPageData(
        createYieldSummaryWithDays(3, 50.0, 2) // 2 outliers removed
      );

      render(
        <WalletMetrics
          portfolioState={portfolioState}
          portfolioChangePercentage={5.5}
          landingPageData={landingPageData}
        />
      );

      // Outlier info should still be shown if outliers_removed > 0
      const titleElement = screen.getByTitle(
        /2 outliers removed for accuracy \(IQR method\)/
      );
      expect(titleElement).toBeInTheDocument();
    });
  });

  // ===========================================================================
  // STATE: LOW CONFIDENCE (7-29 days)
  // ===========================================================================

  describe("State: Low Confidence (7-29 days)", () => {
    it.each([
      [7, "Based on 7 days"],
      [15, "Based on 15 days"],
      [29, "Based on 29 days"],
    ])(
      "shows value with blue Improving badge for %i days",
      (days, expectedText) => {
        const portfolioState = createPortfolioState();
        const landingPageData = createLandingPageData(
          createYieldSummaryWithDays(days, 75.99)
        );

        render(
          <WalletMetrics
            portfolioState={portfolioState}
            portfolioChangePercentage={5.5}
            landingPageData={landingPageData}
          />
        );

        // Should show formatted value
        expect(mockFormatCurrency).toHaveBeenCalledWith(75.99, {
          smartPrecision: true,
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        });

        // Should show Improving badge
        const badge = screen.getByText("Improving");
        expect(badge).toBeInTheDocument();
        expect(badge).toHaveClass("bg-blue-900/20", "text-blue-400");

        // Should show day count explanation
        expect(screen.getByText(expectedText)).toBeInTheDocument();
      }
    );

    it("applies emerald color for value text", () => {
      const portfolioState = createPortfolioState();
      const landingPageData = createLandingPageData(
        createYieldSummaryWithDays(20, 100.0)
      );

      const { container } = render(
        <WalletMetrics
          portfolioState={portfolioState}
          portfolioChangePercentage={5.5}
          landingPageData={landingPageData}
        />
      );

      const valueContainer = container.querySelector(".text-emerald-300");
      expect(valueContainer).toBeInTheDocument();
    });
  });

  // ===========================================================================
  // STATE: NORMAL (30+ days)
  // ===========================================================================

  describe("State: Normal (30+ days)", () => {
    it.each([
      [30, 150.0],
      [60, 200.5],
      [90, 300.75],
    ])("shows value without badge for %i days with $%f", (days, value) => {
      const portfolioState = createPortfolioState();
      const landingPageData = createLandingPageData(
        createYieldSummaryWithDays(days, value)
      );

      render(
        <WalletMetrics
          portfolioState={portfolioState}
          portfolioChangePercentage={5.5}
          landingPageData={landingPageData}
        />
      );

      // Should show formatted value
      expect(mockFormatCurrency).toHaveBeenCalledWith(value, {
        smartPrecision: true,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });

      // Should NOT show any badge
      expect(screen.queryByText("Preliminary")).not.toBeInTheDocument();
      expect(screen.queryByText("Improving")).not.toBeInTheDocument();

      // Should NOT show day count explanation
      expect(screen.queryByText(/Based on \d+ days/)).not.toBeInTheDocument();
      expect(screen.queryByText(/Early estimate/)).not.toBeInTheDocument();
    });

    it("applies emerald color for value text", () => {
      const portfolioState = createPortfolioState();
      const landingPageData = createLandingPageData(
        createYieldSummaryWithDays(30, 200.0)
      );

      const { container } = render(
        <WalletMetrics
          portfolioState={portfolioState}
          portfolioChangePercentage={5.5}
          landingPageData={landingPageData}
        />
      );

      const valueContainer = container.querySelector(".text-emerald-300");
      expect(valueContainer).toBeInTheDocument();
    });

    it("shows clean value display without explanatory text", () => {
      const portfolioState = createPortfolioState();
      const landingPageData = createLandingPageData(
        createYieldSummaryWithDays(45, 250.0)
      );

      render(
        <WalletMetrics
          portfolioState={portfolioState}
          portfolioChangePercentage={5.5}
          landingPageData={landingPageData}
        />
      );

      // Find the Avg Daily Yield section
      const avgYieldLabel = screen.getByText("Avg Daily Yield");
      const avgYieldSection = avgYieldLabel.closest("div");

      // Should not have any explanatory text elements
      const textElements = within(avgYieldSection!).queryAllByText(
        /Early estimate|Based on|Available in/
      );
      expect(textElements).toHaveLength(0);
    });
  });

  // ===========================================================================
  // OUTLIER INFO ICON
  // ===========================================================================

  describe("Outlier Info Icon", () => {
    it("shows info icon when outliers_removed > 0", () => {
      const portfolioState = createPortfolioState();
      const landingPageData = createLandingPageData(
        createYieldSummaryWithDays(30, 150.0, 3) // 3 outliers removed
      );

      render(
        <WalletMetrics
          portfolioState={portfolioState}
          portfolioChangePercentage={5.5}
          landingPageData={landingPageData}
        />
      );

      const avgYieldLabel = screen.getByText("Avg Daily Yield");
      const avgYieldSection = avgYieldLabel.closest("div");

      // Should have title attribute with outlier info
      const titleElement = within(avgYieldSection!).getByTitle(
        /3 outliers removed for accuracy \(IQR method\)/
      );
      expect(titleElement).toBeInTheDocument();
    });

    it("shows correct singular text for 1 outlier", () => {
      const portfolioState = createPortfolioState();
      const landingPageData = createLandingPageData(
        createYieldSummaryWithDays(30, 150.0, 1) // 1 outlier removed
      );

      render(
        <WalletMetrics
          portfolioState={portfolioState}
          portfolioChangePercentage={5.5}
          landingPageData={landingPageData}
        />
      );

      const avgYieldLabel = screen.getByText("Avg Daily Yield");
      const avgYieldSection = avgYieldLabel.closest("div");

      const titleElement = within(avgYieldSection!).getByTitle(
        /1 outlier removed for accuracy \(IQR method\)/
      );
      expect(titleElement).toBeInTheDocument();
    });

    it("does NOT show info icon when outliers_removed is 0", () => {
      const portfolioState = createPortfolioState();
      const landingPageData = createLandingPageData(
        createYieldSummaryWithDays(30, 150.0, 0)
      );

      render(
        <WalletMetrics
          portfolioState={portfolioState}
          portfolioChangePercentage={5.5}
          landingPageData={landingPageData}
        />
      );

      const avgYieldLabel = screen.getByText("Avg Daily Yield");
      const avgYieldSection = avgYieldLabel.closest("div");

      // Should not have outlier info title
      const titleElements = within(avgYieldSection!).queryAllByTitle(
        /outlier/i
      );
      expect(titleElements).toHaveLength(0);
    });
  });

  // ===========================================================================
  // LOADING STATES
  // ===========================================================================

  describe("Loading States", () => {
    it("shows skeleton while yield data is still loading", () => {
      const portfolioState = createPortfolioState({ isLoading: false });
      const landingPageData = createLandingPageData(
        createYieldSummaryWithDays(30, 150.0)
      );

      render(
        <WalletMetrics
          portfolioState={portfolioState}
          portfolioChangePercentage={5.5}
          landingPageData={landingPageData}
          isYieldLoading
        />
      );

      // Should NOT show the formatted value or badges
      expect(screen.queryByText("Preliminary")).not.toBeInTheDocument();
      expect(screen.queryByText("Improving")).not.toBeInTheDocument();
      expect(screen.queryByText("Available in 1 day")).not.toBeInTheDocument();

      // formatCurrency should not be called for avg daily yield
      expect(mockFormatCurrency).not.toHaveBeenCalledWith(150.0, {
        smartPrecision: true,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    });

    it("keeps showing latest yield data even if portfolio state is loading", () => {
      const portfolioState = createPortfolioState({ isLoading: true });
      const landingPageData = createLandingPageData(
        createYieldSummaryWithDays(30, 150.0)
      );

      mockPortfolioHelpers.shouldShowLoading = true;

      render(
        <WalletMetrics
          portfolioState={portfolioState}
          portfolioChangePercentage={5.5}
          landingPageData={landingPageData}
        />
      );

      // Progressive loading keeps yield data visible
      expect(screen.getByText("$150.00")).toBeInTheDocument();
      expect(screen.queryByText("Available in 1 day")).not.toBeInTheDocument();
    });

    it("shows no-data message when landingPageData is null (not loading)", () => {
      const portfolioState = createPortfolioState({ isLoading: false });

      render(
        <WalletMetrics
          portfolioState={portfolioState}
          portfolioChangePercentage={5.5}
          landingPageData={null}
        />
      );

      // When not loading and no data, shows educational message
      expect(screen.getByText("Available in 1 day")).toBeInTheDocument();
    });

    it("shows no-data message when landingPageData is undefined (not loading)", () => {
      const portfolioState = createPortfolioState({ isLoading: false });

      render(
        <WalletMetrics
          portfolioState={portfolioState}
          portfolioChangePercentage={5.5}
          landingPageData={undefined}
        />
      );

      // When not loading and no data, shows educational message
      expect(screen.getByText("Available in 1 day")).toBeInTheDocument();
    });
  });

  // ===========================================================================
  // ERROR STATES
  // ===========================================================================

  describe("Error States", () => {
    it("shows WelcomeNewUser when errorMessage is USER_NOT_FOUND", () => {
      const portfolioState = createPortfolioState({
        hasError: true,
        errorMessage: "USER_NOT_FOUND",
      });

      mockPortfolioHelpers.shouldShowError = true;

      render(
        <WalletMetrics
          portfolioState={portfolioState}
          portfolioChangePercentage={0}
          landingPageData={null}
        />
      );

      // Should NOT render the grid (WalletMetrics returns WelcomeNewUser)
      expect(screen.queryByText("Avg Daily Yield")).not.toBeInTheDocument();
    });

    it("shows regular error message for non-USER_NOT_FOUND errors", () => {
      const portfolioState = createPortfolioState({
        hasError: true,
        errorMessage: "Network error",
      });

      mockPortfolioHelpers.shouldShowError = true;

      render(
        <WalletMetrics
          portfolioState={portfolioState}
          portfolioChangePercentage={0}
          landingPageData={null}
        />
      );

      // Should show error message in Total Balance section
      expect(screen.getByText("Network error")).toBeInTheDocument();
    });
  });

  // ===========================================================================
  // STATE TRANSITIONS
  // ===========================================================================

  describe("State Transitions", () => {
    it("transitions from no_data → insufficient → low_confidence → normal", () => {
      const portfolioState = createPortfolioState();

      // State 1: No data (0 days)
      const { rerender } = render(
        <WalletMetrics
          portfolioState={portfolioState}
          portfolioChangePercentage={5.5}
          landingPageData={createLandingPageData()}
        />
      );
      expect(screen.getByText("Available in 1 day")).toBeInTheDocument();

      // State 2: Insufficient (3 days)
      rerender(
        <WalletMetrics
          portfolioState={portfolioState}
          portfolioChangePercentage={5.5}
          landingPageData={createLandingPageData(
            createYieldSummaryWithDays(3, 50.0)
          )}
        />
      );
      expect(screen.getByText("Preliminary")).toBeInTheDocument();
      expect(screen.getByText("Early estimate (3/7 days)")).toBeInTheDocument();

      // State 3: Low confidence (15 days)
      rerender(
        <WalletMetrics
          portfolioState={portfolioState}
          portfolioChangePercentage={5.5}
          landingPageData={createLandingPageData(
            createYieldSummaryWithDays(15, 75.0)
          )}
        />
      );
      expect(screen.getByText("Improving")).toBeInTheDocument();
      expect(screen.getByText("Based on 15 days")).toBeInTheDocument();

      // State 4: Normal (30 days)
      rerender(
        <WalletMetrics
          portfolioState={portfolioState}
          portfolioChangePercentage={5.5}
          landingPageData={createLandingPageData(
            createYieldSummaryWithDays(30, 100.0)
          )}
        />
      );
      expect(screen.queryByText("Preliminary")).not.toBeInTheDocument();
      expect(screen.queryByText("Improving")).not.toBeInTheDocument();
      // Note: "Based on" may appear in ROI section, so check specifically for yield context
      expect(screen.queryByText("Based on 15 days")).not.toBeInTheDocument();
      expect(screen.queryByText("Early estimate")).not.toBeInTheDocument();
    });
  });

  // ===========================================================================
  // EDGE CASES
  // ===========================================================================

  describe("Edge Cases", () => {
    it("handles boundary case: exactly 7 days (should be low_confidence)", () => {
      const portfolioState = createPortfolioState();
      const landingPageData = createLandingPageData(
        createYieldSummaryWithDays(7, 50.0)
      );

      render(
        <WalletMetrics
          portfolioState={portfolioState}
          portfolioChangePercentage={5.5}
          landingPageData={landingPageData}
        />
      );

      // 7 days should show "Improving" badge (low_confidence state)
      expect(screen.getByText("Improving")).toBeInTheDocument();
      expect(screen.getByText("Based on 7 days")).toBeInTheDocument();
    });

    it("handles boundary case: exactly 30 days (should be normal)", () => {
      const portfolioState = createPortfolioState();
      const landingPageData = createLandingPageData(
        createYieldSummaryWithDays(30, 100.0)
      );

      render(
        <WalletMetrics
          portfolioState={portfolioState}
          portfolioChangePercentage={5.5}
          landingPageData={landingPageData}
        />
      );

      // 30 days should show no badge (normal state)
      expect(screen.queryByText("Preliminary")).not.toBeInTheDocument();
      expect(screen.queryByText("Improving")).not.toBeInTheDocument();
    });

    it("handles very large avgDailyYieldUsd values", () => {
      const portfolioState = createPortfolioState();
      const landingPageData = createLandingPageData(
        createYieldSummaryWithDays(30, 999999.99)
      );

      render(
        <WalletMetrics
          portfolioState={portfolioState}
          portfolioChangePercentage={5.5}
          landingPageData={landingPageData}
        />
      );

      expect(mockFormatCurrency).toHaveBeenCalledWith(999999.99, {
        smartPrecision: true,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    });

    it("handles very small avgDailyYieldUsd values (< $0.01)", () => {
      const portfolioState = createPortfolioState();
      const landingPageData = createLandingPageData(
        createYieldSummaryWithDays(30, 0.005)
      );

      render(
        <WalletMetrics
          portfolioState={portfolioState}
          portfolioChangePercentage={5.5}
          landingPageData={landingPageData}
        />
      );

      // formatCurrency should be called with smartPrecision: true
      expect(mockFormatCurrency).toHaveBeenCalledWith(0.005, {
        smartPrecision: true,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    });

    it("handles negative avgDailyYieldUsd values", () => {
      const portfolioState = createPortfolioState();
      const landingPageData = createLandingPageData(
        createYieldSummaryWithDays(30, -50.0)
      );

      render(
        <WalletMetrics
          portfolioState={portfolioState}
          portfolioChangePercentage={5.5}
          landingPageData={landingPageData}
        />
      );

      expect(mockFormatCurrency).toHaveBeenCalledWith(-50.0, {
        smartPrecision: true,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    });

    it("handles zero avgDailyYieldUsd with 30+ days", () => {
      const portfolioState = createPortfolioState();
      const landingPageData = createLandingPageData(
        createYieldSummaryWithDays(30, 0)
      );

      render(
        <WalletMetrics
          portfolioState={portfolioState}
          portfolioChangePercentage={5.5}
          landingPageData={landingPageData}
        />
      );

      expect(mockFormatCurrency).toHaveBeenCalledWith(0, {
        smartPrecision: true,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    });
  });

  // ===========================================================================
  // ACCESSIBILITY
  // ===========================================================================

  describe("Accessibility", () => {
    it("has accessible label for Avg Daily Yield section", () => {
      const portfolioState = createPortfolioState();
      const landingPageData = createLandingPageData(
        createYieldSummaryWithDays(30, 150.0)
      );

      render(
        <WalletMetrics
          portfolioState={portfolioState}
          portfolioChangePercentage={5.5}
          landingPageData={landingPageData}
        />
      );

      const label = screen.getByText("Avg Daily Yield");
      expect(label).toBeInTheDocument();
      expect(label).toHaveClass("text-sm", "text-gray-400");
    });

    it("provides descriptive title for outlier info icon", () => {
      const portfolioState = createPortfolioState();
      const landingPageData = createLandingPageData(
        createYieldSummaryWithDays(30, 150.0, 5)
      );

      render(
        <WalletMetrics
          portfolioState={portfolioState}
          portfolioChangePercentage={5.5}
          landingPageData={landingPageData}
        />
      );

      const titleElement = screen.getByTitle(
        /5 outliers removed for accuracy \(IQR method\)/
      );
      expect(titleElement).toBeInTheDocument();
    });

    it("uses semantic HTML for badge elements", () => {
      const portfolioState = createPortfolioState();
      const landingPageData = createLandingPageData(
        createYieldSummaryWithDays(3, 50.0)
      );

      render(
        <WalletMetrics
          portfolioState={portfolioState}
          portfolioChangePercentage={5.5}
          landingPageData={landingPageData}
        />
      );

      const badge = screen.getByText("Preliminary");
      expect(badge.tagName).toBe("SPAN");
      expect(badge).toHaveClass("text-xs", "font-medium", "rounded-full");
    });
  });

  // ===========================================================================
  // INTEGRATION WITH OTHER METRICS
  // ===========================================================================

  describe("Integration with Other Metrics", () => {
    it("renders all four metric sections including Avg Daily Yield", () => {
      const portfolioState = createPortfolioState();
      const landingPageData = createLandingPageData(
        createYieldSummaryWithDays(30, 150.0)
      );

      render(
        <WalletMetrics
          portfolioState={portfolioState}
          portfolioChangePercentage={5.5}
          landingPageData={landingPageData}
        />
      );

      expect(screen.getByText("Total Balance")).toBeInTheDocument();
      expect(screen.getByText(/Estimated Yearly ROI/)).toBeInTheDocument();
      expect(screen.getByText("Estimated Yearly PnL")).toBeInTheDocument();
      expect(screen.getByText("Avg Daily Yield")).toBeInTheDocument();
    });

    it("maintains grid layout with 4 columns", () => {
      const portfolioState = createPortfolioState();
      const landingPageData = createLandingPageData(
        createYieldSummaryWithDays(30, 150.0)
      );

      const { container } = render(
        <WalletMetrics
          portfolioState={portfolioState}
          portfolioChangePercentage={5.5}
          landingPageData={landingPageData}
        />
      );

      const grid = container.querySelector(".grid");
      expect(grid).toHaveClass("grid-cols-1", "md:grid-cols-4");
    });
  });
});
