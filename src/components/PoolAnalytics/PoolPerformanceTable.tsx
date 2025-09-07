import { motion } from "framer-motion";
import {
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Filter,
  TrendingDown,
  TrendingUp,
  X,
} from "lucide-react";
import React, { useMemo, useState } from "react";
import { formatCurrency } from "../../lib/formatters";
import type { PoolDetail } from "../../services/analyticsEngine";
import { GlassCard } from "../ui";
import { UnifiedLoading } from "../ui/UnifiedLoading";

interface PoolPerformanceTableProps {
  pools: PoolDetail[];
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  categoryFilter?: string | null;
  onClearCategoryFilter?: () => void;
  defaultTopN?: number | null;
  topNOptions?: number[];
}

type SortField = "apr" | "value" | "contribution" | "protocol";
type SortDirection = "asc" | "desc";

interface SortState {
  field: SortField;
  direction: SortDirection;
}

const CHAIN_COLORS: Record<string, string> = {
  ethereum: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  arbitrum: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
  base: "bg-indigo-500/20 text-indigo-400 border-indigo-500/30",
  polygon: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  optimism: "bg-red-500/20 text-red-400 border-red-500/30",
  frax: "bg-green-500/20 text-green-400 border-green-500/30",
  default: "bg-gray-500/20 text-gray-400 border-gray-500/30",
};

const getChainStyle = (chain: string): string => {
  const lowerChain = chain.toLowerCase();
  return (
    CHAIN_COLORS[lowerChain] ||
    CHAIN_COLORS["default"] ||
    "bg-gray-500/20 text-gray-400 border-gray-500/30"
  );
};

const isUnderperforming = (pool: PoolDetail): boolean => {
  return pool.final_apr <= 0.025 || !pool.protocol_matched;
};

const formatAPR = (apr: number): string => {
  return `${(apr * 100).toFixed(2)}%`;
};

// Category mapping for filtering - matches portfolio.utils.ts categorization
const categorizePool = (
  poolSymbols: string[]
): "btc" | "eth" | "stablecoins" | "others" => {
  const symbols = poolSymbols.map(s => s.toLowerCase());

  // Bitcoin category
  const btcSymbols = ["btc", "wbtc", "cbbtc", "tbtc"];
  if (symbols.some(s => btcSymbols.includes(s))) {
    return "btc";
  }

  // Ethereum category
  const ethSymbols = [
    "eth",
    "weth",
    "steth",
    "wsteth",
    "weeth",
    "mseth",
    "frxeth",
  ];
  if (symbols.some(s => ethSymbols.includes(s))) {
    return "eth";
  }

  // Stablecoins category
  const stableSymbols = [
    "usdc",
    "usdt",
    "dai",
    "frax",
    "usd₮0",
    "bold",
    "msusd",
    "openusdt",
    "susd",
    "gho",
    "vst",
    "frxusd",
    "wfrax",
    "legacy frax dollar",
  ];
  if (symbols.some(s => stableSymbols.includes(s))) {
    return "stablecoins";
  }

  // Everything else
  return "others";
};

export const PoolPerformanceTable: React.FC<PoolPerformanceTableProps> = ({
  pools,
  isLoading,
  error,
  onRetry,
  categoryFilter,
  onClearCategoryFilter,
  defaultTopN = null,
  topNOptions = [5, 10, 20, 50],
}) => {
  const [sortState, setSortState] = useState<SortState>({
    field: "value",
    direction: "desc",
  });
  const [topN, setTopN] = useState<number | null>(defaultTopN);

  // Filter pools by category if specified
  const filteredPools = useMemo(() => {
    if (!categoryFilter) return pools;

    return pools.filter(pool => {
      const poolCategory = categorizePool(pool.pool_symbols);
      return poolCategory === categoryFilter;
    });
  }, [pools, categoryFilter]);

  // Sort filtered pools based on current sort state
  const sortedPools = useMemo(() => {
    if (!filteredPools.length) return [];

    return [...filteredPools].sort((a, b) => {
      let valueA: number | string;
      let valueB: number | string;

      switch (sortState.field) {
        case "apr":
          valueA = a.final_apr;
          valueB = b.final_apr;
          break;
        case "value":
          valueA = a.asset_usd_value;
          valueB = b.asset_usd_value;
          break;
        case "contribution":
          valueA = a.contribution_to_portfolio;
          valueB = b.contribution_to_portfolio;
          break;
        case "protocol":
          valueA = a.protocol_name;
          valueB = b.protocol_name;
          break;
        default:
          return 0;
      }

      if (typeof valueA === "string" && typeof valueB === "string") {
        const comparison = valueA.localeCompare(valueB);
        return sortState.direction === "asc" ? comparison : -comparison;
      }

      const numA = Number(valueA);
      const numB = Number(valueB);
      const comparison = numA - numB;
      return sortState.direction === "asc" ? comparison : -comparison;
    });
  }, [filteredPools, sortState]);

  // Apply Top N limit if specified
  const displayedPools = useMemo(() => {
    if (topN === null || !sortedPools.length) return sortedPools;
    return sortedPools.slice(0, topN);
  }, [sortedPools, topN]);

  const handleSort = (field: SortField) => {
    setSortState(prev => ({
      field,
      direction:
        prev.field === field && prev.direction === "desc" ? "asc" : "desc",
    }));
  };

  const getSortIcon = (field: SortField) => {
    if (sortState.field !== field) {
      return <ChevronDown className="w-4 h-4 text-gray-500" />;
    }
    return sortState.direction === "desc" ? (
      <ChevronDown className="w-4 h-4 text-purple-400" />
    ) : (
      <ChevronUp className="w-4 h-4 text-purple-400" />
    );
  };

  if (isLoading) {
    return (
      <GlassCard>
        <div className="flex items-center justify-center p-8">
          <UnifiedLoading
            variant="skeleton-card"
            aria-label="Loading pool performance data"
          />
          <span className="ml-3 text-gray-400">Loading pool analytics...</span>
        </div>
      </GlassCard>
    );
  }

  if (error) {
    return (
      <GlassCard>
        <div className="text-center p-8">
          <AlertTriangle className="w-8 h-8 text-red-400 mx-auto mb-2" />
          <p className="text-red-400 mb-4">{error}</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
            >
              Try Again
            </button>
          )}
        </div>
      </GlassCard>
    );
  }

  if (!pools.length) {
    return (
      <GlassCard>
        <div className="text-center p-8">
          <p className="text-gray-400">No pool data available</p>
        </div>
      </GlassCard>
    );
  }

  const getCategoryDisplayName = (categoryId: string): string => {
    const names = {
      btc: "Bitcoin",
      eth: "Ethereum",
      stablecoins: "Stablecoins",
      others: "Others",
    };
    return names[categoryId as keyof typeof names] || categoryId;
  };

  return (
    <GlassCard>
      <div className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
          <div>
            <h2 className="text-xl font-semibold text-white">
              Pool Performance
            </h2>
            {categoryFilter && (
              <div className="flex items-center gap-2 mt-2">
                <Filter className="w-4 h-4 text-blue-400" />
                <span className="text-sm text-blue-400">
                  Showing {getCategoryDisplayName(categoryFilter)} pools
                </span>
                {onClearCategoryFilter && (
                  <button
                    onClick={onClearCategoryFilter}
                    className="p-1 rounded hover:bg-gray-800 transition-colors"
                    title="Clear filter"
                  >
                    <X className="w-3 h-3 text-gray-400 hover:text-white" />
                  </button>
                )}
              </div>
            )}
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <div className="text-sm text-gray-400">
              {topN && displayedPools.length < filteredPools.length ? (
                <>
                  Showing {displayedPools.length} of {filteredPools.length}{" "}
                  pools •{" "}
                  {displayedPools.filter(p => !isUnderperforming(p)).length}{" "}
                  performing well
                </>
              ) : (
                <>
                  {filteredPools.length} pools •{" "}
                  {filteredPools.filter(p => !isUnderperforming(p)).length}{" "}
                  performing well
                </>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400">Show:</span>
              <select
                value={topN || "all"}
                onChange={e =>
                  setTopN(
                    e.target.value === "all" ? null : Number(e.target.value)
                  )
                }
                className="px-2 py-1 bg-gray-800/50 border border-gray-600/50 rounded text-sm text-white focus:outline-none focus:ring-1 focus:ring-purple-400"
              >
                <option value="all">All</option>
                {topNOptions.map(option => (
                  <option key={option} value={option}>
                    Top {option}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-700/50">
                <th
                  className="text-left pb-3 cursor-pointer hover:text-purple-400 transition-colors"
                  onClick={() => handleSort("protocol")}
                >
                  <div className="flex items-center space-x-1">
                    <span className="text-sm font-medium text-gray-300">
                      Protocol
                    </span>
                    {getSortIcon("protocol")}
                  </div>
                </th>
                <th className="text-left pb-3">
                  <span className="text-sm font-medium text-gray-300">
                    Assets
                  </span>
                </th>
                <th
                  className="text-left pb-3 cursor-pointer hover:text-purple-400 transition-colors"
                  onClick={() => handleSort("apr")}
                >
                  <div className="flex items-center space-x-1">
                    <span className="text-sm font-medium text-gray-300">
                      APR
                    </span>
                    {getSortIcon("apr")}
                  </div>
                </th>
                <th
                  className="text-right pb-3 cursor-pointer hover:text-purple-400 transition-colors"
                  onClick={() => handleSort("value")}
                >
                  <div className="flex items-center justify-end space-x-1">
                    <span className="text-sm font-medium text-gray-300">
                      Value
                    </span>
                    {getSortIcon("value")}
                  </div>
                </th>
                <th
                  className="text-right pb-3 cursor-pointer hover:text-purple-400 transition-colors"
                  onClick={() => handleSort("contribution")}
                >
                  <div className="flex items-center justify-end space-x-1">
                    <span className="text-sm font-medium text-gray-300">
                      Portfolio %
                    </span>
                    {getSortIcon("contribution")}
                  </div>
                </th>
                <th className="text-center pb-3">
                  <span className="text-sm font-medium text-gray-300">
                    Status
                  </span>
                </th>
              </tr>
            </thead>
            <tbody>
              {displayedPools.map((pool, index) => (
                <motion.tr
                  key={pool.snapshot_id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="border-b border-gray-800/30 hover:bg-white/5 transition-colors"
                >
                  <td className="py-4">
                    <div className="flex items-center space-x-3">
                      <div>
                        <p className="font-medium text-white">
                          {pool.protocol_name}
                        </p>
                        <div
                          className={`inline-block px-2 py-1 rounded-full text-xs border ${getChainStyle(pool.chain)}`}
                        >
                          {pool.chain}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4">
                    <div className="flex flex-wrap gap-1">
                      {pool.pool_symbols.slice(0, 3).map(symbol => (
                        <span
                          key={symbol}
                          className="px-2 py-1 bg-gray-700/50 text-gray-300 text-xs rounded"
                        >
                          {symbol.toUpperCase()}
                        </span>
                      ))}
                      {pool.pool_symbols.length > 3 && (
                        <span className="px-2 py-1 bg-gray-700/50 text-gray-400 text-xs rounded">
                          +{pool.pool_symbols.length - 3}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-4">
                    <div className="flex items-center space-x-2">
                      {pool.final_apr > 0.05 ? (
                        <TrendingUp className="w-4 h-4 text-green-400" />
                      ) : pool.final_apr <= 0.01 ? (
                        <TrendingDown className="w-4 h-4 text-red-400" />
                      ) : null}
                      <span
                        className={`font-medium ${
                          isUnderperforming(pool)
                            ? "text-yellow-400"
                            : pool.final_apr > 0.05
                              ? "text-green-400"
                              : "text-white"
                        }`}
                      >
                        {formatAPR(pool.final_apr)}
                      </span>
                    </div>
                  </td>
                  <td className="py-4 text-right">
                    <span className="text-white font-medium">
                      {formatCurrency(pool.asset_usd_value)}
                    </span>
                  </td>
                  <td className="py-4 text-right">
                    <span className="text-gray-300">
                      {pool.contribution_to_portfolio.toFixed(1)}%
                    </span>
                  </td>
                  <td className="py-4 text-center">
                    {isUnderperforming(pool) ? (
                      <div className="flex items-center justify-center">
                        <AlertTriangle className="w-4 h-4 text-yellow-400" />
                      </div>
                    ) : (
                      <div className="flex items-center justify-center">
                        <div className="w-2 h-2 bg-green-400 rounded-full" />
                      </div>
                    )}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden space-y-4">
          {displayedPools.map((pool, index) => (
            <motion.div
              key={pool.snapshot_id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`p-4 rounded-lg border ${
                isUnderperforming(pool)
                  ? "bg-yellow-900/20 border-yellow-600/30"
                  : "bg-white/5 border-gray-700/50"
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-medium text-white">
                    {pool.protocol_name}
                  </h3>
                  <div
                    className={`inline-block px-2 py-1 rounded-full text-xs border mt-1 ${getChainStyle(pool.chain)}`}
                  >
                    {pool.chain}
                  </div>
                </div>
                {isUnderperforming(pool) && (
                  <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0" />
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-400 mb-1">APR</p>
                  <div className="flex items-center space-x-2">
                    {pool.final_apr > 0.05 ? (
                      <TrendingUp className="w-4 h-4 text-green-400" />
                    ) : pool.final_apr <= 0.01 ? (
                      <TrendingDown className="w-4 h-4 text-red-400" />
                    ) : null}
                    <span
                      className={`font-medium ${
                        isUnderperforming(pool)
                          ? "text-yellow-400"
                          : pool.final_apr > 0.05
                            ? "text-green-400"
                            : "text-white"
                      }`}
                    >
                      {formatAPR(pool.final_apr)}
                    </span>
                  </div>
                </div>

                <div>
                  <p className="text-gray-400 mb-1">Value</p>
                  <p className="text-white font-medium">
                    {formatCurrency(pool.asset_usd_value)}
                  </p>
                </div>

                <div>
                  <p className="text-gray-400 mb-1">Portfolio %</p>
                  <p className="text-gray-300">
                    {pool.contribution_to_portfolio.toFixed(1)}%
                  </p>
                </div>

                <div>
                  <p className="text-gray-400 mb-1">Assets</p>
                  <div className="flex flex-wrap gap-1">
                    {pool.pool_symbols.slice(0, 2).map(symbol => (
                      <span
                        key={symbol}
                        className="px-1.5 py-0.5 bg-gray-700/50 text-gray-300 text-xs rounded"
                      >
                        {symbol.toUpperCase()}
                      </span>
                    ))}
                    {pool.pool_symbols.length > 2 && (
                      <span className="text-gray-400 text-xs">
                        +{pool.pool_symbols.length - 2}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Performance Summary */}
        <div className="mt-6 p-4 bg-white/5 rounded-lg border border-gray-700/50">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
            <div className="text-center">
              <p className="text-gray-400 mb-1">Underperforming</p>
              <p className="text-yellow-400 font-medium">
                {displayedPools.filter(p => isUnderperforming(p)).length}
              </p>
            </div>
            <div className="text-center">
              <p className="text-gray-400 mb-1">Performing Well</p>
              <p className="text-green-400 font-medium">
                {displayedPools.filter(p => !isUnderperforming(p)).length}
              </p>
            </div>
            <div className="text-center">
              <p className="text-gray-400 mb-1">Avg APR</p>
              <p className="text-white font-medium">
                {displayedPools.length > 0
                  ? formatAPR(
                      displayedPools.reduce((sum, p) => sum + p.final_apr, 0) /
                        displayedPools.length
                    )
                  : "0.00%"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </GlassCard>
  );
};
