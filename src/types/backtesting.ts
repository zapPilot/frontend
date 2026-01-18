export interface BacktestRequest {
  token_symbol: string;
  start_date?: string; // YYYY-MM-DD
  end_date?: string; // YYYY-MM-DD
  initial_capital: number;
  dca_amount: number;
}

export interface BacktestPoint {
  date: string;
  price: number;
  sentiment: number | null;
  sentiment_label: string | null;

  // Normal DCA
  normal_invested: number;
  normal_holdings: number;
  normal_value: number;

  // Regime Strategy
  regime_spot_balance: number;
  regime_stable_balance: number;
  regime_lp_balance: number;
  regime_total_value: number;
  regime_allocation_spot_pct: number;
  regime_allocation_stable_pct: number;
  regime_allocation_lp_pct: number;
  regime_effective_exposure: number;
  regime_action?: "buy_spot" | "sell_spot" | null;
}

export interface BacktestSummary {
  total_days: number;
  normal_total_invested: number;
  normal_final_value: number;
  normal_roi_percent: number;
  regime_initial_capital: number;
  regime_final_value: number;
  regime_roi_percent: number;
  regime_trade_count: number;
}

export interface BacktestResponse {
  summary: BacktestSummary;
  history: BacktestPoint[];
}
