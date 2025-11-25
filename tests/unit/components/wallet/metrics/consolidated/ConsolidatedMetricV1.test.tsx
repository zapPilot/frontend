import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ConsolidatedMetricV1 } from "../../../../../../src/components/wallet/metrics/consolidated/ConsolidatedMetricV1";
import type { PerformanceMetricsProps } from "../../../../../../src/components/wallet/metrics/performance/types";
import { logger } from "../../../../../../src/utils/logger";

// Mock lucide-react icons (following WalletMetrics.test.tsx pattern)
vi.mock("lucide-react", () => ({
  TrendingUp: vi.fn(() => (
    <span data-testid="trending-up-icon">TrendingUp</span>
  )),
  DollarSign: vi.fn(() => (
    <span data-testid="dollar-sign-icon">DollarSign</span>
  )),
  Percent: vi.fn(() => <span data-testid="percent-icon">Percent</span>),
  Info: vi.fn(({ className, ...props }) => (
    <span data-testid="info-icon" className={className} {...props}>
      Info
    </span>
  )),
}));

// Mock formatters
vi.mock("../../../../../../src/lib/formatters", async () => {
  const { mockFormatters } = await import("../../../../../mocks/formatters");
  return mockFormatters;
});

// Mock ROI utilities
vi.mock("../../../../../../src/lib/roi", () => ({
  deriveRoiWindowSortScore: vi.fn((key: string) => {
    const order: Record<string, number> = {
      roi_7d: 0,
      roi_30d: 1,
      roi_90d: 2,
      roi_180d: 3,
      roi_365d: 4,
    };
    return order[key] ?? 999;
  }),
  formatRoiWindowLabel: vi.fn((key: string) => {
    return key.replace("roi_", "").replace("d", " days");
  }),
}));

// Mock sortProtocolsByTodayYield
vi.mock("../../../../../../src/lib/sortProtocolsByTodayYield", () => ({
  sortProtocolsByTodayYield: vi.fn(breakdown => breakdown),
}));

// Mock the entire tooltips module (index file re-exports)
vi.mock("../../../../../../src/components/wallet/tooltips", () => ({
  ROITooltip: vi.fn(({ position }) => (
    <div
      data-testid="roi-tooltip"
      style={{ top: position.top, left: position.left }}
    >
      ROI Tooltip
    </div>
  )),
  YieldBreakdownTooltip: vi.fn(({ selectedWindow, position }) => (
    <div
      data-testid="yield-tooltip"
      style={{ top: position.top, left: position.left }}
    >
      {selectedWindow ? "Yield Breakdown" : "No yield data available"}
    </div>
  )),
  useMetricsTooltip: vi.fn(() => ({
    visible: false,
    position: { top: 0, left: 0 },
    triggerRef: { current: null },
    tooltipRef: { current: null },
    open: vi.fn(),
    close: vi.fn(),
    toggle: vi.fn(),
  })),
  selectBestYieldWindow: vi.fn(windows => {
    const entries = Object.entries(windows);
    if (entries.length === 0) return null;

    // Find window with most filtered_days
    const sorted = entries.sort(
      ([, a]: any, [, b]: any) =>
        b.statistics.filtered_days - a.statistics.filtered_days
    );

    const [key, window] = sorted[0];
    return {
      key,
      window,
      label: `${key} days`,
    };
  }),
}));

describe("ConsolidatedMetricV1 - Daily Yield Fixes", () => {
  const mockROIData = {
    user_id: "test-user",
    recommended_yearly_roi: 15.5,
    estimated_yearly_pnl_usd: 1500,
    recommended_period: "roi_30d",
    windows: {
      roi_7d: { value: 10.2, data_points: 7 },
      roi_30d: { value: 15.5, data_points: 30 },
      roi_90d: { value: 12.8, data_points: 90 },
    },
  };

  const mockYieldDataWithWindows = {
    user_id: "test-user",
    windows: {
      "7d": {
        average_daily_yield_usd: 125.5,
        median_daily_yield_usd: 120.0,
        total_yield_usd: 877.5,
        statistics: {
          mean: 125.5,
          median: 120.0,
          std_dev: 15.2,
          min_value: 95.0,
          max_value: 155.0,
          total_days: 7,
          filtered_days: 7,
          outliers_removed: 0,
        },
        outlier_strategy: "iqr" as const,
        outliers_detected: [],
        protocol_breakdown: [
          {
            protocol: "Aave",
            chain: "Ethereum",
            window: {
              average_daily_yield_usd: 75.5,
              median_daily_yield_usd: 72.0,
              total_yield_usd: 528.5,
            },
            today: {
              date: "2025-01-20",
              yield_usd: 78.2,
            },
          },
        ],
      },
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Tooltip Always Clickable", () => {
    it("should render yield tooltip button without data", () => {
      const props: PerformanceMetricsProps = {
        portfolioROI: mockROIData,
        yieldSummaryData: null,
      };

      render(<ConsolidatedMetricV1 {...props} />);

      const yieldInfoButton = screen.getByLabelText("Yield Info");
      expect(yieldInfoButton).toBeInTheDocument();
    });

    it("should render yield tooltip button with data", () => {
      const props: PerformanceMetricsProps = {
        portfolioROI: mockROIData,
        yieldSummaryData: mockYieldDataWithWindows,
      };

      render(<ConsolidatedMetricV1 {...props} />);

      const yieldInfoButton = screen.getByLabelText("Yield Info");
      expect(yieldInfoButton).toBeInTheDocument();
    });

    it("should allow clicking yield tooltip button without data", () => {
      const props: PerformanceMetricsProps = {
        portfolioROI: mockROIData,
        yieldSummaryData: null,
      };

      render(<ConsolidatedMetricV1 {...props} />);

      const yieldInfoButton = screen.getByLabelText("Yield Info");

      // Should not throw error when clicking
      expect(() => {
        fireEvent.click(yieldInfoButton);
      }).not.toThrow();
    });
  });

  describe("Display Shows N/A for Missing Data", () => {
    it('should display "N/A" when yieldSummaryData is null', () => {
      const props: PerformanceMetricsProps = {
        portfolioROI: mockROIData,
        yieldSummaryData: null,
      };

      render(<ConsolidatedMetricV1 {...props} />);

      // Find the Daily Yield section
      const dailyYieldLabel = screen.getByText("Daily Yield");
      const dailyYieldSection = dailyYieldLabel.closest("div");

      expect(dailyYieldSection).toHaveTextContent("N/A");
      expect(dailyYieldSection).not.toHaveTextContent("$0");
    });

    it('should display "N/A" when yieldSummaryData is undefined', () => {
      const props: PerformanceMetricsProps = {
        portfolioROI: mockROIData,
        yieldSummaryData: undefined,
      };

      render(<ConsolidatedMetricV1 {...props} />);

      const dailyYieldLabel = screen.getByText("Daily Yield");
      const dailyYieldSection = dailyYieldLabel.closest("div");

      expect(dailyYieldSection).toHaveTextContent("N/A");
    });

    it('should display "N/A" when windows is empty object', () => {
      const props: PerformanceMetricsProps = {
        portfolioROI: mockROIData,
        yieldSummaryData: {
          user_id: "test-user",
          windows: {},
        },
      };

      render(<ConsolidatedMetricV1 {...props} />);

      const dailyYieldLabel = screen.getByText("Daily Yield");
      const dailyYieldSection = dailyYieldLabel.closest("div");

      expect(dailyYieldSection).toHaveTextContent("N/A");
    });

    it("should display formatted currency when yield data is valid", () => {
      const props: PerformanceMetricsProps = {
        portfolioROI: mockROIData,
        yieldSummaryData: mockYieldDataWithWindows,
      };

      render(<ConsolidatedMetricV1 {...props} />);

      const dailyYieldLabel = screen.getByText("Daily Yield");
      const dailyYieldSection = dailyYieldLabel.closest("div");

      // mockFormatters.formatCurrency rounds to whole numbers: 125.5 → $126
      expect(dailyYieldSection).toHaveTextContent("$126");
      expect(dailyYieldSection).not.toHaveTextContent("N/A");
    });

    it('should display "$0.00" when yield is actually zero (not missing)', () => {
      const zeroYieldData = {
        user_id: "test-user",
        windows: {
          "7d": {
            average_daily_yield_usd: 0, // Actual zero
            median_daily_yield_usd: 0,
            total_yield_usd: 0,
            statistics: {
              mean: 0,
              median: 0,
              std_dev: 0,
              min_value: 0,
              max_value: 0,
              total_days: 7,
              filtered_days: 7,
              outliers_removed: 0,
            },
            outlier_strategy: "iqr" as const,
            outliers_detected: [],
            protocol_breakdown: [],
          },
        },
      };

      const props: PerformanceMetricsProps = {
        portfolioROI: mockROIData,
        yieldSummaryData: zeroYieldData,
      };

      render(<ConsolidatedMetricV1 {...props} />);

      const dailyYieldLabel = screen.getByText("Daily Yield");
      const dailyYieldSection = dailyYieldLabel.closest("div");

      // Should show $0, not N/A, because data exists
      expect(dailyYieldSection).toHaveTextContent("$0");
      expect(dailyYieldSection).not.toHaveTextContent("N/A");
    });
  });

  describe("ROI Regression Tests", () => {
    it("should display ROI percentage correctly", () => {
      const props: PerformanceMetricsProps = {
        portfolioROI: mockROIData,
        yieldSummaryData: mockYieldDataWithWindows,
      };

      render(<ConsolidatedMetricV1 {...props} />);

      // mockFormatters.formatPercent returns "+15.50%" for 15.5
      expect(screen.getByText("+15.50%")).toBeInTheDocument();
    });

    it("should display Yearly PnL correctly", () => {
      const props: PerformanceMetricsProps = {
        portfolioROI: mockROIData,
        yieldSummaryData: mockYieldDataWithWindows,
      };

      render(<ConsolidatedMetricV1 {...props} />);

      const yearlyPnLLabel = screen.getByText("Yearly PnL");
      expect(yearlyPnLLabel).toBeInTheDocument();

      // mockFormatters.formatCurrency returns "$1,500.00" for 1500
      expect(screen.getByText("$1,500")).toBeInTheDocument();
    });

    it("should render ROI info button", () => {
      const props: PerformanceMetricsProps = {
        portfolioROI: mockROIData,
        yieldSummaryData: mockYieldDataWithWindows,
      };

      render(<ConsolidatedMetricV1 {...props} />);

      const roiInfoButton = screen.getByLabelText("ROI Info");
      expect(roiInfoButton).toBeInTheDocument();
    });
  });

  describe("Edge Cases", () => {
    it("should handle negative yield correctly", () => {
      const negativeYieldData = {
        user_id: "test-user",
        windows: {
          "7d": {
            average_daily_yield_usd: -50.25,
            median_daily_yield_usd: -48.0,
            total_yield_usd: -351.75,
            statistics: {
              mean: -50.25,
              median: -48.0,
              std_dev: 10.5,
              min_value: -65.0,
              max_value: -35.0,
              total_days: 7,
              filtered_days: 7,
              outliers_removed: 0,
            },
            outlier_strategy: "iqr" as const,
            outliers_detected: [],
            protocol_breakdown: [],
          },
        },
      };

      const props: PerformanceMetricsProps = {
        portfolioROI: mockROIData,
        yieldSummaryData: negativeYieldData,
      };

      render(<ConsolidatedMetricV1 {...props} />);

      const dailyYieldLabel = screen.getByText("Daily Yield");
      const dailyYieldSection = dailyYieldLabel.closest("div");

      // Should display negative value formatted
      expect(dailyYieldSection).toHaveTextContent("-$50");
    });

    it("should handle very large yield values", () => {
      const largeYieldData = {
        user_id: "test-user",
        windows: {
          "7d": {
            average_daily_yield_usd: 999999.99,
            median_daily_yield_usd: 999999.99,
            total_yield_usd: 6999999.93,
            statistics: {
              mean: 999999.99,
              median: 999999.99,
              std_dev: 0,
              min_value: 999999.99,
              max_value: 999999.99,
              total_days: 7,
              filtered_days: 7,
              outliers_removed: 0,
            },
            outlier_strategy: "iqr" as const,
            outliers_detected: [],
            protocol_breakdown: [],
          },
        },
      };

      const props: PerformanceMetricsProps = {
        portfolioROI: mockROIData,
        yieldSummaryData: largeYieldData,
      };

      render(<ConsolidatedMetricV1 {...props} />);

      const dailyYieldLabel = screen.getByText("Daily Yield");
      const dailyYieldSection = dailyYieldLabel.closest("div");

      // mockFormatters rounds: 999999.99 → $1,000,000
      expect(dailyYieldSection).toHaveTextContent("$1,000,000");
    });

    it("should handle missing ROI data gracefully", () => {
      const props: PerformanceMetricsProps = {
        portfolioROI: null,
        yieldSummaryData: mockYieldDataWithWindows,
      };

      render(<ConsolidatedMetricV1 {...props} />);

      // Should render without ROI data
      expect(screen.getByText("Daily Yield")).toBeInTheDocument();
    });
  });

  describe("Console Debug Logging", () => {
    it("should log debug message when yield data is missing", () => {
      const loggerDebugSpy = vi
        .spyOn(logger, "debug")
        .mockImplementation(() => {
          return null;
        });

      const props: PerformanceMetricsProps = {
        portfolioROI: mockROIData,
        yieldSummaryData: { user_id: "test-user", windows: {} },
      };

      render(<ConsolidatedMetricV1 {...props} />);

      // Should have called logger.debug
      expect(loggerDebugSpy).toHaveBeenCalledWith(
        "No valid yield window selected",
        expect.objectContaining({
          windowsAvailable: [],
          rawData: expect.any(Object),
        }),
        "ConsolidatedMetricV1"
      );

      loggerDebugSpy.mockRestore();
    });

    it("should not log when yield data is present", () => {
      const loggerDebugSpy = vi
        .spyOn(logger, "debug")
        .mockImplementation(() => {
          return null;
        });

      const props: PerformanceMetricsProps = {
        portfolioROI: mockROIData,
        yieldSummaryData: mockYieldDataWithWindows,
      };

      render(<ConsolidatedMetricV1 {...props} />);

      // Should NOT call logger.debug when data is available
      expect(loggerDebugSpy).not.toHaveBeenCalled();

      loggerDebugSpy.mockRestore();
    });
  });
});
