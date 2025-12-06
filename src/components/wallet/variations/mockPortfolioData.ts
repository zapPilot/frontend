/**
 * Mock Portfolio Data for Layout Variations
 *
 * Centralized demo data used by all layout variations.
 * Easy to modify for testing different scenarios.
 */

import type { RegimeId } from "../regime/regimeData";

export const MOCK_DATA = {
  // Portfolio metrics
  balance: 45230.50,
  roi: 12.4,
  roiChange7d: 8.2,
  roiChange30d: 12.4,

  // Market sentiment
  sentimentValue: 68,
  sentimentStatus: "Greed" as const,
  sentimentQuote: "Market conditions favor aggressive positioning with higher allocation to growth assets. Technical indicators show sustained momentum.",

  // Regime data
  currentRegime: "g" as RegimeId, // Greed

  // Allocations
  currentAllocation: {
    crypto: 65,
    stable: 35,
    // Detailed breakdown for advanced visualizations
    constituents: {
      crypto: [
        { asset: 'BTC', symbol: 'BTC', name: 'Bitcoin', value: 40, color: '#F7931A' },
        { asset: 'ETH', symbol: 'ETH', name: 'Ethereum', value: 35, color: '#627EEA' },
        { asset: 'SOL', symbol: 'SOL', name: 'Solana', value: 15, color: '#14F195' },
        { asset: 'Others', symbol: 'ALT', name: 'Altcoins', value: 10, color: '#8C8C8C' }
      ],
      stable: [
        { asset: 'USDC', symbol: 'USDC', name: 'USD Coin', value: 60, color: '#2775CA' },
        { asset: 'USDT', symbol: 'USDT', name: 'Tether', value: 40, color: '#26A17B' }
      ]
    },
    // Simplified breakdown for V13-V15
    simplifiedCrypto: [
      { symbol: 'BTC', name: 'Bitcoin', value: 40, color: '#F7931A' },
      { symbol: 'ETH', name: 'Ethereum', value: 35, color: '#627EEA' },
      { symbol: 'ALT', name: 'Altcoins', value: 25, color: '#8C8C8C' } // SOL + Others
    ]
  },
  targetAllocation: {
    crypto: 80,
    stable: 20
  },
  delta: 15, // crypto allocation gap

  // Portfolio details
  positions: 8,
  protocols: 4,
  chains: 3,

  // Loading states (for testing)
  isLoading: false,
  hasError: false,
};

/**
 * Alternative scenarios for testing
 */
export const MOCK_SCENARIOS = {
  extremeFear: {
    ...MOCK_DATA,
    sentimentValue: 15,
    sentimentStatus: "Extreme Fear" as const,
    currentRegime: "ef" as RegimeId,
    targetAllocation: { crypto: 30, stable: 70 },
    delta: 35,
  },
  neutral: {
    ...MOCK_DATA,
    sentimentValue: 50,
    sentimentStatus: "Neutral" as const,
    currentRegime: "n" as RegimeId,
    currentAllocation: { crypto: 50, stable: 50 },
    targetAllocation: { crypto: 50, stable: 50 },
    delta: 0,
  },
  extremeGreed: {
    ...MOCK_DATA,
    sentimentValue: 92,
    sentimentStatus: "Extreme Greed" as const,
    currentRegime: "eg" as RegimeId,
    targetAllocation: { crypto: 90, stable: 10 },
    delta: 25,
  },
};
