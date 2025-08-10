"use client";

// motion import removed as it's not used in this static chart component
import {
  Activity,
  AlertTriangle,
  Calendar,
  PieChart,
  TrendingUp,
} from "lucide-react";
import { memo, useMemo, useState } from "react";
import { useUser } from "../contexts/UserContext";
import { usePortfolioTrends } from "../hooks/usePortfolioTrends";
import {
  formatAxisLabel,
  generateAreaPath,
  generateSVGPath,
  generateYAxisLabels,
} from "../lib/chartUtils";
import { calculateDrawdownData, CHART_PERIODS } from "../lib/portfolioUtils";
// PortfolioDataPoint is used in the hook return type
import { GlassCard } from "./ui";

const EnhancedPortfolioChartComponent = () => {
  const [selectedPeriod, setSelectedPeriod] = useState("3M");
  const [selectedChart, setSelectedChart] = useState<
    "performance" | "allocation" | "drawdown"
  >("performance");

  // Get user info from context
  const { userInfo, isConnected, connectedWallet } = useUser();

  // Fetch portfolio trends data using the user's wallet
  const {
    data: portfolioHistory,
    loading,
    error,
    refetch,
  } = usePortfolioTrends({
    walletAddress: connectedWallet,
    days:
      parseInt(selectedPeriod.replace(/[^0-9]/g, "")) *
        (selectedPeriod.includes("Y")
          ? 365
          : selectedPeriod.includes("M")
            ? 30
            : 1) || 30,
    enabled: isConnected && !!connectedWallet,
  });

  const drawdownData = useMemo(() => {
    if (!portfolioHistory || portfolioHistory.length === 0) return [];
    return calculateDrawdownData(portfolioHistory);
  }, [portfolioHistory]);

  // Generate allocation data from portfolio history
  const allocationData = useMemo(() => {
    if (!portfolioHistory || portfolioHistory.length === 0) return [];

    const latest = portfolioHistory[portfolioHistory.length - 1];
    if (!latest?.protocols || !Array.isArray(latest.protocols)) return [];

    return latest.protocols.map(protocol => ({
      date: latest.date,
      assets: [
        {
          name: protocol,
          percentage: 100 / latest.protocols.length, // Equal distribution for demo
          value: latest.totalValue / latest.protocols.length,
        },
      ],
    }));
  }, [portfolioHistory]);

  const currentChart = useMemo(() => {
    switch (selectedChart) {
      case "drawdown":
        return drawdownData;
      case "allocation":
        return allocationData;
      default:
        return portfolioHistory || [];
    }
  }, [selectedChart, portfolioHistory, drawdownData, allocationData]);

  const yAxisLabels = useMemo(() => {
    if (!currentChart || currentChart.length === 0) return [];
    return generateYAxisLabels(currentChart, selectedChart);
  }, [currentChart, selectedChart]);

  const svgPath = useMemo(() => {
    if (!currentChart || currentChart.length === 0) return "";
    return generateSVGPath(currentChart, selectedChart);
  }, [currentChart, selectedChart]);

  const areaPath = useMemo(() => {
    if (!currentChart || currentChart.length === 0) return "";
    return generateAreaPath(currentChart, selectedChart);
  }, [currentChart, selectedChart]);

  const getChartIcon = (chart: string) => {
    switch (chart) {
      case "performance":
        return <TrendingUp className="w-4 h-4" />;
      case "allocation":
        return <PieChart className="w-4 h-4" />;
      case "drawdown":
        return <Activity className="w-4 h-4" />;
      default:
        return <TrendingUp className="w-4 h-4" />;
    }
  };

  const formatValue = (value: number) => {
    if (selectedChart === "allocation") {
      return `${value.toFixed(1)}%`;
    }
    return `$${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
  };

  // Show connection prompt if not connected
  if (!isConnected) {
    return (
      <GlassCard className="p-8">
        <div className="text-center">
          <Activity className="w-12 h-12 text-purple-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">
            Portfolio Analytics
          </h3>
          <p className="text-gray-400 mb-4">
            Connect your wallet to view real portfolio performance data
          </p>
          <div className="text-sm text-gray-500">
            Data will be fetched from the quant-engine API
          </div>
        </div>
      </GlassCard>
    );
  }

  return (
    <GlassCard className="p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div className="mb-4 sm:mb-0">
          <h3 className="text-xl font-bold text-white mb-1">
            Portfolio Performance
          </h3>
          <p className="text-gray-400 text-sm">
            {userInfo?.email
              ? `Real data for ${userInfo.email}`
              : "Live data from quant-engine"}
          </p>
        </div>

        {/* Period Selector */}
        <div className="flex items-center space-x-1 p-1 glass-morphism rounded-lg">
          {CHART_PERIODS.map(period => (
            <button
              key={period}
              onClick={() => setSelectedPeriod(period)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                selectedPeriod === period
                  ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white"
                  : "text-gray-400 hover:text-white hover:bg-white/10"
              }`}
            >
              {period}
            </button>
          ))}
        </div>
      </div>

      {/* Chart Type Selector */}
      <div className="flex items-center justify-center space-x-1 mb-6 p-1 glass-morphism rounded-lg w-fit mx-auto">
        {[
          { key: "performance", label: "Performance" },
          { key: "allocation", label: "Allocation" },
          { key: "drawdown", label: "Drawdown" },
        ].map(chart => (
          <button
            key={chart.key}
            onClick={() =>
              setSelectedChart(
                chart.key as "performance" | "allocation" | "drawdown"
              )
            }
            className={`flex items-center space-x-2 px-4 py-2 text-sm font-medium rounded-md transition-all ${
              selectedChart === chart.key
                ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white"
                : "text-gray-400 hover:text-white hover:bg-white/10"
            }`}
          >
            {getChartIcon(chart.key)}
            <span>{chart.label}</span>
          </button>
        ))}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-12">
          <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-400">Loading portfolio data...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="text-center py-12">
          <AlertTriangle className="w-8 h-8 text-red-400 mx-auto mb-4" />
          <p className="text-red-400 mb-4">{error}</p>
          <button
            onClick={refetch}
            className="px-4 py-2 bg-red-600/20 text-red-300 rounded-lg hover:bg-red-600/30 transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* Chart */}
      {!loading && !error && currentChart && currentChart.length > 0 && (
        <div className="relative">
          <div className="flex items-end justify-between mb-4">
            {/* Current Value */}
            <div>
              <div className="text-2xl font-bold text-white">
                {formatValue(
                  currentChart[currentChart.length - 1]?.totalValue || 0
                )}
              </div>
              <div className="text-sm text-gray-400 flex items-center space-x-2">
                <Calendar className="w-3 h-3" />
                <span>
                  Updated{" "}
                  {new Date(
                    currentChart[currentChart.length - 1]?.date || new Date()
                  ).toLocaleDateString()}
                </span>
              </div>
            </div>

            {/* Statistics */}
            <div className="text-right">
              {portfolioHistory && portfolioHistory.length > 0 && (
                <>
                  <div className="text-sm text-gray-400">Protocols</div>
                  <div className="text-lg font-semibold text-purple-300">
                    {portfolioHistory[portfolioHistory.length - 1]?.protocols
                      ?.length || 0}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* SVG Chart */}
          <div className="bg-gray-900/50 rounded-xl p-4 overflow-hidden">
            <svg
              viewBox="0 0 600 300"
              className="w-full h-64"
              preserveAspectRatio="xMidYMid meet"
            >
              {/* Y-axis labels */}
              {yAxisLabels.map((label, index) => (
                <text
                  key={index}
                  x="30"
                  y={280 - (index * 280) / (yAxisLabels.length - 1)}
                  className="fill-gray-400 text-xs"
                  textAnchor="end"
                  dominantBaseline="middle"
                >
                  {formatAxisLabel(label, selectedChart)}
                </text>
              ))}

              {/* Grid lines */}
              {yAxisLabels.map((_, index) => (
                <line
                  key={index}
                  x1="40"
                  y1={280 - (index * 280) / (yAxisLabels.length - 1)}
                  x2="580"
                  y2={280 - (index * 280) / (yAxisLabels.length - 1)}
                  stroke="rgba(75, 85, 99, 0.3)"
                  strokeWidth="1"
                />
              ))}

              {/* Area fill */}
              <path d={areaPath} fill="url(#gradient)" opacity="0.3" />

              {/* Line */}
              <path
                d={svgPath}
                fill="none"
                stroke="url(#gradient)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Gradient definitions */}
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#8b5cf6" />
                  <stop offset="100%" stopColor="#3b82f6" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          {/* X-axis labels */}
          <div className="flex justify-between mt-2 px-4">
            {currentChart.length > 0 &&
              [
                0,
                Math.floor(currentChart.length / 2),
                currentChart.length - 1,
              ].map(index => (
                <div key={index} className="text-xs text-gray-400">
                  {new Date(
                    currentChart[index]?.date || new Date()
                  ).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                  })}
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && (!currentChart || currentChart.length === 0) && (
        <div className="text-center py-12">
          <TrendingUp className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <h4 className="text-lg font-semibold text-gray-300 mb-2">
            No Data Available
          </h4>
          <p className="text-gray-500 mb-4">
            No portfolio data found for the selected period
          </p>
          <button
            onClick={refetch}
            className="px-4 py-2 glass-morphism text-gray-300 rounded-lg hover:bg-white/10 transition-colors"
          >
            Refresh Data
          </button>
        </div>
      )}
    </GlassCard>
  );
};

export const EnhancedPortfolioChart = memo(EnhancedPortfolioChartComponent);
