"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { WalletPortfolioPresenterV15 } from "@/components/wallet/variations/WalletPortfolioPresenterV15";

export default function LayoutV15Page() {
  return (
    <div>
      <div className="fixed top-6 left-6 z-50">
        <Link
          href="/layout-demo"
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors bg-black/50 backdrop-blur px-4 py-2 rounded-full border border-gray-800 hover:bg-black/80"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>
      </div>

      <div className="fixed top-6 right-6 z-50 hidden sm:block">
        <span className="text-xs font-bold tracking-widest uppercase text-gray-500">Variation 15 • Inline Badges</span>
      </div>

      <WalletPortfolioPresenterV15 />
    </div>
  );
}


