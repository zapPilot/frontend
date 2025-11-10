/**
 * Comprehensive tests for WalletMetrics component
 *
 * Tests cover:
 * - Progressive disclosure for Average Daily Yield (0, 1-6, 7-29, 30+ days)
 * - Loading states and error handling
 * - Outlier info icon visibility
 * - Badge rendering and colors
 * - Accessibility and ARIA labels
 */

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { LandingPageResponse } from "../../../services/analyticsService";
import type { PortfolioState } from "../../../types/portfolioState";
import { WalletMetrics } from "../WalletMetrics";

// ==================== MOCK DATA FACTORIES ====================

const createMockPortfolioState = (
  overrides?: Partial<PortfolioState>
): PortfolioState => {
  const base: PortfolioState = {
    type: "has_data",
    isConnected: true,
    isLoading: false,
    hasError: false,
    hasZeroData: false,
    totalValue: 10000,
    errorMessage: null,
    isRetrying: false,
  };

  const state: PortfolioState = {
    ...base,
    ...overrides,
  };

  if (state.errorMessage && overrides?.hasError === undefined) {
    state.hasError = true;
    state.type = overrides?.type ?? "error";
  }

  return state;
};

const createMockLandingPageData = (
  overrides?: Partial<LandingPageResponse>
): LandingPageResponse =>
  ({
    portfolio_roi: {
      windows: {
        roi_30d: { value: 0.15, data_points: 30 },
      },
      recommended_roi: 15.0,
      recommended_period: "roi_30d",
      recommended_yearly_roi: 15.0,
      estimated_yearly_pnl_usd: 1500.0,
    },
    yield_summary: {
      average_daily_yield_usd: 123.45,
      median_daily_yield_usd: 120.0,
      total_yield_usd: 3703.5,
      statistics: {
        mean: 123.45,
        median: 120.0,
        std_dev: 15.2,
        min_value: 95.0,
        max_value: 150.0,
        total_days: 30,
        filtered_days: 30,
        outliers_removed: 0,
      },
      outlier_strategy: "iqr",
      outliers_detected: [],
    },
    ...overrides,
  }) as LandingPageResponse;

// ==================== NO DATA STATE TESTS ====================

describe("WalletMetrics - No Data State (0 days)", () => {
  it("should show educational message for zero days of data", () => {
    const portfolioState = createMockPortfolioState();
    const landingPageData = createMockLandingPageData({
      yield_summary: {
        ...createMockLandingPageData().yield_summary!,
        average_daily_yield_usd: null as any,
        statistics: {
          ...createMockLandingPageData().yield_summary!.statistics,
          filtered_days: 0,
        },
      },
    });

    render(
      <WalletMetrics
        portfolioState={portfolioState}
        portfolioChangePercentage={5.2}
        landingPageData={landingPageData}
      />
    );

    expect(screen.getByText("Available in 1 day")).toBeInTheDocument();
    expect(
      screen.getByText("After 24 hours of portfolio activity")
    ).toBeInTheDocument();
  });

  it("should render Clock icon for no data state", () => {
    const portfolioState = createMockPortfolioState();
    const landingPageData = createMockLandingPageData();
    delete landingPageData.yield_summary;

    const { container } = render(
      <WalletMetrics
        portfolioState={portfolioState}
        portfolioChangePercentage={0}
        landingPageData={landingPageData}
      />
    );

    // Clock icon should be present (lucide-react renders as svg)
    const clockIcon = container.querySelector("svg");
    expect(clockIcon).toBeInTheDocument();
  });

  it("should use purple color for no data message", () => {
    const portfolioState = createMockPortfolioState();
    const landingPageData = createMockLandingPageData();
    delete landingPageData.yield_summary;

    render(
      <WalletMetrics
        portfolioState={portfolioState}
        portfolioChangePercentage={0}
        landingPageData={landingPageData}
      />
    );

    const messageElement = screen
      .getByText("Available in 1 day")
      .closest("div");
    expect(messageElement).toHaveClass("text-purple-400");
  });
});

// ==================== INSUFFICIENT DATA STATE TESTS ====================

describe("WalletMetrics - Insufficient Data (1-6 days)", () => {
  it("should show value with Preliminary badge for 1 day", () => {
    const portfolioState = createMockPortfolioState();
    const landingPageData = createMockLandingPageData({
      yield_summary: {
        ...createMockLandingPageData().yield_summary!,
        statistics: {
          ...createMockLandingPageData().yield_summary!.statistics,
          filtered_days: 1,
        },
      },
    });

    render(
      <WalletMetrics
        portfolioState={portfolioState}
        portfolioChangePercentage={0}
        landingPageData={landingPageData}
      />
    );

    expect(screen.getByText("Preliminary")).toBeInTheDocument();
    expect(screen.getByText("Early estimate (1/7 days)")).toBeInTheDocument();
  });

  it("should show value with Preliminary badge for 6 days", () => {
    const portfolioState = createMockPortfolioState();
    const landingPageData = createMockLandingPageData({
      yield_summary: {
        ...createMockLandingPageData().yield_summary!,
        statistics: {
          ...createMockLandingPageData().yield_summary!.statistics,
          filtered_days: 6,
        },
      },
    });

    render(
      <WalletMetrics
        portfolioState={portfolioState}
        portfolioChangePercentage={0}
        landingPageData={landingPageData}
      />
    );

    expect(screen.getByText("Preliminary")).toBeInTheDocument();
    expect(screen.getByText("Early estimate (6/7 days)")).toBeInTheDocument();
  });

  it("should use yellow badge color for insufficient data", () => {
    const portfolioState = createMockPortfolioState();
    const landingPageData = createMockLandingPageData({
      yield_summary: {
        ...createMockLandingPageData().yield_summary!,
        statistics: {
          ...createMockLandingPageData().yield_summary!.statistics,
          filtered_days: 3,
        },
      },
    });

    render(
      <WalletMetrics
        portfolioState={portfolioState}
        portfolioChangePercentage={0}
        landingPageData={landingPageData}
      />
    );

    const badge = screen.getByText("Preliminary");
    expect(badge).toHaveClass("bg-yellow-900/20", "text-yellow-400");
  });

  it("should display formatted currency value", () => {
    const portfolioState = createMockPortfolioState();
    const landingPageData = createMockLandingPageData({
      yield_summary: {
        ...createMockLandingPageData().yield_summary!,
        average_daily_yield_usd: 123.45,
        statistics: {
          ...createMockLandingPageData().yield_summary!.statistics,
          filtered_days: 5,
        },
      },
    });

    render(
      <WalletMetrics
        portfolioState={portfolioState}
        portfolioChangePercentage={0}
        landingPageData={landingPageData}
      />
    );

    // formatCurrency should format to $123.45
    expect(screen.getByText(/\$123\.45/)).toBeInTheDocument();
  });
});

// ==================== LOW CONFIDENCE STATE TESTS ====================

describe("WalletMetrics - Low Confidence (7-29 days)", () => {
  it("should show value with Improving badge for 7 days", () => {
    const portfolioState = createMockPortfolioState();
    const landingPageData = createMockLandingPageData({
      yield_summary: {
        ...createMockLandingPageData().yield_summary!,
        statistics: {
          ...createMockLandingPageData().yield_summary!.statistics,
          filtered_days: 7,
        },
      },
    });

    render(
      <WalletMetrics
        portfolioState={portfolioState}
        portfolioChangePercentage={0}
        landingPageData={landingPageData}
      />
    );

    expect(screen.getByText("Improving")).toBeInTheDocument();
    expect(screen.getByText("Based on 7 days")).toBeInTheDocument();
  });

  it("should show value with Improving badge for 29 days", () => {
    const portfolioState = createMockPortfolioState();
    const landingPageData = createMockLandingPageData({
      yield_summary: {
        ...createMockLandingPageData().yield_summary!,
        statistics: {
          ...createMockLandingPageData().yield_summary!.statistics,
          filtered_days: 29,
        },
      },
    });

    render(
      <WalletMetrics
        portfolioState={portfolioState}
        portfolioChangePercentage={0}
        landingPageData={landingPageData}
      />
    );

    expect(screen.getByText("Improving")).toBeInTheDocument();
    expect(screen.getByText("Based on 29 days")).toBeInTheDocument();
  });

  it("should use blue badge color for low confidence", () => {
    const portfolioState = createMockPortfolioState();
    const landingPageData = createMockLandingPageData({
      yield_summary: {
        ...createMockLandingPageData().yield_summary!,
        statistics: {
          ...createMockLandingPageData().yield_summary!.statistics,
          filtered_days: 15,
        },
      },
    });

    render(
      <WalletMetrics
        portfolioState={portfolioState}
        portfolioChangePercentage={0}
        landingPageData={landingPageData}
      />
    );

    const badge = screen.getByText("Improving");
    expect(badge).toHaveClass("bg-blue-900/20", "text-blue-400");
  });
});

// ==================== NORMAL STATE TESTS ====================

describe("WalletMetrics - Normal State (30+ days)", () => {
  it("should show value without badge for 30 days", () => {
    const portfolioState = createMockPortfolioState();
    const landingPageData = createMockLandingPageData({
      yield_summary: {
        ...createMockLandingPageData().yield_summary!,
        statistics: {
          ...createMockLandingPageData().yield_summary!.statistics,
          filtered_days: 30,
        },
      },
    });

    render(
      <WalletMetrics
        portfolioState={portfolioState}
        portfolioChangePercentage={0}
        landingPageData={landingPageData}
      />
    );

    expect(screen.queryByText("Preliminary")).not.toBeInTheDocument();
    expect(screen.queryByText("Improving")).not.toBeInTheDocument();
    expect(screen.queryByText(/Based on/)).not.toBeInTheDocument();
  });

  it("should show value without badge for 90+ days", () => {
    const portfolioState = createMockPortfolioState();
    const landingPageData = createMockLandingPageData({
      yield_summary: {
        ...createMockLandingPageData().yield_summary!,
        statistics: {
          ...createMockLandingPageData().yield_summary!.statistics,
          filtered_days: 90,
        },
      },
    });

    render(
      <WalletMetrics
        portfolioState={portfolioState}
        portfolioChangePercentage={0}
        landingPageData={landingPageData}
      />
    );

    expect(screen.getByText(/\$123\.45/)).toBeInTheDocument();
    expect(screen.queryByText("Preliminary")).not.toBeInTheDocument();
    expect(screen.queryByText("Improving")).not.toBeInTheDocument();
  });

  it("should use emerald color for normal display", () => {
    const portfolioState = createMockPortfolioState();
    const landingPageData = createMockLandingPageData();

    render(
      <WalletMetrics
        portfolioState={portfolioState}
        portfolioChangePercentage={0}
        landingPageData={landingPageData}
      />
    );

    const valueElement = screen.getByText(/\$123\.45/).closest("div");
    expect(valueElement).toHaveClass("text-emerald-300");
  });
});

// ==================== OUTLIER INFO ICON TESTS ====================

describe("WalletMetrics - Outlier Info Icon", () => {
  it("should show info icon when outliers are detected", () => {
    const portfolioState = createMockPortfolioState();
    const landingPageData = createMockLandingPageData({
      yield_summary: {
        ...createMockLandingPageData().yield_summary!,
        statistics: {
          ...createMockLandingPageData().yield_summary!.statistics,
          outliers_removed: 2,
        },
      },
    });

    const { container } = render(
      <WalletMetrics
        portfolioState={portfolioState}
        portfolioChangePercentage={0}
        landingPageData={landingPageData}
      />
    );

    // Info icon should be present
    const infoIcon = container.querySelector('svg[class*="w-3 h-3"]');
    expect(infoIcon).toBeInTheDocument();
  });

  it("should show correct tooltip text for multiple outliers", () => {
    const portfolioState = createMockPortfolioState();
    const landingPageData = createMockLandingPageData({
      yield_summary: {
        ...createMockLandingPageData().yield_summary!,
        statistics: {
          ...createMockLandingPageData().yield_summary!.statistics,
          outliers_removed: 3,
        },
      },
    });

    const { container } = render(
      <WalletMetrics
        portfolioState={portfolioState}
        portfolioChangePercentage={0}
        landingPageData={landingPageData}
      />
    );

    const iconSpan = container.querySelector('[title*="outlier"]');
    expect(iconSpan).toHaveAttribute(
      "title",
      "3 outliers removed for accuracy (IQR method)"
    );
  });

  it("should show singular tooltip for single outlier", () => {
    const portfolioState = createMockPortfolioState();
    const landingPageData = createMockLandingPageData({
      yield_summary: {
        ...createMockLandingPageData().yield_summary!,
        statistics: {
          ...createMockLandingPageData().yield_summary!.statistics,
          outliers_removed: 1,
        },
      },
    });

    const { container } = render(
      <WalletMetrics
        portfolioState={portfolioState}
        portfolioChangePercentage={0}
        landingPageData={landingPageData}
      />
    );

    const iconSpan = container.querySelector('[title*="outlier"]');
    expect(iconSpan).toHaveAttribute(
      "title",
      "1 outlier removed for accuracy (IQR method)"
    );
  });

  it("should not show info icon when no outliers detected", () => {
    const portfolioState = createMockPortfolioState();
    const landingPageData = createMockLandingPageData({
      yield_summary: {
        ...createMockLandingPageData().yield_summary!,
        statistics: {
          ...createMockLandingPageData().yield_summary!.statistics,
          outliers_removed: 0,
        },
      },
    });

    const { container } = render(
      <WalletMetrics
        portfolioState={portfolioState}
        portfolioChangePercentage={0}
        landingPageData={landingPageData}
      />
    );

    const iconSpan = container.querySelector('[title*="outlier"]');
    expect(iconSpan).not.toBeInTheDocument();
  });
});

// ==================== LOADING STATE TESTS ====================

describe("WalletMetrics - Loading States", () => {
  it("should show skeleton when portfolioState is loading", () => {
    const portfolioState = createMockPortfolioState({
      type: "loading",
      isLoading: true,
    });
    const landingPageData = createMockLandingPageData();

    const { container } = render(
      <WalletMetrics
        portfolioState={portfolioState}
        portfolioChangePercentage={0}
        landingPageData={landingPageData}
      />
    );

    // Skeleton component should be rendered
    expect(container.querySelector(".animate-pulse")).toBeInTheDocument();
  });

  it("should show skeleton when landing page data is not loaded", () => {
    const portfolioState = createMockPortfolioState({
      type: "loading",
      isLoading: true,
    });

    const { container } = render(
      <WalletMetrics
        portfolioState={portfolioState}
        portfolioChangePercentage={0}
        landingPageData={null}
      />
    );

    expect(container.querySelector(".animate-pulse")).toBeInTheDocument();
  });
});

// ==================== ERROR STATE TESTS ====================

describe("WalletMetrics - Error States", () => {
  it("should show WelcomeNewUser for USER_NOT_FOUND error", () => {
    const portfolioState = createMockPortfolioState({
      type: "error",
      hasError: true,
      errorMessage: "USER_NOT_FOUND",
    });

    render(
      <WalletMetrics
        portfolioState={portfolioState}
        portfolioChangePercentage={0}
        landingPageData={null}
      />
    );

    // WelcomeNewUser component should be rendered
    expect(screen.queryByText("Total Balance")).not.toBeInTheDocument();
  });

  it("should handle null avgDailyYieldUsd gracefully", () => {
    const portfolioState = createMockPortfolioState();
    const landingPageData = createMockLandingPageData({
      yield_summary: {
        ...createMockLandingPageData().yield_summary!,
        average_daily_yield_usd: null as any,
      },
    });

    render(
      <WalletMetrics
        portfolioState={portfolioState}
        portfolioChangePercentage={0}
        landingPageData={landingPageData}
      />
    );

    // Should show no data message
    expect(screen.getByText("Available in 1 day")).toBeInTheDocument();
  });
});

// ==================== DATA TRANSITION TESTS ====================

describe("WalletMetrics - State Transitions", () => {
  it("should transition from insufficient to low_confidence at 7 days", () => {
    const portfolioState = createMockPortfolioState();

    // 6 days: insufficient
    const { rerender } = render(
      <WalletMetrics
        portfolioState={portfolioState}
        portfolioChangePercentage={0}
        landingPageData={createMockLandingPageData({
          yield_summary: {
            ...createMockLandingPageData().yield_summary!,
            statistics: {
              ...createMockLandingPageData().yield_summary!.statistics,
              filtered_days: 6,
            },
          },
        })}
      />
    );

    expect(screen.getByText("Preliminary")).toBeInTheDocument();

    // 7 days: low_confidence
    rerender(
      <WalletMetrics
        portfolioState={portfolioState}
        portfolioChangePercentage={0}
        landingPageData={createMockLandingPageData({
          yield_summary: {
            ...createMockLandingPageData().yield_summary!,
            statistics: {
              ...createMockLandingPageData().yield_summary!.statistics,
              filtered_days: 7,
            },
          },
        })}
      />
    );

    expect(screen.queryByText("Preliminary")).not.toBeInTheDocument();
    expect(screen.getByText("Improving")).toBeInTheDocument();
  });

  it("should transition from low_confidence to normal at 30 days", () => {
    const portfolioState = createMockPortfolioState();

    // 29 days: low_confidence
    const { rerender } = render(
      <WalletMetrics
        portfolioState={portfolioState}
        portfolioChangePercentage={0}
        landingPageData={createMockLandingPageData({
          yield_summary: {
            ...createMockLandingPageData().yield_summary!,
            statistics: {
              ...createMockLandingPageData().yield_summary!.statistics,
              filtered_days: 29,
            },
          },
        })}
      />
    );

    expect(screen.getByText("Improving")).toBeInTheDocument();

    // 30 days: normal
    rerender(
      <WalletMetrics
        portfolioState={portfolioState}
        portfolioChangePercentage={0}
        landingPageData={createMockLandingPageData({
          yield_summary: {
            ...createMockLandingPageData().yield_summary!,
            statistics: {
              ...createMockLandingPageData().yield_summary!.statistics,
              filtered_days: 30,
            },
          },
        })}
      />
    );

    expect(screen.queryByText("Improving")).not.toBeInTheDocument();
  });
});

// ==================== ACCESSIBILITY TESTS ====================

describe("WalletMetrics - Accessibility", () => {
  it("should have descriptive labels for metrics", () => {
    const portfolioState = createMockPortfolioState();
    const landingPageData = createMockLandingPageData();

    render(
      <WalletMetrics
        portfolioState={portfolioState}
        portfolioChangePercentage={0}
        landingPageData={landingPageData}
      />
    );

    expect(screen.getByText("Total Balance")).toBeInTheDocument();
    expect(screen.getByText("Avg Daily Yield")).toBeInTheDocument();
    expect(
      screen.getByText("Estimated Yearly ROI (Potential)")
    ).toBeInTheDocument();
    expect(screen.getByText("Estimated Yearly PnL")).toBeInTheDocument();
  });

  it("should have cursor-help on info icons", () => {
    const portfolioState = createMockPortfolioState();
    const landingPageData = createMockLandingPageData({
      yield_summary: {
        ...createMockLandingPageData().yield_summary!,
        statistics: {
          ...createMockLandingPageData().yield_summary!.statistics,
          outliers_removed: 1,
        },
      },
    });

    const { container } = render(
      <WalletMetrics
        portfolioState={portfolioState}
        portfolioChangePercentage={0}
        landingPageData={landingPageData}
      />
    );

    const infoIcon = container.querySelector(".cursor-help");
    expect(infoIcon).toBeInTheDocument();
  });
});

// ==================== INTEGRATION TESTS ====================

describe("WalletMetrics - Full Component Integration", () => {
  it("should render all four metrics correctly", () => {
    const portfolioState = createMockPortfolioState({
      totalValue: 50000,
    });
    const landingPageData = createMockLandingPageData();

    render(
      <WalletMetrics
        portfolioState={portfolioState}
        portfolioChangePercentage={10.5}
        landingPageData={landingPageData}
      />
    );

    // All metric labels should be present
    expect(screen.getByText("Total Balance")).toBeInTheDocument();
    expect(screen.getByText(/Estimated Yearly ROI/)).toBeInTheDocument();
    expect(screen.getByText("Estimated Yearly PnL")).toBeInTheDocument();
    expect(screen.getByText("Avg Daily Yield")).toBeInTheDocument();

    // Values should be formatted
    expect(screen.getByText(/\$50,000/)).toBeInTheDocument();
    expect(screen.getByText(/\$123\.45/)).toBeInTheDocument();
  });

  it("should maintain grid layout structure", () => {
    const portfolioState = createMockPortfolioState();
    const landingPageData = createMockLandingPageData();

    const { container } = render(
      <WalletMetrics
        portfolioState={portfolioState}
        portfolioChangePercentage={0}
        landingPageData={landingPageData}
      />
    );

    const gridContainer = container.querySelector(".grid");
    expect(gridContainer).toHaveClass("grid-cols-1", "md:grid-cols-4");
  });
});
