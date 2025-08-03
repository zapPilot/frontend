"use client";

import type { SwapToken } from "../../../../types/swap";
import type { OperationMode } from "../../types";

interface AmountInputProps {
  operationMode: OperationMode;
  amount: string;
  onAmountChange: (amount: string) => void;
  fromToken?: SwapToken;
  totalPortfolioValue: number;
  className?: string;
}

export const AmountInput: React.FC<AmountInputProps> = ({
  operationMode,
  amount,
  onAmountChange,
  fromToken,
  totalPortfolioValue,
  className = "",
}) => {
  // Dynamic label based on operation mode
  const getLabel = () => {
    switch (operationMode) {
      case "zapIn":
        return "Amount to Zap In";
      case "zapOut":
        return "Portfolio Value to Convert";
      case "rebalance":
        return "Amount to Rebalance";
      default:
        return "Amount";
    }
  };

  // Currency symbol display
  const getCurrencySymbol = () => {
    if (operationMode === "zapIn" && fromToken) {
      return fromToken.symbol;
    }
    return "USD";
  };

  // Handle max button click
  const handleMaxClick = () => {
    if (operationMode === "zapIn" && fromToken) {
      onAmountChange(fromToken.balance.toString());
    } else if (operationMode === "zapOut" || operationMode === "rebalance") {
      onAmountChange(totalPortfolioValue.toString());
    }
  };

  // Show balance info for zapIn mode
  const showBalance = operationMode === "zapIn" && fromToken;

  // Show portfolio info for zapOut/rebalance modes
  const showPortfolioValue =
    operationMode === "zapOut" || operationMode === "rebalance";

  return (
    <div className={`space-y-2 ${className}`}>
      <label className="block text-xs font-medium text-gray-400">
        {getLabel()}
      </label>

      <div className="relative">
        <input
          type="number"
          value={amount}
          onChange={e => onAmountChange(e.target.value)}
          placeholder="0.0"
          min="0"
          step="0.01"
          className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white text-lg placeholder-gray-500 focus:outline-none focus:border-purple-500"
          data-testid="amount-input"
        />
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-gray-400">
          {getCurrencySymbol()}
        </div>
      </div>

      {/* Balance/Portfolio Info */}
      <div className="flex justify-between text-xs text-gray-400">
        {showBalance && (
          <span>
            Balance: {fromToken!.balance.toFixed(4)} {fromToken!.symbol}
          </span>
        )}

        {showPortfolioValue && (
          <span>Portfolio Value: ${totalPortfolioValue.toLocaleString()}</span>
        )}

        <button
          onClick={handleMaxClick}
          className="text-purple-400 hover:text-purple-300 transition-colors"
          disabled={operationMode === "zapIn" && !fromToken}
        >
          Max
        </button>
      </div>
    </div>
  );
};
