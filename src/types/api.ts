/**
 * Public API types and interfaces for external service responses
 *
 * This file contains types that are used by components and hooks.
 * Internal service implementation types have been moved to api.internal.ts
 */

// =============================================================================
// BASE API RESPONSE TYPES
// =============================================================================

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

// =============================================================================
// PAGINATION INTERFACES
// =============================================================================

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

// =============================================================================
// PORTFOLIO ANALYTICS TYPES
// =============================================================================

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
  assets: unknown[]; // DeBankAsset[] - internal type
}

export interface ChainAllocation {
  chain: string;
  value: number;
  percentage: number;
  protocols: string[];
}

export interface TokenAllocation {
  token: unknown; // DeBankToken - internal type
  totalAmount: number;
  totalValue: number;
  positions: {
    protocol: string;
    chain: string;
    amount: number;
    value: number;
  }[];
}

// =============================================================================
// TRANSACTION TYPES
// =============================================================================

export interface TokenTransaction {
  hash: string;
  from: string;
  to: string;
  value: string;
  token: unknown; // DeBankToken - internal type
  timestamp: number;
  blockNumber: number;
  gasPrice?: string;
  gasUsed?: string;
  status: "success" | "failed" | "pending";
}

// =============================================================================
// STREAMING/WEBSOCKET TYPES
// =============================================================================

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

// =============================================================================
// CHART DATA TYPES
// =============================================================================

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

// =============================================================================
// HTTP UTILITY TYPES
// =============================================================================

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

// =============================================================================
// ERROR HANDLING TYPES
// =============================================================================

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
