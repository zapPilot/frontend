"use client";

import { Navigation } from "@/components/Navigation";
import { WalletPortfolio } from "@/components/WalletPortfolio";
import { InvestmentOpportunity } from "@/types/investment";
import { useState, useCallback } from "react";
import dynamic from "next/dynamic";

// Dynamic imports for code splitting
const InvestTab = dynamic(
  () =>
    import("@/components/InvestTab").then(mod => ({ default: mod.InvestTab })),
  {
    loading: () => (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
      </div>
    ),
  }
);

const AnalyticsTab = dynamic(
  () =>
    import("@/components/AnalyticsTab").then(mod => ({
      default: mod.AnalyticsTab,
    })),
  {
    loading: () => (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
      </div>
    ),
  }
);

const CommunityTab = dynamic(
  () =>
    import("@/components/CommunityTab").then(mod => ({
      default: mod.CommunityTab,
    })),
  {
    loading: () => (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
      </div>
    ),
  }
);

const AirdropTab = dynamic(
  () =>
    import("@/components/AirdropTab").then(mod => ({
      default: mod.AirdropTab,
    })),
  {
    loading: () => (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
      </div>
    ),
  }
);

const SettingsTab = dynamic(
  () =>
    import("@/components/SettingsTab").then(mod => ({
      default: mod.SettingsTab,
    })),
  {
    loading: () => (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
      </div>
    ),
  }
);

const SwapPage = dynamic(
  () =>
    import("@/components/SwapPage").then(mod => ({ default: mod.SwapPage })),
  {
    loading: () => (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
      </div>
    ),
  }
);

export default function DashboardApp() {
  const [activeTab, setActiveTab] = useState("wallet");
  const [selectedStrategy, setSelectedStrategy] =
    useState<InvestmentOpportunity | null>(null);

  const handleInvestClick = useCallback((strategy: InvestmentOpportunity) => {
    setSelectedStrategy(strategy);
  }, []);

  const handleBackToInvest = useCallback(() => {
    setSelectedStrategy(null);
  }, []);

  const handleTabChange = useCallback(
    (tab: string) => {
      setActiveTab(tab);
      // Reset strategy when switching tabs to enable navigation from SwapPage
      if (selectedStrategy) {
        setSelectedStrategy(null);
      }
    },
    [selectedStrategy]
  );

  const renderTabContent = () => {
    if (selectedStrategy) {
      return (
        <SwapPage strategy={selectedStrategy} onBack={handleBackToInvest} />
      );
    }

    switch (activeTab) {
      case "wallet":
        return <WalletPortfolio />;
      case "invest":
        return <InvestTab onInvestClick={handleInvestClick} />;
      case "analytics":
        return <AnalyticsTab />;
      case "community":
        return <CommunityTab />;
      case "airdrop":
        return <AirdropTab />;
      case "settings":
        return <SettingsTab />;
      default:
        return <WalletPortfolio />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-gray-950 to-blue-900/20" />

      {/* Navigation */}
      <Navigation activeTab={activeTab} onTabChange={handleTabChange} />

      {/* Main content */}
      <div className="relative z-10 lg:pl-72">
        {/* Mobile header spacing */}
        <div className="lg:hidden h-16" />

        <main className="px-4 py-8 lg:px-8 pb-20 lg:pb-8">
          <div className="max-w-7xl mx-auto">{renderTabContent()}</div>
        </main>

        {/* Mobile bottom nav spacing */}
        <div className="lg:hidden h-20" />
      </div>
    </div>
  );
}
