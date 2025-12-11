/**
 * Portfolio Data Adapter
 *
 * Transforms API responses from analyticsService and sentimentService
 * into the V22 portfolio data structure.
 */

import { type RegimeId, regimes } from "@/components/wallet/regime/regimeData";
import { getRegimeFromSentiment } from "@/lib/regimeMapper";
import type { LandingPageResponse } from "@/services/analyticsService";
import type { MarketSentimentData } from "@/services/sentimentService";

/**
 * Asset color mapping for consistent visualization
 */
const ASSET_COLORS = {
  BTC: "#F7931A",
  ETH: "#627EEA",
  SOL: "#14F195",
  ALT: "#8C8C8C",
  USDC: "#2775CA",
  USDT: "#26A17B",
} as const;

/**
 * Constituent asset type for allocation breakdown
 */
interface AllocationConstituent {
  asset: string;
  symbol: string;
  name: string;
  value: number;
  color: string;
}

/**
 * V22 Portfolio Data Structure
 * Matches the structure expected by WalletPortfolioPresenterV22
 */
export interface V22PortfolioData {
  // Portfolio metrics
  balance: number;
  roi: number;
  roiChange7d: number;
  roiChange30d: number;

  // Market sentiment
  sentimentValue: number;
  sentimentStatus: string;
  sentimentQuote: string;

  // Regime data
  currentRegime: RegimeId;

  // Allocations
  currentAllocation: {
    crypto: number;
    stable: number;
    constituents: {
      crypto: AllocationConstituent[];
      stable: AllocationConstituent[];
    };
    simplifiedCrypto: AllocationConstituent[];
  };
  targetAllocation: {
    crypto: number;
    stable: number;
  };
  delta: number;

  // Portfolio details
  positions: number;
  protocols: number;
  chains: number;

  // Loading states
  isLoading: boolean;
  hasError: boolean;
}

/**
 * Transforms Landing Page Response and Sentiment Data into V22 Portfolio Data
 *
 * @param landingData - Portfolio data from /api/v2/portfolio/{userId}/landing
 * @param sentimentData - Market sentiment from /api/v2/market/sentiment
 * @returns V22-compatible portfolio data structure
 */
export function transformToV22Data(
  landingData: LandingPageResponse,
  sentimentData: MarketSentimentData | null
): V22PortfolioData {
  // Determine current regime from sentiment
  const sentimentValue = sentimentData?.value ?? 50;
  const currentRegime = getRegimeFromSentiment(sentimentValue);

  // Get target allocation for current regime
  const targetAllocation = getTargetAllocation(currentRegime);

  // Calculate current allocation from portfolio data
  const currentAllocation = calculateAllocation(landingData);

  // Calculate drift (delta) between current and target allocation
  const delta = calculateDelta(currentAllocation.crypto, targetAllocation.crypto);

  // Extract ROI changes
  const roiChanges = extractROIChanges(landingData);

  return {
    // Portfolio metrics
    balance: landingData.net_portfolio_value ?? 0,
    roi: landingData.portfolio_roi.recommended_yearly_roi,
    roiChange7d: roiChanges.change7d,
    roiChange30d: roiChanges.change30d,

    // Market sentiment
    sentimentValue,
    sentimentStatus: sentimentData?.status ?? "Neutral",
    sentimentQuote: sentimentData?.quote?.quote ?? getDefaultQuoteForRegime(currentRegime),

    // Regime
    currentRegime,

    // Allocations
    currentAllocation,
    targetAllocation,
    delta,

    // Portfolio details
    positions: landingData.pool_details?.length ?? 0,
    protocols: countUniqueProtocols(landingData.pool_details ?? []),
    chains: countUniqueChains(landingData.pool_details ?? []),

    // Loading states
    isLoading: false,
    hasError: false,
  };
}

/**
 * Calculates current allocation from portfolio data
 */
function calculateAllocation(
  landingData: LandingPageResponse
): V22PortfolioData["currentAllocation"] {
  const allocation = landingData.portfolio_allocation;

  // Calculate total values
  const btcValue = allocation.btc.total_value;
  const ethValue = allocation.eth.total_value;
  const othersValue = allocation.others.total_value;
  const stablecoinsValue = allocation.stablecoins.total_value;

  const totalCrypto = btcValue + ethValue + othersValue;
  const totalAssets = totalCrypto + stablecoinsValue;

  // Protect against division by zero
  if (totalAssets === 0) {
    return {
      crypto: 0,
      stable: 0,
      constituents: {
        crypto: [],
        stable: [],
      },
      simplifiedCrypto: [],
    };
  }

  // Calculate percentages
  const cryptoPercent = (totalCrypto / totalAssets) * 100;
  const stablePercent = (stablecoinsValue / totalAssets) * 100;

  // Build constituents for detailed breakdown
  const cryptoConstituents: AllocationConstituent[] = [];
  const stableConstituents: AllocationConstituent[] = [];

  // Add BTC if present
  if (btcValue > 0) {
    cryptoConstituents.push({
      asset: "BTC",
      symbol: "BTC",
      name: "Bitcoin",
      value: (btcValue / totalCrypto) * 100,
      color: ASSET_COLORS.BTC,
    });
  }

  // Add ETH if present
  if (ethValue > 0) {
    cryptoConstituents.push({
      asset: "ETH",
      symbol: "ETH",
      name: "Ethereum",
      value: (ethValue / totalCrypto) * 100,
      color: ASSET_COLORS.ETH,
    });
  }

  // Add Others if present
  if (othersValue > 0) {
    cryptoConstituents.push({
      asset: "Others",
      symbol: "ALT",
      name: "Altcoins",
      value: (othersValue / totalCrypto) * 100,
      color: ASSET_COLORS.ALT,
    });
  }

  // Estimate USDC/USDT split (60/40 default - backend does not provide breakdown yet)
  if (stablecoinsValue > 0) {
    const usdcValue = stablecoinsValue * 0.6;
    const usdtValue = stablecoinsValue * 0.4;

    stableConstituents.push(
      {
        asset: "USDC",
        symbol: "USDC",
        name: "USD Coin",
        value: (usdcValue / stablecoinsValue) * 100,
        color: ASSET_COLORS.USDC,
      },
      {
        asset: "USDT",
        symbol: "USDT",
        name: "Tether",
        value: (usdtValue / stablecoinsValue) * 100,
        color: ASSET_COLORS.USDT,
      }
    );
  }

  // Create simplified crypto breakdown (for V13-V15 layouts)
  const simplifiedCrypto: AllocationConstituent[] = [
    {
      symbol: "BTC",
      name: "Bitcoin",
      asset: "BTC",
      value: btcValue > 0 ? (btcValue / totalCrypto) * 100 : 0,
      color: ASSET_COLORS.BTC,
    },
    {
      symbol: "ETH",
      name: "Ethereum",
      asset: "ETH",
      value: ethValue > 0 ? (ethValue / totalCrypto) * 100 : 0,
      color: ASSET_COLORS.ETH,
    },
    {
      symbol: "ALT",
      name: "Altcoins",
      asset: "Others",
      value: othersValue > 0 ? (othersValue / totalCrypto) * 100 : 0,
      color: ASSET_COLORS.ALT,
    },
  ].filter((c) => c.value > 0);

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
 * Gets target allocation for a regime
 */
function getTargetAllocation(
  regimeId: RegimeId
): V22PortfolioData["targetAllocation"] {
  const regime = regimes.find((r) => r.id === regimeId);

  if (!regime) {
    // Fallback to neutral (50/50)
    return { crypto: 50, stable: 50 };
  }

  return {
    crypto: regime.allocation.crypto,
    stable: regime.allocation.stable,
  };
}

/**
 * Calculates delta (drift) between current and target allocation
 */
function calculateDelta(currentCrypto: number, targetCrypto: number): number {
  return Math.abs(targetCrypto - currentCrypto);
}

/**
 * Extracts ROI changes from landing page data
 */
function extractROIChanges(
  landingData: LandingPageResponse
): { change7d: number; change30d: number } {
  const roiData = landingData.portfolio_roi;

  // Try to get from windows first
  let change7d = 0;
  let change30d = 0;

  if (roiData.windows) {
    change7d = roiData.windows["7d"]?.value ?? 0;
    change30d = roiData.windows["30d"]?.value ?? 0;
  } else {
    // Fallback to legacy fields
    change7d = roiData.roi_7d?.value ?? 0;
    change30d = roiData.roi_30d?.value ?? 0;
  }

  return { change7d, change30d };
}

/**
 * Counts unique protocols in pool details
 */
function countUniqueProtocols(
  poolDetails: LandingPageResponse["pool_details"]
): number {
  const uniqueProtocols = new Set(
    poolDetails.map((pool) => pool.protocol_id)
  );
  return uniqueProtocols.size;
}

/**
 * Counts unique chains in pool details
 */
function countUniqueChains(
  poolDetails: LandingPageResponse["pool_details"]
): number {
  const uniqueChains = new Set(poolDetails.map((pool) => pool.chain));
  return uniqueChains.size;
}

/**
 * Gets default quote for a regime when sentiment data is unavailable
 */
function getDefaultQuoteForRegime(regimeId: RegimeId): string {
  const quotes: Record<RegimeId, string> = {
    ef: "Market panic creates opportunities for disciplined investors.",
    f: "Cautiously increase exposure as sentiment improves.",
    n: "Maintain balanced position across market cycles.",
    g: "Market conditions favor aggressive positioning with higher allocation to growth assets.",
    eg: "Extreme optimism requires caution - protect gains and prepare for reversal.",
  };

  return quotes[regimeId];
}

/**
 * Creates a loading state placeholder
 */
export function createLoadingState(): V22PortfolioData {
  return {
    balance: 0,
    roi: 0,
    roiChange7d: 0,
    roiChange30d: 0,
    sentimentValue: 50,
    sentimentStatus: "Neutral",
    sentimentQuote: "",
    currentRegime: "n",
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
 * Creates an error state placeholder
 */
export function createErrorState(): V22PortfolioData {
  return {
    ...createLoadingState(),
    isLoading: false,
    hasError: true,
  };
}
