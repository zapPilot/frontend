"use client";

import { motion } from "framer-motion";
import { Activity, Calendar, PieChart, TrendingUp } from "lucide-react";
import {
  memo,
  useMemo,
  useRef,
  useState,
  useCallback,
  type MouseEvent,
} from "react";
import { useUser } from "../contexts/UserContext";
import { usePortfolioTrends } from "../hooks/usePortfolioTrends";
import {
  formatAxisLabel,
  generateAreaPath,
  generateSVGPath,
  generateYAxisLabels,
} from "../lib/chartUtils";
import {
  calculateDrawdownData,
  CHART_PERIODS,
} from "../lib/portfolio-analytics";
import { AssetAllocationPoint, PortfolioDataPoint } from "../types/portfolio";
import { GlassCard } from "./ui";

const PortfolioChartComponent = () => {
  const [selectedPeriod, setSelectedPeriod] = useState("3M");
  const [selectedChart, setSelectedChart] = useState<
    "performance" | "allocation" | "drawdown"
  >("performance");
  const [hoveredPoint, setHoveredPoint] = useState<{
    x: number;
    y: number;
    value: number;
    benchmark: number;
    date: string;
  } | null>(null);
  const rafId = useRef<number | null>(null);
  const lastIndexRef = useRef<number | null>(null);

  // Get user info from context
  const { userInfo, isConnected } = useUser();

  // Fetch real portfolio trends data
  const { data: apiPortfolioHistory } = usePortfolioTrends({
    userId: userInfo?.userId,
    days: CHART_PERIODS.find(p => p.value === selectedPeriod)?.days || 90,
    enabled: isConnected && !!userInfo?.userId,
  });
  // Portfolio history with fallback logic
  const portfolioHistory: PortfolioDataPoint[] = useMemo(() => {
    return apiPortfolioHistory;
  }, [apiPortfolioHistory]);

  const allocationHistory: AssetAllocationPoint[] = useMemo(() => {
    const days = Math.min(
      CHART_PERIODS.find(p => p.value === selectedPeriod)?.days || 90,
      90
    );
    const data: AssetAllocationPoint[] = [];

    for (let i = days; i >= 0; i -= 7) {
      // Weekly snapshots
      const date = new Date();
      date.setDate(date.getDate() - i);

      // Simulate gradual shifts in allocation
      const progress = (days - i) / days;
      data.push({
        date: date.toISOString().split("T")[0]!,
        btc: 35 + Math.sin(progress * Math.PI) * 5,
        eth: 25 + Math.cos(progress * Math.PI) * 3,
        stablecoin: 20 + progress * 5,
        defi: 15 - progress * 3,
        altcoin: 5 - Math.sin(progress * Math.PI * 2) * 2,
      });
    }

    return data;
  }, [selectedPeriod]);

  const currentValue =
    portfolioHistory[portfolioHistory.length - 1]?.value || 0;
  const firstValue = portfolioHistory[0]?.value || 0;
  const totalReturn = ((currentValue - firstValue) / firstValue) * 100;
  const isPositive = totalReturn >= 0;

  const maxValue = Math.max(...portfolioHistory.map(d => d.value));
  const minValue = Math.min(...portfolioHistory.map(d => d.value));
  const VALUE_RANGE = Math.max(maxValue - minValue, 1);

  // Chart dimensions (match viewBox)
  const CHART_WIDTH = 800;
  const CHART_HEIGHT = 300;
  const CHART_PADDING = 10;

  // Precompute static paths to avoid recomputing on hover
  const portfolioPath = useMemo(
    () =>
      portfolioHistory.length
        ? generateSVGPath(
            portfolioHistory,
            p => p.value,
            CHART_WIDTH,
            CHART_HEIGHT,
            CHART_PADDING
          )
        : "",
    [portfolioHistory]
  );

  const benchmarkPath = useMemo(
    () =>
      portfolioHistory.length
        ? generateSVGPath(
            portfolioHistory,
            p => p.benchmark || 0,
            CHART_WIDTH,
            CHART_HEIGHT,
            CHART_PADDING
          )
        : "",
    [portfolioHistory]
  );

  const portfolioAreaPath = useMemo(
    () =>
      portfolioHistory.length
        ? generateAreaPath(
            portfolioHistory,
            p => p.value,
            CHART_WIDTH,
            CHART_HEIGHT,
            CHART_PADDING
          )
        : "",
    [portfolioHistory]
  );

  const drawdownData = useMemo(() => {
    return calculateDrawdownData(portfolioHistory);
  }, [portfolioHistory]);

  // Mouse event handlers for performance chart hover
  const handleMouseMove = useCallback(
    (event: MouseEvent<SVGSVGElement>) => {
      if (portfolioHistory.length === 0) return;

      const svg = event.currentTarget;
      const rect = svg.getBoundingClientRect();
      const mouseX = event.clientX - rect.left;
      const svgWidth = rect.width || 1;

      // Calculate the data index based on mouse position
      const rawIndex = (mouseX / svgWidth) * (portfolioHistory.length - 1);
      const clampedIndex = Math.max(
        0,
        Math.min(Math.round(rawIndex), portfolioHistory.length - 1)
      );

      // Drop updates if index didn't change (reduces state churn)
      if (lastIndexRef.current === clampedIndex) return;
      lastIndexRef.current = clampedIndex;

      // Schedule state update at next animation frame
      if (rafId.current != null) cancelAnimationFrame(rafId.current);
      rafId.current = requestAnimationFrame(() => {
        const point = portfolioHistory[clampedIndex];
        if (!point) return;

        const x =
          (clampedIndex / Math.max(portfolioHistory.length - 1, 1)) *
          CHART_WIDTH;
        const y =
          CHART_HEIGHT -
          CHART_PADDING -
          ((point.value - minValue) / VALUE_RANGE) *
            (CHART_HEIGHT - 2 * CHART_PADDING);

        setHoveredPoint({
          x,
          y,
          value: point.value,
          benchmark: point.benchmark || 0,
          date: new Date(point.date).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          }),
        });
      });
    },
    [portfolioHistory, minValue, VALUE_RANGE]
  );

  const handleMouseLeave = useCallback(() => {
    if (rafId.current != null) cancelAnimationFrame(rafId.current);
    rafId.current = null;
    lastIndexRef.current = null;
    setHoveredPoint(null);
  }, []);

  const renderPerformanceChart = useMemo(
    () => (
      <div className="relative h-80">
        {/* Grid lines */}
        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="border-t border-gray-800/50" />
          ))}
        </div>

        {/* Chart area */}
        <svg
          viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
          className="w-full h-full"
          preserveAspectRatio="xMidYMid meet"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          <defs>
            <linearGradient
              id="portfolioGradient"
              x1="0%"
              y1="0%"
              x2="0%"
              y2="100%"
            >
              <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
            </linearGradient>
            <linearGradient
              id="benchmarkGradient"
              x1="0%"
              y1="0%"
              x2="0%"
              y2="100%"
            >
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Portfolio line */}
          {portfolioPath && (
            <path
              d={portfolioPath}
              fill="none"
              stroke="#8b5cf6"
              strokeWidth="3"
              className="drop-shadow-lg"
            />
          )}

          {/* Benchmark line */}
          {benchmarkPath && (
            <path
              d={benchmarkPath}
              fill="none"
              stroke="#3b82f6"
              strokeWidth="2"
              strokeDasharray="5,5"
              opacity="0.7"
            />
          )}

          {/* Fill area under portfolio curve */}
          {portfolioAreaPath && (
            <path d={portfolioAreaPath} fill="url(#portfolioGradient)" />
          )}

          {/* Hover cursor circle */}
          {hoveredPoint && (
            <motion.circle
              cx={hoveredPoint.x}
              cy={hoveredPoint.y}
              r="6"
              fill="#8b5cf6"
              stroke="#ffffff"
              strokeWidth="2"
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0 }}
              transition={{ duration: 0.2 }}
              className="drop-shadow-lg"
            />
          )}
        </svg>

        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-gray-400 pr-2 pointer-events-none">
          {generateYAxisLabels(minValue, maxValue, 3).map((value, index) => (
            <span key={index}>{formatAxisLabel(value)}</span>
          ))}
        </div>

        {/* Legend */}
        <div className="absolute top-4 right-4 flex items-center space-x-4 text-xs pointer-events-none">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-0.5 bg-purple-500"></div>
            <span className="text-white">Portfolio</span>
          </div>
          <div className="flex items-center space-x-2">
            <div
              className="w-3 h-0.5 bg-blue-500 opacity-70"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(to right, #3b82f6, #3b82f6 3px, transparent 3px, transparent 6px)",
              }}
            ></div>
            <span className="text-gray-400">Benchmark</span>
          </div>
        </div>

        {/* Hover Tooltip */}
        {hoveredPoint && (
          <motion.div
            className="absolute z-10 pointer-events-none"
            style={{
              left: `min(${hoveredPoint.x * (100 / CHART_WIDTH)}%, calc(100% - 200px))`,
              top: `max(${hoveredPoint.y * (100 / CHART_HEIGHT)}%, 10px)`,
              transform: "translateX(-50%) translateY(-100%)",
            }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.2 }}
          >
            <div className="px-3 py-2 bg-gray-900/95 backdrop-blur-sm border border-gray-700 rounded-lg shadow-xl">
              <div className="text-xs text-gray-300 mb-1">
                {hoveredPoint.date}
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs text-purple-300">Portfolio</span>
                  <span className="text-sm font-semibold text-white">
                    ${(hoveredPoint.value / 1000).toFixed(1)}k
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs text-blue-300">Benchmark</span>
                  <span className="text-sm font-semibold text-gray-300">
                    Coming soon
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    ),
    [
      minValue,
      maxValue,
      hoveredPoint,
      portfolioPath,
      benchmarkPath,
      portfolioAreaPath,
      handleMouseMove,
      handleMouseLeave,
    ]
  );

  const renderAllocationChart = useMemo(
    () => (
      <div className="h-80">
        <div className="relative h-full">
          <svg viewBox="0 0 800 300" className="w-full h-full">
            {allocationHistory.map((point, index) => {
              const x = (index / (allocationHistory.length - 1)) * 800;
              const total =
                point.btc +
                point.eth +
                point.stablecoin +
                point.defi +
                point.altcoin;
              let yOffset = 300;

              // Stack areas
              const assets = [
                { value: point.btc, color: "#f59e0b" },
                { value: point.eth, color: "#6366f1" },
                { value: point.stablecoin, color: "#10b981" },
                { value: point.defi, color: "#8b5cf6" },
                { value: point.altcoin, color: "#ef4444" },
              ];

              return (
                <g key={index}>
                  {assets.map((asset, assetIndex) => {
                    const height = (asset.value / total) * 280;
                    const y = yOffset - height;
                    yOffset -= height;

                    return (
                      <rect
                        key={assetIndex}
                        x={x - 2}
                        y={y}
                        width="4"
                        height={height}
                        fill={asset.color}
                        opacity="0.8"
                      />
                    );
                  })}
                </g>
              );
            })}
          </svg>

          {/* Legend */}
          <div className="absolute top-4 right-4 space-y-1 text-xs">
            {[
              { label: "BTC", color: "#f59e0b" },
              { label: "ETH", color: "#6366f1" },
              { label: "Stablecoin", color: "#10b981" },
              { label: "DeFi", color: "#8b5cf6" },
              { label: "Altcoin", color: "#ef4444" },
            ].map(asset => (
              <div key={asset.label} className="flex items-center space-x-2">
                <div
                  className="w-3 h-3 rounded"
                  style={{ backgroundColor: asset.color }}
                ></div>
                <span className="text-gray-300">{asset.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
    [allocationHistory]
  );

  const renderDrawdownChart = useMemo(
    () => (
      <div className="relative h-80">
        <svg viewBox="0 0 800 300" className="w-full h-full">
          <defs>
            <linearGradient
              id="drawdownGradient"
              x1="0%"
              y1="0%"
              x2="0%"
              y2="100%"
            >
              <stop offset="0%" stopColor="#ef4444" stopOpacity="0" />
              <stop offset="100%" stopColor="#ef4444" stopOpacity="0.3" />
            </linearGradient>
          </defs>

          {/* Zero line */}
          <line
            x1="0"
            y1="50"
            x2="800"
            y2="50"
            stroke="#374151"
            strokeWidth="1"
            strokeDasharray="2,2"
          />

          {/* Drawdown area */}
          <path
            d={`M 0 50 ${drawdownData
              .map((point, index) => {
                const x = (index / (drawdownData.length - 1)) * 800;
                const y = 50 - (point.drawdown / -20) * 250; // Scale to -20% max
                return `L ${x} ${y}`;
              })
              .join(" ")} L 800 50 Z`}
            fill="url(#drawdownGradient)"
          />

          {/* Drawdown line */}
          <path
            d={`M ${drawdownData
              .map((point, index) => {
                const x = (index / (drawdownData.length - 1)) * 800;
                const y = 50 - (point.drawdown / -20) * 250;
                return index === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
              })
              .join(" ")}`}
            fill="none"
            stroke="#ef4444"
            strokeWidth="2"
          />
        </svg>

        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-gray-400 pr-2">
          <span>0%</span>
          <span>-5%</span>
          <span>-10%</span>
          <span>-15%</span>
          <span>-20%</span>
        </div>
      </div>
    ),
    [drawdownData]
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
    >
      <GlassCard className="p-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
          <div className="mb-4 lg:mb-0">
            <h3 className="text-xl font-bold text-white mb-2 flex items-center">
              <Calendar className="w-5 h-5 mr-2 text-purple-400" />
              Historical Performance
            </h3>
            <div className="flex items-center space-x-4 text-sm">
              <div
                className={`font-medium ${isPositive ? "text-green-400" : "text-red-400"}`}
              >
                {isPositive ? "+" : ""}
                {totalReturn.toFixed(2)}%
                <span className="text-gray-400 ml-1">({selectedPeriod})</span>
              </div>
              <div className="text-gray-400">
                ${(currentValue / 1000).toFixed(1)}k Current Value
              </div>
            </div>
          </div>

          {/* Chart Type Selector */}
          <div className="flex space-x-2 mb-4 lg:mb-0">
            {[
              { key: "performance", label: "Performance", icon: TrendingUp },
              { key: "allocation", label: "Allocation", icon: PieChart },
              { key: "drawdown", label: "Drawdown", icon: Activity },
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() =>
                  setSelectedChart(
                    key as "performance" | "allocation" | "drawdown"
                  )
                }
                className={`px-3 py-2 rounded-lg transition-all duration-200 flex items-center space-x-2 cursor-pointer ${
                  selectedChart === key
                    ? "bg-purple-600/30 text-purple-300 border border-purple-500/30"
                    : "glass-morphism text-gray-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="text-sm">{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Period Selector */}
        <div className="flex space-x-2 mb-6">
          {CHART_PERIODS.map(period => (
            <button
              key={period.value}
              onClick={() => setSelectedPeriod(period.value)}
              className={`px-3 py-1 rounded-lg text-sm transition-all duration-200 cursor-pointer ${
                selectedPeriod === period.value
                  ? "bg-purple-600/30 text-purple-300 border border-purple-500/30"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
            >
              {period.label}
            </button>
          ))}
        </div>

        {/* Chart Content */}
        <div className="relative">
          {selectedChart === "performance" && renderPerformanceChart}
          {selectedChart === "allocation" && renderAllocationChart}
          {selectedChart === "drawdown" && renderDrawdownChart}
        </div>

        {/* Chart Summary */}
        <div className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-sm text-gray-400">Best Day</div>
            <div className="text-lg font-bold text-green-400">+5.2%</div>
          </div>
          <div className="text-center">
            <div className="text-sm text-gray-400">Worst Day</div>
            <div className="text-lg font-bold text-red-400">-3.8%</div>
          </div>
          <div className="text-center">
            <div className="text-sm text-gray-400">Avg Daily</div>
            <div className="text-lg font-bold text-gray-300">+0.12%</div>
          </div>
          <div className="text-center">
            <div className="text-sm text-gray-400">Win Rate</div>
            <div className="text-lg font-bold text-blue-400">64.2%</div>
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );
};

export const PortfolioChart = memo(PortfolioChartComponent);
