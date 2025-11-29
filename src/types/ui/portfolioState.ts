/**
 * Portfolio State Types
 *
 * Centralized type definitions for managing consistent portfolio states
 * across all components (WalletMetrics, PortfolioOverview, etc.)
 */

export type PortfolioStateType =
  | "wallet_disconnected" // No wallet connected - show connect prompts
  | "loading" // Fetching data - show loading indicators
  | "has_data" // Normal portfolio data - show portfolio content
  | "connected_no_data" // Connected but API returns all zeros - show "wait 24h" message
  | "error"; // API/network error - show error messages

export interface PortfolioState {
  /** The current portfolio state type */
  type: PortfolioStateType;

  /** Whether a wallet is connected */
  isConnected: boolean;

  /** Whether data is currently being loaded */
  isLoading: boolean;

  /** Whether there's an API or network error */
  hasError: boolean;

  /** Whether API returned valid data but all values are zero */
  hasZeroData: boolean;

  /** The total portfolio value (null if not available) */
  totalValue: number | null;

  /** Error message if hasError is true */
  errorMessage?: string | null;

  /** Whether currently retrying after an error */
  isRetrying?: boolean;
}

/**
 * Helper type guards for portfolio state
 */
export const PortfolioStateGuards = {
  isWalletDisconnected: (state: PortfolioState): boolean =>
    state.type === "wallet_disconnected",

  isLoading: (state: PortfolioState): boolean => state.type === "loading",

  hasData: (state: PortfolioState): boolean => state.type === "has_data",

  isConnectedNoData: (state: PortfolioState): boolean =>
    state.type === "connected_no_data",

  hasError: (state: PortfolioState): boolean => state.type === "error",
} as const;
