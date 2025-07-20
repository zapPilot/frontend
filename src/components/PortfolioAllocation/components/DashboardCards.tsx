"use client";

import { motion } from "framer-motion";
import { ChevronDown, ChevronUp, CheckCircle, XCircle } from "lucide-react";
import { useState } from "react";
import { PieChart } from "../../PieChart";
import { PieChartData } from "../../../types/portfolio";
import { useExcludedCategories } from "../ExcludedCategoriesContext";
import { ProcessedAssetCategory } from "../types";

interface DashboardCardsProps {
  processedCategories: ProcessedAssetCategory[];
  onZapAction?: (includedCategories: ProcessedAssetCategory[]) => void;
}

interface CategoryCardProps {
  category: ProcessedAssetCategory;
  index: number;
}

const CategoryCard: React.FC<CategoryCardProps> = ({ category, index }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { toggleCategoryExclusion } = useExcludedCategories();

  // Create mini pie chart data for this category's protocols
  const protocolChartData: PieChartData[] = category.protocols.map(
    protocol => ({
      label: protocol.name,
      value: protocol.allocationPercentage,
      percentage: protocol.allocationPercentage,
      color: `hsl(${Math.abs(protocol.name.split("").reduce((a, b) => a + b.charCodeAt(0), 0)) % 360}, 70%, 60%)`,
    })
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className={`rounded-3xl border p-6 transition-all duration-300 ${
        category.isExcluded
          ? "border-gray-700/50 bg-gray-900/10 opacity-60"
          : "border-gray-700 bg-gray-900/30 hover:bg-gray-900/50 hover:border-gray-600"
      }`}
      data-testid={`category-card-${category.id}`}
    >
      {/* Card Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div
            className="w-6 h-6 rounded-full"
            style={{ backgroundColor: category.color }}
          />
          <div>
            <h4
              className={`font-semibold ${category.isExcluded ? "text-gray-500 line-through" : "text-white"}`}
            >
              {category.name}
            </h4>
            <p className="text-sm text-gray-400">
              {category.protocols.length} protocol
              {category.protocols.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        {/* Exclusion Toggle */}
        <button
          onClick={() => toggleCategoryExclusion(category.id)}
          className={`p-2 rounded-full transition-all ${
            category.isExcluded
              ? "bg-gray-700 hover:bg-gray-600 text-gray-400"
              : "bg-green-500/20 hover:bg-green-500/30 text-green-400"
          }`}
          title={category.isExcluded ? "Include in Zap" : "Exclude from Zap"}
          data-testid={`toggle-button-${category.id}`}
        >
          {category.isExcluded ? (
            <XCircle className="w-5 h-5" />
          ) : (
            <CheckCircle className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Allocation Display */}
      <div className="mb-4">
        <div className="flex items-baseline justify-between mb-2">
          <span className="text-2xl font-bold text-white">
            {category.isExcluded
              ? "0%"
              : `${category.activeAllocationPercentage.toFixed(1)}%`}
          </span>
          {!category.isExcluded && (
            <span className="text-sm text-gray-400">
              ${category.totalValue.toLocaleString()}
            </span>
          )}
        </div>

        {/* Mini Progress Bar */}
        <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ backgroundColor: category.color }}
            initial={{ width: 0 }}
            animate={{
              width: category.isExcluded
                ? "0%"
                : `${Math.min(category.activeAllocationPercentage, 100)}%`,
            }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        </div>
      </div>

      {/* Mini Pie Chart for Protocol Distribution */}
      {!category.isExcluded && category.protocols.length > 1 && (
        <div className="mb-4 flex justify-center">
          <PieChart data={protocolChartData} size={120} strokeWidth={6} />
        </div>
      )}

      {/* Expand/Collapse Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-center space-x-2 p-2 rounded-lg border border-gray-700 hover:bg-gray-800 transition-colors"
        data-testid={`expand-button-${category.id}`}
      >
        <span className="text-sm text-gray-300">
          {isExpanded ? "Hide" : "Show"} Protocols
        </span>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-gray-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-400" />
        )}
      </button>

      {/* Expanded Protocol Details */}
      {isExpanded && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="mt-4 pt-4 border-t border-gray-700/50"
          data-testid={`protocols-list-${category.id}`}
        >
          <div className="space-y-3">
            {category.protocols.map(protocol => (
              <div
                key={protocol.id}
                className="flex items-center justify-between p-3 rounded-lg bg-gray-800/50 border border-gray-700/30"
              >
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-sm font-medium text-white">
                      {protocol.name}
                    </span>
                    <span className="text-xs text-gray-400 bg-gray-700 px-2 py-1 rounded">
                      {protocol.chain}
                    </span>
                  </div>
                  {protocol.apy && (
                    <div className="text-xs text-green-400">
                      {protocol.apy.toFixed(2)}% APY
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-300">
                    {protocol.allocationPercentage.toFixed(1)}%
                  </div>
                  {protocol.tvl && (
                    <div className="text-xs text-gray-500">
                      TVL: ${protocol.tvl.toLocaleString()}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

const SummaryCard: React.FC<{
  includedCategories: ProcessedAssetCategory[];
  excludedCategories: ProcessedAssetCategory[];
}> = ({ includedCategories, excludedCategories }) => {
  const totalValue = includedCategories.reduce(
    (sum, cat) => sum + cat.totalValue,
    0
  );
  const totalProtocols = includedCategories.reduce(
    (sum, cat) => sum + cat.protocols.length,
    0
  );

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="col-span-full rounded-3xl border border-gray-600 bg-gradient-to-br from-gray-900/50 to-gray-800/50 p-6"
    >
      <div className="text-center">
        <h3 className="text-lg font-semibold text-white mb-4">
          Portfolio Summary
        </h3>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-400">
              {includedCategories.length}
            </div>
            <div className="text-sm text-gray-400">Active Categories</div>
          </div>

          <div className="text-center">
            <div className="text-2xl font-bold text-red-400">
              {excludedCategories.length}
            </div>
            <div className="text-sm text-gray-400">Excluded</div>
          </div>

          <div className="text-center">
            <div className="text-2xl font-bold text-blue-400">
              {totalProtocols}
            </div>
            <div className="text-sm text-gray-400">Total Protocols</div>
          </div>

          <div className="text-center">
            <div className="text-2xl font-bold text-purple-400">
              ${totalValue.toLocaleString()}
            </div>
            <div className="text-sm text-gray-400">Active Value</div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export const DashboardCards: React.FC<DashboardCardsProps> = ({
  processedCategories,
  onZapAction,
}) => {
  const includedCategories = processedCategories.filter(cat => !cat.isExcluded);
  const excludedCategories = processedCategories.filter(cat => cat.isExcluded);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
      data-testid="dashboard-cards"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold gradient-text">Portfolio Dashboard</h3>
        <div className="text-sm text-gray-400">
          Manage categories individually
        </div>
      </div>

      {/* Summary Card */}
      <SummaryCard
        includedCategories={includedCategories}
        excludedCategories={excludedCategories}
      />

      {/* Category Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {processedCategories.map((category, index) => (
          <CategoryCard key={category.id} category={category} index={index} />
        ))}
      </div>

      {/* Zap Action Button */}
      <div className="pt-4">
        <button
          onClick={() => onZapAction?.(includedCategories)}
          disabled={includedCategories.length === 0}
          className="w-full py-4 px-6 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:from-purple-500 hover:to-blue-500"
          data-testid="zap-action-button"
        >
          {includedCategories.length === 0
            ? "Select categories to Zap"
            : `Zap Dashboard: ${includedCategories.length} active categor${includedCategories.length === 1 ? "y" : "ies"}`}
        </button>
      </div>
    </motion.div>
  );
};
