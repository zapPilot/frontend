"use client";

import { Navigation } from "@/components/Navigation";
import { WalletPortfolio } from "@/components/WalletPortfolio";
import { AnalyticsProvider } from "@/components/AnalyticsProvider";
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

// Removed CommunityTab, AirdropTab, and SettingsTab - now handled in MoreTab

const SwapPage = dynamic(
  () =>
    import("@/components/SwapPage/SwapPage").then(mod => ({
      default: mod.SwapPage,
    })),
  {
    loading: () => (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
      </div>
    ),
  }
);

const MoreTab = dynamic(
  () =>
    import("@/components/MoreTab").then(mod => ({
      default: mod.MoreTab,
    })),
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

  const handleAnalyticsClick = useCallback(() => {
    setActiveTab("analytics");
    if (selectedStrategy) {
      setSelectedStrategy(null);
    }
  }, [selectedStrategy]);

  const renderTabContent = () => {
    if (selectedStrategy) {
      return (
        <SwapPage strategy={selectedStrategy} onBack={handleBackToInvest} />
      );
    }

    switch (activeTab) {
      case "wallet":
        return <WalletPortfolio onAnalyticsClick={handleAnalyticsClick} />;
      case "invest":
        return <InvestTab onInvestClick={handleInvestClick} />;
      case "analytics":
        return <AnalyticsTab />;
      case "more":
        return <MoreTab />;
      default:
        return <WalletPortfolio />;
    }
  };

  return (
    <AnalyticsProvider>
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
    </AnalyticsProvider>
  );
}
