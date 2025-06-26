"use client";

import { useState } from "react";
import { Navigation } from "@/components/Navigation";
import { WalletPortfolio } from "@/components/WalletPortfolio";
import { InvestTab } from "@/components/InvestTab";
import { MoreTab } from "@/components/MoreTab";

export default function DashboardApp() {
  const [activeTab, setActiveTab] = useState("portfolio");

  const renderTabContent = () => {
    switch (activeTab) {
      case "portfolio":
        return <WalletPortfolio />;
      case "invest":
        return <InvestTab />;
      case "more":
        return <MoreTab />;
      default:
        return <WalletPortfolio />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-gray-950 to-blue-900/20" />
      
      {/* Navigation */}
      <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
      
      {/* Main content */}
      <div className="relative z-10 lg:pl-72">
        {/* Mobile header spacing */}
        <div className="lg:hidden h-16" />
        
        <main className="px-4 py-8 lg:px-8 pb-20 lg:pb-8">
          <div className="max-w-7xl mx-auto">
            {renderTabContent()}
          </div>
        </main>
        
        {/* Mobile bottom nav spacing */}
        <div className="lg:hidden h-20" />
      </div>
    </div>
  );
}