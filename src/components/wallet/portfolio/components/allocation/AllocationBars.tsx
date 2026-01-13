import { motion } from "framer-motion";
import { useMemo } from "react";

import { ASSET_COLORS, getBarStyle } from "@/constants/assets";
import type { AllocationConstituent } from "@/types/portfolio-allocation";

import { AllocationBarTooltip } from "./AllocationBarTooltip";
import { AllocationLegend } from "./AllocationLegend";

interface AllocationBarsProps {
  cryptoAssets: AllocationConstituent[];
  stablePercentage: number;
}

/** Threshold below which we hide inline text and show tooltip instead */
const MIN_PERCENTAGE_FOR_LABEL = 8;

const STYLES = {
  container: "flex flex-col gap-1",
  barsContainer: "h-20 w-full flex gap-1",
  barWrapper: "h-full",
  barBase:
    "h-full w-full rounded-lg relative group overflow-hidden cursor-pointer",
  barCenter:
    "h-full w-full rounded-lg flex items-center justify-center relative group cursor-pointer",
  labelContainer: "absolute inset-0 flex flex-col items-center justify-center",
  labelText: "font-bold text-white text-lg",
  percentageText:
    "text-xs font-mono opacity-0 group-hover:opacity-100 transition-opacity",
} as const;

interface AllocationBarProps {
  /** Display label for the bar */
  label: string;
  /** Percentage value (0-100) */
  percentage: number;
  /** Color for the bar fill */
  color: string;
  /** Test ID for the bar element */
  testId: string;
  /** Whether to use centered layout (for stables) vs absolute positioned */
  centered?: boolean;
}

/**
 * AllocationBar - Renders a single allocation bar with optional tooltip
 * Automatically shows tooltip for small bars that can't fit labels
 */
function AllocationBar({
  label,
  percentage,
  color,
  testId,
  centered = false,
}: AllocationBarProps): React.ReactElement {
  const isSmall = percentage < MIN_PERCENTAGE_FOR_LABEL;

  const barContent = (
    <motion.div
      data-testid={testId}
      className={centered ? STYLES.barCenter : STYLES.barBase}
      style={getBarStyle(color)}
      whileHover={{ scale: 1.02, y: -2 }}
    >
      {!isSmall &&
        (centered ? (
          <div className="text-center">
            <span className="font-bold text-lg" style={{ color }}>
              {label}
            </span>
            <div
              className={STYLES.percentageText}
              style={{ color: `${color}99` }}
            >
              {percentage.toFixed(2)}%
            </div>
          </div>
        ) : (
          <div className={STYLES.labelContainer}>
            <span className={STYLES.labelText}>{label}</span>
            <span className={`${STYLES.percentageText} text-gray-400`}>
              {percentage.toFixed(2)}%
            </span>
          </div>
        ))}
    </motion.div>
  );

  return (
    <div className={STYLES.barWrapper} style={{ width: `${percentage}%` }}>
      {isSmall ? (
        <AllocationBarTooltip
          label={label}
          percentage={percentage}
          color={color}
        >
          {barContent}
        </AllocationBarTooltip>
      ) : (
        barContent
      )}
    </div>
  );
}

/**
 * AllocationBars - Displays crypto and stable allocation as interactive animated bars
 */
export function AllocationBars({
  cryptoAssets,
  stablePercentage,
}: AllocationBarsProps): React.ReactElement {
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
        {cryptoAssets.map(asset => (
          <AllocationBar
            key={asset.symbol}
            label={asset.symbol}
            percentage={asset.value}
            color={asset.color}
            testId={`composition-${asset.symbol.toLowerCase()}`}
          />
        ))}

        {/* Stable Section - Only show if has value */}
        {stablePercentage > 0 && (
          <AllocationBar
            label="STABLES"
            percentage={stablePercentage}
            color={ASSET_COLORS.USDT}
            testId="composition-stables"
            centered
          />
        )}
      </div>
      <AllocationLegend items={legendItems} />
    </div>
  );
}
