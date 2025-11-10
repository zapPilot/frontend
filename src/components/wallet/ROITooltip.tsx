import React from "react";
import { createPortal } from "react-dom";

import { Z_INDEX } from "@/constants/design-system";
import { formatCurrency, formatPercentage } from "@/lib/formatters";

interface ROIWindowItem {
  key: string;
  label: string;
  value: number; // percentage
  dataPoints: number;
}

export interface ProtocolROIItem {
  protocol: string;
  chain: string;
  netYieldUsd: number;
  tokenYieldUsd: number;
  rewardYieldUsd: number;
  rewardTokenCount?: number;
}

interface ROITooltipProps {
  position: { top: number; left: number };
  windows: ROIWindowItem[];
  protocols?: ProtocolROIItem[];
  recommendedPeriodLabel?: string | null;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}

export function ROITooltip({
  position,
  windows,
  protocols,
  recommendedPeriodLabel,
  onMouseEnter,
  onMouseLeave,
}: ROITooltipProps) {
  return createPortal(
    <div
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{
        position: "fixed",
        top: position.top,
        left: position.left,
        transform: "translateX(-50%)",
      }}
      className={`bg-gray-900 text-white text-xs rounded shadow-lg w-72 p-4 border border-gray-700 ${Z_INDEX.TOOLTIP}`}
    >
      <div className="font-semibold text-gray-200 mb-2 text-center">
        📊 Portfolio ROI Estimation
      </div>

      {recommendedPeriodLabel && (
        <div className="text-gray-300 text-xs mb-2 text-center">
          Based on {recommendedPeriodLabel} performance data
        </div>
      )}

      {windows.length > 0 && (
        <div className="mb-3 p-2 bg-gray-800 rounded">
          <div className="text-gray-300 font-medium mb-2">
            ROI by Time Period
          </div>
          {windows.map(entry => (
            <div
              key={entry.key}
              className="flex justify-between text-gray-300 mb-1 last:mb-0"
            >
              <span>
                {entry.label} ({entry.dataPoints} data points)
              </span>
              <span>{formatPercentage(entry.value, false, 2)}</span>
            </div>
          ))}
        </div>
      )}

      {protocols && protocols.length > 0 && (
        <div className="mb-3 p-2 bg-gray-800 rounded">
          <div className="text-gray-300 font-medium mb-2">
            Top Protocols by Net Yield (30d)
          </div>
          {protocols.map((protocol, index) => (
            <div
              key={`${protocol.protocol}-${protocol.chain}-${index}`}
              className="flex justify-between items-start text-gray-300 mb-1 last:mb-0"
            >
              <span className="flex flex-col">
                <span className="font-medium">{protocol.protocol}</span>
                <span className="text-xs text-gray-500">
                  {protocol.chain}
                  {protocol.rewardTokenCount !== undefined &&
                    protocol.rewardTokenCount > 0 && (
                      <>
                        {" "}
                        · {protocol.rewardTokenCount} reward
                        {protocol.rewardTokenCount > 1 ? "s" : ""}
                      </>
                    )}
                </span>
              </span>
              <span className="ml-2 font-medium text-emerald-300">
                {formatCurrency(protocol.netYieldUsd, { smartPrecision: true })}
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="text-gray-400 text-xs leading-relaxed border-t border-gray-700 pt-2">
        💡 <strong>Methodology:</strong> ROI estimates use recent performance
        windows and scale linearly to yearly projections. Estimates become more
        accurate as data points increase over time.
      </div>
    </div>,
    document.body
  );
}
