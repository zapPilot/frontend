import { ASSET_COLORS } from "@/constants/assets";
import type { LandingPageResponse } from "@/services/analyticsService";
import type { AllocationConstituent } from "@/types/portfolio-allocation";

/**
 * Constituent asset type for allocation breakdown
 */
export type { AllocationConstituent };

/**
 * Simplified portfolio allocation structure
 */
export interface PortfolioAllocation {
  crypto: number;
  stable: number;
  constituents: {
    crypto: AllocationConstituent[];
    stable: AllocationConstituent[];
  };
  simplifiedCrypto: AllocationConstituent[];
}

/**
 * Calculates current allocation from portfolio data
 */
export function calculateAllocation(
  landingData: LandingPageResponse
): PortfolioAllocation {
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
  const safeCryptoDivisor = totalCrypto || 1;
  const cryptoConstituents: AllocationConstituent[] = [
    {
      asset: "BTC",
      symbol: "BTC",
      name: "Bitcoin",
      value: (btcValue / safeCryptoDivisor) * 100,
      color: ASSET_COLORS.BTC,
    },
    {
      asset: "ETH",
      symbol: "ETH",
      name: "Ethereum",
      value: (ethValue / safeCryptoDivisor) * 100,
      color: ASSET_COLORS.ETH,
    },
    {
      asset: "Others",
      symbol: "ALT",
      name: "Altcoins",
      value: (othersValue / safeCryptoDivisor) * 100,
      color: ASSET_COLORS.ALT,
    },
  ].filter(c => c.value > 0);
  const stableConstituents: AllocationConstituent[] = [];

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

  // Create simplified crypto breakdown for composition bar
  // Using absolute portfolio percentages directly from API
  const simplifiedCrypto: AllocationConstituent[] = [
    {
      symbol: "BTC",
      name: "Bitcoin",
      asset: "BTC",
      value: allocation.btc.percentage_of_portfolio,
      color: ASSET_COLORS.BTC,
    },
    {
      symbol: "ETH",
      name: "Ethereum",
      asset: "ETH",
      value: allocation.eth.percentage_of_portfolio,
      color: ASSET_COLORS.ETH,
    },
    {
      symbol: "ALT",
      name: "Altcoins",
      asset: "Others",
      value: allocation.others.percentage_of_portfolio,
      color: ASSET_COLORS.ALT,
    },
  ].filter(c => c.value > 0);

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
 * Calculates delta (drift) between current and target allocation
 */
export function calculateDelta(
  currentCrypto: number,
  targetCrypto: number
): number {
  return Math.abs(targetCrypto - currentCrypto);
}
