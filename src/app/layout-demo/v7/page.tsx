"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { WalletPortfolioPresenterV7 } from "@/components/wallet/variations/WalletPortfolioPresenterV7";

export default function LayoutV7Page() {
  return (
    <div>
      {/* Floating Navigation */}
      <div className="fixed top-6 left-6 z-50">
        <Link
          href="/layout-demo"
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors bg-black/50 backdrop-blur px-4 py-2 rounded-full border border-gray-800 hover:bg-black/80"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>
      </div>

      <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 pointer-events-none mix-blend-difference text-white hidden sm:block">
        <span className="text-xs font-bold tracking-widest uppercase opacity-50">Variation 7 • Kinetic Scroll</span>
      </div>

      <WalletPortfolioPresenterV7 />
    </div>
  );
}


