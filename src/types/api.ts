/**
 * Common API types and interfaces for external service responses
 */

// Base API response structure
export interface ApiResponse<T = unknown> {
  data: T;
  message?: string;
  status: number;
  timestamp?: string;
}

export interface ApiError {
  message: string;
  code?: string;
  details?: Record<string, unknown>;
}

// Pagination interfaces
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface PaginatedResponse<T = unknown> extends ApiResponse<T[]> {
  meta: PaginationMeta;
}

// DeBank API specific types
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

// ThirdWeb SDK types
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

// Transaction types
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

export interface TokenTransaction {
  hash: string;
  from: string;
  to: string;
  value: string;
  token: DeBankToken;
  timestamp: number;
  blockNumber: number;
  gasPrice?: string;
  gasUsed?: string;
  status: "success" | "failed" | "pending";
}

// Trading and swap types
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

// Portfolio analytics types
export interface PortfolioSnapshot {
  timestamp: string;
  totalValue: number;
  totalChange24h: number;
  totalChangePercentage: number;
  protocols: ProtocolPosition[];
  chains: ChainAllocation[];
  tokens: TokenAllocation[];
}

export interface ProtocolPosition {
  protocol: string;
  chain: string;
  value: number;
  pnl: number;
  percentage: number;
  assets: DeBankAsset[];
}

export interface ChainAllocation {
  chain: string;
  value: number;
  percentage: number;
  protocols: string[];
}

export interface TokenAllocation {
  token: DeBankToken;
  totalAmount: number;
  totalValue: number;
  positions: {
    protocol: string;
    chain: string;
    amount: number;
    value: number;
  }[];
}

// Streaming/WebSocket types
export interface StreamingMessage<T = unknown> {
  type: string;
  payload: T;
  timestamp: number;
  id?: string;
}

export interface StreamingProgress {
  currentStep: number;
  totalSteps: number;
  status: "pending" | "in_progress" | "completed" | "failed";
  message: string;
  progress: number; // 0-100
  estimatedTimeRemaining?: number;
}

// Chart data types
export interface ChartDataPoint {
  timestamp: string;
  value: number;
  volume?: number;
  open?: number;
  high?: number;
  low?: number;
  close?: number;
}

export interface TimeSeriesData {
  period: string;
  data: ChartDataPoint[];
  metrics: {
    min: number;
    max: number;
    average: number;
    volatility?: number;
  };
}

// Generic utility types
export type HTTPMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

export interface RequestOptions {
  method?: HTTPMethod;
  headers?: Record<string, string>;
  body?: unknown;
  timeout?: number;
  retries?: number;
  signal?: AbortSignal;
}

export type ResponseTransformer<T = unknown> = (data: unknown) => T;

// Error handling types
export interface ErrorDetails {
  code?: string;
  message: string;
  field?: string;
  value?: unknown;
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface ApiErrorResponse {
  error: {
    message: string;
    code: string;
    details: ErrorDetails[];
  };
  status: number;
  timestamp: string;
}
