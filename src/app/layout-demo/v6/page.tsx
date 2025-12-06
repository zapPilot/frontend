"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { WalletPortfolioPresenterV6 } from "@/components/wallet/variations/WalletPortfolioPresenterV6";

export default function LayoutV6Page() {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Floating Navigation */}
      <div className="absolute top-6 left-6 z-50">
        <Link
          href="/layout-demo"
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-white transition-colors bg-black/20 backdrop-blur px-4 py-2 rounded-full hover:bg-black/40"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to comparison
        </Link>
      </div>

      <div className="absolute top-6 right-6 z-50 hidden sm:block">
        <span className="text-xs font-bold tracking-widest text-gray-600 uppercase">Variation 6 • Zen Focus</span>
      </div>

      <WalletPortfolioPresenterV6 />
      
      {/* Hidden footer for SEO/Context (optional in this demo but good for structure) */}
      <div className="fixed bottom-4 left-0 right-0 text-center pointer-events-none opacity-30 hover:opacity-100 transition-opacity duration-500">
         <p className="text-[10px] text-gray-500 uppercase tracking-widest">
           Minimalist Interface • Progressive Disclosure Pattern
         </p>
      </div>
    </div>
  );
}


