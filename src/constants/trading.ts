/**
 * Trading Constants
 *
 * Consolidated constants for trading, swapping, and DeFi operations
 * including mock data for development and testing.
 */

import { SwapToken } from "../types/swap";

// Trading Configuration
export const SWAP_CONSTANTS = {
  DEFAULT_SLIPPAGE: 0.5,
  PRICE_IMPACT_THRESHOLD: 0.01,
  NETWORK_FEE: 2.5,
  CONVERSION_RATE: 0.97,
  MINIMUM_RECEIVED_RATE: 0.995,
  SHARES_CALCULATION_DIVISOR: 100,
} as const;

// Slippage Options
export const SLIPPAGE_OPTIONS = [0.1, 0.5, 1.0, 3.0] as const;

// Trading Fees
export const TRADING_FEES = {
  NETWORK_FEE_PERCENTAGE: 0.3,
  PLATFORM_FEE_PERCENTAGE: 0.1,
  MAX_GAS_PRICE: 100, // in gwei
  MIN_GAS_PRICE: 1, // in gwei
} as const;

// Mock Trading Data
export const MOCK_TOKENS: SwapToken[] = [
  { symbol: "USDC", name: "USD Coin", balance: 1500.0, price: 1.0 },
  { symbol: "USDT", name: "Tether", balance: 800.0, price: 1.0 },
  { symbol: "ETH", name: "Ethereum", balance: 2.5, price: 2400.0 },
  { symbol: "BTC", name: "Bitcoin", balance: 0.1, price: 45000.0 },
] as const;

export const PERFORMANCE_MOCK_DATA = [
  {
    period: "24 Hours",
    change: "+2.4%",
    color: "text-green-400",
    desc: "Daily return",
  },
  {
    period: "7 Days",
    change: "+8.1%",
    color: "text-green-400",
    desc: "Weekly return",
  },
  {
    period: "30 Days",
    change: "+12.7%",
    color: "text-green-400",
    desc: "Monthly return",
  },
  {
    period: "1 Year",
    change: "+45.2%",
    color: "text-green-400",
    desc: "Annual return",
  },
] as const;

// Trading Strategy Types
export const STRATEGY_TYPES = {
  DCA: "Dollar Cost Average",
  LIMIT: "Limit Order",
  MARKET: "Market Order",
  STOP_LOSS: "Stop Loss",
  TAKE_PROFIT: "Take Profit",
} as const;

// Order Status
export const ORDER_STATUS = {
  PENDING: "pending",
  EXECUTING: "executing",
  COMPLETED: "completed",
  FAILED: "failed",
  CANCELLED: "cancelled",
} as const;

// Type exports
export type SwapConstant = keyof typeof SWAP_CONSTANTS;
export type StrategyType = keyof typeof STRATEGY_TYPES;
export type OrderStatus = keyof typeof ORDER_STATUS;
