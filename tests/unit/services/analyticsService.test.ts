/**
 * Comprehensive test suite for analyticsService
 *
 * Tests all exported functions:
 * - getPortfolioTrends (HTTP)
 * - getLandingPagePortfolioData (HTTP)
 * - getRiskSummary (HTTP)
 * - getRollingSharpe (HTTP)
 * - getRollingVolatility (HTTP)
 * - getEnhancedDrawdown (HTTP)
 * - getUnderwaterRecovery (HTTP)
 * - getAllocationTimeseries (HTTP)
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getPortfolioTrends,
  getLandingPagePortfolioData,
  getRiskSummary,
  getRollingSharpe,
  getRollingVolatility,
  getEnhancedDrawdown,
  getUnderwaterRecovery,
  getAllocationTimeseries,
  type PortfolioTrendsResponse,
  type LandingPageResponse,
  type RollingSharpeResponse,
  type RollingVolatilityResponse,
  type EnhancedDrawdownResponse,
  type UnderwaterRecoveryResponse,
  type AllocationTimeseriesResponse,
} from "../../../src/services/analyticsService";
import type { ActualRiskSummaryResponse } from "../../../src/types/risk";

// Mock dependencies
vi.mock("../../../src/lib/http-utils", () => ({
  httpUtils: {
    analyticsEngine: {
      get: vi.fn(),
    },
  },
}));

// Import mocked module
import { httpUtils } from "../../../src/lib/http-utils";

const mockAnalyticsEngineGet = httpUtils.analyticsEngine.get as ReturnType<
  typeof vi.fn
>;

describe("analyticsService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getPortfolioTrends", () => {
    const testUserId = "0xTestUser123";

    describe("Successful API Calls", () => {
      it("should fetch portfolio trends with default parameters", async () => {
        const mockResponse: PortfolioTrendsResponse = {
          user_id: testUserId,
          period: {
            start_date: "2025-01-08",
            end_date: "2025-02-07",
            days: 30,
          },
          trend_data: [
            {
              id: "trend-1",
              user_id: testUserId,
              wallet_address: "0xWallet1",
              chain: "ethereum",
              protocol: "aave",
              net_value_usd: 1000,
              pnl_usd: 50,
              date: "2025-01-08",
              created_at: "2025-01-08T00:00:00Z",
            },
          ],
          daily_totals: [
            {
              date: "2025-01-08",
              total_value_usd: 1000,
              change_percentage: 5,
              protocols: [
                {
                  protocol: "aave",
                  chain: "ethereum",
                  value_usd: 1000,
                  pnl_usd: 50,
                },
              ],
              chains_count: 1,
            },
          ],
          summary: {
            total_change_usd: 50,
            total_change_percentage: 5,
          },
        };

        mockAnalyticsEngineGet.mockResolvedValue(mockResponse);

        const result = await getPortfolioTrends(testUserId);

        expect(mockAnalyticsEngineGet).toHaveBeenCalledWith(
          `/api/v1/portfolio-trends/by-user/${testUserId}?days=30&limit=100`
        );
        expect(result).toEqual(mockResponse);
      });

      it("should fetch portfolio trends with custom days parameter", async () => {
        const mockResponse: PortfolioTrendsResponse = {
          user_id: testUserId,
          period: {
            start_date: "2024-12-17",
            end_date: "2025-02-07",
            days: 60,
          },
          trend_data: [],
          daily_totals: [],
          summary: {
            total_change_usd: 0,
            total_change_percentage: 0,
          },
        };

        mockAnalyticsEngineGet.mockResolvedValue(mockResponse);

        const result = await getPortfolioTrends(testUserId, 60);

        expect(mockAnalyticsEngineGet).toHaveBeenCalledWith(
          `/api/v1/portfolio-trends/by-user/${testUserId}?days=60&limit=100`
        );
        expect(result).toEqual(mockResponse);
      });

      it("should fetch portfolio trends with custom limit parameter", async () => {
        const mockResponse: PortfolioTrendsResponse = {
          user_id: testUserId,
          period: {
            start_date: "2025-01-08",
            end_date: "2025-02-07",
            days: 30,
          },
          trend_data: [],
          daily_totals: [],
          summary: {
            total_change_usd: 0,
            total_change_percentage: 0,
          },
        };

        mockAnalyticsEngineGet.mockResolvedValue(mockResponse);

        const result = await getPortfolioTrends(testUserId, 30, 200);

        expect(mockAnalyticsEngineGet).toHaveBeenCalledWith(
          `/api/v1/portfolio-trends/by-user/${testUserId}?days=30&limit=200`
        );
        expect(result).toEqual(mockResponse);
      });

      it("should fetch portfolio trends with both custom days and limit", async () => {
        const mockResponse: PortfolioTrendsResponse = {
          user_id: testUserId,
          period: {
            start_date: "2024-11-27",
            end_date: "2025-02-07",
            days: 90,
          },
          trend_data: [],
          daily_totals: [],
          summary: {
            total_change_usd: 0,
            total_change_percentage: 0,
          },
        };

        mockAnalyticsEngineGet.mockResolvedValue(mockResponse);

        const result = await getPortfolioTrends(testUserId, 90, 500);

        expect(mockAnalyticsEngineGet).toHaveBeenCalledWith(
          `/api/v1/portfolio-trends/by-user/${testUserId}?days=90&limit=500`
        );
        expect(result).toEqual(mockResponse);
      });
    });

    describe("Query Parameter Building", () => {
      it("should correctly build URLSearchParams with days=1", async () => {
        mockAnalyticsEngineGet.mockResolvedValue({
          user_id: testUserId,
          period: { start_date: "", end_date: "", days: 1 },
          trend_data: [],
          daily_totals: [],
          summary: { total_change_usd: 0, total_change_percentage: 0 },
        });

        await getPortfolioTrends(testUserId, 1);

        expect(mockAnalyticsEngineGet).toHaveBeenCalledWith(
          `/api/v1/portfolio-trends/by-user/${testUserId}?days=1&limit=100`
        );
      });

      it("should correctly build URLSearchParams with limit=1", async () => {
        mockAnalyticsEngineGet.mockResolvedValue({
          user_id: testUserId,
          period: { start_date: "", end_date: "", days: 30 },
          trend_data: [],
          daily_totals: [],
          summary: { total_change_usd: 0, total_change_percentage: 0 },
        });

        await getPortfolioTrends(testUserId, 30, 1);

        expect(mockAnalyticsEngineGet).toHaveBeenCalledWith(
          `/api/v1/portfolio-trends/by-user/${testUserId}?days=30&limit=1`
        );
      });

      it("should handle zero days parameter", async () => {
        mockAnalyticsEngineGet.mockResolvedValue({
          user_id: testUserId,
          period: { start_date: "", end_date: "", days: 0 },
          trend_data: [],
          daily_totals: [],
          summary: { total_change_usd: 0, total_change_percentage: 0 },
        });

        await getPortfolioTrends(testUserId, 0);

        expect(mockAnalyticsEngineGet).toHaveBeenCalledWith(
          `/api/v1/portfolio-trends/by-user/${testUserId}?days=0&limit=100`
        );
      });
    });

    describe("UserId Path Interpolation", () => {
      it("should correctly interpolate userId with special characters", async () => {
        const specialUserId = "0x123abc-DEF_456";
        mockAnalyticsEngineGet.mockResolvedValue({
          user_id: specialUserId,
          period: { start_date: "", end_date: "", days: 30 },
          trend_data: [],
          daily_totals: [],
          summary: { total_change_usd: 0, total_change_percentage: 0 },
        });

        await getPortfolioTrends(specialUserId);

        expect(mockAnalyticsEngineGet).toHaveBeenCalledWith(
          `/api/v1/portfolio-trends/by-user/${specialUserId}?days=30&limit=100`
        );
      });

      it("should handle empty userId", async () => {
        mockAnalyticsEngineGet.mockResolvedValue({
          user_id: "",
          period: { start_date: "", end_date: "", days: 30 },
          trend_data: [],
          daily_totals: [],
          summary: { total_change_usd: 0, total_change_percentage: 0 },
        });

        await getPortfolioTrends("");

        expect(mockAnalyticsEngineGet).toHaveBeenCalledWith(
          `/api/v1/portfolio-trends/by-user/?days=30&limit=100`
        );
      });
    });

    describe("Response Data Pass-Through", () => {
      it("should return complete response with all fields", async () => {
        const mockResponse: PortfolioTrendsResponse = {
          user_id: testUserId,
          period: {
            start_date: "2025-01-01",
            end_date: "2025-01-30",
            days: 30,
          },
          trend_data: [
            {
              id: "1",
              user_id: testUserId,
              wallet_address: "0xABC",
              chain: "ethereum",
              protocol: "compound",
              net_value_usd: 5000,
              pnl_usd: 200,
              date: "2025-01-15",
              created_at: "2025-01-15T12:00:00Z",
            },
          ],
          daily_totals: [
            {
              date: "2025-01-15",
              total_value_usd: 5000,
              change_percentage: 4,
              protocols: [
                {
                  protocol: "compound",
                  chain: "ethereum",
                  value_usd: 5000,
                  pnl_usd: 200,
                },
              ],
              chains_count: 1,
            },
          ],
          summary: {
            total_change_usd: 200,
            total_change_percentage: 4,
            best_day: {
              id: "1",
              user_id: testUserId,
              wallet_address: "0xABC",
              chain: "ethereum",
              protocol: "compound",
              net_value_usd: 5000,
              pnl_usd: 200,
              date: "2025-01-15",
              created_at: "2025-01-15T12:00:00Z",
            },
            worst_day: {
              id: "2",
              user_id: testUserId,
              wallet_address: "0xABC",
              chain: "ethereum",
              protocol: "compound",
              net_value_usd: 4800,
              pnl_usd: -100,
              date: "2025-01-10",
              created_at: "2025-01-10T12:00:00Z",
            },
          },
        };

        mockAnalyticsEngineGet.mockResolvedValue(mockResponse);

        const result = await getPortfolioTrends(testUserId);

        expect(result).toEqual(mockResponse);
        expect(result.summary.best_day).toBeDefined();
        expect(result.summary.worst_day).toBeDefined();
      });
    });
  });

  describe("getLandingPagePortfolioData", () => {
    const testUserId = "0xTestUser123";

    describe("Successful API Calls", () => {
      it("should fetch landing page data with correct endpoint", async () => {
        const mockResponse: LandingPageResponse = {
          total_assets_usd: 10000,
          total_debt_usd: 2000,
          total_net_usd: 8000,
          weighted_apr: 5.5,
          estimated_monthly_income: 36.67,
          portfolio_roi: {
            recommended_roi: 0.055,
            recommended_period: "30d",
            recommended_yearly_roi: 0.66,
            estimated_yearly_pnl_usd: 440,
          },
          portfolio_allocation: {
            btc: {
              total_value: 3000,
              percentage_of_portfolio: 37.5,
              wallet_tokens_value: 2000,
              other_sources_value: 1000,
            },
            eth: {
              total_value: 2500,
              percentage_of_portfolio: 31.25,
              wallet_tokens_value: 1500,
              other_sources_value: 1000,
            },
            stablecoins: {
              total_value: 2000,
              percentage_of_portfolio: 25,
              wallet_tokens_value: 2000,
              other_sources_value: 0,
            },
            others: {
              total_value: 500,
              percentage_of_portfolio: 6.25,
              wallet_tokens_value: 500,
              other_sources_value: 0,
            },
          },
          wallet_token_summary: {
            total_value_usd: 6000,
            token_count: 12,
            apr_30d: 3.2,
          },
          category_summary_debt: {
            btc: 500,
            eth: 1000,
            stablecoins: 500,
            others: 0,
          },
          pool_details: [],
          total_positions: 5,
          protocols_count: 3,
          chains_count: 2,
          last_updated: "2025-02-07T12:00:00Z",
          apr_coverage: {
            matched_pools: 4,
            total_pools: 5,
            coverage_percentage: 80,
            matched_asset_value_usd: 7500,
          },
        };

        mockAnalyticsEngineGet.mockResolvedValue(mockResponse);

        const result = await getLandingPagePortfolioData(testUserId);

        expect(mockAnalyticsEngineGet).toHaveBeenCalledWith(
          `/api/v1/landing-page/portfolio/${testUserId}`
        );
        expect(result).toEqual(mockResponse);
      });

      it("should handle response with optional message field", async () => {
        const mockResponse: LandingPageResponse = {
          total_assets_usd: 0,
          total_debt_usd: 0,
          total_net_usd: 0,
          weighted_apr: 0,
          estimated_monthly_income: 0,
          portfolio_roi: {
            recommended_roi: 0,
            recommended_period: "7d",
            recommended_yearly_roi: 0,
            estimated_yearly_pnl_usd: 0,
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
            total_value_usd: 0,
            token_count: 0,
            apr_30d: 0,
          },
          category_summary_debt: {
            btc: 0,
            eth: 0,
            stablecoins: 0,
            others: 0,
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
          message: "No portfolio data available",
        };

        mockAnalyticsEngineGet.mockResolvedValue(mockResponse);

        const result = await getLandingPagePortfolioData(testUserId);

        expect(result.message).toBe("No portfolio data available");
      });

      it("should handle response with legacy ROI fields", async () => {
        const mockResponse: LandingPageResponse = {
          total_assets_usd: 5000,
          total_debt_usd: 1000,
          total_net_usd: 4000,
          weighted_apr: 4.2,
          estimated_monthly_income: 14,
          portfolio_roi: {
            recommended_roi: 0.042,
            recommended_period: "7d",
            recommended_yearly_roi: 0.5,
            estimated_yearly_pnl_usd: 168,
            roi_7d: {
              value: 0.01,
              data_points: 7,
            },
            roi_30d: {
              value: 0.042,
              data_points: 30,
            },
            roi_365d: {
              value: 0.5,
              data_points: 365,
            },
            roi_windows: {
              "7d": 0.01,
              "30d": 0.042,
              "90d": 0.12,
              "365d": 0.5,
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
          wallet_token_summary: {
            total_value_usd: 0,
            token_count: 0,
            apr_30d: 0,
          },
          category_summary_debt: {
            btc: 0,
            eth: 0,
            stablecoins: 0,
            others: 0,
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
        };

        mockAnalyticsEngineGet.mockResolvedValue(mockResponse);

        const result = await getLandingPagePortfolioData(testUserId);

        expect(result.portfolio_roi.roi_7d).toBeDefined();
        expect(result.portfolio_roi.roi_30d).toBeDefined();
        expect(result.portfolio_roi.roi_365d).toBeDefined();
        expect(result.portfolio_roi.roi_windows).toBeDefined();
      });

      it("should handle response with windows field", async () => {
        const mockResponse: LandingPageResponse = {
          total_assets_usd: 5000,
          total_debt_usd: 1000,
          total_net_usd: 4000,
          weighted_apr: 4.2,
          estimated_monthly_income: 14,
          portfolio_roi: {
            recommended_roi: 0.042,
            recommended_period: "30d",
            recommended_yearly_roi: 0.5,
            estimated_yearly_pnl_usd: 168,
            windows: {
              "7d": {
                value: 0.01,
                data_points: 7,
                start_balance: 3900,
              },
              "30d": {
                value: 0.042,
                data_points: 30,
                start_balance: 3800,
              },
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
          wallet_token_summary: {
            total_value_usd: 0,
            token_count: 0,
            apr_30d: 0,
          },
          category_summary_debt: {
            btc: 0,
            eth: 0,
            stablecoins: 0,
            others: 0,
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
        };

        mockAnalyticsEngineGet.mockResolvedValue(mockResponse);

        const result = await getLandingPagePortfolioData(testUserId);

        expect(result.portfolio_roi.windows).toBeDefined();
        expect(result.portfolio_roi.windows?.["7d"].start_balance).toBe(3900);
      });
    });
  });

  describe("getRiskSummary", () => {
    const testUserId = "0xTestUser123";

    describe("Successful API Calls", () => {
      it("should fetch risk summary with correct endpoint", async () => {
        const mockResponse: ActualRiskSummaryResponse = {
          user_id: testUserId,
          risk_summary: {
            volatility: {
              user_id: testUserId,
              period_days: 30,
              data_points: 30,
              volatility_daily: 0.025,
              volatility_annualized: 0.475,
              average_daily_return: 0.001,
              period_info: {
                start_date: "2025-01-08",
                end_date: "2025-02-07",
              },
            },
            drawdown: {
              user_id: testUserId,
              period_days: 30,
              data_points: 30,
              max_drawdown: -500,
              max_drawdown_percentage: -0.05,
              max_drawdown_date: "2025-01-20",
              peak_value: 10000,
              trough_value: 9500,
              recovery_needed_percentage: 0.0526,
              current_drawdown: -200,
              current_drawdown_percentage: -0.02,
              period_info: {
                start_date: "2025-01-08",
                end_date: "2025-02-07",
              },
            },
          },
          summary_metrics: {
            annualized_volatility_percentage: 47.5,
            max_drawdown_percentage: -5,
          },
        };

        mockAnalyticsEngineGet.mockResolvedValue(mockResponse);

        const result = await getRiskSummary(testUserId);

        expect(mockAnalyticsEngineGet).toHaveBeenCalledWith(
          `/api/v1/risk/summary/${testUserId}`
        );
        expect(result).toEqual(mockResponse);
      });

      it("should handle risk summary with Sharpe ratio data", async () => {
        const mockResponse: ActualRiskSummaryResponse = {
          user_id: testUserId,
          risk_summary: {
            volatility: {
              user_id: testUserId,
              period_days: 30,
              data_points: 30,
              volatility_daily: 0.025,
              volatility_annualized: 0.475,
              average_daily_return: 0.001,
              period_info: {
                start_date: "2025-01-08",
                end_date: "2025-02-07",
              },
            },
            drawdown: {
              user_id: testUserId,
              period_days: 30,
              data_points: 30,
              max_drawdown: -500,
              max_drawdown_percentage: -0.05,
              max_drawdown_date: "2025-01-20",
              peak_value: 10000,
              trough_value: 9500,
              recovery_needed_percentage: 0.0526,
              current_drawdown: -200,
              current_drawdown_percentage: -0.02,
              period_info: {
                start_date: "2025-01-08",
                end_date: "2025-02-07",
              },
            },
            sharpe_ratio: {
              user_id: testUserId,
              period_days: 30,
              data_points: 30,
              sharpe_ratio: 1.5,
              portfolio_return_annual: 0.15,
              risk_free_rate_annual: 0.03,
              excess_return: 0.12,
              volatility_annual: 0.08,
              interpretation: "Good risk-adjusted returns",
              period_info: {
                start_date: "2025-01-08",
                end_date: "2025-02-07",
              },
            },
          },
          summary_metrics: {
            annualized_volatility_percentage: 47.5,
            max_drawdown_percentage: -5,
            sharpe_ratio: 1.5,
          },
        };

        mockAnalyticsEngineGet.mockResolvedValue(mockResponse);

        const result = await getRiskSummary(testUserId);

        expect(result.risk_summary.sharpe_ratio).toBeDefined();
        expect(result.summary_metrics.sharpe_ratio).toBe(1.5);
      });
    });
  });

  describe("getRollingSharpe", () => {
    const testUserId = "0xTestUser123";

    describe("Successful API Calls", () => {
      it("should fetch rolling Sharpe with default days parameter", async () => {
        const mockResponse: RollingSharpeResponse = {
          user_id: testUserId,
          period: {
            start_date: "2024-12-29",
            end_date: "2025-02-07",
            days: 40,
          },
          rolling_sharpe_data: [
            {
              date: "2025-01-01",
              portfolio_value: 10000,
              daily_return_pct: 0.5,
              rolling_avg_return_pct: 0.4,
              rolling_volatility_pct: 1.2,
              rolling_sharpe_ratio: 1.5,
              window_size: 20,
              is_statistically_reliable: true,
            },
          ],
          data_points: 1,
          summary: {
            latest_sharpe_ratio: 1.5,
            avg_sharpe_ratio: 1.4,
            reliable_data_points: 1,
            statistical_reliability: "reliable",
          },
          educational_context: {
            reliability_warning: "Sufficient data points",
            recommended_minimum: "30 days",
            window_size: 20,
            interpretation: "Good risk-adjusted performance",
          },
        };

        mockAnalyticsEngineGet.mockResolvedValue(mockResponse);

        const result = await getRollingSharpe(testUserId);

        expect(mockAnalyticsEngineGet).toHaveBeenCalledWith(
          `/api/v1/risk/sharpe/rolling/${testUserId}?days=40`
        );
        expect(result).toEqual(mockResponse);
      });

      it("should fetch rolling Sharpe with custom days parameter", async () => {
        const mockResponse: RollingSharpeResponse = {
          user_id: testUserId,
          period: {
            start_date: "2024-11-27",
            end_date: "2025-02-07",
            days: 90,
          },
          rolling_sharpe_data: [],
          data_points: 0,
          summary: {
            latest_sharpe_ratio: 0,
            avg_sharpe_ratio: 0,
            reliable_data_points: 0,
            statistical_reliability: "insufficient",
          },
          educational_context: {
            reliability_warning: "Insufficient data",
            recommended_minimum: "30 days",
            window_size: 20,
            interpretation: "Not enough data",
          },
        };

        mockAnalyticsEngineGet.mockResolvedValue(mockResponse);

        const result = await getRollingSharpe(testUserId, 90);

        expect(mockAnalyticsEngineGet).toHaveBeenCalledWith(
          `/api/v1/risk/sharpe/rolling/${testUserId}?days=90`
        );
        expect(result).toEqual(mockResponse);
      });

      it("should handle response with optional message field", async () => {
        const mockResponse: RollingSharpeResponse = {
          user_id: testUserId,
          period: {
            start_date: "2024-12-29",
            end_date: "2025-02-07",
            days: 40,
          },
          rolling_sharpe_data: [],
          data_points: 0,
          summary: {
            latest_sharpe_ratio: 0,
            avg_sharpe_ratio: 0,
            reliable_data_points: 0,
            statistical_reliability: "insufficient",
          },
          educational_context: {
            reliability_warning: "Insufficient data",
            recommended_minimum: "30 days",
            window_size: 20,
            interpretation: "Not enough data",
          },
          message: "No data available for this period",
        };

        mockAnalyticsEngineGet.mockResolvedValue(mockResponse);

        const result = await getRollingSharpe(testUserId);

        expect(result.message).toBe("No data available for this period");
      });
    });

    describe("Query Parameter Building", () => {
      it("should handle days=1", async () => {
        mockAnalyticsEngineGet.mockResolvedValue({
          user_id: testUserId,
          period: { start_date: "", end_date: "", days: 1 },
          rolling_sharpe_data: [],
          data_points: 0,
          summary: {
            latest_sharpe_ratio: 0,
            avg_sharpe_ratio: 0,
            reliable_data_points: 0,
            statistical_reliability: "insufficient",
          },
          educational_context: {
            reliability_warning: "",
            recommended_minimum: "",
            window_size: 0,
            interpretation: "",
          },
        });

        await getRollingSharpe(testUserId, 1);

        expect(mockAnalyticsEngineGet).toHaveBeenCalledWith(
          `/api/v1/risk/sharpe/rolling/${testUserId}?days=1`
        );
      });
    });
  });

  describe("getRollingVolatility", () => {
    const testUserId = "0xTestUser123";

    describe("Successful API Calls", () => {
      it("should fetch rolling volatility with default days parameter", async () => {
        const mockResponse: RollingVolatilityResponse = {
          user_id: testUserId,
          period: {
            start_date: "2024-12-29",
            end_date: "2025-02-07",
            days: 40,
          },
          rolling_volatility_data: [
            {
              date: "2025-01-15",
              portfolio_value: 10000,
              daily_return_pct: 0.5,
              rolling_volatility_daily_pct: 1.2,
              annualized_volatility_pct: 19.0,
              rolling_avg_return_pct: 0.4,
              window_size: 20,
              is_statistically_reliable: true,
            },
          ],
          data_points: 1,
          summary: {
            latest_daily_volatility: 1.2,
            latest_annualized_volatility: 19.0,
            avg_daily_volatility: 1.1,
            avg_annualized_volatility: 17.4,
            reliable_data_points: 1,
          },
          educational_context: {
            volatility_note: "Moderate volatility",
            calculation_method: "Rolling standard deviation",
            annualization_factor: "sqrt(252)",
            window_size: 20,
            interpretation: "Normal market conditions",
          },
        };

        mockAnalyticsEngineGet.mockResolvedValue(mockResponse);

        const result = await getRollingVolatility(testUserId);

        expect(mockAnalyticsEngineGet).toHaveBeenCalledWith(
          `/api/v1/risk/volatility/rolling/${testUserId}?days=40`
        );
        expect(result).toEqual(mockResponse);
      });

      it("should fetch rolling volatility with custom days parameter", async () => {
        const mockResponse: RollingVolatilityResponse = {
          user_id: testUserId,
          period: {
            start_date: "2024-10-28",
            end_date: "2025-02-07",
            days: 120,
          },
          rolling_volatility_data: [],
          data_points: 0,
          summary: {
            latest_daily_volatility: 0,
            latest_annualized_volatility: 0,
            avg_daily_volatility: 0,
            avg_annualized_volatility: 0,
            reliable_data_points: 0,
          },
          educational_context: {
            volatility_note: "",
            calculation_method: "",
            annualization_factor: "",
            window_size: 0,
            interpretation: "",
          },
        };

        mockAnalyticsEngineGet.mockResolvedValue(mockResponse);

        const result = await getRollingVolatility(testUserId, 120);

        expect(mockAnalyticsEngineGet).toHaveBeenCalledWith(
          `/api/v1/risk/volatility/rolling/${testUserId}?days=120`
        );
        expect(result).toEqual(mockResponse);
      });

      it("should handle response with optional message field", async () => {
        const mockResponse: RollingVolatilityResponse = {
          user_id: testUserId,
          period: {
            start_date: "2024-12-29",
            end_date: "2025-02-07",
            days: 40,
          },
          rolling_volatility_data: [],
          data_points: 0,
          summary: {
            latest_daily_volatility: 0,
            latest_annualized_volatility: 0,
            avg_daily_volatility: 0,
            avg_annualized_volatility: 0,
            reliable_data_points: 0,
          },
          educational_context: {
            volatility_note: "",
            calculation_method: "",
            annualization_factor: "",
            window_size: 0,
            interpretation: "",
          },
          message: "Insufficient data for volatility calculation",
        };

        mockAnalyticsEngineGet.mockResolvedValue(mockResponse);

        const result = await getRollingVolatility(testUserId);

        expect(result.message).toBe(
          "Insufficient data for volatility calculation"
        );
      });
    });
  });

  describe("getEnhancedDrawdown", () => {
    const testUserId = "0xTestUser123";

    describe("Successful API Calls", () => {
      it("should fetch enhanced drawdown with default days parameter", async () => {
        const mockResponse: EnhancedDrawdownResponse = {
          user_id: testUserId,
          period: {
            start_date: "2024-12-29",
            end_date: "2025-02-07",
            days: 40,
          },
          drawdown_data: [
            {
              date: "2025-01-15",
              portfolio_value: 9500,
              peak_value: 10000,
              drawdown_pct: -5,
              is_underwater: true,
            },
          ],
          data_points: 1,
          summary: {
            max_drawdown_pct: -10,
            current_drawdown_pct: -5,
            peak_value: 10000,
            current_value: 9500,
          },
        };

        mockAnalyticsEngineGet.mockResolvedValue(mockResponse);

        const result = await getEnhancedDrawdown(testUserId);

        expect(mockAnalyticsEngineGet).toHaveBeenCalledWith(
          `/api/v1/risk/drawdown/enhanced/${testUserId}?days=40`
        );
        expect(result).toEqual(mockResponse);
      });

      it("should fetch enhanced drawdown with custom days parameter", async () => {
        const mockResponse: EnhancedDrawdownResponse = {
          user_id: testUserId,
          period: {
            start_date: "2024-08-30",
            end_date: "2025-02-07",
            days: 180,
          },
          drawdown_data: [],
          data_points: 0,
          summary: {
            max_drawdown_pct: 0,
            current_drawdown_pct: 0,
            peak_value: 0,
            current_value: 0,
          },
        };

        mockAnalyticsEngineGet.mockResolvedValue(mockResponse);

        const result = await getEnhancedDrawdown(testUserId, 180);

        expect(mockAnalyticsEngineGet).toHaveBeenCalledWith(
          `/api/v1/risk/drawdown/enhanced/${testUserId}?days=180`
        );
        expect(result).toEqual(mockResponse);
      });

      it("should handle response with optional message field", async () => {
        const mockResponse: EnhancedDrawdownResponse = {
          user_id: testUserId,
          period: {
            start_date: "2024-12-29",
            end_date: "2025-02-07",
            days: 40,
          },
          drawdown_data: [],
          data_points: 0,
          summary: {
            max_drawdown_pct: 0,
            current_drawdown_pct: 0,
            peak_value: 0,
            current_value: 0,
          },
          message: "No drawdown data available",
        };

        mockAnalyticsEngineGet.mockResolvedValue(mockResponse);

        const result = await getEnhancedDrawdown(testUserId);

        expect(result.message).toBe("No drawdown data available");
      });
    });
  });

  describe("getUnderwaterRecovery", () => {
    const testUserId = "0xTestUser123";

    describe("Successful API Calls", () => {
      it("should fetch underwater recovery with default days parameter", async () => {
        const mockResponse: UnderwaterRecoveryResponse = {
          user_id: testUserId,
          period: {
            start_date: "2024-12-29",
            end_date: "2025-02-07",
            days: 40,
          },
          underwater_data: [
            {
              date: "2025-01-15",
              underwater_pct: -5,
              is_underwater: true,
              recovery_point: false,
              portfolio_value: 9500,
              peak_value: 10000,
            },
            {
              date: "2025-01-20",
              underwater_pct: 0,
              is_underwater: false,
              recovery_point: true,
              portfolio_value: 10100,
              peak_value: 10100,
            },
          ],
          data_points: 2,
          summary: {
            total_underwater_days: 5,
            underwater_percentage: 12.5,
            recovery_points: 1,
            current_underwater_pct: 0,
            is_currently_underwater: false,
          },
        };

        mockAnalyticsEngineGet.mockResolvedValue(mockResponse);

        const result = await getUnderwaterRecovery(testUserId);

        expect(mockAnalyticsEngineGet).toHaveBeenCalledWith(
          `/api/v1/risk/underwater/${testUserId}?days=40`
        );
        expect(result).toEqual(mockResponse);
      });

      it("should fetch underwater recovery with custom days parameter", async () => {
        const mockResponse: UnderwaterRecoveryResponse = {
          user_id: testUserId,
          period: {
            start_date: "2024-11-08",
            end_date: "2025-02-07",
            days: 100,
          },
          underwater_data: [],
          data_points: 0,
          summary: {
            total_underwater_days: 0,
            underwater_percentage: 0,
            recovery_points: 0,
            current_underwater_pct: 0,
            is_currently_underwater: false,
          },
        };

        mockAnalyticsEngineGet.mockResolvedValue(mockResponse);

        const result = await getUnderwaterRecovery(testUserId, 100);

        expect(mockAnalyticsEngineGet).toHaveBeenCalledWith(
          `/api/v1/risk/underwater/${testUserId}?days=100`
        );
        expect(result).toEqual(mockResponse);
      });

      it("should handle response with optional message field", async () => {
        const mockResponse: UnderwaterRecoveryResponse = {
          user_id: testUserId,
          period: {
            start_date: "2024-12-29",
            end_date: "2025-02-07",
            days: 40,
          },
          underwater_data: [],
          data_points: 0,
          summary: {
            total_underwater_days: 0,
            underwater_percentage: 0,
            recovery_points: 0,
            current_underwater_pct: 0,
            is_currently_underwater: false,
          },
          message: "No underwater periods detected",
        };

        mockAnalyticsEngineGet.mockResolvedValue(mockResponse);

        const result = await getUnderwaterRecovery(testUserId);

        expect(result.message).toBe("No underwater periods detected");
      });
    });
  });

  describe("getAllocationTimeseries", () => {
    const testUserId = "0xTestUser123";

    describe("Successful API Calls", () => {
      it("should fetch allocation timeseries with default days parameter", async () => {
        const mockResponse: AllocationTimeseriesResponse = {
          user_id: testUserId,
          period: {
            start_date: "2024-12-29",
            end_date: "2025-02-07",
            days: 40,
          },
          allocation_data: [
            {
              date: "2025-01-15",
              protocol: "aave",
              chain: "ethereum",
              net_value_usd: 5000,
              percentage_of_portfolio: 50,
            },
            {
              date: "2025-01-15",
              protocol: "compound",
              chain: "polygon",
              net_value_usd: 5000,
              percentage_of_portfolio: 50,
            },
          ],
          data_points: 2,
          summary: {
            unique_dates: 1,
            unique_protocols: 2,
            unique_chains: 2,
          },
        };

        mockAnalyticsEngineGet.mockResolvedValue(mockResponse);

        const result = await getAllocationTimeseries(testUserId);

        expect(mockAnalyticsEngineGet).toHaveBeenCalledWith(
          `/api/v1/portfolio/allocation/timeseries/${testUserId}?days=40`
        );
        expect(result).toEqual(mockResponse);
      });

      it("should fetch allocation timeseries with custom days parameter", async () => {
        const mockResponse: AllocationTimeseriesResponse = {
          user_id: testUserId,
          period: {
            start_date: "2024-04-01",
            end_date: "2025-02-07",
            days: 365,
          },
          allocation_data: [],
          data_points: 0,
          summary: {
            unique_dates: 0,
            unique_protocols: 0,
            unique_chains: 0,
          },
        };

        mockAnalyticsEngineGet.mockResolvedValue(mockResponse);

        const result = await getAllocationTimeseries(testUserId, 365);

        expect(mockAnalyticsEngineGet).toHaveBeenCalledWith(
          `/api/v1/portfolio/allocation/timeseries/${testUserId}?days=365`
        );
        expect(result).toEqual(mockResponse);
      });

      it("should handle response with optional message field", async () => {
        const mockResponse: AllocationTimeseriesResponse = {
          user_id: testUserId,
          period: {
            start_date: "2024-12-29",
            end_date: "2025-02-07",
            days: 40,
          },
          allocation_data: [],
          data_points: 0,
          summary: {
            unique_dates: 0,
            unique_protocols: 0,
            unique_chains: 0,
          },
          message: "No allocation data available",
        };

        mockAnalyticsEngineGet.mockResolvedValue(mockResponse);

        const result = await getAllocationTimeseries(testUserId);

        expect(result.message).toBe("No allocation data available");
      });
    });
  });
});
