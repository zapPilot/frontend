"use client";

import { memo } from "react";
import { RebalanceMode } from "../../types";

interface OverviewHeaderProps {
  rebalanceMode?: RebalanceMode | undefined;
  totalCategories: number;
  includedCategories: number;
}

export const OverviewHeader = memo<OverviewHeaderProps>(
  ({ rebalanceMode, totalCategories, includedCategories }) => {
    const changesCount =
      rebalanceMode?.data?.shifts.filter(s => s.action !== "maintain").length ||
      0;

    return (
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold gradient-text">
          {rebalanceMode?.isEnabled
            ? "Portfolio Rebalancing"
            : "Portfolio Allocation"}
        </h3>
        <div className="text-sm text-gray-400">
          {rebalanceMode?.isEnabled
            ? `${changesCount} changes planned`
            : `${includedCategories} of ${totalCategories} categories active`}
        </div>
      </div>
    );
  }
);

OverviewHeader.displayName = "OverviewHeader";
