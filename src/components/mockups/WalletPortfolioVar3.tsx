"use client";

import { ArrowRight, RefreshCw, Zap } from "lucide-react";

import { PortfolioOverview } from "@/components/PortfolioOverview";
import { BaseCard } from "@/components/ui";
import { WalletHeader } from "@/components/wallet/WalletHeader";
import { BalanceMetric, PnLMetric, ROIMetric, YieldMetric } from "@/components/wallet/metrics";

// Mock Data
const MOCK_PORTFOLIO_STATE = {
  isConnected: true,
  isLoading: false,
  isRetrying: false,
  error: null,
  landingPageData: {
    total_net_usd: 125000,
    portfolio_roi: 12.5,
    yield_summary: {
      average_apy: 5.2,
      total_yield_usd: 1200,
    }
  },
  hasZeroData: false,
  errorMessage: null,
};

const MOCK_FEAR_GREED = {
  value: 25,
  status: "Extreme Fear",
  color: "text-red-400",
  quote: "Be greedy when others are fearful."
};

export function WalletPortfolioVar3() {
  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-400">Variation 3: The Action Panel</h2>
        <div className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-xs border border-purple-500/30">
          Mockup Mode
        </div>
      </div>

      <BaseCard variant="glass">
        <WalletHeader
          onWalletManagerClick={() => {}}
          onToggleBalance={() => {}}
          isOwnBundle={true}
        />

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <BalanceMetric
            totalNetUsd={MOCK_PORTFOLIO_STATE.landingPageData.total_net_usd}
            isLoading={false}
            shouldShowLoading={false}
            balanceHidden={false}
            shouldShowError={false}
            errorMessage={null}
            shouldShowNoDataMessage={false}
            getDisplayTotalValue={() => "$125,000"}
          />

          <ROIMetric
            portfolioROI={MOCK_PORTFOLIO_STATE.landingPageData.portfolio_roi}
            isLoading={false}
            shouldShowLoading={false}
            portfolioChangePercentage={12.5}
            isConnected={true}
            errorMessage={null}
          />

          <PnLMetric
            portfolioROI={MOCK_PORTFOLIO_STATE.landingPageData.portfolio_roi}
            isLoading={false}
            shouldShowLoading={false}
            portfolioChangePercentage={12.5}
            errorMessage={null}
          />

          <YieldMetric
            yieldSummaryData={MOCK_PORTFOLIO_STATE.landingPageData.yield_summary as any}
            isYieldLoading={false}
            errorMessage={null}
          />
        </div>

        {/* NEW: Smart Actions Panel (Replacing standard WalletActions) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          
          {/* Action 1: Smart Rebalance (Featured) */}
          <div className="md:col-span-2 bg-gradient-to-r from-purple-900/40 to-blue-900/40 rounded-xl p-1 border border-purple-500/30 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-3 opacity-10">
              <RefreshCw className="w-24 h-24" />
            </div>
            
            <div className="bg-gray-900/80 rounded-lg p-4 h-full backdrop-blur-sm flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-0.5 bg-purple-500 text-white text-[10px] font-bold uppercase tracking-wider rounded-sm">
                    Opportunity
                  </span>
                  <h3 className="font-bold text-white">Smart Rebalance</h3>
                </div>
                
                <p className="text-sm text-gray-300 mb-3">
                  Market is in <span className="text-red-400 font-bold">{MOCK_FEAR_GREED.status} ({MOCK_FEAR_GREED.value})</span>. 
                  Buffett says: <span className="italic text-gray-400">"{MOCK_FEAR_GREED.quote}"</span>
                </p>

                <div className="flex items-center gap-3 text-xs text-gray-400 bg-black/20 p-2 rounded-lg w-fit">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    Stablecoins
                  </div>
                  <ArrowRight className="w-3 h-3 text-gray-600" />
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    BTC / ETH
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2 min-w-[140px]">
                <button className="px-4 py-2 bg-white text-purple-900 font-bold rounded-lg hover:bg-gray-100 transition-colors shadow-lg shadow-purple-900/20 flex items-center justify-center gap-2">
                  <Zap className="w-4 h-4" />
                  Execute
                </button>
                <span className="text-[10px] text-center text-gray-500">Target: 50/50 Split</span>
              </div>
            </div>
          </div>

          {/* Action 2: Standard Zap (Compact) */}
          <div className="bg-gray-900/40 rounded-xl p-4 border border-gray-800 flex flex-col justify-between hover:border-gray-700 transition-colors">
            <div>
              <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center mb-3 text-gray-400">
                <ArrowRight className="w-5 h-5" />
              </div>
              <h4 className="font-medium text-gray-200">Quick Zap</h4>
              <p className="text-xs text-gray-500 mt-1">Deposit or withdraw assets instantly.</p>
            </div>
            <div className="flex gap-2 mt-4">
              <button className="flex-1 py-1.5 bg-gray-800 hover:bg-gray-700 rounded text-xs font-medium transition-colors">
                In
              </button>
              <button className="flex-1 py-1.5 bg-gray-800 hover:bg-gray-700 rounded text-xs font-medium transition-colors">
                Out
              </button>
            </div>
          </div>

        </div>
      </BaseCard>

      <PortfolioOverview
        portfolioState={MOCK_PORTFOLIO_STATE as any}
        categorySummaries={[]}
        debtCategorySummaries={[]}
        pieChartData={[]}
        title="Asset Distribution"
      />
    </div>
  );
}
