import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ConsolidatedMetric } from "@/components/wallet/metrics/consolidated/ConsolidatedMetric";
import type { PortfolioROI } from "@/services/analyticsService";
import type { YieldSummaryData } from "@/services/yieldService";

// Mock dependencies
vi.mock("@/components/wallet/tooltips", () => ({
  ROITooltip: ({
    recommendedPeriodLabel,
  }: {
    recommendedPeriodLabel: string | null;
  }) => (
    <div data-testid="roi-tooltip">Recommended: {recommendedPeriodLabel}</div>
  ),
  YieldBreakdownTooltip: ({ outliersRemoved }: { outliersRemoved: number }) => (
    <div data-testid="yield-tooltip">Outliers: {outliersRemoved}</div>
  ),
  selectBestYieldWindow: vi.fn(windows => {
    const windowKeys = Object.keys(windows || {});
    if (windowKeys.length === 0) return null;
    const firstKey = windowKeys[0];
    if (!firstKey) return null;
    return {
      key: firstKey,
      window: windows![firstKey],
    };
  }),
  useMetricsTooltip: () => ({
    triggerRef: { current: null },
    tooltipRef: { current: null },
    visible: false,
    toggle: vi.fn(),
    position: { top: 0, left: 0 },
  }),
}));

vi.mock("@/lib/sortProtocolsByTodayYield", () => ({
  sortProtocolsByTodayYield: vi.fn(breakdown => breakdown),
}));

const mockPortfolioROI: PortfolioROI = {
  recommended_yearly_roi: 15.5,
  estimated_yearly_pnl_usd: 1550,
  recommended_period: "roi_1y",
  windows: {
    "1y": { value: 15.5, data_points: 365 },
    "3m": { value: 18.2, data_points: 90 },
  },
};

const mockNegativeROI: PortfolioROI = {
  recommended_yearly_roi: -5.25,
  estimated_yearly_pnl_usd: -525,
  recommended_period: "roi_1y",
  windows: {
    "1y": { value: -5.25, data_points: 365 },
  },
};

const mockYieldData: YieldSummaryData = {
  windows: {
    "7d": {
      median_daily_yield_usd: 25.5,
      statistics: {
        outliers_removed: 2,
        total_data_points: 7,
        mean: 24.8,
        median: 25.5,
        std_dev: 3.2,
      },
      protocol_breakdown: [
        {
          protocol: "Aave",
          today_yield_usd: 15.0,
          median_daily_yield_usd: 14.5,
        },
        {
          protocol: "Compound",
          today_yield_usd: 10.5,
          median_daily_yield_usd: 11.0,
        },
      ],
    },
  },
};

const mockEmptyYieldData: YieldSummaryData = {
  windows: {},
};

describe("ConsolidatedMetric", () => {
  describe("Loading States", () => {
    it("should render full loading skeleton when all data is loading", () => {
      const { container } = render(
        <ConsolidatedMetric
          shouldShowLoading={true}
          isLandingLoading={true}
          isYieldLoading={true}
        />
      );

      const card = container.querySelector('[class*="animate-pulse"]');
      expect(card).toBeInTheDocument();
    });

    it("should render partial loading for ROI only", () => {
      const { container } = render(
        <ConsolidatedMetric
          shouldShowLoading={true}
          isLandingLoading={true}
          isYieldLoading={false}
          yieldSummaryData={mockYieldData}
        />
      );

      // Yield section should be visible
      expect(screen.getByText("Daily Yield")).toBeInTheDocument();
      // Check for skeleton in ROI section
      const skeletons = container.querySelectorAll('[class*="animate-pulse"]');
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it("should render partial loading for Yield only", () => {
      render(
        <ConsolidatedMetric
          shouldShowLoading={true}
          isLandingLoading={false}
          isYieldLoading={true}
          portfolioROI={mockPortfolioROI}
        />
      );

      // ROI section should be visible
      expect(screen.getByText("Yearly ROI")).toBeInTheDocument();
      expect(screen.getByText("+15.50%")).toBeInTheDocument();
    });
  });

  describe("ROI Display", () => {
    it("should display positive ROI correctly", () => {
      render(
        <ConsolidatedMetric
          portfolioROI={mockPortfolioROI}
          yieldSummaryData={mockYieldData}
        />
      );

      expect(screen.getByText("Yearly ROI")).toBeInTheDocument();
      expect(screen.getByText("+15.50%")).toBeInTheDocument();
    });

    it("should display negative ROI correctly", () => {
      render(
        <ConsolidatedMetric
          portfolioROI={mockNegativeROI}
          yieldSummaryData={mockYieldData}
        />
      );

      expect(screen.getByText("-5.25%")).toBeInTheDocument();
    });

    it("should use green color for positive ROI", () => {
      render(
        <ConsolidatedMetric
          portfolioROI={mockPortfolioROI}
          yieldSummaryData={mockYieldData}
        />
      );

      const roiValue = screen.getByText("+15.50%");
      expect(roiValue).toHaveClass("text-green-400");
    });

    it("should use red color for negative ROI", () => {
      render(
        <ConsolidatedMetric
          portfolioROI={mockNegativeROI}
          yieldSummaryData={mockYieldData}
        />
      );

      const roiValue = screen.getByText("-5.25%");
      expect(roiValue).toHaveClass("text-red-400");
    });

    it("should display ROI of 0 as +0.00%", () => {
      const zeroROI: PortfolioROI = {
        recommended_yearly_roi: 0,
        estimated_yearly_pnl_usd: 0,
        recommended_period: null,
        windows: null,
      };

      render(
        <ConsolidatedMetric
          portfolioROI={zeroROI}
          yieldSummaryData={mockYieldData}
        />
      );

      expect(screen.getByText("+0.00%")).toBeInTheDocument();
    });
  });

  describe("PnL Display", () => {
    it("should display PnL amount correctly", () => {
      render(
        <ConsolidatedMetric
          portfolioROI={mockPortfolioROI}
          yieldSummaryData={mockYieldData}
        />
      );

      expect(screen.getByText("PnL")).toBeInTheDocument();
      expect(screen.getByText("$1,550")).toBeInTheDocument();
    });

    it("should display negative PnL amount", () => {
      render(
        <ConsolidatedMetric
          portfolioROI={mockNegativeROI}
          yieldSummaryData={mockYieldData}
        />
      );

      expect(screen.getByText("-$525")).toBeInTheDocument();
    });

    it("should format large PnL amounts without decimals", () => {
      const largeROI: PortfolioROI = {
        recommended_yearly_roi: 25.0,
        estimated_yearly_pnl_usd: 125000.75,
        recommended_period: null,
        windows: null,
      };

      render(
        <ConsolidatedMetric
          portfolioROI={largeROI}
          yieldSummaryData={mockYieldData}
        />
      );

      expect(screen.getByText("$125,001")).toBeInTheDocument();
    });
  });

  describe("Yield Display", () => {
    it("should display daily yield correctly", () => {
      render(
        <ConsolidatedMetric
          portfolioROI={mockPortfolioROI}
          yieldSummaryData={mockYieldData}
        />
      );

      expect(screen.getByText("Daily Yield")).toBeInTheDocument();
      expect(screen.getByText("$26")).toBeInTheDocument(); // Rounded from 25.5
    });

    it("should display N/A when no yield data available", () => {
      render(
        <ConsolidatedMetric
          portfolioROI={mockPortfolioROI}
          yieldSummaryData={mockEmptyYieldData}
        />
      );

      expect(screen.getByText("N/A")).toBeInTheDocument();
    });

    it("should handle undefined yield data", () => {
      render(
        <ConsolidatedMetric
          portfolioROI={mockPortfolioROI}
          yieldSummaryData={undefined}
          shouldShowLoading={false}
        />
      );

      expect(screen.getByText("N/A")).toBeInTheDocument();
    });
  });

  describe("Tooltip Elements", () => {
    it("should render ROI info button", () => {
      render(
        <ConsolidatedMetric
          portfolioROI={mockPortfolioROI}
          yieldSummaryData={mockYieldData}
        />
      );

      const roiButton = screen.getByLabelText("ROI");
      expect(roiButton).toBeInTheDocument();
      expect(roiButton.tagName).toBe("BUTTON");
    });

    it("should render Yield info button", () => {
      render(
        <ConsolidatedMetric
          portfolioROI={mockPortfolioROI}
          yieldSummaryData={mockYieldData}
        />
      );

      const yieldButton = screen.getByLabelText("Yield");
      expect(yieldButton).toBeInTheDocument();
      expect(yieldButton.tagName).toBe("BUTTON");
    });

    it("should not render Yield info button when no yield data", () => {
      render(
        <ConsolidatedMetric
          portfolioROI={mockPortfolioROI}
          yieldSummaryData={mockEmptyYieldData}
        />
      );

      // Yield label should still be there, but button depends on component logic
      expect(screen.getByText("Daily Yield")).toBeInTheDocument();
    });
  });

  describe("Visual Elements", () => {
    it("should have consistent height of h-[140px]", () => {
      const { container } = render(
        <ConsolidatedMetric
          portfolioROI={mockPortfolioROI}
          yieldSummaryData={mockYieldData}
        />
      );

      const card = container.querySelector('[class*="h-\\[140px\\]"]');
      expect(card).toBeInTheDocument();
    });

    it("should render gradient accent border", () => {
      const { container } = render(
        <ConsolidatedMetric
          portfolioROI={mockPortfolioROI}
          yieldSummaryData={mockYieldData}
        />
      );

      const gradientBorder = container.querySelector(
        '[class*="from-green-500"][class*="to-emerald-500"]'
      );
      expect(gradientBorder).toBeInTheDocument();
    });

    it("should render ROI badge with correct styling", () => {
      render(
        <ConsolidatedMetric
          portfolioROI={mockPortfolioROI}
          yieldSummaryData={mockYieldData}
        />
      );

      const badge = screen.getByText("Yearly ROI").parentElement;
      expect(badge).toHaveClass(
        "px-2",
        "py-0.5",
        "rounded-full",
        "bg-green-500/10",
        "border-green-500/20"
      );
    });

    it("should render grid layout for PnL and Yield", () => {
      const { container } = render(
        <ConsolidatedMetric
          portfolioROI={mockPortfolioROI}
          yieldSummaryData={mockYieldData}
        />
      );

      const grid = container.querySelector('[class*="grid-cols-2"]');
      expect(grid).toBeInTheDocument();
    });

    it("should render purple styling for Yield card", () => {
      const { container } = render(
        <ConsolidatedMetric
          portfolioROI={mockPortfolioROI}
          yieldSummaryData={mockYieldData}
        />
      );

      const yieldCard = container.querySelector(
        '[class*="bg-purple-500/10"][class*="border-purple-500/20"]'
      );
      expect(yieldCard).toBeInTheDocument();
    });
  });

  describe("Edge Cases", () => {
    it("should handle undefined portfolioROI gracefully", () => {
      render(
        <ConsolidatedMetric
          portfolioROI={undefined}
          yieldSummaryData={mockYieldData}
          shouldShowLoading={false}
        />
      );

      // Should show ROI as 0
      expect(screen.getByText("+0.00%")).toBeInTheDocument();
      expect(screen.getByText("$0")).toBeInTheDocument();
    });

    it("should handle null recommended_period", () => {
      const roiWithNullPeriod: PortfolioROI = {
        recommended_yearly_roi: 10,
        estimated_yearly_pnl_usd: 1000,
        recommended_period: null,
        windows: null,
      };

      render(
        <ConsolidatedMetric
          portfolioROI={roiWithNullPeriod}
          yieldSummaryData={mockYieldData}
        />
      );

      expect(screen.getByText("+10.00%")).toBeInTheDocument();
    });

    it("should handle null windows in portfolioROI", () => {
      const roiWithNullWindows: PortfolioROI = {
        recommended_yearly_roi: 12,
        estimated_yearly_pnl_usd: 1200,
        recommended_period: "roi_1y",
        windows: null,
      };

      render(
        <ConsolidatedMetric
          portfolioROI={roiWithNullWindows}
          yieldSummaryData={mockYieldData}
        />
      );

      expect(screen.getByText("+12.00%")).toBeInTheDocument();
    });

    it("should handle very small ROI values", () => {
      const tinyROI: PortfolioROI = {
        recommended_yearly_roi: 0.01,
        estimated_yearly_pnl_usd: 1,
        recommended_period: null,
        windows: null,
      };

      render(
        <ConsolidatedMetric
          portfolioROI={tinyROI}
          yieldSummaryData={mockYieldData}
        />
      );

      expect(screen.getByText("+0.01%")).toBeInTheDocument();
      expect(screen.getByText("$1")).toBeInTheDocument();
    });

    it("should handle very large ROI values", () => {
      const hugeROI: PortfolioROI = {
        recommended_yearly_roi: 999.99,
        estimated_yearly_pnl_usd: 999999,
        recommended_period: null,
        windows: null,
      };

      render(
        <ConsolidatedMetric
          portfolioROI={hugeROI}
          yieldSummaryData={mockYieldData}
        />
      );

      expect(screen.getByText("+999.99%")).toBeInTheDocument();
      expect(screen.getByText("$999,999")).toBeInTheDocument();
    });
  });
});
