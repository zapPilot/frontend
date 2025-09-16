"use client";

import { ImageWithFallback } from "@/components/shared/ImageWithFallback";
import { memo } from "react";
import { ProcessedAssetCategory } from "../../types";

interface CategoryProtocolListProps {
  category: ProcessedAssetCategory;
}

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

        return (
          <span key={token} className="flex items-center">
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

            {!isLast && <span className="text-gray-500 mx-1">/</span>}
          </span>
        );
      })}
    </div>
  </span>
);

export const CategoryProtocolList = memo<CategoryProtocolListProps>(
  ({ category }) => {
    if (!category.protocols || category.protocols.length === 0) {
      return null;
    }

    return (
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
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <ImageWithFallback
                    src={`https://zap-assets-worker.davidtnfsh.workers.dev/projectPictures/${protocol.protocol || protocol.name.toLowerCase().replace(/[^a-z0-9]+/g, "")}.webp`}
                    alt={`${protocol.name} logo`}
                    fallbackType="project"
                    symbol={protocol.protocol || protocol.name}
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
                    <span>Value: ${protocol.tvl.toLocaleString()}</span>
                  )}
                  {protocol.apy && (
                    <span className="text-green-400">
                      APR: {protocol.apy.toFixed(2)}%
                      {protocol.aprBreakdown &&
                        protocol.aprBreakdown.base &&
                        protocol.aprBreakdown.reward && (
                          <span className="ml-1 text-gray-500">
                            ({protocol.aprBreakdown.base.toFixed(1)}% +{" "}
                            {protocol.aprBreakdown.reward.toFixed(1)}%)
                          </span>
                        )}
                    </span>
                  )}
                  {protocol.poolSymbols && protocol.poolSymbols.length > 0 && (
                    <TokenSymbolsList
                      tokens={protocol.poolSymbols}
                      label="Pool"
                    />
                  )}
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
    );
  }
);

CategoryProtocolList.displayName = "CategoryProtocolList";
