"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TrendingUp, DollarSign, Clock, Info } from "lucide-react";
import type { MetricType, ConsolidatedMetricsData } from "./types";
import { formatCurrency, formatPercentage } from "@/lib/formatters";
import { getChangeColorClasses } from "@/lib/color-utils";

interface TabbedMetricsCardProps {
  data: ConsolidatedMetricsData;
  className?: string;
}

/**
 * Variation 1: Tabbed Interface
 *
 * Single card with tab navigation between ROI/PnL/Yield views.
 * Only one metric visible at a time with smooth transitions.
 */
export function TabbedMetricsCard({ data, className = "" }: TabbedMetricsCardProps) {
  const [activeTab, setActiveTab] = useState<MetricType>("roi");

  const tabs = [
    {
      id: "roi" as MetricType,
      label: "ROI",
      icon: TrendingUp,
      badge: data.roi.windows ? Object.keys(data.roi.windows).length : 0,
    },
    {
      id: "pnl" as MetricType,
      label: "PnL",
      icon: DollarSign,
      badge: null,
    },
    {
      id: "yield" as MetricType,
      label: "Yield",
      icon: Clock,
      badge: data.yield.daysWithData,
    },
  ];

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 100 : -100,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 100 : -100,
      opacity: 0,
    }),
  };

  const [direction, setDirection] = useState(0);

  const handleTabChange = (newTab: MetricType) => {
    const currentIndex = tabs.findIndex(t => t.id === activeTab);
    const newIndex = tabs.findIndex(t => t.id === newTab);
    setDirection(newIndex > currentIndex ? 1 : -1);
    setActiveTab(newTab);
  };

  return (
    <div className={`border border-gray-800 rounded-lg p-6 bg-gray-900/50 backdrop-blur-sm ${className}`}>
      {/* Tab Navigation */}
      <div className="flex gap-2 mb-6 border-b border-gray-800 pb-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-t-lg transition-all duration-200
                ${isActive
                  ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white"
                  : "text-gray-400 hover:text-white hover:bg-gray-800/80"
                }
              `}
            >
              <Icon className="w-4 h-4" />
              <span className="font-medium">{tab.label}</span>
              {tab.badge !== null && (
                <span className={`
                  text-xs px-1.5 py-0.5 rounded-full
                  ${isActive ? "bg-white/20" : "bg-gray-700"}
                `}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Content Area */}
      <div className="relative min-h-[140px]">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={activeTab}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="absolute inset-0"
          >
            {activeTab === "roi" && <ROIContent data={data.roi} />}
            {activeTab === "pnl" && <PnLContent data={data.pnl} />}
            {activeTab === "yield" && <YieldContent data={data.yield} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

/**
 * ROI metric content
 */
function ROIContent({ data }: { data: ConsolidatedMetricsData["roi"] }) {
  const colorClasses = getChangeColorClasses(data.value);

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-1">
        <span className="text-sm text-gray-400">Estimated Yearly ROI</span>
        {data.isEstimated && (
          <span className="text-xs font-medium px-1.5 py-0.5 rounded-full bg-purple-900/20 text-purple-400">
            est.
          </span>
        )}
      </div>

      <div className={`flex items-center gap-3 ${colorClasses}`}>
        <TrendingUp className="w-5 h-5" />
        <span className="text-3xl font-semibold">
          {formatPercentage(data.value, false, 2)}
        </span>
      </div>

      <div className="text-sm text-gray-400">
        📊 Based on {data.period} performance data
      </div>

      {/* Period Breakdown */}
      <div className="space-y-2 mt-4 pt-4 border-t border-gray-800">
        <div className="text-xs text-gray-500 uppercase tracking-wide">Period Breakdown</div>
        {Object.entries(data.windows).map(([period, { value, dataPoints }]) => (
          <div key={period} className="flex justify-between items-center">
            <span className="text-sm text-gray-400">{period}</span>
            <div className="flex items-center gap-2">
              <span className="text-sm text-white font-medium">
                {formatPercentage(value, false, 2)}
              </span>
              <span className="text-xs text-gray-500">({dataPoints} pts)</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * PnL metric content
 */
function PnLContent({ data }: { data: ConsolidatedMetricsData["pnl"] }) {
  const colorClasses = getChangeColorClasses(data.changePercentage);

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-1">
        <span className="text-sm text-gray-400">Estimated Yearly PnL</span>
        {data.isEstimated && (
          <span className="text-xs font-medium px-1.5 py-0.5 rounded-full bg-purple-900/20 text-purple-400">
            est.
          </span>
        )}
      </div>

      <div className={`flex items-center gap-3 ${colorClasses}`}>
        <DollarSign className="w-5 h-5" />
        <span className="text-3xl font-semibold">
          {formatCurrency(data.value, {
            smartPrecision: true,
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <div className={`flex items-center gap-1 text-sm ${colorClasses}`}>
          <span>{data.trend === "up" ? "↗" : data.trend === "down" ? "↘" : "→"}</span>
          <span>{formatPercentage(Math.abs(data.changePercentage), true, 1)} change</span>
        </div>
      </div>

      {/* Trend Visualization */}
      <div className="mt-6 pt-4 border-t border-gray-800">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-400">Trend</span>
          <span className={`font-medium ${colorClasses} capitalize`}>
            {data.trend}
          </span>
        </div>
        <div className="mt-2 h-2 bg-gray-800 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              data.trend === "up"
                ? "bg-gradient-to-r from-green-500 to-emerald-400"
                : data.trend === "down"
                ? "bg-gradient-to-r from-red-500 to-orange-400"
                : "bg-gradient-to-r from-gray-500 to-gray-400"
            }`}
            style={{ width: `${Math.min(Math.abs(data.changePercentage) * 5, 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
}

/**
 * Yield metric content
 */
function YieldContent({ data }: { data: ConsolidatedMetricsData["yield"] }) {
  const getBadgeStyles = () => {
    switch (data.badge) {
      case "preliminary":
        return "bg-yellow-900/20 text-yellow-400";
      case "improving":
        return "bg-blue-900/20 text-blue-400";
      case "established":
        return "bg-green-900/20 text-green-400";
      default:
        return "";
    }
  };

  const getConfidenceMessage = () => {
    if (data.badge === "preliminary") {
      return `Early estimate (${data.daysWithData}/7 days)`;
    }
    if (data.badge === "improving") {
      return `Based on ${data.daysWithData} days`;
    }
    return "Established average";
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <span className="text-sm text-gray-400">Avg Daily Yield</span>
        {data.outliersRemoved > 0 && (
          <div className="group relative">
            <Info className="w-3 h-3 text-gray-500" />
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-10">
              <div className="bg-gray-800 text-xs text-white px-2 py-1 rounded whitespace-nowrap">
                {data.outliersRemoved} outlier(s) removed
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        <Clock className="w-5 h-5 text-emerald-400" />
        <span className="text-3xl font-semibold text-emerald-300">
          {formatCurrency(data.avgDailyYield, {
            smartPrecision: true,
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </span>
        {data.badge && (
          <span className={`text-xs font-medium px-2 py-1 rounded-full ${getBadgeStyles()}`}>
            {data.badge}
          </span>
        )}
      </div>

      <div className="text-sm text-gray-400">{getConfidenceMessage()}</div>

      {/* Protocol Breakdown */}
      {data.protocolBreakdown.length > 0 && (
        <div className="space-y-3 mt-6 pt-4 border-t border-gray-800">
          <div className="text-xs text-gray-500 uppercase tracking-wide">Protocol Breakdown</div>
          {data.protocolBreakdown.map((protocol) => (
            <div key={protocol.protocol} className="space-y-1">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: protocol.color }}
                  />
                  <span className="text-sm text-gray-300">{protocol.protocol}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-white font-medium">
                    {formatCurrency(protocol.contribution, { smartPrecision: true })}
                  </span>
                  <span className="text-xs text-gray-500">
                    ({protocol.percentage.toFixed(1)}%)
                  </span>
                </div>
              </div>
              <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${protocol.percentage}%`,
                    backgroundColor: protocol.color,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
