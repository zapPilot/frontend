"use client";

import { useState } from "react";

import type { V22PortfolioDataWithDirection } from "@/adapters/portfolioDataAdapter";
import { Footer } from "@/components/Footer/Footer";
import { AnalyticsView } from "@/components/wallet/variations/v22/AnalyticsView";
import { BacktestingView } from "@/components/wallet/variations/v22/BacktestingView";
import {
  DepositModalV3,
  RebalanceModalV18,
} from "@/components/wallet/variations/v22/modals";
import { WithdrawModalV10Dropdown } from "@/components/wallet/variations/v22/modals/WithdrawModalV10Dropdown";
import { WalletManager } from "@/components/WalletManager/WalletManager";

import { getRegimeById } from "../regime/regimeData";
import { MOCK_DATA } from "./mockPortfolioData";
import { BalanceCard } from "./v22/components/BalanceCard";
import { PortfolioComposition } from "./v22/components/PortfolioComposition";
import { SettingsModal } from "./v22/components/SettingsModal";
import { StrategyCard } from "./v22/components/StrategyCard";
import { WalletNavigation } from "./v22/components/WalletNavigation";

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

  const [isWalletManagerOpen, setIsWalletManagerOpen] = useState(false);
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
      {/* --- TOP NAVIGATION (Minimalist) --- */}
      <WalletNavigation
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenWalletManager={() => setIsWalletManagerOpen(true)}
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
                  onOpenModal={openModal}
                />

                {/* EXPANDABLE STRATEGY CARD */}
                <StrategyCard data={data} currentRegime={currentRegime} />
              </div>

              {/* UNIFIED COMPOSITION BAR (V21 Style) - Only visible in Dashboard */}
              <PortfolioComposition
                data={data}
                currentRegime={currentRegime}
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
      <WalletManager
        isOpen={isWalletManagerOpen}
        onClose={() => setIsWalletManagerOpen(false)}
      />

      <DepositModalV3
        isOpen={activeModal === "deposit"}
        onClose={closeModal}
        defaultChainId={1}
      />

      {activeModal === "withdraw" && (
        <WithdrawModalV10Dropdown isOpen={true} onClose={closeModal} />
      )}

      {activeModal === "rebalance" && (
        <RebalanceModalV18
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
    </div>
  );
}
