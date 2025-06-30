// API Response Types
// Interfaces for external API responses to replace 'any' types

export interface PortfolioResponse {
  defi_value: number;
  stable_value: number;
  crypto_value: number;
  total_value: number;
  last_updated: string;
}

export interface PortfolioHistoryItem {
  date: string;
  value: number;
  change_24h: number;
  change_percentage: number;
}

export type PortfolioHistoryResponse = PortfolioHistoryItem[];

export interface AprMetricItem {
  strategy_id: string;
  strategy_name: string;
  current_apr: number;
  avg_30d_apr: number;
  risk_level: "low" | "medium" | "high";
  tvl: number;
  last_updated: string;
}

export type AprMetricsResponse = AprMetricItem[];

export interface FeaturedStrategy {
  id: string;
  name: string;
  description: string;
  apr: number;
  risk_level: "low" | "medium" | "high";
  min_investment: number;
  tvl: number;
  category: string;
  featured_reason: string;
}

export type FeaturedStrategiesResponse = FeaturedStrategy[];

export interface TopPool {
  pool_id: string;
  name: string;
  protocol: string;
  tokens: string[];
  apr: number;
  tvl: number;
  volume_24h: number;
  fees_24h: number;
  risk_score: number;
}

export interface TopPoolsResponse {
  pools: TopPool[];
  total_count: number;
  last_updated: string;
}

export interface PortfolioMetricsResponse {
  total_value: number;
  daily_pnl: number;
  daily_pnl_percentage: number;
  weekly_pnl: number;
  weekly_pnl_percentage: number;
  monthly_pnl: number;
  monthly_pnl_percentage: number;
  all_time_high: number;
  all_time_low: number;
  sharpe_ratio: number;
  max_drawdown: number;
  win_rate: number;
  best_day: number;
  worst_day: number;
  volatility: number;
  last_updated: string;
}

// Error response structure
export interface ApiError {
  error: {
    message: string;
    code: number;
    details?: Record<string, any>;
  };
  timestamp: string;
}

// Generic API response wrapper
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  timestamp: string;
  request_id: string;
}

// Rate limiting info
export interface RateLimitInfo {
  requests_remaining: number;
  reset_time: string;
  tier: string;
}
