import { motion } from "framer-motion";
import { useMemo } from "react";

import { ASSET_COLORS, getBarStyle } from "@/constants/assets";
import type { AllocationConstituent } from "@/types/portfolio-allocation";

import { AllocationLegend } from "./AllocationLegend";
import { AllocationTooltip } from "./AllocationTooltip";

interface AllocationBarsProps {
  cryptoAssets: AllocationConstituent[];
  stablePercentage: number;
}

// Threshold below which we hide inline text and show tooltip instead
const MIN_PERCENTAGE_FOR_LABEL = 8;

const STYLES = {
  container: "flex flex-col gap-1",
  barsContainer: "h-20 w-full flex gap-1",
} as const;

/**
 * AllocationBars - Displays crypto and stable allocation as interactive animated bars
 */
export function AllocationBars({
  cryptoAssets,
  stablePercentage,
}: AllocationBarsProps) {
  const legendItems = useMemo(() => {
    const items = cryptoAssets.map(asset => ({
      symbol: asset.symbol,
      percentage: asset.value,
      color: asset.color,
    }));

    if (stablePercentage > 0) {
      items.push({
        symbol: "Stables",
        percentage: stablePercentage,
        color: ASSET_COLORS.USDT,
      });
    }

    return items;
  }, [cryptoAssets, stablePercentage]);

  return (
    <div className={STYLES.container} data-testid="allocation-bars-container">
      <div className={STYLES.barsContainer}>
        {/* Crypto Section - Each asset bar uses its absolute percentage as width */}
        {cryptoAssets.map(asset => {
          const isSmall = asset.value < MIN_PERCENTAGE_FOR_LABEL;

          const barContent = (
            <motion.div
              key={asset.symbol}
              data-testid={`composition-${asset.symbol.toLowerCase()}`}
              className="h-full w-full rounded-lg relative group overflow-hidden cursor-pointer"
              style={getBarStyle(asset.color)}
              whileHover={{ scale: 1.02, y: -2 }}
            >
              {!isSmall && (
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="font-bold text-white text-lg">
                    {asset.symbol}
                  </span>
                  <span className="text-xs text-gray-400 font-mono opacity-0 group-hover:opacity-100 transition-opacity">
                    {asset.value.toFixed(2)}%
                  </span>
                </div>
              )}
            </motion.div>
          );

          return (
            <div
              key={asset.symbol}
              className="h-full"
              style={{ width: `${asset.value}%` }}
            >
              {isSmall ? (
                <AllocationTooltip
                  label={asset.symbol}
                  percentage={asset.value}
                  color={asset.color}
                >
                  {barContent}
                </AllocationTooltip>
              ) : (
                barContent
              )}
            </div>
          );
        })}

        {/* Stable Section - Only show if has value */}
        {stablePercentage > 0 &&
          (() => {
            const isSmall = stablePercentage < MIN_PERCENTAGE_FOR_LABEL;
            const stableColor = ASSET_COLORS.USDT;

            const stableBarContent = (
              <motion.div
                data-testid="composition-stables"
                className="h-full w-full rounded-lg flex items-center justify-center relative group cursor-pointer"
                style={getBarStyle(stableColor)}
                whileHover={{ scale: 1.02, y: -2 }}
              >
                {!isSmall && (
                  <div className="text-center">
                    <span
                      className="font-bold text-lg"
                      style={{ color: stableColor }}
                    >
                      STABLES
                    </span>
                    <div
                      className="text-xs font-mono opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ color: `${stableColor}99` }}
                    >
                      {stablePercentage.toFixed(2)}%
                    </div>
                  </div>
                )}
              </motion.div>
            );

            return (
              <div className="h-full" style={{ width: `${stablePercentage}%` }}>
                {isSmall ? (
                  <AllocationTooltip
                    label="STABLES"
                    percentage={stablePercentage}
                    color={stableColor}
                  >
                    {stableBarContent}
                  </AllocationTooltip>
                ) : (
                  stableBarContent
                )}
              </div>
            );
          })()}
      </div>
      <AllocationLegend items={legendItems} />
    </div>
  );
}
