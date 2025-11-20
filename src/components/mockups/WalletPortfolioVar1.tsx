"use client";

import { Brain, Settings } from "lucide-react";

import { PortfolioOverview } from "@/components/PortfolioOverview";
import { BaseCard, GradientButton } from "@/components/ui";
import { WalletHeader } from "@/components/wallet/WalletHeader";
import { BalanceMetric, PnLMetric, ROIMetric, YieldMetric } from "@/components/wallet/metrics";
import { GRADIENTS } from "@/constants/design-system";

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
  color: "text-green-500", // Green for fear = good time to buy
  quote: "Be greedy when others are fearful.",
  author: "Warren Buffett"
};

const MOCK_ALLOCATION = {
  stable: 30,
  crypto: 70,
  target: 50
};

export function WalletPortfolioVar1() {
  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-400">Variation 1: The Dashboard Card</h2>
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

        {/* Modified Metrics Grid with Sentiment Card */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
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

          {/* NEW: Market Sentiment Card */}
          <div className="bg-gray-900/40 rounded-xl p-4 border border-gray-800 relative overflow-hidden group hover:border-gray-700 transition-colors">
            <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
              <Brain className="w-12 h-12" />
            </div>
            <div className="flex flex-col h-full justify-between relative z-10">
              <div>
                <p className="text-sm text-gray-400 mb-1">Market Sentiment</p>
                <div className="flex items-end gap-2">
                  <span className={`text-2xl font-bold ${MOCK_FEAR_GREED.color}`}>
                    {MOCK_FEAR_GREED.value}
                  </span>
                  <span className="text-sm text-gray-400 mb-1">/ 100</span>
                </div>
                <p className={`text-xs font-medium ${MOCK_FEAR_GREED.color} mb-2`}>
                  {MOCK_FEAR_GREED.status}
                </p>
              </div>
              <div className="mt-2 pt-2 border-t border-gray-800">
                <p className="text-xs text-gray-300 italic">"{MOCK_FEAR_GREED.quote}"</p>
              </div>
            </div>
          </div>
        </div>

        {/* NEW: Rebalance Section */}
        <div className="mb-6 bg-gray-900/30 rounded-xl p-4 border border-gray-800">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex-1 w-full">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-400">Current Allocation</span>
                <span className="text-gray-400">Target: 50/50</span>
              </div>
              <div className="h-4 bg-gray-800 rounded-full overflow-hidden flex relative">
                {/* Stablecoin Segment */}
                <div 
                  className="h-full bg-blue-500/50 flex items-center justify-center text-[10px] text-white font-medium transition-all duration-500"
                  style={{ width: `${MOCK_ALLOCATION.stable}%` }}
                >
                  Stable {MOCK_ALLOCATION.stable}%
                </div>
                {/* Crypto Segment */}
                <div 
                  className="h-full bg-purple-500/50 flex items-center justify-center text-[10px] text-white font-medium transition-all duration-500"
                  style={{ width: `${MOCK_ALLOCATION.crypto}%` }}
                >
                  Crypto {MOCK_ALLOCATION.crypto}%
                </div>
                
                {/* Target Marker */}
                <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-white/50 z-10 transform -translate-x-1/2"></div>
              </div>
              <div className="mt-2 flex justify-between text-xs text-gray-500">
                <span>Stablecoins</span>
                <span>BTC / ETH</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <GradientButton
                gradient={GRADIENTS.PRIMARY}
                shadowColor="purple-500"
                icon={Settings}
                onClick={() => {}}
              >
                <span className="text-sm">Optimize</span>
              </GradientButton>
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
