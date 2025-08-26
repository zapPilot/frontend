"use client";

import { getSimpleWalletName } from "../../utils/walletBatching";
import { GlassCard } from "../ui";
import { TradingSummary } from "./TradingSummary";
import { WalletTransactionProgress } from "./WalletTransactionProgress";
import { EventsList } from "./EventsList";
import type { Account } from "thirdweb/wallets";

/**
 * Event data structure for streaming events
 */
interface StreamingEvent {
  type: string;
  tokenSymbol?: string;
  provider?: string;
  tradingLoss?: {
    inputValueUSD: number;
    outputValueUSD: number;
    netLossUSD: number;
    lossPercentage: number;
  };
  gasCostUSD?: number;
}

/**
 * Batch progress information for wallet transactions
 */
interface BatchProgress {
  index: number;
  status: "pending" | "processing" | "completed" | "failed";
  transactionHash?: string;
  error?: string;
}

interface StreamingProgressProps {
  // Streaming state
  isStreaming: boolean;
  events: StreamingEvent[];
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
  batchProgress: BatchProgress[];
  currentBatchIndex: number;
  activeAccount: Account | undefined;

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

        {/* Events List */}
        <EventsList
          events={events}
          showTechnicalDetails={showTechnicalDetails}
        />
      </div>
    </GlassCard>
  );
}
