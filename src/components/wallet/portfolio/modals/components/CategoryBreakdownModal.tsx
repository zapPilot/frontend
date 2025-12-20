"use client";

import { Modal, ModalContent } from "@/components/ui/modal";
import { ASSET_CATEGORIES } from "@/constants/portfolio";
import type { AssetCategoryKey } from "@/lib/assetCategoryUtils";

interface TokenBreakdown {
  symbol: string;
  name: string;
  balance: number;
  usdValue: number;
  percentage: number;
}

interface CategoryBreakdownModalProps {
  isOpen: boolean;
  onClose: () => void;
  category: AssetCategoryKey;
  tokens: TokenBreakdown[];
  totalUsd: number;
}

export function CategoryBreakdownModal({
  isOpen,
  onClose,
  category,
  tokens,
  totalUsd,
}: CategoryBreakdownModalProps) {
  const categoryInfo = ASSET_CATEGORIES[category];

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="md">
      <ModalContent className="p-0 overflow-hidden bg-gray-950 border-gray-800">
        {/* Header */}
        <div className="bg-gray-900/50 p-4 flex justify-between items-center border-b border-gray-800">
          <h3 className="font-bold text-white">
            {categoryInfo.label} Breakdown
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Total */}
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
            <div className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">
              Total Value
            </div>
            <div className="text-3xl font-bold text-white">
              ${totalUsd.toLocaleString()}
            </div>
            <div className="text-xs text-gray-400 mt-1">
              {tokens.length} {tokens.length === 1 ? "asset" : "assets"}
            </div>
          </div>

          {/* Token List */}
          <div className="space-y-2">
            <div className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
              Asset Distribution
            </div>
            <div className="max-h-64 overflow-y-auto space-y-2">
              {tokens.map((token, idx) => (
                <div
                  key={idx}
                  className="bg-gray-900/50 border border-gray-800 rounded-lg p-3 flex items-center justify-between"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white">
                        {token.symbol}
                      </span>
                      <span className="text-xs text-gray-500">
                        {token.name}
                      </span>
                    </div>
                    <div className="text-xs text-gray-400">
                      {token.balance.toLocaleString()} tokens
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-white">
                      ${token.usdValue.toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-500">
                      {token.percentage.toFixed(1)}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="w-full bg-gray-900 hover:bg-gray-800 border border-gray-800 text-white font-bold py-3 rounded-xl transition-colors"
          >
            Close
          </button>
        </div>
      </ModalContent>
    </Modal>
  );
}
