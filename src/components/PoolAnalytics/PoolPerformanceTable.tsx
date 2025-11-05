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

import { formatCurrency, formatPercentage } from "../../lib/formatters";
import type { PoolDetail } from "../../services/analyticsService";
import { categorizePool } from "../../utils/portfolio.utils";
import { ProtocolImage } from "../shared/ProtocolImage";
import { TokenImage } from "../shared/TokenImage";
import { BaseCard } from "../ui";
import { UnifiedLoading } from "../ui/LoadingSystem";

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
  return formatPercentage(apr * 100, false, 2);
};

const APR_HIGH_THRESHOLD = 0.05;
const APR_LOW_THRESHOLD = 0.01;

const getAprTrendIcon = (apr: number) => {
  if (apr > APR_HIGH_THRESHOLD) {
    return <TrendingUp className="w-4 h-4 text-green-400" />;
  }

  if (apr <= APR_LOW_THRESHOLD) {
    return <TrendingDown className="w-4 h-4 text-red-400" />;
  }

  return null;
};

const getAprTextClass = (pool: PoolDetail) => {
  if (isUnderperforming(pool)) {
    return "text-yellow-400";
  }

  if (pool.final_apr > APR_HIGH_THRESHOLD) {
    return "text-green-400";
  }

  return "text-white";
};

const renderAprIndicator = (pool: PoolDetail) => {
  const trendIcon = getAprTrendIcon(pool.final_apr);

  return (
    <div className="flex items-center space-x-2">
      {trendIcon}
      <span className={`font-medium ${getAprTextClass(pool)}`}>
        {formatAPR(pool.final_apr)}
      </span>
    </div>
  );
};

interface PoolEntry {
  pool: PoolDetail;
  index: number;
  snapshotCount: number;
}

interface RowCell {
  key: string;
  className: string;
  content: React.ReactNode;
}

const buildRowCells = ({ pool, snapshotCount }: PoolEntry): RowCell[] => [
  {
    key: "protocol",
    className: "py-4",
    content: (
      <div className="flex items-center space-x-3">
        <ProtocolImage
          protocol={{ name: pool.protocol_name }}
          size={20}
          className="flex-shrink-0"
        />
        <ProtocolNameAndChain
          pool={pool}
          nameClassName="font-medium text-white"
        />
      </div>
    ),
  },
  {
    key: "tokens",
    className: "py-4",
    content: (
      <>
        <div className="flex items-center -space-x-2 mb-2">
          {pool.pool_symbols.slice(0, 3).map((symbol: string, idx: number) => (
            <TokenImage
              key={`${symbol}-${idx}`}
              token={{ symbol }}
              size={20}
              className="border-2 border-gray-900 ring-1 ring-gray-700"
            />
          ))}
          {pool.pool_symbols.length > 3 && (
            <div className="w-5 h-5 rounded-full bg-gray-700 border-2 border-gray-900 flex items-center justify-center text-[10px] text-gray-400">
              +{pool.pool_symbols.length - 3}
            </div>
          )}
        </div>
        <div className="flex flex-wrap gap-1">
          {pool.pool_symbols.slice(0, 3).map((symbol: string) => (
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
      </>
    ),
  },
  {
    key: "snapshots",
    className: "py-4 text-center",
    content: <span className="text-gray-300 font-medium">{snapshotCount}</span>,
  },
  {
    key: "apr",
    className: "py-4",
    content: renderAprIndicator(pool),
  },
  {
    key: "value",
    className: "py-4 text-right",
    content: (
      <span className="text-white font-medium">
        {formatCurrency(pool.asset_usd_value)}
      </span>
    ),
  },
  {
    key: "contribution",
    className: "py-4 text-right",
    content: (
      <span className="text-gray-300">
        {formatPercentage(pool.contribution_to_portfolio, false, 1)}
      </span>
    ),
  },
  {
    key: "status",
    className: "py-4 text-center",
    content: isUnderperforming(pool) ? (
      <div className="flex items-center justify-center">
        <AlertTriangle className="w-4 h-4 text-yellow-400" />
      </div>
    ) : (
      <div className="flex items-center justify-center">
        <div className="w-2 h-2 bg-green-400 rounded-full" />
      </div>
    ),
  },
];

const CARD_SECTIONS: Array<{
  key: string;
  label: string;
  render: (entry: PoolEntry) => React.ReactNode;
}> = [
  {
    key: "apr",
    label: "APR",
    render: ({ pool }) => renderAprIndicator(pool),
  },
  {
    key: "value",
    label: "Value",
    render: ({ pool }) => (
      <p className="text-white font-medium">
        {formatCurrency(pool.asset_usd_value)}
      </p>
    ),
  },
  {
    key: "contribution",
    label: "Portfolio %",
    render: ({ pool }) => (
      <p className="text-gray-300">
        {formatPercentage(pool.contribution_to_portfolio, false, 1)}
      </p>
    ),
  },
  {
    key: "snapshots",
    label: "Snapshots",
    render: ({ snapshotCount }) => (
      <p className="text-gray-300 font-medium">{snapshotCount}</p>
    ),
  },
  {
    key: "assets",
    label: "Assets",
    render: ({ pool }) => (
      <div className="flex flex-wrap gap-1">
        {pool.pool_symbols.slice(0, 2).map((symbol: string) => (
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
    ),
  },
];

const PoolTableRow = ({ entry }: { entry: PoolEntry }) => {
  const rowCells = buildRowCells(entry);

  return (
    <motion.tr
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: entry.index * 0.05 }}
      className="border-b border-gray-800/30 hover:bg-white/5 transition-colors"
    >
      {rowCells.map(cell => (
        <td key={cell.key} className={cell.className}>
          {cell.content}
        </td>
      ))}
    </motion.tr>
  );
};

const PoolMobileCard = ({ entry }: { entry: PoolEntry }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: entry.index * 0.05 }}
    className={`p-4 rounded-lg border ${
      isUnderperforming(entry.pool)
        ? "bg-yellow-900/20 border-yellow-600/30"
        : "bg-white/5 border-gray-700/50"
    }`}
  >
    <div className="flex items-start justify-between mb-3">
      <div className="flex items-center gap-3">
        <ProtocolImage
          protocol={{ name: entry.pool.protocol_name }}
          size={32}
          className="flex-shrink-0"
        />
        <ProtocolNameAndChain
          pool={entry.pool}
          nameAs="h3"
          nameClassName="font-medium text-white"
          chainClassName="mt-1"
        />
      </div>
      {isUnderperforming(entry.pool) && (
        <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0" />
      )}
    </div>
    <div className="grid grid-cols-2 gap-4 text-sm">
      {CARD_SECTIONS.map(section => (
        <div key={section.key}>
          <p className="text-gray-400 mb-1">{section.label}</p>
          {section.render(entry)}
        </div>
      ))}
    </div>
  </motion.div>
);

type HeadingTag = keyof Pick<React.JSX.IntrinsicElements, "h3" | "p">;

interface ProtocolInfoProps {
  pool: PoolDetail;
  nameAs?: HeadingTag;
  nameClassName: string;
  chainClassName?: string;
}

const CHAIN_BADGE_BASE = "inline-block px-2 py-1 rounded-full text-xs border";

const ProtocolNameAndChain = ({
  pool,
  nameAs: NameComponent = "p",
  nameClassName,
  chainClassName = "",
}: ProtocolInfoProps) => (
  <div>
    <NameComponent className={nameClassName}>
      {pool.protocol_name}
    </NameComponent>
    <div
      className={`${CHAIN_BADGE_BASE} ${chainClassName} ${getChainStyle(pool.chain)}`}
    >
      {pool.chain}
    </div>
  </div>
);

export function PoolPerformanceTable({
  pools,
  isLoading,
  error,
  onRetry,
  categoryFilter,
  onClearCategoryFilter,
  defaultTopN = 5,
  topNOptions = [5, 10, 20, 50],
}: PoolPerformanceTableProps) {
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

  const poolEntries = useMemo(
    () =>
      displayedPools.map((pool, index) => ({
        pool,
        index,
        snapshotCount: pool.snapshot_ids?.length ?? 0,
      })),
    [displayedPools]
  );

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
      <BaseCard variant="glass">
        <div className="flex items-center justify-center p-8">
          <UnifiedLoading
            variant="rectangular"
            width={200}
            height={40}
            aria-label="Loading pool performance data"
          />
          <span className="ml-3 text-gray-400">Loading pool analytics...</span>
        </div>
      </BaseCard>
    );
  }

  if (error) {
    return (
      <BaseCard variant="glass">
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
      </BaseCard>
    );
  }

  if (!pools.length) {
    return (
      <BaseCard variant="glass">
        <div className="text-center p-8">
          <p className="text-gray-400">No pool data available</p>
        </div>
      </BaseCard>
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
    <BaseCard variant="glass">
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
                <th className="text-center pb-3">
                  <span className="text-sm font-medium text-gray-300">
                    Positions
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
              {poolEntries.map(entry => (
                <PoolTableRow key={entry.pool.snapshot_id} entry={entry} />
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden space-y-4">
          {poolEntries.map(entry => (
            <PoolMobileCard key={entry.pool.snapshot_id} entry={entry} />
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
    </BaseCard>
  );
}
