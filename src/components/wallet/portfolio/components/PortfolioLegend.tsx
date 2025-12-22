import { ASSET_COLORS } from "@/adapters/walletPortfolioDataAdapter";

import type { AllocationConstituent } from "./AllocationBars";

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

interface PortfolioLegendProps {
  isEmptyState: boolean;
  cryptoAssets: AllocationConstituent[];
  stablePercentage: number;
  delta: number;
  simplifiedCrypto?: AllocationConstituent[];
}

export function PortfolioLegend({
  isEmptyState,
  cryptoAssets,
  stablePercentage,
  delta,
  simplifiedCrypto = [],
}: PortfolioLegendProps) {
  return (
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
          {simplifiedCrypto.map(asset => (
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
          <span className="text-purple-400">Optimize: {delta.toFixed(0)}%</span>
        ) : (
          <>Drift: {delta.toFixed(2)}%</>
        )}
      </div>
    </div>
  );
}
