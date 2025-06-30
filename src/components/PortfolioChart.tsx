"use client";

import { motion } from "framer-motion";
import { useState, useMemo, memo } from "react";
import { GlassCard, ErrorBoundary } from "./ui";
import { ChartContainer, ChartControls, ChartMetrics } from "./PortfolioChart";
import {
  generatePortfolioHistory,
  calculateDrawdownData,
} from "../lib/portfolioUtils";
import { PortfolioDataPoint, AssetAllocationPoint } from "../types/portfolio";

const PortfolioChartComponent = () => {
  const [selectedPeriod, setSelectedPeriod] = useState("3M");
  const [selectedChart, setSelectedChart] = useState<
    "performance" | "allocation" | "drawdown"
  >("performance");

  // Mock historical data - in real app this would come from API
  const portfolioHistory: PortfolioDataPoint[] = useMemo(() => {
    return generatePortfolioHistory(selectedPeriod);
  }, [selectedPeriod]);

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

  const drawdownData = useMemo(() => {
    return calculateDrawdownData(portfolioHistory);
  }, [portfolioHistory]);

  const renderPerformanceChart = useMemo(
    () => (
      <div className="relative h-80">
        {/* Grid lines */}
        <div className="absolute inset-0 flex flex-col justify-between">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="border-t border-gray-800/50" />
          ))}
        </div>

        {/* Chart area */}
        <svg
          viewBox="0 0 800 300"
          className="w-full h-full"
          preserveAspectRatio="xMidYMid meet"
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
          {portfolioHistory.length > 0 && (
            <path
              d={generateSVGPath(
                portfolioHistory,
                point => point.value,
                800,
                300,
                10
              )}
              fill="none"
              stroke="#8b5cf6"
              strokeWidth="3"
              className="drop-shadow-lg"
            />
          )}

          {/* Benchmark line */}
          {portfolioHistory.length > 0 && (
            <path
              d={generateSVGPath(
                portfolioHistory,
                point => point.benchmark || 0,
                800,
                300,
                10
              )}
              fill="none"
              stroke="#3b82f6"
              strokeWidth="2"
              strokeDasharray="5,5"
              opacity="0.7"
            />
          )}

          {/* Fill area under portfolio curve */}
          {portfolioHistory.length > 0 && (
            <path
              d={generateAreaPath(
                portfolioHistory,
                point => point.value,
                800,
                300,
                10
              )}
              fill="url(#portfolioGradient)"
            />
          )}
        </svg>

        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-gray-400 pr-2">
          {generateYAxisLabels(minValue, maxValue, 3).map((value, index) => (
            <span key={index}>{formatAxisLabel(value)}</span>
          ))}
        </div>

        {/* Legend */}
        <div className="absolute top-4 right-4 flex items-center space-x-4 text-xs">
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
      </div>
    ),
    [portfolioHistory, minValue, maxValue]
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

const MemoizedPortfolioChart = memo(PortfolioChartComponent);

export const PortfolioChart = () => (
  <ErrorBoundary>
    <MemoizedPortfolioChart />
  </ErrorBoundary>
);
