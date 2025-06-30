"use client";

import { TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import { GlassCard } from "../ui";
import { PerformancePeriod } from "../../types/analytics";
import { getPerformanceColor } from "../../lib/analyticsUtils";

interface PerformanceTableProps {
  performanceData: PerformancePeriod[];
}

export function PerformanceTable({ performanceData }: PerformanceTableProps) {
  return (
    <GlassCard className="p-6">
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
        <TrendingUp className="w-5 h-5 mr-2 text-green-400" />
        Performance by Period
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-800">
              <th className="text-left py-3 text-sm font-medium text-gray-400">
                Period
              </th>
              <th className="text-right py-3 text-sm font-medium text-gray-400">
                Return
              </th>
              <th className="text-right py-3 text-sm font-medium text-gray-400">
                Volatility
              </th>
              <th className="text-right py-3 text-sm font-medium text-gray-400">
                Sharpe
              </th>
              <th className="text-right py-3 text-sm font-medium text-gray-400">
                Max DD
              </th>
            </tr>
          </thead>
          <tbody>
            {performanceData.map((period, index) => (
              <motion.tr
                key={period.period}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + index * 0.05 }}
                className="border-b border-gray-800/50 hover:bg-white/5 transition-colors"
              >
                <td className="py-3 text-sm font-medium text-white">
                  {period.period}
                </td>
                <td
                  className={`py-3 text-sm text-right font-medium ${getPerformanceColor(period.return)}`}
                >
                  {period.return > 0 ? "+" : ""}
                  {period.return.toFixed(2)}%
                </td>
                <td className="py-3 text-sm text-right text-gray-300">
                  {period.volatility.toFixed(1)}%
                </td>
                <td
                  className={`py-3 text-sm text-right font-medium ${
                    period.sharpe > 1
                      ? "text-green-400"
                      : period.sharpe > 0.5
                        ? "text-yellow-400"
                        : "text-red-400"
                  }`}
                >
                  {period.sharpe.toFixed(2)}
                </td>
                <td className="py-3 text-sm text-right text-red-400 font-medium">
                  {period.maxDrawdown.toFixed(1)}%
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </GlassCard>
  );
}
