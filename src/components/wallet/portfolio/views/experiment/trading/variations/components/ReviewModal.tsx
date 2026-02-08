"use client";

import { Modal, ModalContent } from "@/components/ui/modal";
import {
  SubmittingState,
  TransactionModalHeader,
} from "@/components/wallet/portfolio/modals/components/TransactionModalParts";
import { cn } from "@/lib/ui/classNames";
import type { TradeSuggestion } from "@/types/strategy";
import { formatCurrency } from "@/utils/formatters";
import {
  ArrowRight,
  ArrowRightLeft,
  GitMerge,
  LineChart,
  ShieldCheck,
} from "lucide-react";
import { ImpactVisual } from "./ImpactVisual";

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isSubmitting?: boolean;
  trades: TradeSuggestion[];
  totalValue: number;
  title?: string;
}

// --- Helpers ---

const enrichTradeSteps = (trade: TradeSuggestion) => {
  const isBuy = trade.action === "buy";
  const asset =
    trade.bucket === "spot"
      ? "BTC"
      : trade.bucket === "stable"
        ? "USDC"
        : "BTC-USDC LP";

  // Mock logic to determine chain flow
  const sourceChain = isBuy ? "Arbitrum" : "Ethereum";
  const targetChain = isBuy ? "Ethereum" : "Arbitrum";
  const protocol = isBuy ? "Uniswap V3" : "Aave V3";

  // Generate steps based on action
  const steps = [];

  if (trade.action === "sell") {
    steps.push({
      label: `Withdraw ${asset}`,
      detail: `from ${protocol} (${sourceChain})`,
      icon: ArrowRightLeft,
    });
    steps.push({
      label: `Bridge Funds`,
      detail: `via Across Protocol to ${targetChain}`,
      icon: GitMerge,
    });
    steps.push({
      label: `Swap to USDC`,
      detail: `on 1inch Aggregator`,
      icon: ArrowRight,
    });
  } else {
    steps.push({
      label: `Bridge USDC`,
      detail: `via Stargate to ${targetChain}`,
      icon: GitMerge,
    });
    steps.push({
      label: `Buy ${asset}`,
      detail: `on ${protocol}`,
      icon: ArrowRight,
    });
    steps.push({
      label: `Deposit`,
      detail: `into Strategy Vault`,
      icon: ShieldCheck,
    });
  }

  return { ...trade, steps, protocol, sourceChain, targetChain, asset };
};

// --- Components ---

function RegimeContext() {
  return (
    <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-4 flex items-start gap-4">
      <div className="p-2 bg-indigo-500/20 rounded-lg">
        <LineChart className="w-5 h-5 text-indigo-400" />
      </div>
      <div>
        <h4 className="text-sm font-bold text-indigo-100 flex items-center gap-2">
          Uptrend Detected
          <span className="text-[10px] bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full font-mono uppercase">
            Bullish
          </span>
        </h4>
        <p className="text-xs text-indigo-300 mt-1 leading-relaxed">
          BTC Price <strong className="font-mono text-white">$65,400</strong> is
          above the 200-Day Moving Average{" "}
          <strong className="font-mono text-white">($58,200)</strong>. Strategy
          recommends increasing Spot exposure.
        </p>
      </div>
    </div>
  );
}

function ExecutionTimeline({ trades }: { trades: TradeSuggestion[] }) {
  const enrichedTrades = trades.map(enrichTradeSteps);

  return (
    <div className="space-y-4">
      <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
        Execution Route
      </h4>
      <div className="relative pl-4">
        {/* Timeline Line */}
        <div className="absolute left-[27px] top-4 bottom-4 w-px bg-gradient-to-b from-transparent via-gray-800 to-transparent" />

        {enrichedTrades.map((t, i) => (
          <div key={i} className="relative pl-10 pb-8 last:pb-0">
            {/* Trade Node */}
            <div className="absolute left-3 top-0 w-6 h-6 rounded-full bg-gray-950 border-2 border-gray-800 z-10 flex items-center justify-center">
              <div
                className={cn(
                  "w-2 h-2 rounded-full",
                  t.action === "buy" ? "bg-green-500" : "bg-red-500"
                )}
              />
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 shadow-sm">
              {/* Trade Header */}
              <div className="flex justify-between items-center mb-3 pb-3 border-b border-gray-800">
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "text-xs font-bold uppercase px-1.5 py-0.5 rounded",
                      t.action === "buy"
                        ? "bg-green-900/30 text-green-400"
                        : "bg-red-900/30 text-red-400"
                    )}
                  >
                    {t.action}
                  </span>
                  <span className="text-sm font-bold text-white">
                    {t.asset}
                  </span>
                </div>
                <span className="font-mono text-sm text-gray-400">
                  {formatCurrency(t.amount_usd)}
                </span>
              </div>

              {/* Steps */}
              <div className="space-y-3">
                {t.steps.map((step, idx) => (
                  <div key={idx} className="flex items-start gap-3 text-xs">
                    <step.icon className="w-3.5 h-3.5 text-gray-500 mt-0.5" />
                    <div>
                      <span className="font-medium text-gray-300 block">
                        {step.label}
                      </span>
                      <span className="text-gray-600">{step.detail}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TradeList({ trades }: { trades: TradeSuggestion[] }) {
  return (
    <div className="space-y-3">
      {trades.map((trade, i) => (
        <div
          key={i}
          className="flex justify-between items-center bg-gray-900/50 border border-gray-800 rounded-xl p-4"
        >
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "w-2 h-2 rounded-full",
                trade.action === "buy" ? "bg-green-500" : "bg-red-500"
              )}
            />
            <span className="text-sm font-medium text-gray-300 capitalize">
              {trade.action} {trade.bucket.toUpperCase()}
            </span>
          </div>
          <span className="font-mono text-white">
            {formatCurrency(trade.amount_usd)}
          </span>
        </div>
      ))}
    </div>
  );
}

// --- Variation 1: Simple (List focused) ---

export function ReviewModalSimple({
  isOpen,
  onClose,
  onConfirm,
  isSubmitting = false,
  trades,
  title = "Confirm Strategy",
}: ReviewModalProps) {
  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="md">
      <ModalContent className="p-0 overflow-hidden bg-gray-950 border-gray-800">
        <TransactionModalHeader
          title={title}
          indicatorClassName="bg-indigo-500"
          isSubmitting={isSubmitting}
          onClose={onClose}
        />

        <div className="p-6">
          {isSubmitting ? (
            <SubmittingState isSuccess={false} />
          ) : (
            <div className="space-y-6">
              <RegimeContext />
              <TradeList trades={trades} />

              <button
                onClick={onConfirm}
                className="w-full py-4 rounded-xl bg-white text-black font-bold hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
              >
                Confirm Execution
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </ModalContent>
    </Modal>
  );
}

// --- Variation 2: Visual (Chart focused) ---

export function ReviewModalVisual({
  isOpen,
  onClose,
  onConfirm,
  isSubmitting = false,
  trades,
  totalValue,
  title = "Review Allocation",
}: ReviewModalProps) {
  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="lg">
      <ModalContent className="p-0 overflow-hidden bg-gray-950 border-gray-800">
        <TransactionModalHeader
          title={title}
          indicatorClassName="bg-purple-500"
          isSubmitting={isSubmitting}
          onClose={onClose}
        />

        <div className="p-6">
          {isSubmitting ? (
            <SubmittingState isSuccess={false} />
          ) : (
            <div className="space-y-8">
              <div className="bg-gray-900/50 rounded-2xl p-6 border border-gray-800">
                <ImpactVisual trades={trades} totalValue={totalValue} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <RegimeContext />
                <TradeList trades={trades} />
              </div>

              <div className="pt-4 border-t border-gray-800">
                <button
                  onClick={onConfirm}
                  className="w-full py-4 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-bold hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shadow-lg shadow-purple-500/20"
                >
                  Confirm Rebalance
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </ModalContent>
    </Modal>
  );
}

// --- Variation 3: Detailed (Timeline focused) ---

export function ReviewModalTimeline({
  isOpen,
  onClose,
  onConfirm,
  isSubmitting = false,
  trades,
  title = "Execution Plan",
}: ReviewModalProps) {
  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="md">
      <ModalContent className="p-0 overflow-hidden bg-gray-950 border-gray-800 flex flex-col max-h-[85vh]">
        <TransactionModalHeader
          title={title}
          indicatorClassName="bg-green-500"
          isSubmitting={isSubmitting}
          onClose={onClose}
        />

        <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
          {isSubmitting ? (
            <SubmittingState isSuccess={false} />
          ) : (
            <div className="space-y-8">
              <RegimeContext />
              <div className="border-t border-dashed border-gray-800" />
              <ExecutionTimeline trades={trades} />
            </div>
          )}
        </div>

        {!isSubmitting && (
          <div className="p-6 border-t border-gray-800 bg-gray-900/50">
            <button
              onClick={onConfirm}
              className="w-full py-4 rounded-xl bg-gray-800 text-white font-bold hover:bg-gray-700 transition-colors border border-gray-700 flex items-center justify-center gap-2"
            >
              Start Execution
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </ModalContent>
    </Modal>
  );
}

export function ReviewModal(props: ReviewModalProps) {
  return <ReviewModalVisual {...props} />;
}
