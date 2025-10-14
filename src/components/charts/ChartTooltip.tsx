/**
 * ChartTooltip Component
 *
 * Reusable tooltip component for all chart types with smart positioning
 * and chart-specific content rendering.
 */

import { motion } from "framer-motion";
import type {
  AllocationHoverData,
  ChartHoverState,
  DrawdownHoverData,
  PerformanceHoverData,
  SharpeHoverData,
  UnderwaterHoverData,
  VolatilityHoverData,
} from "../../types/chartHover";
import {
  getDrawdownSeverity,
  getDrawdownSeverityColor,
  getSharpeInterpretation,
  getSharpeColor,
  getVolatilityRiskLevel,
  getVolatilityRiskColor,
  calculateDailyVolatility,
  getRecoveryStatusColor,
} from "@/lib/chartHoverUtils";

const CHARTS_WITH_TOP_LEGEND = new Set([
  "performance",
  "allocation",
  "sharpe",
  "volatility",
  "underwater",
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
  const formattedValue = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(data.value);

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
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs text-blue-300">Benchmark</span>
          <span className="text-sm font-semibold text-gray-300">
            Coming soon
          </span>
        </div>
      </div>
    </>
  );
}

/**
 * Render Allocation chart tooltip content
 */
function AllocationTooltipContent({ data }: { data: AllocationHoverData }) {
  const allocations = [
    { label: "BTC", value: data.btc, color: "text-amber-400" },
    { label: "ETH", value: data.eth, color: "text-indigo-400" },
    { label: "Stablecoin", value: data.stablecoin, color: "text-emerald-400" },
    { label: "DeFi", value: data.defi, color: "text-purple-400" },
    { label: "Altcoin", value: data.altcoin, color: "text-red-400" },
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
                {value.toFixed(1)}%
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
            {data.drawdown.toFixed(2)}%
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
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs text-gray-400">Peak Date</span>
          <span className="text-xs text-gray-300">{data.peakDate}</span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs text-gray-400">Days from Peak</span>
          <span className="text-sm font-semibold text-blue-400">
            {data.distanceFromPeak}
          </span>
        </div>
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
            {data.volatility.toFixed(1)}%
          </span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs text-gray-400">Daily Vol</span>
          <span className="text-sm font-semibold text-gray-300">
            {dailyVol.toFixed(2)}%
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
 * Render Underwater chart tooltip content with recovery flag
 */
function UnderwaterTooltipContent({ data }: { data: UnderwaterHoverData }) {
  const statusColors = getRecoveryStatusColor(data.recoveryStatus);

  // Calculate approximate days underwater (assuming daily data)
  const daysUnderwater = Math.abs(data.underwater) > 0.5 ? "Ongoing" : "0";

  return (
    <>
      <div className="text-xs text-gray-300 mb-2">{data.date}</div>
      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs text-red-300">Underwater</span>
          <span className="text-sm font-semibold text-white">
            {data.underwater.toFixed(2)}%
          </span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs text-gray-400">Days Underwater</span>
          <span className="text-sm font-semibold text-blue-400">
            {daysUnderwater}
          </span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs text-gray-400">Status</span>
          <span className={`text-sm font-semibold ${statusColors.color}`}>
            {data.recoveryStatus}
          </span>
        </div>
        {data.isRecoveryPoint && (
          <div className="flex items-center gap-2 mt-1 pt-1.5 border-t border-gray-700">
            <svg
              width="12"
              height="12"
              viewBox="0 0 12 12"
              className="text-green-400"
            >
              <path
                d="M2 10 L2 2 L10 6 Z"
                fill="currentColor"
                stroke="white"
                strokeWidth="0.5"
              />
            </svg>
            <span className="text-xs text-green-400 font-semibold">
              Recovery Point
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
  if (!hoveredPoint) return null;

  // Smart positioning to avoid overflow
  const leftPercentage = (hoveredPoint.x / chartWidth) * 100;
  const topPercentage = (hoveredPoint.y / chartHeight) * 100;

  const TOOLTIP_MIN_WIDTH = 180;
  const TOOLTIP_MIN_HEIGHT = 120;

  const halfWidthPercent =
    chartWidth > 0
      ? Math.min(45, (TOOLTIP_MIN_WIDTH / 2 / chartWidth) * 100)
      : 10;
  const leftClampMin = Math.max(halfWidthPercent, 8);
  const leftClampMax = Math.min(100 - halfWidthPercent, 92);

  let adjustedLeft = Math.min(
    Math.max(leftPercentage, leftClampMin),
    leftClampMax
  );

  const topOffsetPercent =
    chartHeight > 0
      ? Math.min(40, (TOOLTIP_MIN_HEIGHT / chartHeight) * 100)
      : 12;
  let adjustedTop = Math.min(Math.max(topPercentage, topOffsetPercent), 92);

  if (CHARTS_WITH_TOP_LEGEND.has(hoveredPoint.chartType)) {
    const isNearbyLegend = adjustedLeft > 60 && topPercentage < 32;
    if (isNearbyLegend) {
      adjustedLeft = Math.min(adjustedLeft, 60);
      adjustedTop = Math.max(adjustedTop, 34);
    }
  }

  return (
    <motion.div
      className="absolute z-10 pointer-events-none"
      role="tooltip"
      data-chart-type={hoveredPoint.chartType}
      data-testid="chart-tooltip"
      style={{
        left: `${adjustedLeft}%`,
        top: `${adjustedTop}%`,
        transform: "translateX(-50%) translateY(-100%)",
      }}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      transition={{ duration: 0.2 }}
    >
      <div className="px-3 py-2 bg-gray-900/95 backdrop-blur-sm border border-gray-700 rounded-lg shadow-xl min-w-[160px]">
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
        {hoveredPoint.chartType === "drawdown" && (
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
        {hoveredPoint.chartType === "underwater" && (
          <UnderwaterTooltipContent
            data={hoveredPoint as UnderwaterHoverData}
          />
        )}
      </div>
    </motion.div>
  );
}
