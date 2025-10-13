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

interface ChartTooltipProps {
  /** Current hover state or null */
  hoveredPoint: ChartHoverState | null;
  /** Chart width for positioning calculations */
  chartWidth?: number;
  /** Chart height for positioning calculations */
  chartHeight?: number;
}

/**
 * Get severity badge color based on drawdown percentage
 */
function getDrawdownSeverity(drawdown: number): {
  label: string;
  color: string;
  bgColor: string;
} {
  const absDrawdown = Math.abs(drawdown);
  if (absDrawdown < 5)
    return {
      label: "Minor",
      color: "text-green-400",
      bgColor: "bg-green-500/20",
    };
  if (absDrawdown < 10)
    return {
      label: "Moderate",
      color: "text-yellow-400",
      bgColor: "bg-yellow-500/20",
    };
  if (absDrawdown < 20)
    return {
      label: "Significant",
      color: "text-orange-400",
      bgColor: "bg-orange-500/20",
    };
  return { label: "Severe", color: "text-red-400", bgColor: "bg-red-500/20" };
}

/**
 * Get Sharpe ratio interpretation and color (5-level system)
 */
function getSharpeInterpretation(sharpe: number): {
  label: string;
  color: string;
  indicatorColor: string;
} {
  if (sharpe > 2.0)
    return {
      label: "Excellent",
      color: "text-green-400",
      indicatorColor: "#10b981",
    };
  if (sharpe > 1.0)
    return { label: "Good", color: "text-lime-400", indicatorColor: "#84cc16" };
  if (sharpe > 0.5)
    return {
      label: "Fair",
      color: "text-yellow-400",
      indicatorColor: "#eab308",
    };
  if (sharpe > 0)
    return {
      label: "Poor",
      color: "text-orange-400",
      indicatorColor: "#f97316",
    };
  return {
    label: "Very Poor",
    color: "text-red-400",
    indicatorColor: "#ef4444",
  };
}

/**
 * Get risk level assessment based on volatility
 */
function getRiskLevel(volatility: number): {
  label: string;
  color: string;
  bgColor: string;
  isHighRisk: boolean;
} {
  if (volatility < 15)
    return {
      label: "Low",
      color: "text-green-400",
      bgColor: "bg-green-500/20",
      isHighRisk: false,
    };
  if (volatility < 25)
    return {
      label: "Moderate",
      color: "text-yellow-400",
      bgColor: "bg-yellow-500/20",
      isHighRisk: false,
    };
  if (volatility < 35)
    return {
      label: "High",
      color: "text-orange-400",
      bgColor: "bg-orange-500/20",
      isHighRisk: false,
    };
  return {
    label: "Very High",
    color: "text-red-400",
    bgColor: "bg-red-500/20",
    isHighRisk: true,
  };
}

/**
 * Render Performance chart tooltip content
 */
function PerformanceTooltipContent({ data }: { data: PerformanceHoverData }) {
  return (
    <>
      <div className="text-xs text-gray-300 mb-1">{data.date}</div>
      <div className="space-y-1">
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs text-purple-300">Portfolio</span>
          <span className="text-sm font-semibold text-white">
            ${(data.value / 1000).toFixed(1)}k
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
  const severity = getDrawdownSeverity(data.drawdown);

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
            className={`text-xs font-semibold px-2 py-0.5 rounded ${severity.bgColor} ${severity.color}`}
          >
            {severity.label}
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

  return (
    <>
      <div className="text-xs text-gray-300 mb-2">{data.date}</div>
      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: interpretation.indicatorColor }}
            />
            <span className="text-xs text-gray-300">Sharpe Ratio</span>
          </div>
          <span className="text-sm font-semibold text-white">
            {data.sharpe.toFixed(2)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs text-gray-400">Rating</span>
          <span className={`text-sm font-semibold ${interpretation.color}`}>
            {interpretation.label}
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
  const riskLevel = getRiskLevel(data.volatility);
  const dailyVol = data.volatility / Math.sqrt(252); // Approximate daily from annualized

  return (
    <>
      <div className="text-xs text-gray-300 mb-2">{data.date}</div>
      <div className="space-y-1.5">
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
            className={`text-xs font-semibold px-2 py-0.5 rounded ${riskLevel.bgColor} ${riskLevel.color}`}
          >
            {riskLevel.label}
          </span>
        </div>
        {riskLevel.isHighRisk && (
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
  const statusColor =
    data.recoveryStatus === "Recovered"
      ? "text-green-400"
      : data.recoveryStatus === "Near Peak"
        ? "text-yellow-400"
        : "text-red-400";

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
          <span className={`text-sm font-semibold ${statusColor}`}>
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

  // Adjust left position to keep tooltip in bounds
  const adjustedLeft = Math.min(leftPercentage, 75);

  // Adjust top position to keep tooltip visible
  const adjustedTop = Math.max(topPercentage, 10);

  return (
    <motion.div
      className="absolute z-10 pointer-events-none"
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
