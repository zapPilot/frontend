/**
 * V22 Data Adapter
 *
 * Transforms existing API responses (landing page, sentiment, risk) into
 * the data format required by WalletPortfolioPresenterV22 component.
 *
 * This adapter enables zero-backend migration by reusing existing endpoints
 * and calculating derived metrics on the frontend.
 */

import type { V22PortfolioDataWithDirection } from "@/adapters/portfolioDataAdapter";
import {
  getRegimeAllocation,
  getRegimeById,
  type RegimeId,
} from "@/components/wallet/regime/regimeData";
import { getRegimeFromSentiment } from "@/lib/regimeMapper";
import type { LandingPageResponse } from "@/schemas/api/analyticsSchemas";
import type { MarketSentimentData } from "@/services/sentimentService";

/**
 * Asset allocation constituent (individual asset within crypto/stable category)
 */
interface AllocationConstituent {
  asset: string;
  symbol: string;
  name: string;
  value: number; // Percentage of parent category
  color: string;
}

/**
 * Portfolio allocation data structure for V22
 */
interface V22AllocationData {
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
interface V22PortfolioData {
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
 * Asset color mapping for consistent visualization
 */
const ASSET_COLORS = {
  BTC: "#F7931A",
  ETH: "#627EEA",
  SOL: "#14F195",
  ALT: "#8C8C8C", // Others/Altcoins
  USDC: "#2775CA",
  USDT: "#26A17B",
} as const;

/**
 * Calculate allocation percentages from landing page data
 */
function calculateAllocation(
  landingData: LandingPageResponse
): V22AllocationData {
  const { portfolio_allocation } = landingData;

  // Calculate total assets
  const totalAssets =
    portfolio_allocation.btc.total_value +
    portfolio_allocation.eth.total_value +
    portfolio_allocation.others.total_value +
    portfolio_allocation.stablecoins.total_value;

  // Prevent division by zero
  if (totalAssets === 0) {
    return {
      crypto: 0,
      stable: 0,
      constituents: { crypto: [], stable: [] },
      simplifiedCrypto: [],
    };
  }

  // Calculate crypto/stable split
  const cryptoTotal =
    portfolio_allocation.btc.total_value +
    portfolio_allocation.eth.total_value +
    portfolio_allocation.others.total_value;
  const stableTotal = portfolio_allocation.stablecoins.total_value;

  const cryptoPercent = (cryptoTotal / totalAssets) * 100;
  const stablePercent = (stableTotal / totalAssets) * 100;

  // Build constituent breakdown for crypto
  const cryptoConstituents: AllocationConstituent[] = [];
  if (cryptoTotal > 0) {
    if (portfolio_allocation.btc.total_value > 0) {
      cryptoConstituents.push({
        asset: "BTC",
        symbol: "BTC",
        name: "Bitcoin",
        value: (portfolio_allocation.btc.total_value / cryptoTotal) * 100,
        color: ASSET_COLORS.BTC,
      });
    }
    if (portfolio_allocation.eth.total_value > 0) {
      cryptoConstituents.push({
        asset: "ETH",
        symbol: "ETH",
        name: "Ethereum",
        value: (portfolio_allocation.eth.total_value / cryptoTotal) * 100,
        color: ASSET_COLORS.ETH,
      });
    }
    if (portfolio_allocation.others.total_value > 0) {
      cryptoConstituents.push({
        asset: "Others",
        symbol: "ALT",
        name: "Altcoins",
        value: (portfolio_allocation.others.total_value / cryptoTotal) * 100,
        color: ASSET_COLORS.ALT,
      });
    }
  }

  // Build constituent breakdown for stablecoins
  // Note: API returns aggregated stablecoins, so we estimate USDC/USDT split
  const stableConstituents: AllocationConstituent[] = [];
  if (stableTotal > 0) {
    // Estimate 60/40 split for USDC/USDT (adjust if backend provides breakdown)
    stableConstituents.push({
      asset: "USDC",
      symbol: "USDC",
      name: "USD Coin",
      value: 60,
      color: ASSET_COLORS.USDC,
    });
    stableConstituents.push({
      asset: "USDT",
      symbol: "USDT",
      name: "Tether",
      value: 40,
      color: ASSET_COLORS.USDT,
    });
  }

  // Simplified crypto for composition bar (BTC, ETH, ALT)
  const simplifiedCrypto: AllocationConstituent[] = [];
  if (cryptoTotal > 0) {
    const btcPercent =
      (portfolio_allocation.btc.total_value / totalAssets) * 100;
    const ethPercent =
      (portfolio_allocation.eth.total_value / totalAssets) * 100;
    const othersPercent =
      (portfolio_allocation.others.total_value / totalAssets) * 100;

    if (btcPercent > 0) {
      simplifiedCrypto.push({
        asset: "BTC",
        symbol: "BTC",
        name: "Bitcoin",
        value: btcPercent,
        color: ASSET_COLORS.BTC,
      });
    }
    if (ethPercent > 0) {
      simplifiedCrypto.push({
        asset: "ETH",
        symbol: "ETH",
        name: "Ethereum",
        value: ethPercent,
        color: ASSET_COLORS.ETH,
      });
    }
    if (othersPercent > 0) {
      simplifiedCrypto.push({
        asset: "ALT",
        symbol: "ALT",
        name: "Altcoins",
        value: othersPercent,
        color: ASSET_COLORS.ALT,
      });
    }
  }

  return {
    crypto: cryptoPercent,
    stable: stablePercent,
    constituents: {
      crypto: cryptoConstituents,
      stable: stableConstituents,
    },
    simplifiedCrypto,
  };
}

/**
 * Extract ROI change values from landing page data
 */
function extractROIChanges(landingData: LandingPageResponse): {
  roiChange7d: number;
  roiChange30d: number;
} {
  const windows = landingData.portfolio_roi.windows;

  let roiChange7d = 0;
  let roiChange30d = 0;

  if (windows) {
    roiChange7d = windows["7d"]?.value ?? 0;
    roiChange30d = windows["30d"]?.value ?? 0;
  }

  return { roiChange7d, roiChange30d };
}

/**
 * Calculate allocation delta (drift from target)
 */
function calculateDelta(currentCrypto: number, targetCrypto: number): number {
  return Math.abs(currentCrypto - targetCrypto);
}

/**
 * Transform API responses into V22 data format
 *
 * @param landingData - Portfolio landing page data
 * @param sentimentData - Market sentiment data (optional)
 * @param riskData - Risk summary data (optional, for future analytics)
 * @returns V22-compatible portfolio data
 */
export function transformToV22Data(
  landingData: LandingPageResponse,
  sentimentData?: MarketSentimentData | null
): V22PortfolioData {
  // Determine current regime from sentiment
  const currentRegime: RegimeId = sentimentData
    ? getRegimeFromSentiment(sentimentData.value)
    : "n"; // Default to neutral if no sentiment data

  // Get regime configuration for target allocation
  const regimeConfig = getRegimeById(currentRegime);
  const regimeAllocation = getRegimeAllocation(regimeConfig);
  const targetAllocation = {
    crypto: regimeAllocation.spot + regimeAllocation.lp,
    stable: regimeAllocation.stable,
  };

  // Calculate current allocation
  const currentAllocation = calculateAllocation(landingData);

  // Calculate delta
  const delta = calculateDelta(
    currentAllocation.crypto,
    targetAllocation.crypto
  );

  // Extract ROI changes
  const { roiChange7d, roiChange30d } = extractROIChanges(landingData);

  return {
    // Portfolio metrics
    balance: landingData.net_portfolio_value ?? 0,
    roi: landingData.portfolio_roi.recommended_yearly_roi,
    roiChange7d,
    roiChange30d,

    // Regime & sentiment
    sentimentValue: sentimentData?.value ?? 50, // Default to neutral (50)
    sentimentStatus: sentimentData?.status ?? "Neutral",
    sentimentQuote: sentimentData?.quote.quote ?? "",
    currentRegime,

    // Allocations
    currentAllocation,
    targetAllocation,
    delta,

    // Portfolio details
    positions:
      landingData.total_positions ?? landingData.pool_details?.length ?? 0,
    protocols: landingData.protocols_count ?? 0,
    chains: landingData.chains_count ?? 0,

    // State
    isLoading: false,
    hasError: false,
  };
}

/**
 * Create loading state for V22 data
 */
export function createV22LoadingState(): V22PortfolioDataWithDirection {
  return {
    balance: 0,
    roi: 0,
    roiChange7d: 0,
    roiChange30d: 0,
    sentimentValue: 50,
    sentimentStatus: "Neutral",
    sentimentQuote: "",
    currentRegime: "n",
    previousRegime: null,
    strategyDirection: "default",
    regimeDuration: null,
    currentAllocation: {
      crypto: 0,
      stable: 0,
      constituents: { crypto: [], stable: [] },
      simplifiedCrypto: [],
    },
    targetAllocation: { crypto: 50, stable: 50 },
    delta: 0,
    positions: 0,
    protocols: 0,
    chains: 0,
    isLoading: true,
    hasError: false,
  };
}

/**
 * Create error state for V22 data
 */
export function createV22ErrorState(): V22PortfolioDataWithDirection {
  return {
    ...createV22LoadingState(),
    isLoading: false,
    hasError: true,
  };
}
