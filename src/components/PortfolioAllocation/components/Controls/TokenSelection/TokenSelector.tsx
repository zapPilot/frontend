"use client";

import { useDropdown } from "@/hooks/useDropdown";
import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { memo } from "react";
import { MOCK_TOKENS } from "../../../../../constants/trading";
import type { SwapToken } from "../../../../../types/swap";

interface TokenSelectorProps {
  selectedToken?: SwapToken;
  onTokenSelect: (token: SwapToken) => void;
  label: string;
  placeholder: string;
}

export const TokenSelector = memo<TokenSelectorProps>(
  ({ selectedToken, onTokenSelect, label, placeholder }) => {
    const dropdown = useDropdown(false);

    return (
      <div className="relative">
        <label className="block text-xs font-medium text-gray-400 mb-2">
          {label}
        </label>
        <button
          onClick={dropdown.toggle}
          className="w-full flex items-center justify-between p-3 bg-gray-800 border border-gray-600 rounded-lg hover:bg-gray-700 transition-colors"
          data-testid={`token-selector-${label.toLowerCase().replace(" ", "-")}`}
        >
          <div className="flex items-center space-x-3">
            {selectedToken ? (
              <>
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                  <span className="text-sm font-bold text-white">
                    {selectedToken.symbol.charAt(0)}
                  </span>
                </div>
                <div className="text-left">
                  <div className="text-white font-medium">
                    {selectedToken.symbol}
                  </div>
                  <div className="text-xs text-gray-400">
                    {selectedToken.name}
                  </div>
                </div>
              </>
            ) : (
              <span className="text-gray-400">{placeholder}</span>
            )}
          </div>
          <ChevronDown className="w-4 h-4 text-gray-400" />
        </button>

        {/* Token Dropdown */}
        {dropdown.isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-full left-0 right-0 mt-2 bg-gray-900 border border-gray-700 rounded-lg shadow-xl z-50 max-h-64 overflow-auto"
            >
              {MOCK_TOKENS.map(token => (
                <button
                  key={token.symbol}
                  onClick={() => {
                    onTokenSelect(token);
                    dropdown.close();
                  }}
                  className="w-full flex items-center space-x-3 p-3 hover:bg-gray-800 transition-colors"
                  data-testid={`token-option-${token.symbol}`}
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                    <span className="text-sm font-bold text-white">
                      {token.symbol.charAt(0)}
                    </span>
                  </div>
                  <div className="flex-1 text-left">
                    <div className="text-white font-medium">{token.symbol}</div>
                    <div className="text-xs text-gray-400">{token.name}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-300">
                      {token.balance.toFixed(
                        token.symbol.includes("BTC") ||
                          token.symbol.includes("ETH")
                          ? 4
                          : 2
                      )}
                    </div>
                    <div className="text-xs text-gray-500">
                      ${(token.balance * token.price).toLocaleString()}
                    </div>
                  </div>
                </button>
              ))}
            </motion.div>
            <div
              className="fixed inset-0 z-40"
              onClick={() => dropdown.close()}
            />
          </>
        )}
      </div>
    );
  }
);

TokenSelector.displayName = "TokenSelector";
