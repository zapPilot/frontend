"use client";

import { useState } from "react";

import type { WalletPortfolioDataWithDirection } from "@/adapters/walletPortfolioDataAdapter";
import { Footer } from "@/components/Footer/Footer";
import { BalanceCard } from "@/components/wallet/portfolio/components/BalanceCard";
import { PortfolioComposition } from "@/components/wallet/portfolio/components/PortfolioComposition";
import { SettingsModal } from "@/components/wallet/portfolio/components/SettingsModal";
import { StrategyCard } from "@/components/wallet/portfolio/components/StrategyCard";
import { WalletNavigation } from "@/components/wallet/portfolio/components/WalletNavigation";
import {
  DepositModal,
  RebalanceModal,
} from "@/components/wallet/portfolio/modals";
import { WithdrawModal } from "@/components/wallet/portfolio/modals/WithdrawModal";
import { AnalyticsView } from "@/components/wallet/portfolio/views/AnalyticsView";
import { BacktestingView } from "@/components/wallet/portfolio/views/BacktestingView";
import { getRegimeById } from "@/components/wallet/regime/regimeData";

interface WalletPortfolioPresenterProps {
  data: WalletPortfolioDataWithDirection;
  userId?: string;
  isEmptyState?: boolean;
  headerBanners?: React.ReactNode;
  footerOverlays?: React.ReactNode;
}

export function WalletPortfolioPresenter({
  data,
  userId = "",
  isEmptyState = false,
  headerBanners,
  footerOverlays,
}: WalletPortfolioPresenterProps) {
  const currentRegime = getRegimeById(data.currentRegime);
  const [activeTab, setActiveTab] = useState("dashboard");

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

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
      {/* --- HEADER BANNERS (Bundle-specific: SwitchPrompt, EmailReminder) --- */}
      {headerBanners}

      {/* --- TOP NAVIGATION (Minimalist) --- */}
      <WalletNavigation
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* --- MAIN CONTENT --- */}
      <main className="flex-1 flex justify-center p-4 md:p-8">
        <div className="w-full max-w-4xl flex flex-col gap-8 min-h-[600px]">
          {activeTab === "dashboard" && (
            <div data-testid="dashboard-content">
              {/* HERO SECTION: Balance + Expandable Strategy Card */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Balance Card */}
                <BalanceCard
                  balance={data.balance}
                  roi={data.roi}
                  isEmptyState={isEmptyState}
                  onOpenModal={openModal}
                />

                {/* EXPANDABLE STRATEGY CARD */}
                <StrategyCard
                  data={data}
                  currentRegime={currentRegime}
                  isEmptyState={isEmptyState}
                />
              </div>

              {/* UNIFIED COMPOSITION BAR (V21 Style) - Only visible in Dashboard */}
              <PortfolioComposition
                data={data}
                currentRegime={currentRegime}
                isEmptyState={isEmptyState}
                onRebalance={() => openModal("rebalance")}
              />
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
      <DepositModal
        isOpen={activeModal === "deposit"}
        onClose={closeModal}
        defaultChainId={1}
      />

      {activeModal === "withdraw" && (
        <WithdrawModal isOpen={true} onClose={closeModal} />
      )}

      {activeModal === "rebalance" && (
        <RebalanceModal
          isOpen={true}
          onClose={closeModal}
          currentAllocation={{
            crypto: data.currentAllocation.crypto,
            stable: data.currentAllocation.stable,
            simplifiedCrypto: data.currentAllocation.simplifiedCrypto,
          }}
          targetAllocation={data.targetAllocation}
        />
      )}

      {/* Core Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />

      {/* --- FOOTER OVERLAYS (Bundle-specific: QuickSwitchFAB) --- */}
      {footerOverlays}
    </div>
  );
}
