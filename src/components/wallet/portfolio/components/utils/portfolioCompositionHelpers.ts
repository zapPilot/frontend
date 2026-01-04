import {
  ASSET_COLORS,
  type WalletPortfolioDataWithDirection,
} from "@/adapters/walletPortfolioDataAdapter";
import {
  getRegimeAllocation,
  type Regime,
} from "@/components/wallet/regime/regimeData";
import type { AllocationConstituent } from "@/types/portfolio-allocation";

/**
 * Build target crypto assets from regime breakdown for empty state
 * Uses BTC for Spot allocation and ETH for LP allocation
 */
export function buildTargetCryptoAssets(
  regime: Regime
): AllocationConstituent[] {
  const breakdown = getRegimeAllocation(regime);
  const totalCrypto = breakdown.spot + breakdown.lp;

  if (totalCrypto === 0) {
    return [];
  }

  const assets: AllocationConstituent[] = [];

  // Add Spot (BTC) if present
  if (breakdown.spot > 0) {
    assets.push({
      asset: "BTC",
      symbol: "BTC",
      name: "Bitcoin (Spot)",
      value: (breakdown.spot / totalCrypto) * 100,
      color: ASSET_COLORS.BTC,
    });
  }

  // Add LP (ETH) if present
  if (breakdown.lp > 0) {
    assets.push({
      asset: "ETH",
      symbol: "ETH",
      name: "Ethereum (LP)",
      value: (breakdown.lp / totalCrypto) * 100,
      color: ASSET_COLORS.ETH,
    });
  }

  return assets;
}

/**
 * Get real crypto assets from portfolio data
 */
export function buildRealCryptoAssets(
  data: WalletPortfolioDataWithDirection
): AllocationConstituent[] {
  return data.currentAllocation.simplifiedCrypto;
}

interface TargetAllocation {
  crypto: number;
  stable: number;
}

interface AllocationWeights {
  btc_weight: number;
  eth_weight: number;
}

/**
 * Build target assets array with marketcap-weighted BTC/ETH split
 * Used for the "Target Allocation" bar
 */
export function buildTargetAssetsWithWeights(
  target: TargetAllocation,
  weights: AllocationWeights | undefined
): { symbol: string; percentage: number; color: string }[] {
  const btcWeight = weights?.btc_weight ?? 0.8;
  const ethWeight = weights?.eth_weight ?? 0.2;

  return [
    {
      symbol: "BTC",
      percentage: target.crypto * btcWeight,
      color: ASSET_COLORS.BTC,
    },
    {
      symbol: "ETH",
      percentage: target.crypto * ethWeight,
      color: ASSET_COLORS.ETH,
    },
    {
      symbol: "Stables",
      percentage: target.stable,
      color: ASSET_COLORS.USDT,
    },
  ];
}
