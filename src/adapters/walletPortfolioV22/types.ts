/**
 * V22 Portfolio Type Definitions
 *
 * Centralized type definitions for V22 data structures used across
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
 * Portfolio allocation data structure for V22
 */
export interface V22AllocationData {
  crypto: number; // Percentage
  stable: number; // Percentage
  constituents: {
    crypto: AllocationConstituent[];
    stable: AllocationConstituent[];
  };
  simplifiedCrypto: AllocationConstituent[]; // For composition bar
}

/**
 * Complete V22 data model
 * Internal-only; consumed via V22PortfolioDataWithDirection
 */
export interface V22PortfolioData {
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
  currentAllocation: V22AllocationData;
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
 * V22 Portfolio Data with directional strategy support
 * Re-exported from portfolioDataAdapter for centralized type access
 */
export type { V22PortfolioDataWithDirection } from "@/adapters/portfolioDataAdapter";
