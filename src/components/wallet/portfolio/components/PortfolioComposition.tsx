import { Zap } from "lucide-react";

import {
  ASSET_COLORS,
  type WalletPortfolioDataWithDirection,
} from "@/adapters/walletPortfolioDataAdapter";
import { GradientButton } from "@/components/ui";
import {
  getRegimeAllocation,
  type Regime,
} from "@/components/wallet/regime/regimeData";
import { GRADIENTS } from "@/constants/design-system";

import { AllocationBars, type AllocationConstituent } from "./AllocationBars";

interface PortfolioCompositionProps {
  data: WalletPortfolioDataWithDirection;
  currentRegime: Regime;
  isEmptyState?: boolean;
  onRebalance: () => void;
}

/**
 * Helper: Build target crypto assets from regime breakdown for empty state
 * Uses BTC for Spot allocation and ETH for LP allocation
 */
function buildTargetCryptoAssets(regime: Regime): AllocationConstituent[] {
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
 * Helper: Get real crypto assets from portfolio data
 */
function buildRealCryptoAssets(
  data: WalletPortfolioDataWithDirection
): AllocationConstituent[] {
  return data.currentAllocation.simplifiedCrypto;
}

interface LegendItemProps {
  label: string;
  color: string;
}

function LegendItem({ label, color }: LegendItemProps) {
  return (
    <div className="flex items-center gap-1.5">
      <div
        className="w-2 h-2 rounded-full"
        style={{ backgroundColor: color }}
      />
      <span>{label}</span>
    </div>
  );
}

export function PortfolioComposition({
  data,
  currentRegime,
  isEmptyState = false,
  onRebalance,
}: PortfolioCompositionProps) {
  const targetBreakdown = getRegimeAllocation(currentRegime);
  const target = {
    crypto: targetBreakdown.spot + targetBreakdown.lp,
    stable: targetBreakdown.stable,
  };
  const allocationLabel = isEmptyState ? "Recommended" : "Target";

  // Determine which assets to display
  const cryptoAssets = isEmptyState
    ? buildTargetCryptoAssets(currentRegime)
    : buildRealCryptoAssets(data);

  const cryptoPercentage = isEmptyState
    ? target.crypto
    : data.currentAllocation.crypto;
  const stablePercentage = isEmptyState
    ? target.stable
    : data.currentAllocation.stable;

  const renderAllocationChip = (label: string, color: string) => (
    <div
      className="px-2 py-1 rounded-full text-xs font-mono font-bold flex items-center gap-1.5"
      style={{
        backgroundColor: `${color}20`,
        color,
        border: `1px solid ${color}40`,
      }}
    >
      <div
        className="w-1.5 h-1.5 rounded-full"
        style={{ backgroundColor: color }}
      />
      {label}
    </div>
  );

  return (
    <div
      className="bg-gray-900/20 border border-gray-800 rounded-2xl p-8 flex flex-col relative overflow-hidden"
      data-testid="composition-bar"
    >
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-xl font-bold text-white mb-1">
            Portfolio Composition
          </h2>
          <p className="text-sm text-gray-400">
            <div className="flex gap-2 items-center">
              <span className="text-sm text-gray-400 mr-2">
                {allocationLabel}:
              </span>
              {renderAllocationChip(
                `${target.stable}% Stable`,
                ASSET_COLORS.USDT
              )}
              {renderAllocationChip(
                `${target.crypto}% Crypto`,
                ASSET_COLORS.BTC
              )}
            </div>
          </p>
        </div>
        <div className="flex gap-2">
          <GradientButton
            data-testid="rebalance-button"
            gradient={GRADIENTS.PRIMARY}
            icon={Zap}
            className="h-8 text-xs"
            onClick={onRebalance}
            disabled={isEmptyState}
          >
            Rebalance
          </GradientButton>
        </div>
      </div>

      {/* THE GHOST BAR TRACK */}
      <div className="relative h-24 w-full bg-gray-900/50 rounded-xl border border-gray-800 p-1 flex overflow-hidden">
        {/* GHOST TARGET BACKGROUND - Visual guide only */}
        <div className="absolute inset-0 flex opacity-20 pointer-events-none">
          <div
            style={{ width: `${target.crypto}%` }}
            className="h-full border-r border-dashed border-white/30"
          />
          <div style={{ width: `${target.stable}%` }} className="h-full" />
        </div>

        {/* ACTUAL BARS (Foreground) */}
        <div className="relative w-full h-full flex gap-1 z-10">
          <AllocationBars
            cryptoAssets={cryptoAssets}
            cryptoPercentage={cryptoPercentage}
            stablePercentage={stablePercentage}
          />
        </div>
      </div>

      {/* Legend - Conditional rendering for empty state */}
      <div className="flex justify-between mt-4 px-1">
        {isEmptyState ? (
          <div className="flex gap-4 text-xs text-gray-400">
            {cryptoAssets.map(asset => (
              <LegendItem
                key={asset.symbol}
                color={asset.color}
                label={asset.symbol === "BTC" ? "Spot (Target)" : "LP (Target)"}
              />
            ))}
            {stablePercentage > 0 && (
              <LegendItem
                color={ASSET_COLORS.USDT}
                label="Stablecoins (Target)"
              />
            )}
          </div>
        ) : (
          <div className="flex gap-4 text-xs text-gray-400">
            {data.currentAllocation.simplifiedCrypto.map(asset => (
              <LegendItem
                key={asset.symbol}
                color={asset.color}
                label={asset.name}
              />
            ))}
            <LegendItem color={ASSET_COLORS.USDT} label="Stablecoins" />
          </div>
        )}
        <div className="text-xs font-bold text-orange-400">
          {isEmptyState ? (
            <span className="text-purple-400">
              Optimize: {data.delta.toFixed(0)}%
            </span>
          ) : (
            <>Drift: {data.delta.toFixed(2)}%</>
          )}
        </div>
      </div>
    </div>
  );
}
