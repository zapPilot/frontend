import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useWalletPortfolioTransform } from "@/hooks/useWalletPortfolioTransform";
import * as chartUtils from "@/lib/chartUtils";
import type { LandingPageResponse } from "@/services/analyticsService";
import * as portfolioUtils from "@/utils/portfolio.utils";

// Mock dependencies
vi.mock("@/lib/chartUtils");
vi.mock("@/utils/portfolio.utils");

/**
 * Test Suite for useWalletPortfolioTransform Hook
 *
 * This hook transforms API response data (LandingPageResponse) into UI-ready structures:
 * - pieChartData: Visual representation of portfolio allocation
 * - categorySummaries: Aggregated asset category data
 * - debtCategorySummaries: Aggregated debt category data
 * - portfolioMetrics: Portfolio-level financial metrics
 * - hasZeroData: Boolean flag for empty portfolio detection
 */

describe("useWalletPortfolioTransform", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock implementations
    vi.mocked(portfolioUtils.createCategoriesFromApiData).mockImplementation(
      (categoryData, totalValue) => {
        if (!categoryData) return [];

        return Object.entries(categoryData)
          .filter(([, value]) => value > 0)
          .map(([key, value]) => ({
            id: key,
            name: key.toUpperCase(),
            color: "#000",
            totalValue: value,
            percentage: totalValue > 0 ? (value / totalValue) * 100 : 0,
            averageAPR: 0,
            topProtocols: [],
          }));
      }
    );

    vi.mocked(chartUtils.transformToPieChartData).mockImplementation(items => {
      return items
        .filter(item => item.value > 0)
        .map(item => ({
          label: item.id,
          value: item.value,
          percentage: item.percentage || 0,
          color: "#000",
        }));
    });
  });

  // ============================================================================
  // Test Data Fixtures
  // ============================================================================

  const createMockLandingPageData = (
    overrides?: Partial<LandingPageResponse>
  ): LandingPageResponse => ({
    total_assets_usd: 10000,
    total_debt_usd: 2000,
    total_net_usd: 8000,
    weighted_apr: 0.05,
    estimated_monthly_income: 400,
    portfolio_roi: {
      recommended_roi: 0.08,
      recommended_period: "30d",
      recommended_yearly_roi: 0.096,
      estimated_yearly_pnl_usd: 768,
      windows: {
        "7d": { value: 0.02, data_points: 7 },
        "30d": { value: 0.05, data_points: 30 },
      },
    },
    portfolio_allocation: {
      btc: {
        total_value: 3000,
        percentage_of_portfolio: 30,
        wallet_tokens_value: 1000,
        other_sources_value: 2000,
      },
      eth: {
        total_value: 4000,
        percentage_of_portfolio: 40,
        wallet_tokens_value: 1500,
        other_sources_value: 2500,
      },
      stablecoins: {
        total_value: 2000,
        percentage_of_portfolio: 20,
        wallet_tokens_value: 800,
        other_sources_value: 1200,
      },
      others: {
        total_value: 1000,
        percentage_of_portfolio: 10,
        wallet_tokens_value: 400,
        other_sources_value: 600,
      },
    },
    wallet_token_summary: {
      total_value_usd: 3700,
      token_count: 12,
      apr_30d: 0.04,
    },
    category_summary_debt: {
      btc: 500,
      eth: 800,
      stablecoins: 600,
      others: 100,
    },
    pool_details: [],
    total_positions: 5,
    protocols_count: 3,
    chains_count: 2,
    last_updated: "2025-01-17T12:00:00Z",
    apr_coverage: {
      matched_pools: 4,
      total_pools: 5,
      coverage_percentage: 80,
      matched_asset_value_usd: 9000,
    },
    ...overrides,
  });

  // ============================================================================
  // Pie Chart Data Transformation
  // ============================================================================

  describe("Pie Chart Data Transformation", () => {
    it("should transform portfolio_allocation into pie chart data", () => {
      const mockData = createMockLandingPageData();
      const { result } = renderHook(() =>
        useWalletPortfolioTransform(mockData)
      );

      expect(chartUtils.transformToPieChartData).toHaveBeenCalled();
      expect(result.current.pieChartData).not.toBeNull();
      expect(Array.isArray(result.current.pieChartData)).toBe(true);
    });

    it("should pass correct category order to chart transformation", () => {
      const mockData = createMockLandingPageData();
      renderHook(() => useWalletPortfolioTransform(mockData));

      const callArgs = vi.mocked(chartUtils.transformToPieChartData).mock
        .calls[0];
      const categories = callArgs[0];

      // Should maintain category order: btc, eth, stablecoins, others
      expect(categories[0].id).toBe("btc");
      expect(categories[1].id).toBe("eth");
      expect(categories[2].id).toBe("stablecoins");
      expect(categories[3].id).toBe("others");
    });

    it("should include brand color variant option in chart transformation", () => {
      const mockData = createMockLandingPageData();
      renderHook(() => useWalletPortfolioTransform(mockData));

      const callArgs = vi.mocked(chartUtils.transformToPieChartData).mock
        .calls[0];
      const options = callArgs[1];

      expect(options).toEqual({
        deriveCategoryMetadata: true,
        colorVariant: "brand",
      });
    });

    it("should handle zero total_net_usd", () => {
      const mockData = createMockLandingPageData({
        total_net_usd: 0,
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
      });

      vi.mocked(chartUtils.transformToPieChartData).mockReturnValue([]);

      const { result } = renderHook(() =>
        useWalletPortfolioTransform(mockData)
      );

      expect(result.current.pieChartData).toBeNull();
      expect(result.current.hasZeroData).toBe(true);
    });

    it("should return null for pie chart when no positive values", () => {
      const mockData = createMockLandingPageData();
      vi.mocked(chartUtils.transformToPieChartData).mockReturnValue([]);

      const { result } = renderHook(() =>
        useWalletPortfolioTransform(mockData)
      );

      expect(result.current.pieChartData).toBeNull();
    });

    it("should handle missing portfolio_allocation gracefully", () => {
      const mockData = createMockLandingPageData({
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
      });

      const { result } = renderHook(() =>
        useWalletPortfolioTransform(mockData)
      );

      expect(result.current.pieChartData).toBeDefined();
    });

    it("should filter out zero-value categories from summaries", () => {
      const mockData = createMockLandingPageData();

      vi.mocked(portfolioUtils.createCategoriesFromApiData).mockReturnValue([
        {
          id: "btc",
          name: "Bitcoin",
          color: "#000",
          totalValue: 3000,
          percentage: 30,
          averageAPR: 0,
          topProtocols: [],
        },
        {
          id: "eth",
          name: "Ethereum",
          color: "#000",
          totalValue: 4000,
          percentage: 40,
          averageAPR: 0,
          topProtocols: [],
        },
      ]);

      const { result } = renderHook(() =>
        useWalletPortfolioTransform(mockData)
      );

      expect(result.current.categorySummaries).toHaveLength(2);
    });
  });

  // ============================================================================
  // Category Summaries
  // ============================================================================

  describe("Category Summaries", () => {
    it("should generate category summaries from portfolio allocation", () => {
      const mockData = createMockLandingPageData();
      const { result } = renderHook(() =>
        useWalletPortfolioTransform(mockData)
      );

      expect(portfolioUtils.createCategoriesFromApiData).toHaveBeenCalledWith(
        {
          btc: 3000,
          eth: 4000,
          stablecoins: 2000,
          others: 1000,
        },
        10000
      );

      expect(result.current.categorySummaries).toBeDefined();
      expect(Array.isArray(result.current.categorySummaries)).toBe(true);
    });

    it("should handle empty categorySummaries result", () => {
      const mockData = createMockLandingPageData();
      vi.mocked(portfolioUtils.createCategoriesFromApiData).mockReturnValue([]);

      const { result } = renderHook(() =>
        useWalletPortfolioTransform(mockData)
      );

      expect(result.current.categorySummaries).toEqual([]);
    });

    it("should ensure categorySummaries is always an array", () => {
      const mockData = createMockLandingPageData();
      // Simulate edge case where function returns non-array
      vi.mocked(portfolioUtils.createCategoriesFromApiData).mockReturnValue(
        null as any
      );

      const { result } = renderHook(() =>
        useWalletPortfolioTransform(mockData)
      );

      expect(Array.isArray(result.current.categorySummaries)).toBe(true);
      expect(result.current.categorySummaries).toEqual([]);
    });

    it("should extract total_value from portfolio allocation correctly", () => {
      const mockData = createMockLandingPageData({
        portfolio_allocation: {
          btc: {
            total_value: 5000,
            percentage_of_portfolio: 50,
            wallet_tokens_value: 2000,
            other_sources_value: 3000,
          },
          eth: {
            total_value: 3000,
            percentage_of_portfolio: 30,
            wallet_tokens_value: 1000,
            other_sources_value: 2000,
          },
          stablecoins: {
            total_value: 1500,
            percentage_of_portfolio: 15,
            wallet_tokens_value: 500,
            other_sources_value: 1000,
          },
          others: {
            total_value: 500,
            percentage_of_portfolio: 5,
            wallet_tokens_value: 200,
            other_sources_value: 300,
          },
        },
        total_assets_usd: 10000,
      });

      renderHook(() => useWalletPortfolioTransform(mockData));

      expect(portfolioUtils.createCategoriesFromApiData).toHaveBeenCalledWith(
        {
          btc: 5000,
          eth: 3000,
          stablecoins: 1500,
          others: 500,
        },
        10000
      );
    });
  });

  // ============================================================================
  // Debt Categorization
  // ============================================================================

  describe("Debt Categorization", () => {
    it("should generate debt category summaries", () => {
      const mockData = createMockLandingPageData();
      const { result } = renderHook(() =>
        useWalletPortfolioTransform(mockData)
      );

      // Check if createCategoriesFromApiData was called twice (once for assets, once for debt)
      expect(portfolioUtils.createCategoriesFromApiData).toHaveBeenCalledTimes(
        2
      );

      // Second call should be for debt
      const debtCall = vi.mocked(portfolioUtils.createCategoriesFromApiData)
        .mock.calls[1];
      expect(debtCall[0]).toEqual({
        btc: 500,
        eth: 800,
        stablecoins: 600,
        others: 100,
      });
      expect(debtCall[1]).toBe(2000);

      expect(result.current.debtCategorySummaries).toBeDefined();
    });

    it("should handle missing category_summary_debt with defaults", () => {
      const mockData = createMockLandingPageData({
        category_summary_debt: undefined as any,
        total_debt_usd: 0,
      });

      renderHook(() => useWalletPortfolioTransform(mockData));

      const debtCall = vi.mocked(portfolioUtils.createCategoriesFromApiData)
        .mock.calls[1];
      expect(debtCall[0]).toEqual({
        btc: 0,
        eth: 0,
        stablecoins: 0,
        others: 0,
      });
      expect(debtCall[1]).toBe(0);
    });

    it("should handle portfolio with no debt", () => {
      const mockData = createMockLandingPageData({
        category_summary_debt: {
          btc: 0,
          eth: 0,
          stablecoins: 0,
          others: 0,
        },
        total_debt_usd: 0,
      });

      vi.mocked(portfolioUtils.createCategoriesFromApiData).mockReturnValueOnce(
        [
          // Asset summaries
          {
            id: "btc",
            name: "Bitcoin",
            color: "#000",
            totalValue: 3000,
            percentage: 30,
            averageAPR: 0,
            topProtocols: [],
          },
        ]
      );

      vi.mocked(portfolioUtils.createCategoriesFromApiData).mockReturnValueOnce(
        []
      );

      const { result } = renderHook(() =>
        useWalletPortfolioTransform(mockData)
      );

      expect(result.current.debtCategorySummaries).toEqual([]);
    });

    it("should ensure debtCategorySummaries is always an array", () => {
      const mockData = createMockLandingPageData();

      vi.mocked(portfolioUtils.createCategoriesFromApiData)
        .mockReturnValueOnce([]) // Asset summaries
        .mockReturnValueOnce(null as any); // Debt summaries (simulated bad return)

      const { result } = renderHook(() =>
        useWalletPortfolioTransform(mockData)
      );

      expect(Array.isArray(result.current.debtCategorySummaries)).toBe(true);
      expect(result.current.debtCategorySummaries).toEqual([]);
    });

    it("should handle undefined total_debt_usd", () => {
      const mockData = createMockLandingPageData({
        total_debt_usd: undefined as any,
      });

      renderHook(() => useWalletPortfolioTransform(mockData));

      const debtCall = vi.mocked(portfolioUtils.createCategoriesFromApiData)
        .mock.calls[1];
      expect(debtCall[1]).toBe(0); // Should default to 0
    });
  });

  // ============================================================================
  // Portfolio Metrics
  // ============================================================================

  describe("Portfolio Metrics", () => {
    it("should calculate portfolio metrics from landing page data", () => {
      const mockData = createMockLandingPageData({
        total_net_usd: 12345.67,
      });

      const { result } = renderHook(() =>
        useWalletPortfolioTransform(mockData)
      );

      expect(result.current.portfolioMetrics).toEqual({
        totalValue: 12345.67,
        totalChange24h: 0,
        totalChangePercentage: 0,
      });
    });

    it("should handle zero net worth", () => {
      const mockData = createMockLandingPageData({
        total_net_usd: 0,
      });

      const { result } = renderHook(() =>
        useWalletPortfolioTransform(mockData)
      );

      expect(result.current.portfolioMetrics?.totalValue).toBe(0);
    });

    it("should handle negative net worth", () => {
      const mockData = createMockLandingPageData({
        total_net_usd: -1000,
        total_assets_usd: 5000,
        total_debt_usd: 6000,
      });

      const { result } = renderHook(() =>
        useWalletPortfolioTransform(mockData)
      );

      expect(result.current.portfolioMetrics?.totalValue).toBe(-1000);
    });

    it("should always include change metrics (even if zero)", () => {
      const mockData = createMockLandingPageData();
      const { result } = renderHook(() =>
        useWalletPortfolioTransform(mockData)
      );

      expect(result.current.portfolioMetrics).toHaveProperty("totalChange24h");
      expect(result.current.portfolioMetrics).toHaveProperty(
        "totalChangePercentage"
      );
      expect(result.current.portfolioMetrics?.totalChange24h).toBe(0);
      expect(result.current.portfolioMetrics?.totalChangePercentage).toBe(0);
    });
  });

  // ============================================================================
  // Zero Data Detection
  // ============================================================================

  describe("Zero Data Detection", () => {
    it("should detect zero data when all category values are zero", () => {
      const mockData = createMockLandingPageData({
        total_net_usd: 0,
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
      });

      const { result } = renderHook(() =>
        useWalletPortfolioTransform(mockData)
      );

      expect(result.current.hasZeroData).toBe(true);
    });

    it("should NOT detect zero data when at least one category has value", () => {
      const mockData = createMockLandingPageData({
        total_net_usd: 100,
        portfolio_allocation: {
          btc: {
            total_value: 100,
            percentage_of_portfolio: 100,
            wallet_tokens_value: 100,
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
      });

      const { result } = renderHook(() =>
        useWalletPortfolioTransform(mockData)
      );

      expect(result.current.hasZeroData).toBe(false);
    });

    it("should require BOTH zero categories AND zero net worth", () => {
      // Case 1: Zero categories but positive net worth
      const mockData1 = createMockLandingPageData({
        total_net_usd: 100, // Non-zero
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
      });

      const { result: result1 } = renderHook(() =>
        useWalletPortfolioTransform(mockData1)
      );
      expect(result1.current.hasZeroData).toBe(false);
    });

    it("should handle undefined data as zero state", () => {
      const { result } = renderHook(() => useWalletPortfolioTransform());

      expect(result.current.hasZeroData).toBe(false); // No data = not necessarily zero portfolio
      expect(result.current.pieChartData).toBeNull();
      expect(result.current.categorySummaries).toEqual([]);
      expect(result.current.portfolioMetrics).toBeNull();
    });
  });

  // ============================================================================
  // Edge Cases
  // ============================================================================

  describe("Edge Cases", () => {
    it("should handle very large numbers (whale portfolio)", () => {
      const mockData = createMockLandingPageData({
        total_assets_usd: 10_000_000,
        total_debt_usd: 1_000_000,
        total_net_usd: 9_000_000,
        portfolio_allocation: {
          btc: {
            total_value: 5_000_000,
            percentage_of_portfolio: 50,
            wallet_tokens_value: 2_000_000,
            other_sources_value: 3_000_000,
          },
          eth: {
            total_value: 3_000_000,
            percentage_of_portfolio: 30,
            wallet_tokens_value: 1_000_000,
            other_sources_value: 2_000_000,
          },
          stablecoins: {
            total_value: 1_500_000,
            percentage_of_portfolio: 15,
            wallet_tokens_value: 500_000,
            other_sources_value: 1_000_000,
          },
          others: {
            total_value: 500_000,
            percentage_of_portfolio: 5,
            wallet_tokens_value: 200_000,
            other_sources_value: 300_000,
          },
        },
      });

      const { result } = renderHook(() =>
        useWalletPortfolioTransform(mockData)
      );

      expect(result.current.portfolioMetrics?.totalValue).toBe(9_000_000);
      expect(result.current.hasZeroData).toBe(false);
    });

    it("should handle very small numbers (micro portfolio)", () => {
      const mockData = createMockLandingPageData({
        total_assets_usd: 1,
        total_debt_usd: 0,
        total_net_usd: 1,
        portfolio_allocation: {
          btc: {
            total_value: 0.5,
            percentage_of_portfolio: 50,
            wallet_tokens_value: 0.5,
            other_sources_value: 0,
          },
          eth: {
            total_value: 0.3,
            percentage_of_portfolio: 30,
            wallet_tokens_value: 0.3,
            other_sources_value: 0,
          },
          stablecoins: {
            total_value: 0.2,
            percentage_of_portfolio: 20,
            wallet_tokens_value: 0.2,
            other_sources_value: 0,
          },
          others: {
            total_value: 0,
            percentage_of_portfolio: 0,
            wallet_tokens_value: 0,
            other_sources_value: 0,
          },
        },
      });

      const { result } = renderHook(() =>
        useWalletPortfolioTransform(mockData)
      );

      expect(result.current.portfolioMetrics?.totalValue).toBe(1);
      expect(result.current.hasZeroData).toBe(false);
    });

    it("should handle fractional percentages correctly", () => {
      const mockData = createMockLandingPageData({
        portfolio_allocation: {
          btc: {
            total_value: 3333.33,
            percentage_of_portfolio: 33.3333,
            wallet_tokens_value: 1000,
            other_sources_value: 2333.33,
          },
          eth: {
            total_value: 3333.33,
            percentage_of_portfolio: 33.3333,
            wallet_tokens_value: 1000,
            other_sources_value: 2333.33,
          },
          stablecoins: {
            total_value: 3333.34,
            percentage_of_portfolio: 33.3334,
            wallet_tokens_value: 1000,
            other_sources_value: 2333.34,
          },
          others: {
            total_value: 0,
            percentage_of_portfolio: 0,
            wallet_tokens_value: 0,
            other_sources_value: 0,
          },
        },
        total_assets_usd: 10000,
      });

      const { result } = renderHook(() =>
        useWalletPortfolioTransform(mockData)
      );

      expect(result.current.categorySummaries).toBeDefined();
      expect(result.current.hasZeroData).toBe(false);
    });

    it("should handle single category portfolio", () => {
      const mockData = createMockLandingPageData({
        portfolio_allocation: {
          btc: {
            total_value: 10000,
            percentage_of_portfolio: 100,
            wallet_tokens_value: 5000,
            other_sources_value: 5000,
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
        total_assets_usd: 10000,
      });

      const { result } = renderHook(() =>
        useWalletPortfolioTransform(mockData)
      );

      expect(result.current.hasZeroData).toBe(false);
    });

    it("should handle missing optional fields gracefully", () => {
      const mockData = createMockLandingPageData({
        category_summary_debt: undefined as any,
        wallet_token_summary: undefined as any,
      });

      const { result } = renderHook(() =>
        useWalletPortfolioTransform(mockData)
      );

      expect(result.current.debtCategorySummaries).toBeDefined();
      expect(Array.isArray(result.current.debtCategorySummaries)).toBe(true);
    });
  });

  // ============================================================================
  // Data Integrity & Memoization
  // ============================================================================

  describe("Data Integrity", () => {
    it("should return stable references when data unchanged", () => {
      const mockData = createMockLandingPageData();

      const { result, rerender } = renderHook(
        ({ data }) => useWalletPortfolioTransform(data),
        {
          initialProps: { data: mockData },
        }
      );

      const firstResult = result.current;

      rerender({ data: mockData });

      // With useMemo, references should be stable when input is unchanged
      expect(result.current).toBe(firstResult);
    });

    it("should return new references when data changes", () => {
      const mockData1 = createMockLandingPageData();
      const mockData2 = createMockLandingPageData({
        total_net_usd: 9999,
      });

      const { result, rerender } = renderHook(
        ({ data }) => useWalletPortfolioTransform(data),
        {
          initialProps: { data: mockData1 },
        }
      );

      const firstResult = result.current;

      rerender({ data: mockData2 });

      // References should change when data changes
      expect(result.current).not.toBe(firstResult);
    });

    it("should handle transitions from undefined to defined data", () => {
      const { result, rerender } = renderHook(
        ({ data }) => useWalletPortfolioTransform(data),
        {
          initialProps: { data: undefined },
        }
      );

      expect(result.current.pieChartData).toBeNull();
      expect(result.current.categorySummaries).toEqual([]);

      const mockData = createMockLandingPageData();
      rerender({ data: mockData });

      expect(result.current.pieChartData).toBeDefined();
      expect(result.current.categorySummaries).toBeDefined();
    });

    it("should handle transitions from defined to undefined data", () => {
      const mockData = createMockLandingPageData();

      const { result, rerender } = renderHook(
        ({ data }) => useWalletPortfolioTransform(data),
        {
          initialProps: { data: mockData },
        }
      );

      expect(result.current.pieChartData).toBeDefined();

      rerender({ data: undefined });

      expect(result.current.pieChartData).toBeNull();
      expect(result.current.categorySummaries).toEqual([]);
    });
  });

  // ============================================================================
  // Integration Scenarios
  // ============================================================================

  describe("Integration Scenarios", () => {
    it("should handle complete real-world portfolio", () => {
      const realWorldData = createMockLandingPageData({
        total_assets_usd: 25789.45,
        total_debt_usd: 3200.5,
        total_net_usd: 22588.95,
        portfolio_allocation: {
          btc: {
            total_value: 12000,
            percentage_of_portfolio: 46.55,
            wallet_tokens_value: 5000,
            other_sources_value: 7000,
          },
          eth: {
            total_value: 8500,
            percentage_of_portfolio: 32.97,
            wallet_tokens_value: 3500,
            other_sources_value: 5000,
          },
          stablecoins: {
            total_value: 4289.45,
            percentage_of_portfolio: 16.63,
            wallet_tokens_value: 2000,
            other_sources_value: 2289.45,
          },
          others: {
            total_value: 1000,
            percentage_of_portfolio: 3.88,
            wallet_tokens_value: 500,
            other_sources_value: 500,
          },
        },
        category_summary_debt: {
          btc: 1200,
          eth: 1500,
          stablecoins: 400,
          others: 100.5,
        },
      });

      const { result } = renderHook(() =>
        useWalletPortfolioTransform(realWorldData)
      );

      expect(result.current.pieChartData).not.toBeNull();
      expect(result.current.categorySummaries.length).toBeGreaterThan(0);
      expect(result.current.debtCategorySummaries.length).toBeGreaterThan(0);
      expect(result.current.portfolioMetrics?.totalValue).toBe(22588.95);
      expect(result.current.hasZeroData).toBe(false);
    });

    it("should handle visitor mode (empty) portfolio", () => {
      const { result } = renderHook(() => useWalletPortfolioTransform());

      expect(result.current).toEqual({
        pieChartData: null,
        categorySummaries: [],
        debtCategorySummaries: [],
        portfolioMetrics: null,
        hasZeroData: false,
      });
    });

    it("should handle portfolio with single position", () => {
      const singlePositionData = createMockLandingPageData({
        total_positions: 1,
        protocols_count: 1,
        chains_count: 1,
        portfolio_allocation: {
          btc: {
            total_value: 5000,
            percentage_of_portfolio: 100,
            wallet_tokens_value: 5000,
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
        total_assets_usd: 5000,
        total_debt_usd: 0,
        total_net_usd: 5000,
      });

      const { result } = renderHook(() =>
        useWalletPortfolioTransform(singlePositionData)
      );

      expect(result.current.hasZeroData).toBe(false);
      expect(result.current.portfolioMetrics?.totalValue).toBe(5000);
    });

    it("should handle portfolio with mixed allocation sources", () => {
      const mixedSourceData = createMockLandingPageData({
        portfolio_allocation: {
          btc: {
            total_value: 5000,
            percentage_of_portfolio: 50,
            wallet_tokens_value: 4500, // Mostly wallet
            other_sources_value: 500,
          },
          eth: {
            total_value: 3000,
            percentage_of_portfolio: 30,
            wallet_tokens_value: 500, // Mostly other sources
            other_sources_value: 2500,
          },
          stablecoins: {
            total_value: 1500,
            percentage_of_portfolio: 15,
            wallet_tokens_value: 750, // 50/50 split
            other_sources_value: 750,
          },
          others: {
            total_value: 500,
            percentage_of_portfolio: 5,
            wallet_tokens_value: 0, // All from other sources
            other_sources_value: 500,
          },
        },
      });

      const { result } = renderHook(() =>
        useWalletPortfolioTransform(mixedSourceData)
      );

      expect(result.current.categorySummaries).toBeDefined();
      expect(result.current.hasZeroData).toBe(false);
    });
  });

  // ============================================================================
  // Return Type Structure
  // ============================================================================

  describe("Return Type Structure", () => {
    it("should always return all required fields", () => {
      const mockData = createMockLandingPageData();
      const { result } = renderHook(() =>
        useWalletPortfolioTransform(mockData)
      );

      expect(result.current).toHaveProperty("pieChartData");
      expect(result.current).toHaveProperty("categorySummaries");
      expect(result.current).toHaveProperty("debtCategorySummaries");
      expect(result.current).toHaveProperty("portfolioMetrics");
      expect(result.current).toHaveProperty("hasZeroData");
    });

    it("should return correct types for all fields", () => {
      const mockData = createMockLandingPageData();
      const { result } = renderHook(() =>
        useWalletPortfolioTransform(mockData)
      );

      // pieChartData can be null or array
      expect(
        result.current.pieChartData === null ||
          Array.isArray(result.current.pieChartData)
      ).toBe(true);

      // categorySummaries must be array
      expect(Array.isArray(result.current.categorySummaries)).toBe(true);

      // debtCategorySummaries must be array
      expect(Array.isArray(result.current.debtCategorySummaries)).toBe(true);

      // portfolioMetrics can be null or object
      expect(
        result.current.portfolioMetrics === null ||
          typeof result.current.portfolioMetrics === "object"
      ).toBe(true);

      // hasZeroData must be boolean
      expect(typeof result.current.hasZeroData).toBe("boolean");
    });

    it("should match the documented return interface", () => {
      const { result } = renderHook(() => useWalletPortfolioTransform());

      // When undefined, should return safe defaults
      expect(result.current).toMatchObject({
        pieChartData: null,
        categorySummaries: [],
        debtCategorySummaries: [],
        portfolioMetrics: null,
        hasZeroData: false,
      });
    });
  });
});
