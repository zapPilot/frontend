"use client";

import { motion } from "framer-motion";
import { formatCurrency } from "../../lib/utils";
import { SwapToken } from "../../types/swap";

interface TokenSelectorModalProps {
  tokens: SwapToken[];
  onTokenSelect: (token: SwapToken) => void;
  onClose: () => void;
}

export function TokenSelectorModal({
  tokens,
  onTokenSelect,
  onClose,
}: TokenSelectorModalProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
      data-testid="token-selector-modal"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="glass-morphism rounded-3xl p-6 border border-gray-800 w-full max-w-md"
        onClick={e => e.stopPropagation()}
        data-testid="token-selector-content"
      >
        <h3 className="text-lg font-bold text-white mb-4">Select Token</h3>
        <div className="space-y-2" data-testid="token-list">
          {tokens.map(token => (
            <button
              key={token.symbol}
              onClick={() => onTokenSelect(token)}
              className="w-full p-3 rounded-xl bg-gray-900/50 hover:bg-gray-900/70 transition-colors flex items-center justify-between cursor-pointer"
              data-testid={`token-option-${token.symbol.toLowerCase()}`}
            >
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600" />
                <div className="text-left">
                  <div
                    className="font-semibold text-white"
                    data-testid={`token-symbol-${token.symbol.toLowerCase()}`}
                  >
                    {token.symbol}
                  </div>
                  <div className="text-sm text-gray-400">{token.name}</div>
                </div>
              </div>
              <div className="text-right">
                <div
                  className="text-white font-semibold"
                  data-testid={`token-balance-${token.symbol.toLowerCase()}`}
                >
                  {token.balance}
                </div>
                <div
                  className="text-sm text-gray-400"
                  data-testid={`token-value-${token.symbol.toLowerCase()}`}
                >
                  {formatCurrency(token.balance * token.price)}
                </div>
              </div>
            </button>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}
