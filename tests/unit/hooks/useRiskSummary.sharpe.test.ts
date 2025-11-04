/**
 * @vitest-environment jsdom
 */

import { renderHook, waitFor } from "@testing-library/react";
import { afterEach,beforeEach, describe, expect, it, vi } from "vitest";

import { useRiskSummary } from "../../../src/hooks/useRiskSummary";
import { getRiskSummary } from "../../../src/services/analyticsService";
import type { ActualRiskSummaryResponse } from "../../../src/types/risk";

// Mock the analytics service
vi.mock("../../../src/services/analyticsService");
const mockGetRiskSummary = vi.mocked(getRiskSummary);

describe("useRiskSummary - Sharpe Ratio Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const mockRiskSummaryWithSharpe: ActualRiskSummaryResponse = {
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

  const mockRiskSummaryWithoutSharpe: ActualRiskSummaryResponse = {
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
    },
    summary_metrics: {
      annualized_volatility_percentage: 156.9,
      max_drawdown_percentage: -16.19,
    },
  };

  it("should successfully fetch and validate risk data with Sharpe ratio", async () => {
    mockGetRiskSummary.mockResolvedValueOnce(mockRiskSummaryWithSharpe);

    const { result } = renderHook(() => useRiskSummary("test-user-id"));

    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toBeNull();

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toEqual(mockRiskSummaryWithSharpe);
    expect(result.current.error).toBeNull();
    expect(result.current.data?.risk_summary.sharpe_ratio?.sharpe_ratio).toBe(
      2.419
    );
    expect(result.current.data?.summary_metrics.sharpe_ratio).toBe(2.419);
  });

  it("should successfully handle risk data without Sharpe ratio", async () => {
    mockGetRiskSummary.mockResolvedValueOnce(mockRiskSummaryWithoutSharpe);

    const { result } = renderHook(() => useRiskSummary("test-user-id"));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toEqual(mockRiskSummaryWithoutSharpe);
    expect(result.current.error).toBeNull();
    expect(result.current.data?.risk_summary.sharpe_ratio).toBeUndefined();
    expect(result.current.data?.summary_metrics.sharpe_ratio).toBeUndefined();
  });

  it("should reject response with invalid sharpe_ratio structure", async () => {
    const invalidSharpeData = {
      ...mockRiskSummaryWithSharpe,
      risk_summary: {
        ...mockRiskSummaryWithSharpe.risk_summary,
        sharpe_ratio: {
          ...mockRiskSummaryWithSharpe.risk_summary.sharpe_ratio!,
          sharpe_ratio: "invalid", // Should be number
        },
      },
    };

    mockGetRiskSummary.mockResolvedValueOnce(invalidSharpeData as any);

    const { result } = renderHook(() => useRiskSummary("test-user-id"));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toBeNull();
    expect(result.current.error).not.toBeNull();
    expect(result.current.error?.message).toContain("Invalid API response");
  });

  it("should reject response with missing required sharpe_ratio fields", async () => {
    const incompleteSharpeData = {
      ...mockRiskSummaryWithSharpe,
      risk_summary: {
        ...mockRiskSummaryWithSharpe.risk_summary,
        sharpe_ratio: {
          user_id: "test-user-id",
          sharpe_ratio: 2.419,
          // Missing required fields like portfolio_return_annual, etc.
        },
      },
    };

    mockGetRiskSummary.mockResolvedValueOnce(incompleteSharpeData as any);

    const { result } = renderHook(() => useRiskSummary("test-user-id"));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toBeNull();
    expect(result.current.error).not.toBeNull();
    expect(result.current.error?.message).toContain("Invalid API response");
  });

  it("should reject response with invalid summary_metrics sharpe_ratio", async () => {
    const invalidSummaryMetrics = {
      ...mockRiskSummaryWithSharpe,
      summary_metrics: {
        ...mockRiskSummaryWithSharpe.summary_metrics,
        sharpe_ratio: "invalid", // Should be number
      },
    };

    mockGetRiskSummary.mockResolvedValueOnce(invalidSummaryMetrics as any);

    const { result } = renderHook(() => useRiskSummary("test-user-id"));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toBeNull();
    expect(result.current.error).not.toBeNull();
    expect(result.current.error?.message).toContain("Invalid API response");
  });

  it("should handle response with only summary_metrics sharpe_ratio", async () => {
    const summaryOnlyData = {
      ...mockRiskSummaryWithoutSharpe,
      summary_metrics: {
        ...mockRiskSummaryWithoutSharpe.summary_metrics,
        sharpe_ratio: 1.85,
      },
    };

    mockGetRiskSummary.mockResolvedValueOnce(summaryOnlyData);

    const { result } = renderHook(() => useRiskSummary("test-user-id"));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toEqual(summaryOnlyData);
    expect(result.current.error).toBeNull();
    expect(result.current.data?.summary_metrics.sharpe_ratio).toBe(1.85);
    expect(result.current.data?.risk_summary.sharpe_ratio).toBeUndefined();
  });

  it("should validate all required sharpe_ratio fields", async () => {
    const requiredFields = [
      "sharpe_ratio",
      "portfolio_return_annual",
      "risk_free_rate_annual",
      "excess_return",
      "volatility_annual",
      "interpretation",
      "period_days",
      "data_points",
    ];

    for (const field of requiredFields) {
      const invalidData = {
        ...mockRiskSummaryWithSharpe,
        risk_summary: {
          ...mockRiskSummaryWithSharpe.risk_summary,
          sharpe_ratio: {
            ...mockRiskSummaryWithSharpe.risk_summary.sharpe_ratio!,
            [field]: undefined, // Remove required field
          },
        },
      };

      mockGetRiskSummary.mockResolvedValueOnce(invalidData as any);

      const { result } = renderHook(() => useRiskSummary("test-user-id"));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toBeNull();
      expect(result.current.error).not.toBeNull();
      expect(result.current.error?.message).toContain("Invalid API response");

      // Reset for next iteration
      vi.clearAllMocks();
    }
  });
});
