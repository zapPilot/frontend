"use client";

import { ImageWithFallback } from "@/components/shared/ImageWithFallback";
import { useDropdown } from "@/hooks/useDropdown";
import { motion } from "framer-motion";
import { ChevronDown, ChevronUp, X } from "lucide-react";
import { memo } from "react";
import { ProcessedAssetCategory, RebalanceMode } from "../../types";

interface AssetCategoryRowProps {
  category: ProcessedAssetCategory;
  rebalanceMode?: RebalanceMode;
  excludedCategoryIds: string[];
  onToggleCategoryExclusion: (categoryId: string) => void;
}

// Major tokens that should show icons instead of text only
const MAJOR_TOKENS = new Set([
  "eth",
  "weth",
  "steth",
  "reth",
  "btc",
  "wbtc",
  "usdc",
  "usdt",
  "dai",
  "busd",
  "frax",
  "lusd",
  "matic",
  "avax",
  "bnb",
  "sol",
  "ada",
  "dot",
  "uni",
  "aave",
  "comp",
  "mkr",
  "snx",
  "crv",
]);

// Helper component to render token symbols with selective icons
const TokenSymbolsList = ({
  tokens,
  label,
}: {
  tokens: string[];
  label: string;
}) => (
  <span className="flex items-center gap-1">
    <span className="text-gray-400">{label}:</span>
    <div className="flex items-center gap-1">
      {tokens.map((token, index) => {
        const isLast = index === tokens.length - 1;
        const isMajor = MAJOR_TOKENS.has(token.toLowerCase());

        return (
          <span key={token} className="flex items-center">
            {isMajor ? (
              <div className="flex items-center gap-1">
                <ImageWithFallback
                  src={`https://zap-assets-worker.davidtnfsh.workers.dev/tokenPictures/${token.toLowerCase()}.webp`}
                  alt={`${token} token`}
                  fallbackType="token"
                  symbol={token}
                  size={12}
                  className="flex-shrink-0 max-sm:!w-[10px] max-sm:!h-[10px]"
                />
                <span className="text-xs">{token.toUpperCase()}</span>
              </div>
            ) : (
              <span className="text-xs">{token.toUpperCase()}</span>
            )}
            {!isLast && <span className="text-gray-500 mx-1">/</span>}
          </span>
        );
      })}
    </div>
  </span>
);

export const AssetCategoryRow = memo<AssetCategoryRowProps>(
  ({
    category,
    rebalanceMode,
    excludedCategoryIds,
    onToggleCategoryExclusion,
  }) => {
    const dropdown = useDropdown(false);
    const excluded = excludedCategoryIds.includes(category.id);

    // Get rebalance data for this category
    const categoryShift = rebalanceMode?.data?.shifts.find(
      s => s.categoryId === category.id
    );
    const targetCategory = rebalanceMode?.data?.target.find(
      t => t.id === category.id
    );
    const isRebalanceMode =
      rebalanceMode?.isEnabled && categoryShift && targetCategory;

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`rounded-2xl border transition-all duration-200 ${
          excluded
            ? "border-gray-700/50 bg-gray-900/20"
            : "border-gray-700 bg-gray-900/30 hover:bg-gray-900/50"
        }`}
        data-testid={`category-row-${category.id}`}
      >
        <div className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {/* Category Color Indicator */}
              <div
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: category.color }}
              />

              {/* Category Name */}
              <span
                className={`font-medium ${excluded ? "text-gray-500 line-through" : "text-white"}`}
              >
                {category.name}
              </span>

              {/* Protocol Count */}
              <span className="text-xs text-gray-400 bg-gray-800 px-2 py-1 rounded-full">
                {category.enabledProtocolCount || 0} protocols
              </span>
            </div>

            <div className="flex items-center space-x-3">
              {/* Allocation Percentage */}
              <div className="text-right">
                {isRebalanceMode ? (
                  // Rebalance Mode: Show Before -> After
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <div className="text-sm text-gray-400">
                        {category.activeAllocationPercentage.toFixed(1)}%
                      </div>
                      <span className="text-gray-500">→</span>
                      <div
                        className={`font-bold ${
                          categoryShift!.action === "increase"
                            ? "text-green-400"
                            : categoryShift!.action === "decrease"
                              ? "text-red-400"
                              : "text-white"
                        }`}
                      >
                        {targetCategory!.activeAllocationPercentage.toFixed(1)}%
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 text-xs">
                      <div
                        className={`${
                          categoryShift!.action === "increase"
                            ? "text-green-400"
                            : categoryShift!.action === "decrease"
                              ? "text-red-400"
                              : "text-gray-400"
                        }`}
                      >
                        {categoryShift!.changeAmount > 0 ? "+" : ""}
                        {categoryShift!.changeAmount.toFixed(1)}%
                      </div>
                      <div className="text-gray-500">•</div>
                      <div className="text-gray-400">
                        {categoryShift!.actionDescription}
                      </div>
                    </div>
                  </div>
                ) : (
                  // Normal Mode: Show Current Allocation
                  <div>
                    <div
                      className={`font-bold ${excluded ? "text-gray-500" : "text-white"}`}
                    >
                      {excluded
                        ? "0%"
                        : `${category.activeAllocationPercentage.toFixed(1)}%`}
                    </div>
                    {!excluded && (
                      <div className="text-sm text-gray-400">
                        ${category.totalValue.toLocaleString()}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Expand/Collapse Button */}
              <button
                onClick={dropdown.toggle}
                className="p-1 rounded-lg hover:bg-gray-800 transition-colors"
                data-testid={`expand-button-${category.id}`}
              >
                {dropdown.isOpen ? (
                  <ChevronUp className="w-4 h-4 text-gray-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                )}
              </button>

              {/* Exclusion Toggle */}
              <button
                onClick={() => onToggleCategoryExclusion(category.id)}
                className={`p-2 rounded-lg transition-colors ${
                  excluded
                    ? "bg-gray-800 hover:bg-gray-700 text-gray-400"
                    : "bg-red-500/20 hover:bg-red-500/30 text-red-400"
                }`}
                title={excluded ? "Include in Zap" : "Exclude from Zap"}
                data-testid={`toggle-button-${category.id}`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Expanded Protocol Details */}
          {dropdown.isOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mt-4 pt-4 border-t border-gray-700/50"
              data-testid={`protocols-list-${category.id}`}
            >
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-gray-300 mb-3">
                  Strategy Details:
                </h4>

                {/* Description */}
                {category.description && (
                  <div className="p-3 rounded-lg bg-gray-800/50">
                    <div className="text-sm text-gray-300">
                      {category.description}
                    </div>
                  </div>
                )}

                {/* Individual Protocol Positions */}
                {category.protocols && category.protocols.length > 0 && (
                  <div className="space-y-2">
                    <h5 className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                      Active Positions ({category.protocols.length})
                    </h5>
                    {category.protocols.map(protocol => (
                      <div
                        key={protocol.id}
                        className="p-3 rounded-lg bg-gray-800/30 border border-gray-700/30"
                        data-testid={`protocol-row-${protocol.id}`}
                      >
                        {JSON.stringify(protocol)}
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              {protocol.protocol}:
                              <ImageWithFallback
                                src={`https://zap-assets-worker.davidtnfsh.workers.dev/projectPictures/${protocol.protocol}.webp`}
                                alt={`${protocol.protocol} logo`}
                                fallbackType="project"
                                symbol={protocol.protocol}
                                size={16}
                                className="flex-shrink-0 max-sm:!w-[14px] max-sm:!h-[14px]"
                              />
                              <span className="font-medium text-white text-sm">
                                {protocol.name}
                              </span>
                              <div
                                className="flex items-center justify-center px-2 py-1 rounded-full bg-blue-800/30"
                                title={protocol.chain}
                              >
                                <ImageWithFallback
                                  src={`https://zap-assets-worker.davidtnfsh.workers.dev/chainPicturesWebp/${protocol.chain}.webp`}
                                  alt={`${protocol.chain} chain`}
                                  fallbackType="chain"
                                  symbol={protocol.chain}
                                  size={14}
                                  className="flex-shrink-0 max-sm:!w-[12px] max-sm:!h-[12px]"
                                />
                              </div>
                              {/* APR Confidence Indicator */}
                              {protocol.aprConfidence && (
                                <span
                                  className={`text-xs px-2 py-1 rounded-full ${
                                    protocol.aprConfidence === "high"
                                      ? "bg-green-800/30 text-green-200"
                                      : protocol.aprConfidence === "medium"
                                        ? "bg-yellow-800/30 text-yellow-200"
                                        : "bg-red-800/30 text-red-200"
                                  }`}
                                >
                                  {protocol.aprConfidence === "high"
                                    ? "Verified APR"
                                    : protocol.aprConfidence === "medium"
                                      ? "Estimated APR"
                                      : "APR Unknown"}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center space-x-4 mt-1 text-xs text-gray-400">
                              {protocol.tvl && (
                                <span>
                                  Value: ${protocol.tvl.toLocaleString()}
                                </span>
                              )}
                              {protocol.apy && (
                                <span className="text-green-400">
                                  APR: {protocol.apy.toFixed(2)}%
                                  {protocol.aprBreakdown &&
                                    protocol.aprBreakdown.base &&
                                    protocol.aprBreakdown.reward && (
                                      <span className="ml-1 text-gray-500">
                                        ({protocol.aprBreakdown.base.toFixed(1)}
                                        % +{" "}
                                        {protocol.aprBreakdown.reward.toFixed(
                                          1
                                        )}
                                        %)
                                      </span>
                                    )}
                                </span>
                              )}
                              {/* Pool Composition */}
                              {protocol.poolSymbols &&
                                protocol.poolSymbols.length > 0 && (
                                  <TokenSymbolsList
                                    tokens={protocol.poolSymbols}
                                    label="Pool"
                                  />
                                )}
                              {/* Target Tokens from strategies API */}
                              {protocol.targetTokens &&
                                protocol.targetTokens.length > 0 && (
                                  <TokenSymbolsList
                                    tokens={protocol.targetTokens}
                                    label="Targets"
                                  />
                                )}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-white">
                              {protocol.allocationPercentage.toFixed(1)}%
                            </div>
                            {protocol.riskScore && (
                              <div className="text-xs text-gray-400">
                                Risk: {protocol.riskScore}/10
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
    );
  }
);

AssetCategoryRow.displayName = "AssetCategoryRow";
