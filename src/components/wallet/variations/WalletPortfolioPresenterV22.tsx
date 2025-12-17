"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  ArrowUpRight,
  Calendar,
  ChevronDown,
  Gauge,
  History,
  Info,
  LayoutDashboard,
  LineChart,
  Zap,
} from "lucide-react";
import { useState } from "react";

import type { V22PortfolioDataWithDirection } from "@/adapters/portfolioDataAdapter";
import { Footer } from "@/components/Footer/Footer";
import { GradientButton } from "@/components/ui";
import {
  Modal,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "@/components/ui/modal";
import { AnalyticsView } from "@/components/wallet/variations/v22/AnalyticsView";
import { BacktestingView } from "@/components/wallet/variations/v22/BacktestingView";
import {
  DepositModal,
  RebalanceModal,
  WithdrawModal,
} from "@/components/wallet/variations/v22/modals";
import { WalletUIVariation1 } from "@/components/wallet/variations/v22/WalletUIVariation1";
import { WalletUIVariation2 } from "@/components/wallet/variations/v22/WalletUIVariation2";
import { WalletUIVariation3 } from "@/components/wallet/variations/v22/WalletUIVariation3";
import { WalletManager } from "@/components/WalletManager/WalletManager";
import { ANIMATIONS, GRADIENTS } from "@/constants/design-system";
import { getRegimeName, getStrategyMeta } from "@/lib/strategySelector";

import { getRegimeById } from "../regime/regimeData";
import { MOCK_DATA } from "./mockPortfolioData";

interface WalletPortfolioPresenterV22Props {
  data?: typeof MOCK_DATA | V22PortfolioDataWithDirection;
  userId?: string;
}

export function WalletPortfolioPresenterV22({
  data = MOCK_DATA,
  userId = "",
}: WalletPortfolioPresenterV22Props = {}) {
  const currentRegime = getRegimeById(data.currentRegime);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isStrategyExpanded, setIsStrategyExpanded] = useState(false);
  const [isWalletManagerOpen, setIsWalletManagerOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [walletUIVariation, setWalletUIVariation] = useState<1 | 2 | 3>(1);

  // Extract directional strategy metadata (safely handle missing fields)
  const strategyDirection =
    "strategyDirection" in data ? data.strategyDirection : "default";
  const previousRegime = "previousRegime" in data ? data.previousRegime : null;
  const regimeDuration = "regimeDuration" in data ? data.regimeDuration : null;
  const strategyMeta = getStrategyMeta(strategyDirection);

  // Mock Regime Spectrum Data (from V20)
  const regimes = [
    { id: "extreme-fear", label: "Extreme Fear", color: "#ef4444" },
    { id: "fear", label: "Fear", color: "#f97316" },
    { id: "neutral", label: "Neutral", color: "#eab308" },
    { id: "greed", label: "Greed", color: "#84cc16" },
    { id: "extreme-greed", label: "Extreme Greed", color: "#22c55e" },
  ];

  // Modal state - consolidated to avoid duplication
  const [activeModal, setActiveModal] = useState<
    "deposit" | "withdraw" | "rebalance" | null
  >(null);

  const openModal = (type: "deposit" | "withdraw" | "rebalance" | null) =>
    setActiveModal(type);
  const closeModal = () => setActiveModal(null);

  return (
    <div
      className="min-h-screen bg-gray-950 flex flex-col font-sans selection:bg-purple-500/30"
      data-testid="v22-dashboard"
    >
      {/* DEV TOGGLE: Wallet UI Variation Selector */}
      <div className="fixed top-20 left-4 z-50 bg-gray-900 border border-purple-500/30 rounded-lg p-3 shadow-xl">
        <div className="text-xs text-gray-400 uppercase tracking-wide mb-2 font-bold">
          Wallet UI Variation
        </div>
        <div className="flex gap-2">
          {([1, 2, 3] as const).map(variant => (
            <button
              key={variant}
              onClick={() => setWalletUIVariation(variant)}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                walletUIVariation === variant
                  ? "bg-purple-600 text-white shadow-sm"
                  : "bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-200"
              }`}
            >
              V{variant}
            </button>
          ))}
        </div>
        <div className="mt-2 text-xs text-gray-500">
          {walletUIVariation === 1 && "Unified Menu"}
          {walletUIVariation === 2 && "Progressive Disclosure"}
          {walletUIVariation === 3 && "Split Actions"}
        </div>
      </div>
      {/* --- TOP NAVIGATION (Minimalist) --- */}
      <nav className="h-16 border-b border-gray-800/50 bg-gray-950/80 backdrop-blur-md sticky top-0 z-50 px-4 md:px-8 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-purple-500/20">
            ZP
          </div>
          <span className="text-white font-bold tracking-tight hidden md:block">
            Zap Pilot
          </span>
        </div>

        <div className="flex items-center gap-1 bg-gray-900/50 p-1 rounded-full border border-gray-800/50">
          {[
            { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
            { id: "analytics", label: "Analytics", icon: LineChart },
            { id: "backtesting", label: "Backtesting", icon: History },
          ].map(tab => (
            <button
              key={tab.id}
              data-testid={`v22-tab-${tab.id}`}
              onClick={() => setActiveTab(tab.id)}
              role="button"
              aria-label={`${tab.label} tab`}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                activeTab === tab.id
                  ? "bg-gradient-to-r from-purple-500/10 to-blue-600/10 border border-purple-500/30 text-white shadow-sm"
                  : "text-gray-400 hover:text-gray-200 hover:bg-gray-800/50 hover:border-purple-500/20 border border-transparent"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-4">
          {/* Wallet UI Variations - Conditionally Rendered */}
          {walletUIVariation === 1 && (
            <WalletUIVariation1
              onOpenWalletManager={() => setIsWalletManagerOpen(true)}
              onOpenSettings={() => setIsSettingsOpen(true)}
            />
          )}
          {walletUIVariation === 2 && (
            <WalletUIVariation2
              onOpenWalletManager={() => setIsWalletManagerOpen(true)}
              onOpenSettings={() => setIsSettingsOpen(true)}
            />
          )}
          {walletUIVariation === 3 && (
            <WalletUIVariation3
              onOpenWalletManager={() => setIsWalletManagerOpen(true)}
              onOpenSettings={() => setIsSettingsOpen(true)}
            />
          )}
        </div>
      </nav>

      {/* --- MAIN CONTENT --- */}
      <main className="flex-1 flex justify-center p-4 md:p-8">
        <div className="w-full max-w-4xl flex flex-col gap-8 min-h-[600px]">
          {activeTab === "dashboard" && (
            <div data-testid="dashboard-content">
              {/* HERO SECTION: Balance + Expandable Strategy Card */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Balance Card */}
                <div className="bg-gray-900/40 backdrop-blur-sm border border-gray-800 rounded-2xl p-8 flex flex-col justify-center">
                  <div className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-2">
                    Net Worth
                  </div>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="flex-1">
                      <div
                        className="text-5xl font-bold text-white tracking-tight mb-4"
                        data-testid="net-worth"
                      >
                        ${data.balance.toLocaleString()}
                      </div>
                      <div className="flex items-center gap-3">
                        <span
                          className="px-2 py-1 bg-green-500/10 text-green-400 text-xs font-bold rounded flex items-center gap-1"
                          data-testid="performance-change"
                        >
                          <ArrowUpRight className="w-3 h-3" /> {data.roi}%
                        </span>
                        <span className="text-xs text-gray-500">
                          All Time Return
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Quick Actions - Moved to top for visibility on mobile */}
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      data-testid="deposit-button"
                      onClick={() => openModal("deposit")}
                      className="flex items-center justify-center gap-2 px-4 py-2 bg-green-500/10 hover:bg-green-500/20 text-green-400 text-xs font-bold rounded-lg transition-colors border border-green-500/20"
                    >
                      <ArrowDownCircle className="w-4 h-4" /> Deposit
                    </button>
                    <button
                      data-testid="withdraw-button"
                      onClick={() => openModal("withdraw")}
                      className="flex items-center justify-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-bold rounded-lg transition-colors border border-red-500/20"
                    >
                      <ArrowUpCircle className="w-4 h-4" /> Withdraw
                    </button>
                  </div>
                </div>

                {/* EXPANDABLE STRATEGY CARD */}
                <motion.div
                  data-testid="strategy-card"
                  layout
                  className={`bg-gray-900/40 backdrop-blur-sm border rounded-2xl p-8 relative overflow-hidden group cursor-pointer transition-all duration-200 ${
                    isStrategyExpanded
                      ? "row-span-2 md:col-span-2 border-purple-500/30 shadow-lg shadow-purple-500/10"
                      : "border-gray-800 hover:border-purple-500/20 hover:bg-gray-900/60"
                  }`}
                  onClick={() => setIsStrategyExpanded(!isStrategyExpanded)}
                >
                  {/* Background Icon */}
                  <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Gauge className="w-32 h-32 text-purple-500" />
                  </div>

                  {/* Header / Collapsed State */}
                  <motion.div
                    layout="position"
                    className="relative z-10 flex items-start justify-between"
                  >
                    <div className="flex items-center gap-6">
                      <div className="w-20 h-20 rounded-2xl bg-gray-800 flex items-center justify-center text-3xl font-bold border border-gray-700 shadow-inner flex-shrink-0">
                        <span
                          style={{ color: currentRegime.fillColor }}
                          data-testid="regime-badge"
                        >
                          {data.currentRegime.toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-1 flex items-center gap-2">
                          Current Strategy
                          <Info className="w-3 h-3" />
                        </div>
                        <div className="text-2xl font-bold text-white mb-1">
                          {currentRegime.label}
                        </div>
                        <div className="text-sm text-gray-400 italic mb-2">
                          &ldquo;{currentRegime.philosophy}&rdquo;
                        </div>

                        {/* Directional Strategy Indicator */}
                        {previousRegime && strategyDirection !== "default" && (
                          <div
                            className="flex items-center gap-2 text-xs mt-2"
                            aria-label={strategyMeta.ariaLabel}
                          >
                            <span className="px-2 py-0.5 bg-purple-500/10 text-purple-400 rounded-md font-medium border border-purple-500/20">
                              {strategyDirection === "fromLeft" ? "↗" : "↘"}{" "}
                              {strategyMeta.description}
                            </span>
                            <span className="text-gray-500">
                              from {getRegimeName(previousRegime)}
                            </span>
                          </div>
                        )}

                        {/* Regime Duration Badge */}
                        {regimeDuration?.human_readable && (
                          <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-1">
                            <span className="opacity-60">In regime for</span>
                            <span className="font-mono text-gray-400">
                              {regimeDuration.human_readable}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div
                      className={`p-2 rounded-full bg-gray-800 text-gray-400 transition-transform duration-300 ${isStrategyExpanded ? "rotate-180" : ""}`}
                    >
                      <ChevronDown className="w-5 h-5" />
                    </div>
                  </motion.div>

                  {/* Expanded Content (Progressive Disclosure) */}
                  <AnimatePresence>
                    {isStrategyExpanded && (
                      <motion.div
                        {...ANIMATIONS.EXPAND_COLLAPSE}
                        className="relative z-10 mt-8 pt-8 border-t border-gray-800"
                      >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          {/* Left: Regime Spectrum */}
                          <div data-testid="regime-spectrum">
                            <h4 className="text-sm font-bold text-white mb-4">
                              Market Cycle Position
                            </h4>
                            <div className="flex flex-col gap-2">
                              {regimes.map(regime => {
                                const isActive = regime.id === "greed"; // Hardcoded
                                return (
                                  <div
                                    key={regime.id}
                                    className={`flex items-center gap-3 p-2 rounded-lg transition-all ${
                                      isActive
                                        ? "bg-gray-800 border border-gray-700 shadow-lg scale-105"
                                        : "opacity-40"
                                    }`}
                                  >
                                    <div
                                      className={`w-3 h-3 rounded-full ${isActive ? "animate-pulse" : ""}`}
                                      style={{ backgroundColor: regime.color }}
                                    />
                                    <span
                                      className={`text-sm font-bold ${isActive ? "text-white" : "text-gray-400"}`}
                                    >
                                      {regime.label}
                                    </span>
                                    {isActive && (
                                      <span className="ml-auto text-xs font-mono text-gray-400">
                                        Current
                                      </span>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* Right: Strategy Explanation */}
                          <div>
                            <h4 className="text-sm font-bold text-white mb-4">
                              Why this allocation?
                            </h4>
                            <div className="space-y-4 text-sm text-gray-400">
                              <p>
                                In{" "}
                                <span className="text-green-400 font-bold">
                                  Greed
                                </span>{" "}
                                markets, prices are high and risk is elevated.
                              </p>
                              <p>
                                Zap Pilot automatically{" "}
                                <span className="text-white font-bold">
                                  takes profit
                                </span>{" "}
                                by converting volatile crypto assets into
                                stablecoins.
                              </p>
                              <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700 mt-4">
                                <div className="flex justify-between items-center mb-2">
                                  <span>Target Crypto</span>
                                  <span className="text-white font-bold">
                                    {currentRegime.allocation.crypto}%
                                  </span>
                                </div>
                                <div className="w-full bg-gray-700 h-2 rounded-full overflow-hidden">
                                  <div
                                    className="bg-purple-500 h-full"
                                    style={{
                                      width: `${currentRegime.allocation.crypto}%`,
                                    }}
                                  />
                                </div>

                                <div className="flex justify-between items-center mt-4 mb-2">
                                  <span>Target Stable</span>
                                  <span className="text-emerald-400 font-bold">
                                    {currentRegime.allocation.stable}%
                                  </span>
                                </div>
                                <div className="w-full bg-gray-700 h-2 rounded-full overflow-hidden">
                                  <div
                                    className="bg-emerald-500 h-full"
                                    style={{
                                      width: `${currentRegime.allocation.stable}%`,
                                    }}
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              </div>

              {/* UNIFIED COMPOSITION BAR (V21 Style) - Only visible in Dashboard */}
              <div
                className="bg-gray-900/20 border border-gray-800 rounded-2xl p-8 flex flex-col relative overflow-hidden"
                data-testid="composition-bar"
              >
                <div className="flex justify-between items-end mb-8">
                  <div>
                    <h2 className="text-xl font-bold text-white mb-1">
                      Portfolio Composition
                    </h2>
                    <p className="text-sm text-gray-400">
                      Target:{" "}
                      <span className="text-gray-300 font-mono">
                        {currentRegime.allocation.stable}% Stable
                      </span>{" "}
                      /{" "}
                      <span className="text-gray-300 font-mono">
                        {currentRegime.allocation.crypto}% Crypto
                      </span>
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <GradientButton
                      data-testid="rebalance-button"
                      gradient={GRADIENTS.PRIMARY}
                      icon={Zap}
                      className="h-8 text-xs"
                      onClick={() => openModal("rebalance")}
                    >
                      Rebalance
                    </GradientButton>
                  </div>
                </div>

                {/* THE GHOST BAR TRACK */}
                <div className="relative h-24 w-full bg-gray-900/50 rounded-xl border border-gray-800 p-1 flex overflow-hidden">
                  {/* GHOST TARGET BACKGROUND - Visual guide only */}
                  <div className="absolute inset-0 flex opacity-20 pointer-events-none">
                    <div
                      style={{ width: `${currentRegime.allocation.crypto}%` }}
                      className="h-full border-r border-dashed border-white/30"
                    />
                    <div
                      style={{ width: `${currentRegime.allocation.stable}%` }}
                      className="h-full"
                    />
                  </div>

                  {/* ACTUAL BARS (Foreground) */}
                  <div className="relative w-full h-full flex gap-1 z-10">
                    {/* Crypto Section */}
                    <div
                      className="h-full flex gap-1 transition-all duration-500 ease-out"
                      style={{
                        width: `${data.currentAllocation.crypto}%`,
                      }}
                    >
                      {data.currentAllocation.simplifiedCrypto.map(asset => (
                        <motion.div
                          key={asset.symbol}
                          data-testid={`composition-${asset.symbol.toLowerCase()}`}
                          className="h-full rounded-lg relative group overflow-hidden cursor-pointer"
                          style={{
                            flex: asset.value,
                            backgroundColor: `${asset.color}20`,
                            border: `1px solid ${asset.color}50`,
                          }}
                          whileHover={{ scale: 1.02, y: -2 }}
                        >
                          <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="font-bold text-white text-lg">
                              {asset.symbol}
                            </span>
                            <span className="text-xs text-gray-400 font-mono opacity-0 group-hover:opacity-100 transition-opacity">
                              {asset.value.toFixed(2)}%
                            </span>
                          </div>
                        </motion.div>
                      ))}
                    </div>

                    {/* Stable Section */}
                    <motion.div
                      data-testid="composition-stables"
                      className="h-full rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center relative group"
                      style={{
                        width: `${data.currentAllocation.stable}%`,
                      }}
                      whileHover={{ scale: 1.02, y: -2 }}
                    >
                      <div className="text-center">
                        <span className="font-bold text-emerald-400 text-lg">
                          STABLES
                        </span>
                        <div className="text-xs text-emerald-500/60 font-mono opacity-0 group-hover:opacity-100 transition-opacity">
                          {data.currentAllocation.stable.toFixed(2)}%
                        </div>
                      </div>
                    </motion.div>
                  </div>
                </div>

                {/* Legend */}
                <div className="flex justify-between mt-4 px-1">
                  <div className="flex gap-4 text-xs text-gray-400">
                    {data.currentAllocation.simplifiedCrypto.map(asset => (
                      <div
                        key={asset.symbol}
                        className="flex items-center gap-1.5"
                      >
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: asset.color }}
                        />
                        <span>{asset.name}</span>
                      </div>
                    ))}
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span>Stablecoins</span>
                    </div>
                  </div>
                  <div className="text-xs font-bold text-orange-400">
                    Drift: {data.delta.toFixed(2)}%
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Analytics View */}
          {activeTab === "analytics" && userId && (
            <div data-testid="analytics-content">
              <AnalyticsView userId={userId} />
            </div>
          )}

          {/* Backtesting View */}
          {activeTab === "backtesting" && (
            <div data-testid="backtesting-content">
              <BacktestingView />
            </div>
          )}
        </div>
      </main>

      {/* --- FOOTER --- */}
      <Footer
        className="bg-gray-950 border-gray-800/50"
        containerClassName="max-w-4xl"
      />

      {/* --- MODALS --- */}
      <WalletManager
        isOpen={isWalletManagerOpen}
        onClose={() => setIsWalletManagerOpen(false)}
      />

      <DepositModal
        isOpen={activeModal === "deposit"}
        onClose={closeModal}
        defaultChainId={1}
        regimeAllocation={
          currentRegime
            ? {
                crypto: currentRegime.allocation.crypto,
                stable: currentRegime.allocation.stable,
              }
            : undefined
        }
      />

      <WithdrawModal
        isOpen={activeModal === "withdraw"}
        onClose={closeModal}
        currentBalance={data.balance}
      />

      <RebalanceModal
        isOpen={activeModal === "rebalance"}
        onClose={closeModal}
        currentAllocation={{
          crypto: data.currentAllocation.crypto,
          stable: data.currentAllocation.stable,
          simplifiedCrypto: data.currentAllocation.simplifiedCrypto,
        }}
        targetAllocation={data.targetAllocation}
      />

      {/* Core Settings Modal */}
      <Modal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        maxWidth="md"
      >
        <ModalHeader
          title="Core Settings"
          subtitle="Connect services to enable automated rebalancing reminders tailored to your personal regime."
          onClose={() => setIsSettingsOpen(false)}
        />
        <ModalContent>
          <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-xl border border-gray-700/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-400">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <div className="font-bold text-white text-sm">
                  Google Calendar
                </div>
                <div className="text-xs text-gray-400">
                  Remind me to rebalance
                </div>
              </div>
            </div>
            <button className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition-colors">
              Connect
            </button>
          </div>
        </ModalContent>
        <ModalFooter className="justify-end">
          <button
            onClick={() => setIsSettingsOpen(false)}
            className="px-4 py-2 text-gray-400 hover:text-white text-sm font-medium transition-colors"
          >
            Close
          </button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
