"use client";

import { memo } from "react";
import { RebalanceData } from "../../types";

interface RebalanceSummaryProps {
  rebalanceData: RebalanceData;
}

export const RebalanceSummary = memo<RebalanceSummaryProps>(
  ({ rebalanceData }) => {
    return (
      <div className="bg-gray-900/30 rounded-2xl border border-gray-700 p-4">
        <h4 className="text-sm font-medium text-white mb-3">
          Rebalance Summary
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-green-400">
              {rebalanceData.shifts.filter(s => s.action === "increase").length}
            </div>
            <div className="text-xs text-gray-400">Positions to Increase</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-red-400">
              {rebalanceData.shifts.filter(s => s.action === "decrease").length}
            </div>
            <div className="text-xs text-gray-400">Positions to Decrease</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-white">
              ${rebalanceData.totalRebalanceValue.toLocaleString()}
            </div>
            <div className="text-xs text-gray-400">
              Total Value to Rebalance
            </div>
          </div>
        </div>
      </div>
    );
  }
);

RebalanceSummary.displayName = "RebalanceSummary";
