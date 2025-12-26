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

  // Create simplified crypto breakdown for composition bar
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
