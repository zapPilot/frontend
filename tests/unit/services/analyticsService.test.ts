/**
 * Comprehensive test suite for analyticsService
 *
 * Tests all exported functions:
 * - getLandingPagePortfolioData (HTTP)
 * - getRiskSummary (HTTP)
 * - getPortfolioDashboard (HTTP)
 */

import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";

import { httpUtils } from "../../../src/lib/http-utils";
import {
  getDailyYieldReturns,
  getLandingPagePortfolioData,
  getPoolPerformance,
  getPortfolioDashboard,
  getRiskSummary,
  getYieldReturnsSummary,
  type LandingPageResponse,
  type UnifiedDashboardResponse,
  type YieldReturnsSummaryResponse,
} from "../../../src/services/analyticsService";
import type { ActualRiskSummaryResponse } from "../../../src/types/risk";

const analyticsEngineGetSpy = vi.spyOn(httpUtils.analyticsEngine, "get");

const createMockDashboardResponse = (): UnifiedDashboardResponse => ({
  user_id: "0xDashboardUser",
  parameters: {
    trend_days: 30,
    risk_days: 30,
    drawdown_days: 90,
    allocation_days: 40,
    rolling_days: 40,
  },
  trends: {
    period: {
      start_date: "2025-01-01",
      end_date: "2025-01-30",
      days: 30,
    },
    daily_values: [],
    summary: {
      current_value_usd: 0,
      start_value_usd: 0,
      change_usd: 0,
      change_pct: 0,
    },
  },
  risk_metrics: {
    volatility: {
      period: {
        start_date: "2025-01-01",
        end_date: "2025-01-30",
        days: 30,
      },
      volatility_pct: 0,
      annualized_volatility_pct: 0,
      interpretation: "",
      summary: {
        avg_volatility: 0,
        max_volatility: 0,
        min_volatility: 0,
      },
    },
    sharpe_ratio: {
      period: {
        start_date: "2025-01-01",
        end_date: "2025-01-30",
        days: 30,
      },
      sharpe_ratio: 0,
      interpretation: "",
      summary: {
        avg_sharpe: 0,
        statistical_reliability: "",
      },
    },
    max_drawdown: {
      period: {
        start_date: "2025-01-01",
        end_date: "2025-01-30",
        days: 30,
      },
      max_drawdown_pct: 0,
      peak_date: "2025-01-01",
      trough_date: "2025-01-01",
      recovery_date: null,
      summary: {
        current_drawdown_pct: 0,
        is_recovered: true,
      },
    },
  },
  drawdown_analysis: {
    enhanced: {
      period: {
        start_date: "2025-01-01",
        end_date: "2025-01-30",
        days: 30,
      },
      period_info: {
        start_date: "2025-01-01",
        end_date: "2025-01-30",
        timezone: "UTC",
        label: "Last 30 Days",
      },
      drawdown_data: [],
      summary: {
        max_drawdown_pct: 0,
        current_drawdown_pct: 0,
        peak_value: 0,
        current_value: 0,
      },
    },
    underwater_recovery: {
      period: {
        start_date: "2025-01-01",
        end_date: "2025-01-30",
        days: 30,
      },
      period_info: {
        start_date: "2025-01-01",
        end_date: "2025-01-30",
        timezone: "UTC",
        label: "Last 30 Days",
      },
      underwater_data: [],
      summary: {
        total_underwater_days: 0,
        underwater_percentage: 0,
        recovery_points: 0,
        current_underwater_pct: 0,
        is_currently_underwater: false,
      },
    },
  },
  allocation: {
    allocations: [],
    summary: {
      unique_dates: 0,
      unique_protocols: 0,
      unique_chains: 0,
    },
  },
  rolling_analytics: {
    sharpe: {
      period: {
        start_date: "2025-01-01",
        end_date: "2025-01-30",
        days: 30,
      },
      rolling_sharpe_data: [],
      summary: {
        latest_sharpe_ratio: 0,
        avg_sharpe_ratio: 0,
        reliable_data_points: 0,
        statistical_reliability: "",
      },
      educational_context: {
        title: "Sharpe Ratio",
        summary: "Measures excess return per unit of risk",
        highlights: ["Sharpe ratio above 1.0 indicates strong performance"],
        links: [
          {
            label: "What is Sharpe Ratio?",
            url: "https://example.com/sharpe-ratio",
          },
        ],
      },
    },
    volatility: {
      period: {
        start_date: "2025-01-01",
        end_date: "2025-01-30",
        days: 30,
      },
      rolling_volatility_data: [],
      summary: {
        latest_daily_volatility: 0,
        latest_annualized_volatility: 0,
        avg_daily_volatility: 0,
        avg_annualized_volatility: 0,
      },
      educational_context: {
        title: "Volatility",
        summary: "Tracks dispersion of portfolio returns",
        highlights: ["Lower volatility typically indicates more stability"],
        links: [
          {
            label: "Volatility basics",
            url: "https://example.com/volatility",
          },
        ],
      },
    },
  },
  _metadata: {
    success_count: 1,
    error_count: 0,
    success_rate: 1,
    errors: {},
  },
});
describe("analyticsService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    analyticsEngineGetSpy.mockReset();
  });

  afterAll(() => {
    analyticsEngineGetSpy.mockRestore();
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

        analyticsEngineGetSpy.mockResolvedValue(mockResponse);

        const result = await getLandingPagePortfolioData(testUserId);

        expect(analyticsEngineGetSpy).toHaveBeenCalledWith(
          `/api/v2/portfolio/${testUserId}/landing`
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

        analyticsEngineGetSpy.mockResolvedValue(mockResponse);

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

        analyticsEngineGetSpy.mockResolvedValue(mockResponse);

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

        analyticsEngineGetSpy.mockResolvedValue(mockResponse);

        const result = await getLandingPagePortfolioData(testUserId);

        expect(result.portfolio_roi.windows).toBeDefined();
        expect(result.portfolio_roi.windows?.["7d"].start_balance).toBe(3900);
      });
    });
  });

  describe("getPoolPerformance", () => {
    it("should fetch pool performance data for the user", async () => {
      const mockPools = [
        {
          protocol_id: "aave-v3",
          protocol_name: "Aave V3",
          chain: "Ethereum",
          final_apr: 0.045,
          total_value_usd: 5000,
          wallet_tokens_value: 3000,
          other_sources_value: 2000,
          pool_tokens: [
            {
              symbol: "USDC",
              amount: 2500,
              value_usd: 2500,
            },
          ],
        },
      ];

      analyticsEngineGetSpy.mockResolvedValue(mockPools);
      const testUserId = "user-analytics";
      const result = await getPoolPerformance(testUserId);

      expect(analyticsEngineGetSpy).toHaveBeenCalledWith(
        `/api/v2/pools/${testUserId}/performance`
      );
      expect(result).toEqual(mockPools);
      expect(result[0]?.protocol_name).toBe("Aave V3");
    });
  });

  describe("getYieldReturnsSummary", () => {
    const testUserId = "user-returns";

    it("should default to multi-window summary with IQR filtering", async () => {
      const mockSummary: YieldReturnsSummaryResponse = {
        user_id: testUserId,
        windows: {
          "7d": {
            user_id: testUserId,
            period: {
              start_date: "2025-01-01",
              end_date: "2025-01-07",
              days: 7,
            },
            average_daily_yield_usd: 42,
            median_daily_yield_usd: 40,
            total_yield_usd: 294,
            statistics: {
              mean: 42,
              median: 40,
              std_dev: 5,
              min_value: 12,
              max_value: 70,
              total_days: 7,
              filtered_days: 6,
              outliers_removed: 1,
            },
            outlier_strategy: "iqr",
            outliers_detected: [],
            protocol_breakdown: [],
          },
        },
        recommended_period: "7d",
      } as YieldReturnsSummaryResponse;

      analyticsEngineGetSpy.mockResolvedValue(mockSummary);

      const result = await getYieldReturnsSummary(testUserId);

      const callArg = (analyticsEngineGetSpy.mock.calls[0] ?? [
        "",
      ])[0] as string;
      expect(callArg).toContain(`/api/v1/yield/returns/summary/${testUserId}`);
      expect(callArg).toContain("windows=7d%2C30d%2C90d");
      expect(callArg).toContain("outlier_strategy=iqr");
      expect(result.windows["7d"]?.statistics.outliers_removed).toBe(1);
    });

    it("should support custom window parameters", async () => {
      analyticsEngineGetSpy.mockResolvedValue({
        user_id: testUserId,
        windows: {},
      });

      await getYieldReturnsSummary(testUserId);

      const customCallArg = (analyticsEngineGetSpy.mock.calls[0] ?? [
        "",
      ])[0] as string;
      expect(customCallArg).toContain(
        `/api/v1/yield/returns/summary/${testUserId}`
      );
      expect(customCallArg).toContain("windows=14d%2C60d");
    });
  });

  describe("getDailyYieldReturns", () => {
    const testUserId = "user-yield";

    it("should fetch daily yield returns with default period", async () => {
      const mockResponse = {
        user_id: testUserId,
        period: {
          start_date: "2025-01-01",
          end_date: "2025-01-30",
          days: 30,
        },
        daily_returns: [
          {
            date: "2025-01-02",
            protocol_name: "Lido",
            chain: "Ethereum",
            position_type: "staking",
            yield_return_usd: 12.5,
            tokens: [
              {
                symbol: "stETH",
                amount_change: 0.1,
                current_price: 2500,
                yield_return_usd: 12.5,
              },
            ],
          },
        ],
      };

      analyticsEngineGetSpy.mockResolvedValue(mockResponse);

      const result = await getDailyYieldReturns(testUserId);

      expect(analyticsEngineGetSpy).toHaveBeenCalledWith(
        `/api/v1/yield/returns/daily/${testUserId}?days=30`
      );
      expect(result.daily_returns[0]?.protocol_name).toBe("Lido");
    });

    it("should honor custom days parameter", async () => {
      analyticsEngineGetSpy.mockResolvedValue({
        user_id: testUserId,
        period: { start_date: "2025-01-01", end_date: "2025-01-14", days: 14 },
        daily_returns: [],
      });

      await getDailyYieldReturns(testUserId, 14);

      expect(analyticsEngineGetSpy).toHaveBeenCalledWith(
        `/api/v1/yield/returns/daily/${testUserId}?days=14`
      );
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
              max_drawdown_pct: -0.05,
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
            max_drawdown_pct: -5,
          },
        };

        analyticsEngineGetSpy.mockResolvedValue(mockResponse);

        const result = await getRiskSummary(testUserId);

        expect(analyticsEngineGetSpy).toHaveBeenCalledWith(
          `/api/v2/analytics/${testUserId}/risk/summary`
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
              max_drawdown_pct: -0.05,
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
            max_drawdown_pct: -5,
            sharpe_ratio: 1.5,
          },
        };

        analyticsEngineGetSpy.mockResolvedValue(mockResponse);

        const result = await getRiskSummary(testUserId);

        expect(result.risk_summary.sharpe_ratio).toBeDefined();
        expect(result.summary_metrics.sharpe_ratio).toBe(1.5);
      });
    });
  });

  describe("getPortfolioDashboard", () => {
    const testUserId = "0xDashboardUser";

    it("should fetch unified dashboard with default parameters", async () => {
      const mockResponse = createMockDashboardResponse();
      mockResponse.user_id = testUserId;

      analyticsEngineGetSpy.mockResolvedValue(mockResponse);

      const result = await getPortfolioDashboard(testUserId);

      expect(analyticsEngineGetSpy).toHaveBeenCalledWith(
        `/api/v1/dashboard/portfolio-analytics/${testUserId}?trend_days=30&risk_days=30&drawdown_days=90&allocation_days=40&rolling_days=40`
      );
      expect(result).toEqual(mockResponse);
    });

    it("should fetch unified dashboard with custom parameters", async () => {
      const mockResponse = createMockDashboardResponse();
      mockResponse.user_id = testUserId;
      mockResponse.parameters = {
        trend_days: 45,
        risk_days: 45,
        drawdown_days: 120,
        allocation_days: 60,
        rolling_days: 60,
      };

      analyticsEngineGetSpy.mockResolvedValue(mockResponse);

      const result = await getPortfolioDashboard(testUserId, {
        trend_days: 45,
        risk_days: 45,
        drawdown_days: 120,
        allocation_days: 60,
        rolling_days: 60,
      });

      expect(analyticsEngineGetSpy).toHaveBeenCalledWith(
        `/api/v1/dashboard/portfolio-analytics/${testUserId}?trend_days=45&risk_days=45&drawdown_days=120&allocation_days=60&rolling_days=60`
      );
      expect(result).toEqual(mockResponse);
    });
  });
});
