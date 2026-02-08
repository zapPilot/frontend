"use client";

import { Modal, ModalContent } from "@/components/ui/modal";
import {
  SubmittingState,
  TransactionModalHeader,
} from "@/components/wallet/portfolio/modals/components/TransactionModalParts";
import { cn } from "@/lib/ui/classNames";
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  Cpu,
  Globe,
  Info,
  Layers,
  LineChart,
  ShieldCheck,
  Zap
} from "lucide-react";
import { useState } from "react";

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isSubmitting?: boolean;
  trades?: any[];
  totalValue?: number;
  title?: string;
}

// --- Mock Data ---

const MOCK_INTENTS = [
  {
    id: 1,
    title: "Bridge Liquidity",
    description: "Move 10.5 ETH from Ethereum to Arbitrum via Across",
    status: "pending",
  },
  {
    id: 2,
    title: "Protocol Swap",
    description: "Convert ETH to WBTC on Uniswap V3 (0.05% fee tier)",
    status: "pending",
  },
  {
    id: 3,
    title: "Vault Deposit",
    description: "Supply WBTC to the All-Weather Alpha Vault",
    status: "pending",
  },
  {
    id: 4,
    title: "Reward Lock",
    description: "Auto-stake generated GMX rewards for compounding",
    status: "pending",
  },
];

const MOCK_ROUTE = [
  {
    type: "source",
    chain: "Ethereum Mainnet",
    asset: "10.5 ETH",
    icon: Globe,
  },
  {
    type: "bridge",
    protocol: "Across Protocol",
    duration: "~2 mins",
    icon: Zap,
  },
  {
    type: "target",
    chain: "Arbitrum One",
    asset: "10.5 ETH",
    icon: Globe,
  },
  {
    type: "action",
    protocol: "Uniswap V3",
    action: "Swap ETH -> WBTC",
    impact: "-0.02%",
    icon: Cpu,
  },
  {
    type: "finish",
    protocol: "All-Weather Vault",
    action: "Vault Allocation",
    icon: ShieldCheck,
  },
];

const MOCK_LOGIC = {
  reason: "Volatility Expansion",
  details: [
    {
      label: "Current Market Regime",
      value: "High Volatility / Uptrend",
      sentiment: "positive",
    },
    {
      label: "Signal Source",
      value: "On-chain MVRV Z-Score + RSI",
      sentiment: "neutral",
    },
    {
      label: "Action Rationale",
      value:
        "The strategy is shifting from 40% stables to 80% spot assets to capture the upcoming momentum phase while maintaining a trailing stop-loss.",
      sentiment: "neutral",
    },
    {
      label: "Estimated Monthly Yield",
      value: "+12.4% APY",
      sentiment: "positive",
    },
  ],
};

// --- Components for Variations ---

function VariationChecklist() {
  return (
    <div className="space-y-4">
      <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl flex gap-3">
        <Info className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
        <p className="text-xs text-blue-200 leading-relaxed">
          By signing this transaction, you are authorizing the following sequence
          of actions to be performed by our smart execution engine.
        </p>
      </div>

      <div className="space-y-3">
        {MOCK_INTENTS.map((intent, i) => (
          <div
            key={intent.id}
            className="group flex gap-4 p-4 bg-gray-900 border border-gray-800 rounded-2xl hover:border-gray-700 transition-colors"
          >
            <div className="relative flex flex-col items-center">
              <div className="w-6 h-6 rounded-full border-2 border-gray-700 flex items-center justify-center shrink-0">
                <span className="text-[10px] font-bold text-gray-500">
                  {i + 1}
                </span>
              </div>
              {i !== MOCK_INTENTS.length - 1 && (
                <div className="w-px flex-1 bg-gray-800 my-1" />
              )}
            </div>
            <div>
              <h4 className="text-sm font-bold text-white mb-1">
                {intent.title}
              </h4>
              <p className="text-xs text-gray-400">{intent.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function VariationRoute() {
  return (
    <div className="space-y-6">
      <div className="relative">
        {/* Connection Line */}
        <div className="absolute left-[23px] top-6 bottom-6 w-px border-l-2 border-dashed border-gray-800" />

        <div className="space-y-6">
          {MOCK_ROUTE.map((step, i) => (
            <div key={i} className="relative flex items-center gap-4">
              <div
                className={cn(
                  "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 z-10",
                  step.type === "finish"
                    ? "bg-green-500/20 border border-green-500/30 text-green-400 shadow-lg shadow-green-500/10"
                    : "bg-gray-900 border border-gray-800 text-gray-400"
                )}
              >
                <step.icon className="w-6 h-6" />
              </div>

              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
                    {step.type}
                  </span>
                  {step.duration && (
                    <span className="flex items-center gap-1 text-[10px] text-gray-500">
                      <Clock className="w-3 h-3" /> {step.duration}
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between mt-1">
                  <div className="text-sm font-bold text-white">
                    {step.chain || step.protocol}
                  </div>
                  <div className="text-sm font-mono text-indigo-400">
                    {step.asset || step.action}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function VariationLogic() {
  return (
    <div className="space-y-6">
      <div className="p-6 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-white/10 rounded-2xl">
        <div className="flex items-center gap-2 mb-4">
          <LineChart className="w-5 h-5 text-indigo-400" />
          <h4 className="text-sm font-bold text-white uppercase tracking-tighter">
            Executive Summary
          </h4>
        </div>
        <p className="text-lg font-medium text-indigo-100 leading-tight">
          Current market metrics suggest a{" "}
          <span className="text-white underline decoration-indigo-500">
            {MOCK_LOGIC.reason}
          </span>{" "}
          scenario.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {MOCK_LOGIC.details.map((detail, i) => (
          <div
            key={i}
            className="p-4 bg-gray-900/50 border border-gray-800 rounded-xl"
          >
            <div className="text-[10px] font-bold text-gray-500 uppercase mb-1">
              {detail.label}
            </div>
            <div
              className={cn(
                "text-sm",
                detail.sentiment === "positive" ? "text-green-400" : "text-white"
              )}
            >
              {detail.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// --- Main Modal Container ---

export function ReviewModal({
  isOpen,
  onClose,
  onConfirm,
  isSubmitting = false,
  title = "Review Execution",
}: ReviewModalProps) {
  const [activeTab, setActiveTab] = useState<"checklist" | "route" | "logic">(
    "checklist"
  );

  if (!isOpen) return null;

  const tabs = [
    { id: "checklist", label: "Intent Flow", icon: CheckCircle2 },
    { id: "route", label: "Execution Route", icon: Layers },
    { id: "logic", label: "Logic Brief", icon: Cpu },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="md">
      <ModalContent className="p-0 overflow-hidden bg-gray-950 border-gray-800 flex flex-col max-h-[90vh]">
        <TransactionModalHeader
          title={title}
          indicatorClassName="bg-indigo-500"
          isSubmitting={isSubmitting}
          onClose={onClose}
        />

        {/* Tab Switcher */}
        {!isSubmitting && (
          <div className="flex p-2 bg-gray-900/50 border-b border-gray-800 gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all",
                  activeTab === tab.id
                    ? "bg-gray-800 text-white shadow-sm ring-1 ring-white/10"
                    : "text-gray-500 hover:text-gray-300"
                )}
              >
                <tab.icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            ))}
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          {isSubmitting ? (
            <SubmittingState isSuccess={false} />
          ) : (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              {activeTab === "checklist" && <VariationChecklist />}
              {activeTab === "route" && <VariationRoute />}
              {activeTab === "logic" && <VariationLogic />}
            </div>
          )}
        </div>

        {!isSubmitting && (
          <div className="p-6 pt-2 border-t border-gray-800 bg-gray-950">
            <button
              onClick={onConfirm}
              className="group w-full py-4 rounded-2xl bg-white text-black font-bold hover:bg-gray-200 transition-all flex items-center justify-center gap-2"
            >
              Sign & Execute
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
            <p className="text-[10px] text-gray-500 text-center mt-4 uppercase tracking-widest font-medium">
              Secured by MPC & Hardware Isolation
            </p>
          </div>
        )}
      </ModalContent>
    </Modal>
  );
}
