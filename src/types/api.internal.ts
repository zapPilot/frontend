/**
 * Internal API types for service layer implementations
 *
 * These types represent internal data structures from external APIs (DeBank, ThirdWeb, etc.)
 * and should NOT be imported by components or hooks - use domain-specific types instead.
 *
 * @internal
 */

// =============================================================================
// DEBANK API TYPES
// =============================================================================

export interface DeBankPortfolioItem {
  id: string;
  chain: string;
  name: string;
  site_url: string;
  logo_url: string;
  has_supported_portfolio: boolean;
  tvl: number;
  portfolio_item_list: DeBankAsset[];
}

export interface DeBankAsset {
  stats: {
    asset_usd_value: number;
    debt_usd_value: number;
    net_usd_value: number;
  };
  name: string;
  detail_types: string[];
  detail: {
    supply_token_list: DeBankToken[];
    reward_token_list?: DeBankToken[];
    borrow_token_list?: DeBankToken[];
  };
  proxy_detail?: {
    project: DeBankProject;
    proxy_chain: string;
  };
  pool: {
    id: string;
    chain: string;
    project_id: string;
    adapter_id: string;
    controller: string;
    index: null | string;
    time_at: number;
  };
  position_index: string;
  position_name?: string;
  position_percentage?: number;
}

export interface DeBankToken {
  id: string;
  chain: string;
  name: string;
  symbol: string;
  display_symbol?: string;
  optimized_symbol?: string;
  decimals: number;
  logo_url: string;
  price: number;
  price_24h_change?: number;
  credit_score?: number;
  is_verified: boolean;
  is_core: boolean;
  is_wallet: boolean;
  time_at: number;
  amount: number;
  raw_amount?: string;
  raw_amount_hex_str?: string;
}

export interface DeBankProject {
  id: string;
  chain: string;
  name: string;
  site_url: string;
  logo_url: string;
  has_supported_portfolio: boolean;
  tvl?: number;
  net_usd_value?: number;
  asset_usd_value?: number;
  debt_usd_value?: number;
}

// =============================================================================
// THIRDWEB SDK TYPES
// =============================================================================

export interface ThirdWebAccount {
  address: string;
  status: "connected" | "disconnected" | "connecting";
}

export interface ThirdWebWallet {
  id: string;
  name: string;
  type: string;
  getAccount(): ThirdWebAccount | undefined;
  connect(connectOptions?: {
    chain?: { id: number };
  }): Promise<ThirdWebAccount>;
  disconnect(): Promise<void>;
  switchChain(chain: { id: number }): Promise<void>;
}

export interface ThirdWebChain {
  id: number;
  name: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  rpcUrls: {
    default: { http: string[] };
    public?: { http: string[] };
  };
  blockExplorers?: {
    default: { name: string; url: string };
  };
  testnet?: boolean;
  rpc: string;
}

// =============================================================================
// TRANSACTION TYPES
// =============================================================================

export interface TransactionReceipt {
  transactionHash: string;
  blockNumber: number;
  blockHash: string;
  gasUsed: string;
  status: "success" | "failed";
  from: string;
  to: string;
  contractAddress?: string;
  logs: TransactionLog[];
}

export interface TransactionLog {
  address: string;
  topics: string[];
  data: string;
  blockNumber: number;
  transactionHash: string;
  transactionIndex: number;
  blockHash: string;
  logIndex: number;
  removed: boolean;
}

// =============================================================================
// TRADING AND SWAP TYPES
// =============================================================================

export interface TradingLoss {
  inputValueUSD: number;
  outputValueUSD: number;
  netLossUSD: number;
  lossPercentage: number;
  expectedSlippage?: number;
  actualSlippage?: number;
}

export interface SwapEvent {
  type: "token_ready" | "swap_started" | "swap_completed" | "swap_failed";
  provider: string;
  timestamp: number;
  tokenSymbol?: string;
  tradingLoss?: TradingLoss;
  gasCostUSD?: number;
  fromToken?: DeBankToken;
  toToken?: DeBankToken;
  fromAmount?: number;
  toAmount?: number;
  route?: string[];
  transactionHash?: string;
  errorMessage?: string;
}
