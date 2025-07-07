"use client";

import {
  ArrowRight,
  Coins,
  ArrowRightLeft,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";
import { OptimizationOptions } from "./OptimizeTab";

interface OptimizationPreviewProps {
  options: OptimizationOptions;
  mockData: {
    dustValue: number;
    dustTokenCount: number;
    rebalanceActions: number;
    chainCount: number;
    totalSavings: number;
    estimatedGasSavings: number;
  };
}

export function OptimizationPreview({
  options,
  mockData,
}: OptimizationPreviewProps) {
  const mockDustTokens = [
    { symbol: "USDC", amount: 0.05, value: 0.05 },
    { symbol: "DAI", amount: 1.23, value: 1.23 },
    { symbol: "LINK", amount: 0.1, value: 2.15 },
    { symbol: "UNI", amount: 0.5, value: 4.25 },
    { symbol: "AAVE", amount: 0.02, value: 1.89 },
  ];

  const mockRebalanceActions = [
    {
      action: "Withdraw from Ethereum",
      amount: "$1,250",
      from: "ETH Staking",
      to: "Bridge",
    },
    {
      action: "Bridge to Polygon",
      amount: "$1,250",
      from: "Ethereum",
      to: "Polygon",
    },
    {
      action: "Deposit to Polygon Pool",
      amount: "$1,250",
      from: "Bridge",
      to: "MATIC-USDC LP",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Summary Header */}
      <div className="bg-gradient-to-r from-purple-900/20 to-blue-900/20 p-4 rounded-xl border border-purple-500/30">
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-semibold text-white">Optimization Summary</h4>
          <div className="flex items-center space-x-2 text-green-400">
            <CheckCircle className="w-4 h-4" />
            <span className="text-sm">Ready to execute</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-400">Estimated Savings:</span>
            <div className="text-green-400 font-bold">
              ${mockData.totalSavings}
            </div>
          </div>
          <div>
            <span className="text-gray-400">Gas Savings:</span>
            <div className="text-green-400 font-bold">
              {mockData.estimatedGasSavings} ETH
            </div>
          </div>
        </div>
      </div>

      {/* Dust Conversion Preview */}
      {options.convertDust && (
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Coins className="w-5 h-5 text-blue-500" />
            <h5 className="font-semibold text-white">Dust Token Conversion</h5>
          </div>

          <div className="bg-gray-900/50 p-4 rounded-xl border border-gray-700">
            <div className="space-y-3">
              {mockDustTokens.slice(0, 3).map((token, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600" />
                    <div>
                      <div className="text-sm font-medium text-white">
                        {token.symbol}
                      </div>
                      <div className="text-xs text-gray-400">
                        {token.amount} tokens
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-400">
                      ${token.value.toFixed(2)}
                    </span>
                    <ArrowRight className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-blue-400">ETH</span>
                  </div>
                </div>
              ))}

              {mockDustTokens.length > 3 && (
                <div className="text-center text-sm text-gray-400 pt-2 border-t border-gray-700">
                  +{mockDustTokens.length - 3} more tokens...
                </div>
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-gray-700 flex justify-between">
              <span className="text-sm text-gray-400">Total Conversion:</span>
              <span className="text-sm font-bold text-blue-400">
                ${mockData.dustValue} → ETH
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Portfolio Rebalance Preview */}
      {options.rebalancePortfolio && (
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <ArrowRightLeft className="w-5 h-5 text-purple-500" />
            <h5 className="font-semibold text-white">Portfolio Rebalancing</h5>
          </div>

          <div className="bg-gray-900/50 p-4 rounded-xl border border-gray-700">
            <div className="space-y-3">
              {mockRebalanceActions.map((action, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="text-sm font-medium text-white">
                      {action.action}
                    </div>
                    <div className="text-xs text-gray-400">
                      {action.from} → {action.to}
                    </div>
                  </div>

                  <div className="text-sm font-bold text-purple-400">
                    {action.amount}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-4 border-t border-gray-700 flex justify-between">
              <span className="text-sm text-gray-400">Total Actions:</span>
              <span className="text-sm font-bold text-purple-400">
                {mockData.rebalanceActions} transactions
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Risk Warning */}
      <div className="bg-amber-900/20 p-4 rounded-xl border border-amber-500/30">
        <div className="flex items-start space-x-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 mt-0.5" />
          <div>
            <h6 className="text-sm font-semibold text-amber-400">
              Important Notes
            </h6>
            <ul className="text-xs text-gray-300 mt-2 space-y-1">
              <li>• Slippage tolerance set to {options.slippage}%</li>
              <li>• Transactions will be executed sequentially</li>
              <li>
                • Gas fees will be optimized for current network conditions
              </li>
              <li>• You can cancel the process at any time before signing</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Network Fee Estimate */}
      <div className="bg-gray-900/50 p-4 rounded-xl border border-gray-700">
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-400">Estimated Network Fees:</span>
            <span className="text-white">~0.015 ETH ($38.50)</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Slippage Tolerance:</span>
            <span className="text-white">{options.slippage}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Minimum Received:</span>
            <span className="text-white">
              ${(mockData.dustValue * (1 - options.slippage / 100)).toFixed(2)}{" "}
              ETH
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
