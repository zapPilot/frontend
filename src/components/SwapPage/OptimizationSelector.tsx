"use client";

import { ArrowRightLeft, Coins } from "lucide-react";
import { memo, useMemo } from "react";
import { formatSmallCurrency } from "../../utils/formatters";
import {
  calculateTotalTokenValue,
  getTokenSymbol,
} from "../../utils/tokenUtils";
import { TokenImage } from "../shared/TokenImage";
import { OptimizationOptions } from "./OptimizeTab";

interface DustToken {
  id: string;
  symbol: string;
  optimized_symbol?: string;
  amount: number;
  price: number;
  logo_url?: string;
}

interface OptimizationSelectorProps {
  options: OptimizationOptions;
  onChange: (options: OptimizationOptions) => void;
  dustTokens: DustToken[];
  loadingTokens: boolean;
  mockData: {
    rebalanceActions: number;
    chainCount: number;
  };
}

export const OptimizationSelector = memo(function OptimizationSelector({
  options,
  onChange,
  dustTokens,
  loadingTokens,
  mockData,
}: OptimizationSelectorProps) {
  const handleToggle = (
    type: keyof Pick<OptimizationOptions, "convertDust" | "rebalancePortfolio">
  ) => {
    onChange({
      ...options,
      [type]: !options[type],
    });
  };

  // Memoize expensive calculations to avoid recalculating on every render
  const dustTokenData = useMemo(() => {
    const dustValue = calculateTotalTokenValue(dustTokens);
    const dustTokenCount = dustTokens.length;
    const displayTokens = dustTokens
      .slice() // create a shallow copy to avoid mutating the original array
      .sort((a, b) => b.price * b.amount - a.price * a.amount)
      .slice(0, 3); // Show top 3 tokens by value

    return {
      dustValue,
      dustTokenCount,
      displayTokens,
    };
  }, [dustTokens]);
  return (
    <div className="space-y-4">
      <h4 className="font-semibold text-white">Choose Optimizations</h4>

      <div className="space-y-3">
        {/* Dust Conversion Option */}
        <label
          className={`flex items-center space-x-4 p-4 rounded-xl cursor-pointer transition-all duration-300 ${
            options.convertDust
              ? "bg-blue-500/20 border border-blue-500/50"
              : "bg-gray-900/30 border border-gray-700 hover:bg-gray-900/50"
          }`}
          onClick={() => handleToggle("convertDust")}
        >
          <input
            type="checkbox"
            checked={options.convertDust}
            onChange={() => handleToggle("convertDust")}
            className="w-5 h-5 rounded border-gray-600 bg-gray-800 text-blue-500 focus:ring-blue-500 focus:ring-2"
          />

          <div className="flex items-center space-x-3 flex-1">
            <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <Coins className="w-5 h-5 text-blue-500" />
            </div>

            <div className="flex-1">
              <div className="font-medium text-white">Convert Dust to ETH</div>
              <div className="text-sm text-gray-400">
                {loadingTokens ? (
                  "Loading dust tokens..."
                ) : dustTokenData.dustTokenCount > 0 ? (
                  <>
                    Convert {dustTokenData.dustTokenCount} small token balances
                    worth {formatSmallCurrency(dustTokenData.dustValue)}
                  </>
                ) : (
                  "No dust tokens found"
                )}
              </div>
              <div className="text-xs text-blue-400 mt-1">
                Estimated savings: ~$2.50 in gas fees
              </div>

              {/* Token Previews */}
              {dustTokenData.dustTokenCount > 0 && (
                <div className="flex items-center gap-2 mt-2">
                  <div className="text-xs text-gray-400">Tokens:</div>
                  <div className="flex items-center gap-1">
                    {dustTokenData.displayTokens.map(token => (
                      <div key={token.id} className="flex items-center gap-1">
                        <TokenImage token={token} size={16} />
                        <span className="text-xs text-gray-400">
                          {getTokenSymbol(token)}
                        </span>
                      </div>
                    ))}
                    {dustTokenData.dustTokenCount > 3 && (
                      <span className="text-xs text-gray-400">
                        +{dustTokenData.dustTokenCount - 3} more
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="text-right">
              <div className="text-lg font-bold text-blue-500">
                {loadingTokens
                  ? "..."
                  : formatSmallCurrency(dustTokenData.dustValue)}
              </div>
              <div className="text-xs text-gray-400">
                {dustTokenData.dustTokenCount} tokens
              </div>
            </div>
          </div>
        </label>

        {/* Portfolio Rebalance Option */}
        <label
          className={`flex items-center space-x-4 p-4 rounded-xl cursor-pointer transition-all duration-300 ${
            options.rebalancePortfolio
              ? "bg-purple-500/20 border border-purple-500/50"
              : "bg-gray-900/30 border border-gray-700 hover:bg-gray-900/50"
          }`}
          onClick={() => handleToggle("rebalancePortfolio")}
        >
          <input
            type="checkbox"
            checked={options.rebalancePortfolio}
            onChange={() => handleToggle("rebalancePortfolio")}
            className="w-5 h-5 rounded border-gray-600 bg-gray-800 text-purple-500 focus:ring-purple-500 focus:ring-2"
          />

          <div className="flex items-center space-x-3 flex-1">
            <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
              <ArrowRightLeft className="w-5 h-5 text-purple-500" />
            </div>

            <div className="flex-1">
              <div className="font-medium text-white">Rebalance Portfolio</div>
              <div className="text-sm text-gray-400">
                Optimize allocation across {mockData.chainCount} chains with{" "}
                {mockData.rebalanceActions} actions
              </div>
              <div className="text-xs text-purple-400 mt-1">
                Estimated improvement: +2.3% APR efficiency
              </div>
            </div>

            <div className="text-right">
              <div className="text-lg font-bold text-purple-500">
                {mockData.rebalanceActions}
              </div>
              <div className="text-xs text-gray-400">actions</div>
            </div>
          </div>
        </label>
      </div>
    </div>
  );
});
