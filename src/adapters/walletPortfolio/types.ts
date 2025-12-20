/**
 * Wallet Portfolio Type Definitions
 *
 * Centralized type definitions for wallet portfolio data structures used across
 * the portfolio management system.
 */

import type { RegimeId } from "@/components/wallet/regime/regimeData";

/**
 * Asset allocation constituent (individual asset within crypto/stable category)
 */
export interface AllocationConstituent {
  asset: string;
  symbol: string;
  name: string;
  value: number; // Percentage of parent category
  color: string;
}

/**
 * Portfolio allocation data structure
 */
export interface WalletPortfolioAllocationData {
  crypto: number; // Percentage
  stable: number; // Percentage
  constituents: {
    crypto: AllocationConstituent[];
    stable: AllocationConstituent[];
  };
  simplifiedCrypto: AllocationConstituent[]; // For composition bar
}

/**
 * Complete wallet portfolio data model
 * Internal-only; consumed via WalletPortfolioDataWithDirection
 */
export interface WalletPortfolioData {
  // Portfolio metrics
  balance: number;
  roi: number;
  roiChange7d: number;
  roiChange30d: number;

  // Regime & sentiment
  sentimentValue: number;
  sentimentStatus: string;
  sentimentQuote: string;
  currentRegime: RegimeId;

  // Allocations
  currentAllocation: WalletPortfolioAllocationData;
  targetAllocation: {
    crypto: number;
    stable: number;
  };
  delta: number; // Allocation drift

  // Portfolio details
  positions: number;
  protocols: number;
  chains: number;

  // State
  isLoading: boolean;
  hasError: boolean;
}

/**
 * Wallet portfolio data with directional strategy support
 * Re-exported from walletPortfolioDataAdapter for centralized type access
 */
export type { WalletPortfolioDataWithDirection } from "@/adapters/walletPortfolioDataAdapter";
