/**
 * Pool details breakdown tooltip
 * Shows portfolio composition by protocol, chain, and APR
 *
 * Follows the ROITooltip pattern for simple multi-section display
 */

import React from "react";

import { formatCurrency, formatPercentage } from "@/lib/formatters";
import type { PoolDetail } from "@/types/domain/pool";

import { MetricsTooltipContainer } from "./MetricsTooltipContainer";
import type { MetricsTooltipProps } from "./types";

interface PoolDetailsTooltipProps extends MetricsTooltipProps {
  tooltipRef: React.RefObject<HTMLDivElement | null>;
  poolDetails: PoolDetail[];
  totalPositions?: number | undefined;
  protocolsCount?: number | undefined;
  chainsCount?: number | undefined;
}

/**
 * PoolDetailsTooltip displays a comprehensive breakdown of pool positions
 *
 * Features:
 * - Summary stats (positions, protocols, chains)
 * - Scrollable list of all pools sorted by value
 * - Protocol name, chain, and symbol display
 * - USD value and portfolio contribution percentage
 * - APR information when available
 * - Consistent styling with ROITooltip and YieldBreakdownTooltip
 */
export function PoolDetailsTooltip({
  position,
  tooltipRef,
  poolDetails,
  totalPositions,
  protocolsCount,
  chainsCount,
}: PoolDetailsTooltipProps) {
  // Sort pools by asset value (descending)
  const sortedPools = [...poolDetails].sort(
    (a, b) => b.asset_usd_value - a.asset_usd_value
  );

  // Calculate summary stats if not provided
  const positionCount = totalPositions ?? poolDetails.length;
  const protocolSet = new Set(poolDetails.map(p => p.protocol.toLowerCase()));
  const chainSet = new Set(poolDetails.map(p => p.chain.toLowerCase()));
  const calculatedProtocolsCount = protocolsCount ?? protocolSet.size;
  const calculatedChainsCount = chainsCount ?? chainSet.size;

  return (
    <MetricsTooltipContainer
      ref={tooltipRef}
      position={position}
      className="w-80 max-w-xs md:max-w-sm"
    >
      {/* Header */}
      <div className="font-semibold text-gray-200 mb-3 text-center text-base">
        💼 Portfolio Breakdown
      </div>

      {/* Summary Stats */}
      {(positionCount > 0 ||
        calculatedProtocolsCount > 0 ||
        calculatedChainsCount > 0) && (
        <div className="mb-3 p-2.5 bg-gray-800 rounded text-xs text-gray-300">
          <div className="flex justify-between mb-1.5">
            <span>Total Positions</span>
            <span className="font-medium text-gray-200">{positionCount}</span>
          </div>
          {calculatedProtocolsCount > 0 && (
            <div className="flex justify-between mb-1.5">
              <span>Protocols</span>
              <span className="font-medium text-gray-200">
                {calculatedProtocolsCount}
              </span>
            </div>
          )}
          {calculatedChainsCount > 0 && (
            <div className="flex justify-between">
              <span>Chains</span>
              <span className="font-medium text-gray-200">
                {calculatedChainsCount}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Pools List */}
      {sortedPools.length > 0 ? (
        <div className="mb-3">
          <div className="text-gray-300 font-medium mb-2 text-xs">
            All Pools by Value
          </div>
          <div className="space-y-2 max-h-96 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-800">
            {sortedPools.map((pool, index) => (
              <div
                key={`${pool.snapshot_id}-${index}`}
                className="bg-gray-800/80 rounded p-2.5 border border-gray-700/40 hover:border-gray-600/60 transition-colors"
              >
                {/* Protocol and Value Row */}
                <div className="flex justify-between items-start mb-1.5">
                  <div className="flex flex-col flex-1 min-w-0">
                    <span className="font-medium text-gray-200 text-sm truncate">
                      {pool.protocol_name}
                    </span>
                    <span className="text-xs text-gray-500">
                      {pool.chain} · {pool.pool_symbols.join("/")}
                    </span>
                  </div>
                  <div className="flex flex-col items-end ml-2">
                    <span className="font-semibold text-gray-200 text-sm whitespace-nowrap">
                      {formatCurrency(pool.asset_usd_value, {
                        smartPrecision: true,
                      })}
                    </span>
                    <span className="text-xs text-gray-500">
                      {formatPercentage(
                        pool.contribution_to_portfolio,
                        false,
                        1
                      )}
                    </span>
                  </div>
                </div>

                {/* APR Row removed because pool performance endpoint no longer provides APR data */}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center text-gray-400 text-sm py-4">
          No pool positions found
        </div>
      )}

      {/* Footer */}
      <div className="text-gray-400 text-xs leading-relaxed border-t border-gray-700 pt-2.5">
        💡 <strong className="text-gray-300">Tip:</strong> Positions are ranked
        by USD value. APR data is sourced from DeFiLlama and Hyperliquid,
        updated regularly.
      </div>
    </MetricsTooltipContainer>
  );
}
