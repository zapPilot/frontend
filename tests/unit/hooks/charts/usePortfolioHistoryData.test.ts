/**
 * Unit tests for usePortfolioHistoryData hook
 *
 * Tests portfolio performance data transformation, metric calculations,
 * and edge case handling.
 */

import { renderHook } from "@testing-library/react";
import { describe, expect,it } from "vitest";

import { usePortfolioHistoryData } from "@/hooks/charts/usePortfolioHistoryData";
import type { PortfolioDataPoint } from "@/types/domain/portfolio";

describe("usePortfolioHistoryData", () => {
  const mockPortfolioData: PortfolioDataPoint[] = [
    {
      date: "2024-01-01",
      value: 10000,
      change: 0,
      protocols: [],
      categories: [],
    },
    {
      date: "2024-01-02",
      value: 10500,
      change: 5,
      protocols: [],
      categories: [],
    },
    {
      date: "2024-01-03",
      value: 11000,
      change: 4.76,
      protocols: [],
      categories: [],
    },
  ];

  it("should process portfolio data correctly", () => {
    const { result } = renderHook(() =>
      usePortfolioHistoryData({
        portfolioHistory: mockPortfolioData,
      })
    );

    expect(result.current.performanceData).toHaveLength(3);
    expect(result.current.hasData).toBe(true);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe(null);
  });

  it("should calculate portfolio metrics correctly", () => {
    const { result } = renderHook(() =>
      usePortfolioHistoryData({
        portfolioHistory: mockPortfolioData,
      })
    );

    expect(result.current.currentValue).toBe(11000);
    expect(result.current.firstValue).toBe(10000);
    expect(result.current.totalReturn).toBe(10); // (11000 - 10000) / 10000 * 100
    expect(result.current.isPositive).toBe(true);
  });

  it("should handle negative returns correctly", () => {
    const negativeData: PortfolioDataPoint[] = [
      {
        date: "2024-01-01",
        value: 10000,
        change: 0,
        protocols: [],
        categories: [],
      },
      {
        date: "2024-01-02",
        value: 9000,
        change: -10,
        protocols: [],
        categories: [],
      },
    ];

    const { result } = renderHook(() =>
      usePortfolioHistoryData({
        portfolioHistory: negativeData,
      })
    );

    expect(result.current.totalReturn).toBe(-10);
    expect(result.current.isPositive).toBe(false);
  });

  it("should handle empty portfolio data", () => {
    const { result } = renderHook(() =>
      usePortfolioHistoryData({
        portfolioHistory: [],
      })
    );

    expect(result.current.performanceData).toHaveLength(0);
    expect(result.current.hasData).toBe(false);
    expect(result.current.currentValue).toBe(0);
    expect(result.current.firstValue).toBe(0);
    expect(result.current.totalReturn).toBe(0);
    expect(result.current.isPositive).toBe(false);
  });

  it("should handle undefined portfolio data", () => {
    const { result } = renderHook(() =>
      usePortfolioHistoryData({
        portfolioHistory: undefined,
      })
    );

    expect(result.current.performanceData).toHaveLength(0);
    expect(result.current.hasData).toBe(false);
  });

  it("should generate stacked portfolio data", () => {
    const { result } = renderHook(() =>
      usePortfolioHistoryData({
        portfolioHistory: mockPortfolioData,
      })
    );

    expect(result.current.stackedPortfolioData).toHaveLength(3);
    for (const point of result.current.stackedPortfolioData) {
      expect(point).toHaveProperty("defiValue");
      expect(point).toHaveProperty("walletValue");
      expect(point).toHaveProperty("stackedTotalValue");
    }
  });

  it("should generate drawdown reference data", () => {
    const { result } = renderHook(() =>
      usePortfolioHistoryData({
        portfolioHistory: mockPortfolioData,
      })
    );

    expect(result.current.drawdownReferenceData).toHaveLength(3);
    expect(result.current.drawdownReferenceData[0]).toEqual({
      date: "2024-01-01",
      portfolio_value: 10000,
    });
    expect(result.current.drawdownReferenceData[1]).toEqual({
      date: "2024-01-02",
      portfolio_value: 10500,
    });
  });

  it("should propagate loading state", () => {
    const { result } = renderHook(() =>
      usePortfolioHistoryData({
        portfolioHistory: [],
        isLoading: true,
      })
    );

    expect(result.current.isLoading).toBe(true);
  });

  it("should propagate error state", () => {
    const errorMessage = "Failed to fetch portfolio data";
    const { result } = renderHook(() =>
      usePortfolioHistoryData({
        portfolioHistory: [],
        error: errorMessage,
      })
    );

    expect(result.current.error).toBe(errorMessage);
  });

  it("should handle zero first value (avoid division by zero)", () => {
    const zeroStartData: PortfolioDataPoint[] = [
      {
        date: "2024-01-01",
        value: 0,
        change: 0,
        protocols: [],
        categories: [],
      },
      {
        date: "2024-01-02",
        value: 1000,
        change: 0,
        protocols: [],
        categories: [],
      },
    ];

    const { result } = renderHook(() =>
      usePortfolioHistoryData({
        portfolioHistory: zeroStartData,
      })
    );

    expect(result.current.totalReturn).toBe(0);
    expect(result.current.currentValue).toBe(1000);
    expect(result.current.firstValue).toBe(0);
  });

  it("should handle single data point", () => {
    const singlePoint: PortfolioDataPoint[] = [
      {
        date: "2024-01-01",
        value: 10000,
        change: 0,
        protocols: [],
        categories: [],
      },
    ];

    const { result } = renderHook(() =>
      usePortfolioHistoryData({
        portfolioHistory: singlePoint,
      })
    );

    expect(result.current.currentValue).toBe(10000);
    expect(result.current.firstValue).toBe(10000);
    expect(result.current.totalReturn).toBe(0);
    expect(result.current.hasData).toBe(true);
  });

  it("should memoize performance data correctly", () => {
    const { result, rerender } = renderHook(
      ({ data }) =>
        usePortfolioHistoryData({
          portfolioHistory: data,
        }),
      {
        initialProps: { data: mockPortfolioData },
      }
    );

    const firstRenderData = result.current.performanceData;

    // Rerender with same data
    rerender({ data: mockPortfolioData });

    // Should be the same reference (memoized)
    expect(result.current.performanceData).toBe(firstRenderData);
  });

  it("should recalculate when data changes", () => {
    const { result, rerender } = renderHook(
      ({ data }) =>
        usePortfolioHistoryData({
          portfolioHistory: data,
        }),
      {
        initialProps: { data: mockPortfolioData },
      }
    );

    const initialValue = result.current.currentValue;
    expect(initialValue).toBe(11000);

    const newData: PortfolioDataPoint[] = [
      ...mockPortfolioData,
      {
        date: "2024-01-04",
        value: 12000,
        change: 9.09,
        protocols: [],
        categories: [],
      },
    ];

    rerender({ data: newData });

    expect(result.current.currentValue).toBe(12000);
    expect(result.current.performanceData).toHaveLength(4);
  });
});
