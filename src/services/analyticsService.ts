/**
 * API service for analytics-engine integration
 * Uses service-specific HTTP utilities for consistent error handling
 */

import { httpUtils } from "../lib/http-utils";
import { ActualRiskSummaryResponse } from "../types/risk";

// API Response Types
export interface AdditionalWallet {
  wallet_address: string;
  label?: string;
  is_main?: boolean; // DEPRECATED: Optional for backward compatibility during migration
  created_at?: string;
}

export interface PortfolioSnapshot {
  id: string;
  user_id: string;
  wallet_address: string;
  chain: string;
  protocol: string;
  net_value_usd: number;
  snapshot_date: string;
  created_at: string;
}

export interface PortfolioTrend {
  id: string;
  user_id: string;
  wallet_address: string;
  chain: string;
  protocol: string;
  net_value_usd: number;
  pnl_usd: number;
  date: string;
  created_at: string;
}

export interface AssetCategory {
  category: string;
  total_value_usd: number;
  percentage: number;
  assets: Array<{
    name: string;
    symbol: string;
    protocol: string;
    amount: number;
    value_usd: number;
    apr?: number;
    type?: string;
  }>;
}

export interface PortfolioSummaryResponse {
  user_id: string;
  total_value_usd: number;
  total_change_24h: number;
  total_change_percentage: number;
  last_updated: string;
  categories?: AssetCategory[];
}

export interface PoolDetail {
  snapshot_id: string;
  chain: string;
  protocol: string;
  protocol_name: string;
  asset_usd_value: number;
  pool_symbols: string[];
  final_apr: number;
  protocol_matched: boolean;
  apr_data: {
    apr_protocol: string | null;
    apr_symbol: string | null;
    apr: number | null;
    apr_base: number | null;
    apr_reward: number | null;
    apr_updated_at: string | null;
  };
  contribution_to_portfolio: number;
}

export interface PortfolioAPRSummary {
  total_asset_value_usd: number;
  weighted_apr: number;
  matched_pools: number;
  total_pools: number;
  matched_asset_value_usd: number;
  coverage_percentage: number;
}

export interface PortfolioAPRResponse {
  user_id: string;
  portfolio_summary: PortfolioAPRSummary;
  pool_details: PoolDetail[];
}

// Unified Landing Page Response Type
export interface LandingPageResponse {
  total_assets_usd: number;
  total_debt_usd: number;
  total_net_usd: number;
  weighted_apr: number;
  estimated_monthly_income: number;
  portfolio_roi: {
    recommended_roi: number;
    recommended_period: string;
    recommended_yearly_roi: number;
    estimated_yearly_pnl_usd: number;
    windows?: {
      [key: string]: {
        value: number;
        data_points: number;
        start_balance?: number;
      };
    };
    // Legacy fields for backward compatibility
    roi_7d?: {
      value: number;
      data_points: number;
    };
    roi_30d?: {
      value: number;
      data_points: number;
    };
    roi_365d?: {
      value: number;
      data_points: number;
    };
    roi_windows?: {
      [period: string]: number; // e.g., "7d": 0.02, "30d": 0.08, etc.
    };
  };
  portfolio_allocation: {
    btc: {
      total_value: number;
      percentage_of_portfolio: number;
      wallet_tokens_value: number;
      other_sources_value: number;
    };
    eth: {
      total_value: number;
      percentage_of_portfolio: number;
      wallet_tokens_value: number;
      other_sources_value: number;
    };
    stablecoins: {
      total_value: number;
      percentage_of_portfolio: number;
      wallet_tokens_value: number;
      other_sources_value: number;
    };
    others: {
      total_value: number;
      percentage_of_portfolio: number;
      wallet_tokens_value: number;
      other_sources_value: number;
    };
  };
  wallet_token_summary: {
    total_value_usd: number;
    token_count: number;
    apr_30d: number;
  };
  category_summary_debt: {
    btc: number;
    eth: number;
    stablecoins: number;
    others: number;
  };
  pool_details: PoolDetail[];
  total_positions: number;
  protocols_count: number;
  chains_count: number;
  last_updated: string | null;
  apr_coverage: {
    matched_pools: number;
    total_pools: number;
    coverage_percentage: number;
    matched_asset_value_usd: number;
  };
  message?: string;
}

// Transformed data types for UI
export interface WalletAddress {
  id: string;
  address: string;
  label: string;
  isActive: boolean;
  isMain: boolean;
  createdAt: string | null;
}

export interface PortfolioTrendsResponse {
  user_id: string;
  period: {
    start_date: string;
    end_date: string;
    days: number;
  };
  trend_data: PortfolioTrend[];
  daily_totals: PortfolioDailyTotal[];
  summary: {
    total_change_usd: number;
    total_change_percentage: number;
    best_day?: PortfolioTrend;
    worst_day?: PortfolioTrend;
  };
}

export interface PortfolioDailyProtocol {
  protocol: string | null;
  chain: string | null;
  value_usd: number;
  pnl_usd: number;
}

export interface PortfolioDailyTotal {
  date: string;
  total_value_usd: number;
  change_percentage: number;
  protocols: PortfolioDailyProtocol[];
  chains_count: number;
}

/**
 * Get portfolio trends for a user
 */
export const getPortfolioTrends = async (
  userId: string,
  days: number = 30,
  limit: number = 100
): Promise<PortfolioTrendsResponse> => {
  const params = new URLSearchParams({
    days: days.toString(),
    limit: limit.toString(),
  });
  return await httpUtils.analyticsEngine.get<PortfolioTrendsResponse>(
    `/api/v1/portfolio-trends/by-user/${userId}?${params}`
  );
};

/**
 * Get unified landing page portfolio data
 *
 * Combines portfolio summary, APR calculations, and pre-formatted data
 * in a single API call for optimal performance. Implements BFF pattern.
 */
export const getLandingPagePortfolioData = async (
  userId: string
): Promise<LandingPageResponse> => {
  const endpoint = `/api/v1/landing-page/portfolio/${userId}`;
  return await httpUtils.analyticsEngine.get<LandingPageResponse>(endpoint);
};

/**
 * Get risk summary for a user
 *
 * Retrieves comprehensive risk assessment including volatility analysis,
 * drawdown metrics, and computed risk scores with component breakdown.
 */
export const getRiskSummary = async (
  userId: string
): Promise<ActualRiskSummaryResponse> => {
  const endpoint = `/api/v1/risk/summary/${userId}`;
  return await httpUtils.analyticsEngine.get<ActualRiskSummaryResponse>(
    endpoint
  );
};

// Phase 2 Analytics - Rolling Sharpe Ratio Response
export interface RollingSharpeTimeseriesPoint {
  date: string;
  portfolio_value: number;
  daily_return_pct: number;
  rolling_avg_return_pct: number;
  rolling_volatility_pct: number | null;
  rolling_sharpe_ratio: number | null;
  window_size: number;
  is_statistically_reliable: boolean;
}

export interface RollingSharpeResponse {
  user_id: string;
  period: {
    start_date: string;
    end_date: string;
    days: number;
  };
  rolling_sharpe_data: RollingSharpeTimeseriesPoint[];
  data_points: number;
  summary: {
    latest_sharpe_ratio: number;
    avg_sharpe_ratio: number;
    reliable_data_points: number;
    statistical_reliability: string;
  };
  educational_context: {
    reliability_warning: string;
    recommended_minimum: string;
    window_size: number;
    interpretation: string;
  };
  message?: string;
}

// Phase 2 Analytics - Rolling Volatility Response
export interface RollingVolatilityTimeseriesPoint {
  date: string;
  portfolio_value: number;
  daily_return_pct: number;
  rolling_volatility_daily_pct: number | null;
  annualized_volatility_pct: number | null;
  rolling_avg_return_pct: number | null;
  window_size: number;
  is_statistically_reliable: boolean;
}

export interface RollingVolatilityResponse {
  user_id: string;
  period: {
    start_date: string;
    end_date: string;
    days: number;
  };
  rolling_volatility_data: RollingVolatilityTimeseriesPoint[];
  data_points: number;
  summary: {
    latest_daily_volatility: number;
    latest_annualized_volatility: number;
    avg_daily_volatility: number;
    avg_annualized_volatility: number;
    reliable_data_points: number;
  };
  educational_context: {
    volatility_note: string;
    calculation_method: string;
    annualization_factor: string;
    window_size: number;
    interpretation: string;
  };
  message?: string;
}

// Phase 2 Analytics - Enhanced Drawdown Response
export interface EnhancedDrawdownTimeseriesPoint {
  date: string;
  portfolio_value: number;
  peak_value: number;
  drawdown_pct: number;
  is_underwater: boolean;
}

export interface EnhancedDrawdownResponse {
  user_id: string;
  period: {
    start_date: string;
    end_date: string;
    days: number;
  };
  drawdown_data: EnhancedDrawdownTimeseriesPoint[];
  data_points: number;
  summary: {
    max_drawdown_pct: number;
    current_drawdown_pct: number;
    peak_value: number;
    current_value: number;
  };
  message?: string;
}

// Phase 2 Analytics - Underwater Recovery Response
export interface UnderwaterRecoveryTimeseriesPoint {
  date: string;
  underwater_pct: number;
  is_underwater: boolean;
  recovery_point: boolean;
  portfolio_value: number;
  peak_value: number;
}

export interface UnderwaterRecoveryResponse {
  user_id: string;
  period: {
    start_date: string;
    end_date: string;
    days: number;
  };
  underwater_data: UnderwaterRecoveryTimeseriesPoint[];
  data_points: number;
  summary: {
    total_underwater_days: number;
    underwater_percentage: number;
    recovery_points: number;
    current_underwater_pct: number;
    is_currently_underwater: boolean;
  };
  message?: string;
}

// Phase 2 Analytics - Allocation Timeseries Response
export interface AllocationTimeseriesPoint {
  date: string;
  protocol: string;
  chain: string;
  net_value_usd: number;
  percentage_of_portfolio: number;
}

export interface AllocationTimeseriesResponse {
  user_id: string;
  period: {
    start_date: string;
    end_date: string;
    days: number;
  };
  allocation_data: AllocationTimeseriesPoint[];
  data_points: number;
  summary: {
    unique_dates: number;
    unique_protocols: number;
    unique_chains: number;
  };
  message?: string;
}

/**
 * Get rolling Sharpe ratio analysis
 */
export const getRollingSharpe = async (
  userId: string,
  days: number = 40
): Promise<RollingSharpeResponse> => {
  const params = new URLSearchParams({
    days: days.toString(),
  });
  return await httpUtils.analyticsEngine.get<RollingSharpeResponse>(
    `/api/v1/risk/sharpe/rolling/${userId}?${params}`
  );
};

/**
 * Get rolling volatility analysis
 */
export const getRollingVolatility = async (
  userId: string,
  days: number = 40
): Promise<RollingVolatilityResponse> => {
  const params = new URLSearchParams({
    days: days.toString(),
  });
  return await httpUtils.analyticsEngine.get<RollingVolatilityResponse>(
    `/api/v1/risk/volatility/rolling/${userId}?${params}`
  );
};

/**
 * Get enhanced drawdown analysis
 */
export const getEnhancedDrawdown = async (
  userId: string,
  days: number = 40
): Promise<EnhancedDrawdownResponse> => {
  const params = new URLSearchParams({
    days: days.toString(),
  });
  return await httpUtils.analyticsEngine.get<EnhancedDrawdownResponse>(
    `/api/v1/risk/drawdown/enhanced/${userId}?${params}`
  );
};

/**
 * Get underwater recovery analysis
 */
export const getUnderwaterRecovery = async (
  userId: string,
  days: number = 40
): Promise<UnderwaterRecoveryResponse> => {
  const params = new URLSearchParams({
    days: days.toString(),
  });
  return await httpUtils.analyticsEngine.get<UnderwaterRecoveryResponse>(
    `/api/v1/risk/underwater/${userId}?${params}`
  );
};

/**
 * Get allocation timeseries data
 */
export const getAllocationTimeseries = async (
  userId: string,
  days: number = 40
): Promise<AllocationTimeseriesResponse> => {
  const params = new URLSearchParams({
    days: days.toString(),
  });
  return await httpUtils.analyticsEngine.get<AllocationTimeseriesResponse>(
    `/api/v1/portfolio/allocation/timeseries/${userId}?${params}`
  );
};
