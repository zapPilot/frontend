/**
 * API service for analytics-engine integration
 * Uses service-specific HTTP utilities for consistent error handling
 */

import { httpUtils } from "../lib/http-utils";
import { PortfolioDataPoint } from "../types/portfolio";

// API Response Types
export interface UserResponse {
  id: string;
  email: string;
  primary_wallet: string;
  created_at: string;
  updated_at: string;
}

export interface AdditionalWallet {
  wallet_address: string;
  label?: string;
  is_main?: boolean;
  created_at?: string;
}

export interface BundleWalletsResponse {
  user_id: string;
  primary_wallet: string;
  main_wallet: string;
  visible_wallets: string[];
  bundle_wallets: string[];
  additional_wallets?: AdditionalWallet[];
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

// Portfolio Analytics Response Types
export interface PortfolioHistoryPoint {
  date: string;
  value: number;
  benchmark: number;
}

export interface PortfolioMetrics {
  total_return: number;
  volatility: number;
  max_drawdown: number;
  sharpe_ratio: number;
  calmar_ratio: number;
}

export interface SummaryStats {
  best_day_change: number;
  worst_day_change: number;
  avg_daily_return: number;
  win_rate: number;
  total_return: number;
  current_value: number;
}

export interface PortfolioAnalyticsResponse {
  user_id: string;
  period: string;
  portfolio_history: PortfolioHistoryPoint[];
  portfolio_metrics: PortfolioMetrics;
  summary_stats: SummaryStats;
  asset_allocation_history: any[];
  performance_by_period: Record<string, any>;
  asset_allocation_analysis: any[];
  asset_attribution_analysis: any[];
  risk_assessment: Record<string, any>;
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
    recommended_roi_period: string;
    recommended_yearly_roi: number;
    estimated_yearly_pnl_usd: number;
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

export interface ProtocolData {
  protocol: string;
  chain: string;
  value: number;
  pnl: number;
}

export interface PortfolioTrendsResponse {
  user_id: string;
  period: {
    start_date: string;
    end_date: string;
    days: number;
  };
  trend_data: PortfolioTrend[];
  summary: {
    total_change_usd: number;
    total_change_percentage: number;
    best_day?: PortfolioTrend;
    worst_day?: PortfolioTrend;
  };
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
 * Get comprehensive portfolio analytics for a user
 *
 * Returns portfolio performance metrics, risk analysis, asset allocation,
 * and historical performance data for advanced analytics dashboard.
 */
export const getPortfolioAnalytics = async (
  userId: string,
  period: string = "3M"
): Promise<PortfolioAnalyticsResponse> => {
  const params = new URLSearchParams({ period });
  const endpoint = `/api/v1/portfolio/analytics/${userId}?${params}`;
  return await httpUtils.analyticsEngine.get<PortfolioAnalyticsResponse>(
    endpoint
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
 * Transform analytics-engine portfolio trends data into PortfolioDataPoint format
 */
export const transformPortfolioTrends = (
  trendsData: PortfolioTrend[]
): PortfolioDataPoint[] => {
  // Group by date and sum net_value_usd
  const groupedByDate = trendsData.reduce(
    (acc, item) => {
      const date = item.date;
      if (!acc[date]) {
        acc[date] = {
          date,
          totalValue: 0,
          protocols: [] as ProtocolData[],
          chains: new Set<string>(),
        };
      }
      acc[date].totalValue += item.net_value_usd;
      acc[date].protocols.push({
        protocol: item.protocol,
        chain: item.chain,
        value: item.net_value_usd,
        pnl: item.pnl_usd,
      });
      acc[date].chains.add(item.chain);
      return acc;
    },
    {} as Record<
      string,
      {
        date: string;
        totalValue: number;
        protocols: ProtocolData[];
        chains: Set<string>;
      }
    >
  );

  // Convert to array and sort by date
  const sortedData = Object.values(groupedByDate).sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  // Calculate daily changes and format for chart
  return sortedData.map((item, index) => {
    const prevItem = index > 0 ? sortedData[index - 1] : null;
    const prevValue = prevItem ? prevItem.totalValue : item.totalValue;
    const change =
      prevValue > 0 ? ((item.totalValue - prevValue) / prevValue) * 100 : 0;

    return {
      date: item.date,
      value: item.totalValue,
      change,
      benchmark: item.totalValue * 0.95, // Mock benchmark - 5% below actual
      protocols: item.protocols,
      chainsCount: item.chains.size,
    };
  });
};

/**
 * Transform bundle addresses API response to WalletAddress format
 */
export const transformBundleWallets = (
  bundleData: BundleWalletsResponse | null | undefined
): WalletAddress[] => {
  if (!bundleData) {
    return [];
  }

  const wallets: WalletAddress[] = [];

  // Add primary wallet first
  wallets.push({
    id: "primary",
    address: bundleData.primary_wallet,
    label: "Main Wallet",
    isActive: true,
    isMain: true,

    createdAt: null,
  });

  // Add additional wallets
  bundleData.additional_wallets?.forEach((wallet, index) => {
    wallets.push({
      id: wallet.wallet_address,
      address: wallet.wallet_address,
      label: wallet.label || `Wallet ${index + 2}`, // Auto-generate labels
      isActive: false,
      isMain: wallet.is_main ?? false,
      createdAt: wallet.created_at ?? null,
    });
  });

  return wallets;
};
