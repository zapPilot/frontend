"use client";

import { WalletPortfolioPresenterV16 } from "@/components/wallet/variations/WalletPortfolioPresenterV16";
import { WalletPortfolioPresenterV17 } from "@/components/wallet/variations/WalletPortfolioPresenterV17";
import { WalletPortfolioPresenterV18 } from "@/components/wallet/variations/WalletPortfolioPresenterV18";
import { useState } from "react";

export default function PortfolioReviewPage() {
  const [currentView, setCurrentView] = useState<"v16" | "v17" | "v18">("v16");

  return (
    <div className="bg-black min-h-screen">
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] bg-gray-900/90 backdrop-blur border border-gray-700 rounded-full p-1 flex gap-1 shadow-2xl">
        <button
          onClick={() => setCurrentView("v16")}
          className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${
            currentView === "v16" ? "bg-purple-600 text-white" : "text-gray-400 hover:text-white"
          }`}
        >
          V16: Zen
        </button>
        <button
          onClick={() => setCurrentView("v17")}
          className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${
            currentView === "v17" ? "bg-blue-600 text-white" : "text-gray-400 hover:text-white"
          }`}
        >
          V17: Dashboard
        </button>
        <button
          onClick={() => setCurrentView("v18")}
          className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${
            currentView === "v18" ? "bg-orange-600 text-white" : "text-gray-400 hover:text-white"
          }`}
        >
          V18: Command
        </button>
      </div>

      <div className="pt-0">
        {currentView === "v16" && <WalletPortfolioPresenterV16 />}
        {currentView === "v17" && <WalletPortfolioPresenterV17 />}
        {currentView === "v18" && <WalletPortfolioPresenterV18 />}
      </div>
    </div>
  );
}
