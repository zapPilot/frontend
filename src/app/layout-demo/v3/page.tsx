/**
 * Layout Variation 3 Demo Route
 * Action-Oriented Layout - Optimize button prominent, combined cards
 */

"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { WalletPortfolioPresenterV3 } from "@/components/wallet/variations/WalletPortfolioPresenterV3";

export default function LayoutV3Page() {
  return (
    <div className="min-h-screen bg-gray-950 text-white p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Back Link */}
        <Link
          href="/layout-demo"
          className="inline-flex items-center gap-2 text-sm text-purple-400 hover:text-purple-300 transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to comparison
        </Link>

        {/* Title */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">
            Variation 3: Action-Oriented Layout
          </h1>
          <p className="text-sm text-gray-400">
            Combined Portfolio card • Optimize button prominent • Timeline secondary • Best for conversion
          </p>
        </div>

        {/* Layout */}
        <WalletPortfolioPresenterV3 />

        {/* Info Card */}
        <div className="mt-8 bg-gray-900/50 border border-gray-800 rounded-xl p-4">
          <h3 className="text-sm font-bold text-purple-400 mb-2">Key Changes:</h3>
          <ul className="text-sm text-gray-300 space-y-1">
            <li>✓ Portfolio Overview card combines Balance + ROI + Zap buttons</li>
            <li>✓ Compact Regime Status card with sentiment + mini timeline</li>
            <li>✓ Optimize button positioned next to delta indicator (high conversion)</li>
            <li>✓ Full timeline moved to bottom (secondary detail)</li>
            <li>✓ 2-card top row (financial status vs market status)</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
