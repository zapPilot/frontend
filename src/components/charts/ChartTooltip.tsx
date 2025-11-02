/**
 * ChartTooltip Component
 *
 * Reusable tooltip component for all chart types with smart positioning
 * and chart-specific content rendering.
 */

import { motion } from "framer-motion";
import { useRef } from "react";

import { ASSET_CATEGORIES } from "@/constants/portfolio";
import {
  calculateDailyVolatility,
  getDrawdownSeverity,
  getDrawdownSeverityColor,
  getSharpeColor,
  getSharpeInterpretation,
  getVolatilityRiskColor,
  getVolatilityRiskLevel,
} from "@/lib/chartHoverUtils";
import { formatters } from "@/lib/formatters";

import type {
  AllocationHoverData,
  ChartHoverState,
  DrawdownHoverData,
  PerformanceHoverData,
  SharpeHoverData,
  VolatilityHoverData,
} from "../../types/chartHover";

const CHARTS_WITH_TOP_LEGEND = new Set([
  "performance",
  "allocation",
  "sharpe",
  "volatility",
]);

interface ChartTooltipProps {
  /** Current hover state or null */
  hoveredPoint: ChartHoverState | null;
  /** Chart width for positioning calculations */
  chartWidth?: number;
  /** Chart height for positioning calculations */
  chartHeight?: number;
}

/**
 * Render Performance chart tooltip content
 */
function PerformanceTooltipContent({ data }: { data: PerformanceHoverData }) {
  const formattedValue = formatters.currencyPrecise(data.value);
  const breakdownRows = [
    {
      label: "DeFi",
      colorClass: "text-purple-300",
      value: data.defiValue,
    },
    {
      label: "Wallet",
      colorClass: "text-cyan-300",
      value: data.walletValue,
    },
  ].filter(
    (
      entry
    ): entry is {
      label: string;
      colorClass: string;
      value: number;
    } => typeof entry.value === "number" && Number.isFinite(entry.value)
  );

  return (
    <>
      <div className="text-xs text-gray-300 mb-1">{data.date}</div>
      <div className="space-y-1">
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs text-purple-300">Portfolio</span>
          <span className="text-sm font-semibold text-white">
            {formattedValue}
          </span>
        </div>
        {breakdownRows.map(({ label, colorClass, value }) => (
          <div key={label} className="flex items-center justify-between gap-3">
            <span className={`text-xs ${colorClass}`}>{label}</span>
            <span className="text-sm font-semibold text-gray-200">
              {formatters.currencyPrecise(value)}
            </span>
          </div>
        ))}
      </div>
    </>
  );
}

/**
 * Render Allocation chart tooltip content
 */
function AllocationTooltipContent({ data }: { data: AllocationHoverData }) {
  const allocations = [
    {
      label: ASSET_CATEGORIES.btc.shortLabel,
      value: data.btc,
      color: ASSET_CATEGORIES.btc.tailwindColor,
    },
    {
      label: ASSET_CATEGORIES.eth.shortLabel,
      value: data.eth,
      color: ASSET_CATEGORIES.eth.tailwindColor,
    },
    {
      label: ASSET_CATEGORIES.stablecoin.shortLabel,
      value: data.stablecoin,
      color: ASSET_CATEGORIES.stablecoin.tailwindColor,
    },
    {
      label: ASSET_CATEGORIES.altcoin.shortLabel,
      value: data.altcoin,
      color: ASSET_CATEGORIES.altcoin.tailwindColor,
    },
  ];

  return (
    <>
      <div className="text-xs text-gray-300 mb-2">{data.date}</div>
      <div className="space-y-1">
        {allocations
          .filter(({ value }) => value > 0.5) // Only show allocations > 0.5%
          .map(({ label, value, color }) => (
            <div
              key={label}
              className="flex items-center justify-between gap-3"
            >
              <span className={`text-xs ${color}`}>{label}</span>
              <span className="text-sm font-semibold text-white">
                {formatters.percent(value)}
              </span>
            </div>
          ))}
      </div>
    </>
  );
}

/**
 * Render Drawdown chart tooltip content with severity badge
 */
function DrawdownTooltipContent({ data }: { data: DrawdownHoverData }) {
  const severityLabel = getDrawdownSeverity(data.drawdown);
  const severityColors = getDrawdownSeverityColor(severityLabel);

  return (
    <>
      <div className="text-xs text-gray-300 mb-2">{data.date}</div>
      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs text-red-300">Drawdown</span>
          <span className="text-sm font-semibold text-white">
            {formatters.percent(data.drawdown, 2)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs text-gray-400">Severity</span>
          <span
            className={`text-xs font-semibold px-2 py-0.5 rounded ${severityColors.bgColor} ${severityColors.color}`}
          >
            {severityLabel}
          </span>
        </div>
        {data.peakDate && (
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs text-gray-400">Peak Date</span>
            <span className="text-xs text-gray-300">{data.peakDate}</span>
          </div>
        )}
        {data.distanceFromPeak != null && (
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs text-gray-400">Days from Peak</span>
            <span className="text-sm font-semibold text-blue-400">
              {data.distanceFromPeak}
            </span>
          </div>
        )}
        {data.recoveryDurationDays != null && (
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs text-gray-400">Recovery Time</span>
            <span className="text-sm font-semibold text-emerald-400">
              {data.recoveryDurationDays} days
            </span>
          </div>
        )}
        {data.recoveryDepth != null && (
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs text-gray-400">Cycle Depth</span>
            <span className="text-sm font-semibold text-gray-200">
              {formatters.percent(data.recoveryDepth, 1)}
            </span>
          </div>
        )}
        {data.isRecoveryPoint && (
          <div className="flex items-center gap-2 mt-1 pt-1.5 border-t border-gray-700">
            <svg
              width="12"
              height="12"
              viewBox="0 0 12 12"
              className="text-emerald-400"
            >
              <path
                d="M2 10 L2 2 L10 6 Z"
                fill="currentColor"
                stroke="white"
                strokeWidth="0.5"
              />
            </svg>
            <span className="text-xs text-emerald-400 font-semibold">
              New Peak
            </span>
          </div>
        )}
      </div>
    </>
  );
}

/**
 * Render Sharpe Ratio chart tooltip content with color-coded rating
 */
function SharpeTooltipContent({ data }: { data: SharpeHoverData }) {
  const interpretation = getSharpeInterpretation(data.sharpe);
  const indicatorColor = getSharpeColor(data.sharpe);

  // Map interpretation to text color class
  const textColorClass =
    interpretation === "Excellent"
      ? "text-green-400"
      : interpretation === "Good"
        ? "text-lime-400"
        : interpretation === "Fair"
          ? "text-yellow-400"
          : interpretation === "Poor"
            ? "text-orange-400"
            : "text-red-400";

  return (
    <>
      <div className="text-xs text-gray-300 mb-2">{data.date}</div>
      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: indicatorColor }}
            />
            <span className="text-xs text-gray-300">Sharpe Ratio</span>
          </div>
          <span className="text-sm font-semibold text-white">
            {data.sharpe.toFixed(2)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs text-gray-400">Rating</span>
          <span className={`text-sm font-semibold ${textColorClass}`}>
            {interpretation}
          </span>
        </div>
      </div>
    </>
  );
}

/**
 * Render Volatility chart tooltip content with risk badge and values
 */
function VolatilityTooltipContent({ data }: { data: VolatilityHoverData }) {
  const riskLevel = getVolatilityRiskLevel(data.volatility);
  const riskColors = getVolatilityRiskColor(riskLevel);
  const dailyVol = calculateDailyVolatility(data.volatility);
  const isHighRisk = data.volatility >= 25;

  return (
    <>
      <div className="text-xs text-gray-300 mb-2">{data.date}</div>
      <div className="space-y-1.5">
        <div className="text-sm font-semibold text-white">
          Volatility overview
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs text-amber-300">Annualized Vol</span>
          <span className="text-sm font-semibold text-white">
            {formatters.percent(data.volatility)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs text-gray-400">Daily Vol</span>
          <span className="text-sm font-semibold text-gray-300">
            {formatters.percent(dailyVol, 2)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs text-gray-400">Risk Level</span>
          <span
            className={`text-xs font-semibold px-2 py-0.5 rounded ${riskColors.bgColor} ${riskColors.color}`}
          >
            {riskLevel}
          </span>
        </div>
        {isHighRisk && (
          <div className="flex items-center gap-1.5 mt-1 pt-1 border-t border-gray-700">
            <span className="text-xs text-red-400">
              ⚠ High volatility warning
            </span>
          </div>
        )}
      </div>
    </>
  );
}

/**
 * ChartTooltip component with smart positioning
 */
export function ChartTooltip({
  hoveredPoint,
  chartWidth = 800,
  chartHeight = 300,
}: ChartTooltipProps) {
  const tooltipRef = useRef<HTMLDivElement>(null);

  if (!hoveredPoint) return null;

  const TOOLTIP_MIN_WIDTH = 180;
  const TOOLTIP_MIN_HEIGHT = 120;
  const EDGE_PADDING = 12;
  const VERTICAL_OFFSET = 20;

  const containerWidth = hoveredPoint.containerWidth ?? chartWidth;
  const containerHeight = hoveredPoint.containerHeight ?? chartHeight;

  const pointerX =
    hoveredPoint.screenX ??
    (chartWidth > 0 ? (hoveredPoint.x / chartWidth) * containerWidth : 0);
  const pointerY =
    hoveredPoint.screenY ??
    (chartHeight > 0 ? (hoveredPoint.y / chartHeight) * containerHeight : 0);

  const measuredWidth = tooltipRef.current?.offsetWidth ?? 0;
  const measuredHeight = tooltipRef.current?.offsetHeight ?? 0;
  const tooltipWidth = measuredWidth || TOOLTIP_MIN_WIDTH;
  const tooltipHeight = measuredHeight || TOOLTIP_MIN_HEIGHT;

  let left = pointerX;
  let translateX = "-50%";
  const halfWidth = tooltipWidth / 2;

  if (left - halfWidth < EDGE_PADDING) {
    left = Math.max(left, EDGE_PADDING);
    translateX = "0";
  } else if (left + halfWidth > containerWidth - EDGE_PADDING) {
    left = Math.min(left, containerWidth - EDGE_PADDING);
    translateX = "-100%";
  }

  let top = pointerY - VERTICAL_OFFSET;
  let translateY = "-100%";

  if (top - tooltipHeight < EDGE_PADDING) {
    top = Math.min(pointerY + VERTICAL_OFFSET, containerHeight - EDGE_PADDING);
    translateY = "0";
  }

  if (CHARTS_WITH_TOP_LEGEND.has(hoveredPoint.chartType)) {
    const legendGuardTop = 60;
    if (translateY === "-100%" && top < legendGuardTop + tooltipHeight) {
      translateY = "0";
      top = Math.max(pointerY + VERTICAL_OFFSET, legendGuardTop);
    }
  }

  return (
    <motion.div
      className="absolute z-10 pointer-events-none"
      role="tooltip"
      data-chart-type={hoveredPoint.chartType}
      data-testid="chart-tooltip"
      style={{
        left,
        top,
        transform: `translate(${translateX}, ${translateY})`,
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <div
        ref={tooltipRef}
        className="px-3 py-2 bg-gray-900/95 backdrop-blur-sm border border-gray-700 rounded-lg shadow-xl min-w-[160px]"
      >
        {hoveredPoint.chartType === "performance" && (
          <PerformanceTooltipContent
            data={hoveredPoint as PerformanceHoverData}
          />
        )}
        {hoveredPoint.chartType === "allocation" && (
          <AllocationTooltipContent
            data={hoveredPoint as AllocationHoverData}
          />
        )}
        {hoveredPoint.chartType === "drawdown-recovery" && (
          <DrawdownTooltipContent data={hoveredPoint as DrawdownHoverData} />
        )}
        {hoveredPoint.chartType === "sharpe" && (
          <SharpeTooltipContent data={hoveredPoint as SharpeHoverData} />
        )}
        {hoveredPoint.chartType === "volatility" && (
          <VolatilityTooltipContent
            data={hoveredPoint as VolatilityHoverData}
          />
        )}
      </div>
    </motion.div>
  );
}
