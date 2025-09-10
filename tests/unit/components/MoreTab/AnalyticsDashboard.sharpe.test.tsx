/**
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { AnalyticsDashboard } from "../../../../src/components/MoreTab/AnalyticsDashboard";
import { useRiskSummary } from "../../../../src/hooks/useRiskSummary";
import type { ActualRiskSummaryResponse } from "../../../../src/types/risk";

// Mock dependencies
vi.mock("../../../../src/hooks/useRiskSummary");
vi.mock("../../../../src/components/RiskAssessment", () => ({
  RiskAssessment: ({ userId }: { userId: string }) => (
    <div data-testid="risk-assessment">Risk Assessment for {userId}</div>
  ),
}));

// Mock UI components
vi.mock("../../../../src/components/ui", () => ({
  APRMetrics: ({ annualAPR, monthlyReturn }: any) => (
    <div data-testid="apr-metrics">
      APR: {annualAPR}%, Monthly: {monthlyReturn}%
    </div>
  ),
  GlassCard: ({ children, ...props }: any) => (
    <div data-testid="glass-card" {...props}>
      {children}
    </div>
  ),
}));

// Mock constants and utilities
vi.mock("../../../../src/constants/design-system", () => ({
  GRADIENTS: { PRIMARY: "from-blue-500 to-purple-600" },
}));

vi.mock("../../../../src/lib/color-utils", () => ({
  getChangeColorClasses: (change: number) =>
    change > 0
      ? "text-green-400"
      : change < 0
        ? "text-red-400"
        : "text-gray-400",
}));

// Mock framer-motion
vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
}));

const mockUseRiskSummary = vi.mocked(useRiskSummary);

const mockRiskDataWithSharpe: ActualRiskSummaryResponse = {
  user_id: "test-user-id",
  risk_summary: {
    volatility: {
      user_id: "test-user-id",
      period_days: 30,
      data_points: 26,
      volatility_daily: 0.098836,
      volatility_annualized: 1.569,
      average_daily_return: 0.015158,
      period_info: {
        start_date: "2025-08-11T05:56:42.688914+00:00",
        end_date: "2025-09-10T05:56:42.688914+00:00",
      },
    },
    drawdown: {
      user_id: "test-user-id",
      period_days: 90,
      data_points: 29,
      max_drawdown: -0.161932,
      max_drawdown_percentage: -16.19,
      max_drawdown_date: "2025-09-09",
      peak_value: 159247.9,
      trough_value: 133460.63,
      recovery_needed_percentage: 16.19,
      current_drawdown: -0.161932,
      current_drawdown_percentage: -16.19,
      period_info: {
        start_date: "2025-06-12T05:56:42.799466+00:00",
        end_date: "2025-09-10T05:56:42.799466+00:00",
      },
    },
    sharpe_ratio: {
      user_id: "test-user-id",
      period_days: 30,
      data_points: 26,
      sharpe_ratio: 2.419,
      portfolio_return_annual: 3.8199,
      risk_free_rate_annual: 0.025,
      excess_return: 3.7949,
      volatility_annual: 1.569,
      interpretation: "Very Good",
      period_info: {
        start_date: "2025-08-11T05:56:42.816285+00:00",
        end_date: "2025-09-10T05:56:42.816285+00:00",
      },
    },
  },
  summary_metrics: {
    annualized_volatility_percentage: 156.9,
    max_drawdown_percentage: -16.19,
    sharpe_ratio: 2.419,
  },
};

describe("AnalyticsDashboard - Sharpe Ratio Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should display real Sharpe ratio data in Key Metrics Grid", () => {
    mockUseRiskSummary.mockReturnValue({
      data: mockRiskDataWithSharpe,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<AnalyticsDashboard userId="test-user-id" />);

    // Find the Sharpe Ratio metric card
    const sharpeRatioValue = screen.getByText("2.42");
    expect(sharpeRatioValue).toBeInTheDocument();

    const sharpeRatioLabel = screen.getByText("Sharpe Ratio");
    expect(sharpeRatioLabel).toBeInTheDocument();

    const sharpeRatioDescription = screen.getByText("Risk-adjusted returns");
    expect(sharpeRatioDescription).toBeInTheDocument();
  });

  it("should display mock Sharpe ratio when no real data is available", () => {
    mockUseRiskSummary.mockReturnValue({
      data: null,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<AnalyticsDashboard userId="test-user-id" />);

    // Should display mock data
    const mockSharpeValue = screen.getByText("1.34");
    expect(mockSharpeValue).toBeInTheDocument();

    const mockDescription = screen.getByText("Risk-adjusted returns (mock)");
    expect(mockDescription).toBeInTheDocument();
  });

  it("should display real Sharpe ratio from summary_metrics when detailed data is not available", () => {
    const dataWithSummaryOnly = {
      ...mockRiskDataWithSharpe,
      risk_summary: {
        ...mockRiskDataWithSharpe.risk_summary,
        sharpe_ratio: undefined,
      },
      summary_metrics: {
        ...mockRiskDataWithSharpe.summary_metrics,
        sharpe_ratio: 1.85,
      },
    };

    mockUseRiskSummary.mockReturnValue({
      data: dataWithSummaryOnly,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<AnalyticsDashboard userId="test-user-id" />);

    const sharpeValue = screen.getByText("1.85");
    expect(sharpeValue).toBeInTheDocument();

    const realDataDescription = screen.getByText("Risk-adjusted returns");
    expect(realDataDescription).toBeInTheDocument();
  });

  it("should show positive trend for good Sharpe ratio", () => {
    mockUseRiskSummary.mockReturnValue({
      data: mockRiskDataWithSharpe, // Sharpe ratio is 2.419 > 1.5
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<AnalyticsDashboard userId="test-user-id" />);

    // Look for up arrow indicator (ArrowUpRight icon)
    const upArrow = document.querySelector('svg[data-lucide="arrow-up-right"]');
    expect(upArrow).toBeInTheDocument();

    // Should show positive change value
    expect(screen.getByText("+0.15%")).toBeInTheDocument();
  });

  it("should show negative trend for poor Sharpe ratio", () => {
    const dataWithPoorSharpe = {
      ...mockRiskDataWithSharpe,
      risk_summary: {
        ...mockRiskDataWithSharpe.risk_summary,
        sharpe_ratio: {
          ...mockRiskDataWithSharpe.risk_summary.sharpe_ratio!,
          sharpe_ratio: 1.2, // Below 1.5 threshold
        },
      },
      summary_metrics: {
        ...mockRiskDataWithSharpe.summary_metrics,
        sharpe_ratio: 1.2,
      },
    };

    mockUseRiskSummary.mockReturnValue({
      data: dataWithPoorSharpe,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<AnalyticsDashboard userId="test-user-id" />);

    const sharpeValue = screen.getByText("1.20");
    expect(sharpeValue).toBeInTheDocument();

    // Look for down arrow indicator
    const downArrow = document.querySelector(
      'svg[data-lucide="arrow-down-right"]'
    );
    expect(downArrow).toBeInTheDocument();

    // Should show negative change value
    expect(screen.getByText("-0.05%")).toBeInTheDocument();
  });

  it("should display real Sharpe ratio in Performance by Period table", () => {
    mockUseRiskSummary.mockReturnValue({
      data: mockRiskDataWithSharpe,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<AnalyticsDashboard userId="test-user-id" />);

    // Find the Performance by Period table
    const performanceTable = screen.getByText("Performance by Period");
    expect(performanceTable).toBeInTheDocument();

    // Find Sharpe column header
    const sharpeHeader = screen.getByText("Sharpe");
    expect(sharpeHeader).toBeInTheDocument();

    // The 1M period should show the real Sharpe ratio
    const realSharpeInTable = screen.getByText("2.42");
    expect(realSharpeInTable).toBeInTheDocument();
  });

  it("should handle loading state correctly", () => {
    mockUseRiskSummary.mockReturnValue({
      data: null,
      isLoading: true,
      error: null,
      refetch: vi.fn(),
    });

    render(<AnalyticsDashboard userId="test-user-id" />);

    // Should still render component structure but with mock data
    const sharpeRatioLabel = screen.getByText("Sharpe Ratio");
    expect(sharpeRatioLabel).toBeInTheDocument();

    // Should show mock value during loading
    const mockValue = screen.getByText("1.34");
    expect(mockValue).toBeInTheDocument();
  });

  it("should handle error state gracefully", () => {
    mockUseRiskSummary.mockReturnValue({
      data: null,
      isLoading: false,
      error: new Error("API Error"),
      refetch: vi.fn(),
    });

    render(<AnalyticsDashboard userId="test-user-id" />);

    // Should fallback to mock data when error occurs
    const mockValue = screen.getByText("1.34");
    expect(mockValue).toBeInTheDocument();

    const mockDescription = screen.getByText("Risk-adjusted returns (mock)");
    expect(mockDescription).toBeInTheDocument();
  });

  it("should pass userId to RiskAssessment component", () => {
    mockUseRiskSummary.mockReturnValue({
      data: mockRiskDataWithSharpe,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<AnalyticsDashboard userId="test-user-id" />);

    const riskAssessment = screen.getByTestId("risk-assessment");
    expect(riskAssessment).toHaveTextContent(
      "Risk Assessment for test-user-id"
    );
  });

  it("should handle undefined userId gracefully", () => {
    mockUseRiskSummary.mockReturnValue({
      data: null,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<AnalyticsDashboard userId={undefined} />);

    // Should still render with mock data
    const mockValue = screen.getByText("1.34");
    expect(mockValue).toBeInTheDocument();
  });
});
