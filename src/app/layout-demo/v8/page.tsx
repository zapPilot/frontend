"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { WalletPortfolioPresenterV8 } from "@/components/wallet/variations/WalletPortfolioPresenterV8";

export default function LayoutV8Page() {
  return (
    <div>
      {/* Floating Navigation */}
      <div className="fixed top-6 left-6 z-50">
        <Link
          href="/layout-demo"
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors bg-gray-900/50 backdrop-blur border border-gray-700 px-4 py-2 rounded shadow-lg hover:bg-gray-800"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>
      </div>

      <div className="fixed top-6 right-6 z-50 text-right hidden sm:block">
         <div className="text-xs font-mono text-blue-400">SYSTEM_VAR_08</div>
         <div className="text-xs font-bold text-gray-500 tracking-widest uppercase">Glass HUD Interface</div>
      </div>

      <WalletPortfolioPresenterV8 />
    </div>
  );
}


