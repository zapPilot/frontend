"use client";

import { WalletPortfolioVar1 } from "@/components/mockups/WalletPortfolioVar1";
import { WalletPortfolioVar2 } from "@/components/mockups/WalletPortfolioVar2";
import { WalletPortfolioVar3 } from "@/components/mockups/WalletPortfolioVar3";
import { useState } from "react";

export default function MockupsPage() {
  const [activeTab, setActiveTab] = useState<1 | 2 | 3>(1);

  return (
    <div className="min-h-screen bg-[#0a0a0f] p-8">
      <div className="max-w-7xl mx-auto mb-8">
        <h1 className="text-3xl font-bold text-white mb-4">Wallet Portfolio Mockups</h1>
        <p className="text-gray-400 mb-6">
          Review the three design variations below. Click the tabs to switch between them.
        </p>
        
        <div className="flex gap-2 p-1 bg-gray-900 rounded-lg w-fit border border-gray-800">
          <button
            onClick={() => setActiveTab(1)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === 1 
                ? "bg-purple-600 text-white shadow-lg" 
                : "text-gray-400 hover:text-white hover:bg-gray-800"
            }`}
          >
            Variation 1: Dashboard Card
          </button>
          <button
            onClick={() => setActiveTab(2)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === 2 
                ? "bg-purple-600 text-white shadow-lg" 
                : "text-gray-400 hover:text-white hover:bg-gray-800"
            }`}
          >
            Variation 2: Strategic Header
          </button>
          <button
            onClick={() => setActiveTab(3)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === 3 
                ? "bg-purple-600 text-white shadow-lg" 
                : "text-gray-400 hover:text-white hover:bg-gray-800"
            }`}
          >
            Variation 3: Action Panel
          </button>
        </div>
      </div>

      <div className="border-t border-gray-800 pt-8">
        {activeTab === 1 && <WalletPortfolioVar1 />}
        {activeTab === 2 && <WalletPortfolioVar2 />}
        {activeTab === 3 && <WalletPortfolioVar3 />}
      </div>
    </div>
  );
}
