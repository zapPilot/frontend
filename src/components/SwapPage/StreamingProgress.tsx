"use client";

import { ImageWithFallback } from "../shared/ImageWithFallback";
import { formatSmallNumber } from "../../utils/formatters";
import { getSimpleWalletName } from "../../utils/walletBatching";
import { GlassCard } from "../ui";
import { TradingSummary } from "./TradingSummary";
import { WalletTransactionProgress } from "./WalletTransactionProgress";

interface StreamingProgressProps {
  // Streaming state
  isStreaming: boolean;
  events: any[];
  totalTokens: number;
  processedTokens: number;
  progress: number;
  batchesCompleted: number;

  // Error states
  streamError: string | null;
  tokensError: string | null;
  walletError: string | null;

  // Wallet transaction state
  sendingToWallet: boolean;
  walletSuccess: boolean;
  batchProgress: any[];
  currentBatchIndex: number;
  activeAccount: any;

  // UI state
  showTechnicalDetails: boolean;
  onToggleTechnicalDetails: () => void;
}

export function StreamingProgress({
  isStreaming,
  events,
  totalTokens,
  processedTokens,
  progress,
  batchesCompleted,
  streamError,
  tokensError,
  walletError,
  sendingToWallet,
  walletSuccess,
  batchProgress,
  currentBatchIndex,
  activeAccount,
  showTechnicalDetails,
  onToggleTechnicalDetails,
}: StreamingProgressProps) {
  // Only show if there's streaming activity or events to display
  const shouldShow = isStreaming || events.length > 0;

  if (!shouldShow) {
    return null;
  }

  return (
    <GlassCard>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">DustZap Progress</h3>
          <div className="text-sm text-gray-400">
            {isStreaming ? "Processing..." : "Complete"}
          </div>
        </div>

        {totalTokens > 0 && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Token Conversion</span>
              <span>
                {processedTokens}/{totalTokens}
              </span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {batchesCompleted > 0 && (
          <div className="text-sm text-gray-400">
            Batches completed: {batchesCompleted}
          </div>
        )}

        {(streamError || tokensError || walletError) && (
          <div className="text-sm text-red-400 bg-red-900/20 p-2 rounded">
            Error: {streamError || tokensError || walletError}
          </div>
        )}

        {/* Enhanced Wallet Transaction Progress */}
        <WalletTransactionProgress
          isVisible={
            sendingToWallet || walletSuccess || batchProgress.length > 0
          }
          overallStatus={
            walletSuccess
              ? "completed"
              : sendingToWallet
                ? "processing"
                : walletError
                  ? "failed"
                  : "idle"
          }
          batches={batchProgress}
          currentBatch={currentBatchIndex}
          walletType={getSimpleWalletName(activeAccount)}
        />

        {/* Trading Summary */}
        <TradingSummary
          events={events}
          showTechnicalDetails={showTechnicalDetails}
          onToggleTechnicalDetails={onToggleTechnicalDetails}
        />

        {/* Scrollable Events List */}
        <div className="max-h-64 overflow-y-auto space-y-2">
          {events
            .filter(
              (event: any) => event.type === "token_ready" && event.provider
            )
            .map((event: any, index) => {
              const tradingLoss = event.tradingLoss;
              const inputValue = tradingLoss?.inputValueUSD || 0;
              const outputValue = tradingLoss?.outputValueUSD || 0;
              const netLoss = tradingLoss?.netLossUSD || 0;
              const lossPercentage = tradingLoss?.lossPercentage || 0;
              const gasCost = event.gasCostUSD || 0;

              return (
                <div
                  key={index}
                  className="bg-gray-800/30 rounded-lg p-3 border border-gray-700/30"
                >
                  {/* Main conversion info */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <ImageWithFallback
                        src={`https://zap-assets-worker.davidtnfsh.workers.dev/tokenPictures/${event.tokenSymbol?.toLowerCase()}.webp`}
                        alt={event.tokenSymbol || "Token"}
                        fallbackType="token"
                        symbol={event.tokenSymbol}
                        size={20}
                      />
                      <span className="font-medium text-blue-300 text-sm">
                        {event.tokenSymbol || "Token"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400">via</span>
                      <ImageWithFallback
                        src={`https://zap-assets-worker.davidtnfsh.workers.dev/projectPictures/${event.provider?.toLowerCase()}.webp`}
                        alt={event.provider || "Provider"}
                        fallbackType="project"
                        symbol={event.provider}
                        size={16}
                      />
                      <span className="text-green-400 text-sm">
                        {event.provider}
                      </span>
                    </div>
                  </div>

                  {/* Simplified info - always visible */}
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-300">
                      ${formatSmallNumber(inputValue)} converted
                    </span>
                    {(() => {
                      const isGain = netLoss < 0; // Negative = gain
                      const isBreakEven = Math.abs(netLoss) < 0.01;

                      return (
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-xs ${
                              isBreakEven
                                ? "text-gray-400"
                                : isGain
                                  ? "text-green-400"
                                  : "text-red-400"
                            }`}
                          >
                            {isBreakEven
                              ? "Break Even"
                              : isGain
                                ? "Arbitrage +"
                                : "Loss -"}
                            ${formatSmallNumber(Math.abs(netLoss))}
                          </span>
                          <span className="text-green-400">✓</span>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Technical details - only when expanded */}
                  {showTechnicalDetails && (
                    <div className="mt-2 pt-2 border-t border-gray-700/50 space-y-1">
                      <div className="flex justify-between text-xs text-gray-400">
                        <span>Input Value:</span>
                        <span>${formatSmallNumber(inputValue)}</span>
                      </div>
                      <div className="flex justify-between text-xs text-gray-400">
                        <span>Output Value:</span>
                        <span>${formatSmallNumber(outputValue)}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        {(() => {
                          const isGain = netLoss < 0; // Negative = gain
                          const isBreakEven = Math.abs(netLoss) < 0.01;

                          return (
                            <>
                              <span>
                                {isBreakEven
                                  ? "Trading Impact:"
                                  : isGain
                                    ? "Arbitrage Gain:"
                                    : "Trading Loss:"}
                              </span>
                              <span
                                className={
                                  isBreakEven
                                    ? "text-gray-400"
                                    : isGain
                                      ? "text-green-400"
                                      : "text-red-400"
                                }
                              >
                                {isGain ? "+" : ""}$
                                {formatSmallNumber(Math.abs(netLoss))} (
                                {lossPercentage >= 0 ? "" : "+"}
                                {formatSmallNumber(Math.abs(lossPercentage))}
                                %)
                              </span>
                            </>
                          );
                        })()}
                      </div>
                      <div className="flex justify-between text-xs text-gray-400">
                        <span>Gas Cost:</span>
                        <span>${formatSmallNumber(gasCost)}</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
        </div>
      </div>
    </GlassCard>
  );
}
