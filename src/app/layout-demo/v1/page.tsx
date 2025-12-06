/**
 * Layout Variation 1 Demo Route
 * Conservative Merge - Minimal changes to current layout
 */

"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { WalletPortfolioPresenterV1 } from "@/components/wallet/variations/WalletPortfolioPresenterV1";

export default function LayoutV1Page() {
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
            Variation 1: Conservative Merge
          </h1>
          <p className="text-sm text-gray-400">
            Minimal changes • Quote removed from sentiment card • Regime label added • Preserves current structure
          </p>
        </div>

        {/* Layout */}
        <WalletPortfolioPresenterV1 />

        {/* Info Card */}
        <div className="mt-8 bg-gray-900/50 border border-gray-800 rounded-xl p-4">
          <h3 className="text-sm font-bold text-purple-400 mb-2">Key Changes:</h3>
          <ul className="text-sm text-gray-300 space-y-1">
            <li>✓ Philosophy quote appears ONLY in regime section (not in sentiment card)</li>
            <li>✓ Sentiment card enhanced with regime label badge</li>
            <li>✓ 3-card top row maintained (familiar layout)</li>
            <li>✓ Minimal refactoring required</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
