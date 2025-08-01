"use client";

import { ArrowDown, ChevronDown, Settings, Zap } from "lucide-react";
import { useState, useCallback } from "react";
import { formatCurrency } from "../../lib/utils";
import { InvestmentOpportunity } from "../../types/investment";
import { SwapToken } from "../../types/swap";
import { SWAP_CONSTANTS } from "../../constants/swap";
import { AmountButtons } from "./AmountButtons";
import { IntentProgressModal } from "./IntentProgressModal";
import { GRADIENTS } from "@/constants/design-system";
import { GlassCard, GradientButton } from "../ui";

interface SwapTabProps {
  strategy: InvestmentOpportunity;
  fromToken: SwapToken;
  fromAmount: string;
  onFromAmountChange: (amount: string) => void;
  onTokenSelectorOpen: () => void;
  onStrategySelectorOpen?: () => void;
}

export function SwapTab({
  strategy,
  fromToken,
  fromAmount,
  onFromAmountChange,
  onTokenSelectorOpen,
  onStrategySelectorOpen,
}: SwapTabProps) {
  const [isProgressModalOpen, setIsProgressModalOpen] = useState(false);

  // Determine UI behavior based on navigation context
  // - ZapIn: User came from WalletPortfolio ZapIn button, needs to select strategy
  // - ZapOut: User came from WalletPortfolio ZapOut button, needs to select position to exit
  // - Invest: User came from portfolio optimization, strategy is pre-selected (default behavior)
  const isZapIn = strategy.navigationContext === "zapIn";
  const isZapOut = strategy.navigationContext === "zapOut";
  const isInvest =
    strategy.navigationContext === "invest" || !strategy.navigationContext;

  const estimatedShares = fromAmount
    ? (
        parseFloat(fromAmount) / SWAP_CONSTANTS.SHARES_CALCULATION_DIVISOR
      ).toFixed(4)
    : "0";
  const minimumReceived = fromAmount
    ? (parseFloat(fromAmount) * SWAP_CONSTANTS.MINIMUM_RECEIVED_RATE).toFixed(2)
    : "0";

  const handleSwapClick = useCallback(() => {
    if (fromAmount && parseFloat(fromAmount) > 0) {
      setIsProgressModalOpen(true);
    }
  }, [fromAmount]);

  const handleCloseProgressModal = useCallback(() => {
    setIsProgressModalOpen(false);
  }, []);

  return (
    <GlassCard testId="swap-tab">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold gradient-text">
          {isZapIn
            ? "ZapIn to Strategy"
            : isZapOut
              ? "ZapOut from Strategy"
              : "Swap & Invest"}
        </h3>
        <Settings className="w-5 h-5 text-gray-400" />
      </div>

      <div className="max-w-md mx-auto space-y-4">
        {/* From */}
        <div
          className="p-5 rounded-2xl bg-gray-900/50 border border-gray-700"
          data-testid="from-section"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-400">From</span>
            <span className="text-sm text-gray-400" data-testid="token-balance">
              {formatCurrency(fromToken.balance * fromToken.price)}
            </span>
          </div>
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <button
                onClick={onTokenSelectorOpen}
                className="flex items-center space-x-2 px-3 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 transition-colors cursor-pointer"
                data-testid="token-selector-button"
              >
                <div className="w-6 h-6 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600" />
                <span
                  className="font-semibold text-white"
                  data-testid="selected-token"
                >
                  {fromToken.symbol}
                </span>
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </button>
              <input
                type="number"
                placeholder="0.0"
                value={fromAmount}
                onChange={e => onFromAmountChange(e.target.value)}
                className="flex-1 bg-transparent text-2xl font-bold text-white placeholder-gray-500 outline-none"
                data-testid="from-amount-input"
              />
            </div>
            <AmountButtons
              fromToken={fromToken}
              onAmountChange={onFromAmountChange}
            />
          </div>
        </div>

        {/* Arrow */}
        <div className="flex justify-center">
          <div className="p-3 rounded-full glass-morphism border border-gray-700">
            <ArrowDown className="w-5 h-5 text-gray-400" />
          </div>
        </div>

        {/* To */}
        <div
          className="p-5 rounded-2xl bg-gray-900/50 border border-gray-700"
          data-testid="to-section"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-400">To</span>
            <span
              className="text-sm text-gray-400"
              data-testid="estimated-shares"
            >
              {isInvest ? `~${estimatedShares} shares` : "Select strategy"}
            </span>
          </div>

          {/* Context-aware "To" content */}
          {isZapIn ? (
            /* ZapIn: Show strategy selector */
            <button
              onClick={onStrategySelectorOpen}
              className="w-full flex items-center space-x-3 px-3 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 transition-colors cursor-pointer"
              data-testid="strategy-selector-button"
            >
              <div className="w-8 h-8 rounded-xl bg-gradient-to-r from-purple-500 to-blue-600 flex items-center justify-center">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1 text-left">
                <div className="font-semibold text-white">Select Strategy</div>
                <div className="text-sm text-gray-400">
                  Choose vault to invest in
                </div>
              </div>
              <ChevronDown className="w-4 h-4 text-gray-400" />
            </button>
          ) : isZapOut ? (
            /* ZapOut: Show position selector (placeholder for now) */
            <button
              onClick={onStrategySelectorOpen}
              className="w-full flex items-center space-x-3 px-3 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 transition-colors cursor-pointer"
              data-testid="position-selector-button"
            >
              <div className="w-8 h-8 rounded-xl bg-gradient-to-r from-red-500 to-rose-600 flex items-center justify-center">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1 text-left">
                <div className="font-semibold text-white">Select Position</div>
                <div className="text-sm text-gray-400">
                  Choose vault to exit from
                </div>
              </div>
              <ChevronDown className="w-4 h-4 text-gray-400" />
            </button>
          ) : (
            /* Default/Invest: Show selected strategy */
            <div className="flex items-center space-x-3">
              <div
                className={`w-8 h-8 rounded-xl bg-gradient-to-r ${strategy.color} flex items-center justify-center`}
              >
                <Zap className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1">
                <div className="font-semibold text-white">{strategy.name}</div>
                <div className="text-sm text-gray-400">{strategy.category}</div>
              </div>
              <div
                className="text-2xl font-bold text-white"
                data-testid="estimated-value"
              >
                {fromAmount
                  ? (
                      parseFloat(fromAmount) * SWAP_CONSTANTS.CONVERSION_RATE
                    ).toFixed(2)
                  : "0.0"}
              </div>
            </div>
          )}
        </div>

        {/* Swap Details */}
        {fromAmount && (
          <div
            className="p-4 rounded-2xl bg-gray-900/30 border border-gray-700/50"
            data-testid="swap-details"
          >
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Network Fee</span>
                <span className="text-white">
                  ~${SWAP_CONSTANTS.NETWORK_FEE}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Slippage</span>
                <span className="text-white">
                  {SWAP_CONSTANTS.DEFAULT_SLIPPAGE}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Min. Received</span>
                <span className="text-white" data-testid="minimum-received">
                  ${minimumReceived}
                </span>
              </div>
            </div>
          </div>
        )}

        <GradientButton
          disabled={!fromAmount || parseFloat(fromAmount) <= 0}
          gradient={GRADIENTS.PRIMARY}
          className="w-full py-4"
          testId="swap-invest-button"
          onClick={handleSwapClick}
        >
          {!fromAmount || parseFloat(fromAmount) <= 0
            ? "Enter Amount"
            : "Swap & Invest"}
        </GradientButton>
      </div>

      {/* Intent Progress Modal */}
      <IntentProgressModal
        isOpen={isProgressModalOpen}
        onClose={handleCloseProgressModal}
        strategy={{
          name: strategy.name,
          color: strategy.color,
        }}
        amount={fromAmount}
        fromToken={fromToken.symbol}
        showDetailed={true}
      />
    </GlassCard>
  );
}
