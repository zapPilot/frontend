import type { WalletPortfolioDataWithDirection } from "@/adapters/walletPortfolioDataAdapter";
import type { RegimeId } from "@/components/wallet/regime/regimeData";

/**
 * Generic state for a dashboard section
 */
export interface SectionState<T> {
  data: T | null;
  isLoading: boolean;
  error: Error | null;
}

/**
 * Data needed for the Balance Card
 */
export interface BalanceData {
  balance: number;
  roi: number;
  roiChange7d: number;
  roiChange30d: number;
}

/**
 * Data needed for the Composition Bar
 */
export interface CompositionData {
  currentAllocation: {
    crypto: number;
    stable: number;
  };
  targetAllocation: {
    crypto: number;
    stable: number;
  };
  delta: number;
  positions: number;
  protocols: number;
  chains: number;
}

/**
 * Independent Sentiment Data
 */
export interface SentimentData {
  value: number;
  status: string;
  quote: string;
}

/**
 * Strategy Card Data
 */
export interface StrategyData {
  currentRegime: RegimeId;
  sentimentValue: number | null;
  sentimentStatus: string;
  sentimentQuote: string;
  targetAllocation: {
    crypto: number;
    stable: number;
  };
  strategyDirection: string;
  previousRegime: string | null;
  hasSentiment: boolean;
  hasRegimeHistory: boolean;
}

/**
 * Full Progressive Dashboard State
 */
export interface DashboardProgressiveState {
  // Legacy unified data (for backward compatibility during migration)
  unifiedData: WalletPortfolioDataWithDirection | null;
  
  // Progressive sections
  sections: {
    balance: SectionState<BalanceData>;
    composition: SectionState<CompositionData>;
    strategy: SectionState<StrategyData>;
    sentiment: SectionState<SentimentData>;
  };
  
  // Global states
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}
