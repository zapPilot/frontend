"use client";

import { useState } from "react";

import type { WalletPortfolioDataWithDirection } from "@/adapters/walletPortfolioDataAdapter";
import { Footer } from "@/components/Footer/Footer";
import { PortfolioModals } from "@/components/wallet/portfolio/components/PortfolioModals";
import { WalletNavigation } from "@/components/wallet/portfolio/components/WalletNavigation";
import { BacktestingView } from "@/components/wallet/portfolio/views/BacktestingView";
import { DashboardView } from "@/components/wallet/portfolio/views/DashboardView";
import { getRegimeById } from "@/components/wallet/regime/regimeData";
import type { ModalType, TabType } from "@/types/portfolio";

interface WalletPortfolioPresenterProps {
  data: WalletPortfolioDataWithDirection;
  isEmptyState?: boolean;
  headerBanners?: React.ReactNode;
  footerOverlays?: React.ReactNode;
}

export function WalletPortfolioPresenter({
  data,
  isEmptyState = false,
  headerBanners,
  footerOverlays,
}: WalletPortfolioPresenterProps) {
  const currentRegime = getRegimeById(data.currentRegime);
  const [activeTab, setActiveTab] = useState<TabType>("dashboard");

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Modal state - consolidated to avoid duplication
  const [activeModal, setActiveModal] = useState<ModalType | null>(null);

  const openModal = (type: ModalType | null) => setActiveModal(type);
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
            <DashboardView
              data={data}
              currentRegime={currentRegime}
              isEmptyState={isEmptyState}
              onOpenModal={openModal}
            />
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

      <PortfolioModals
        activeModal={activeModal}
        onClose={closeModal}
        data={data}
        isSettingsOpen={isSettingsOpen}
        setIsSettingsOpen={setIsSettingsOpen}
      />

      {/* --- FOOTER OVERLAYS (Bundle-specific: QuickSwitchFAB) --- */}
      {footerOverlays}
    </div>
  );
}
