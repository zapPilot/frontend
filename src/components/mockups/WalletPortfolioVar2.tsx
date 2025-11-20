"use client";

import { ArrowRight, Brain, RefreshCw } from "lucide-react";

import { PortfolioOverview } from "@/components/PortfolioOverview";
import { BaseCard } from "@/components/ui";
import { WalletActions } from "@/components/wallet/WalletActions";
import { WalletHeader } from "@/components/wallet/WalletHeader";
import { BalanceMetric, PnLMetric, ROIMetric, YieldMetric } from "@/components/wallet/metrics";

// Mock Data (Same as Var 1 for consistency)
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
  bgColor: "bg-red-500/10",
  borderColor: "border-red-500/20",
  quote: "Be greedy when others are fearful.",
  author: "Warren Buffett"
};

const MOCK_ALLOCATION = {
  stable: 30,
  crypto: 70,
  targetStable: 40,
  targetCrypto: 60
};

export function WalletPortfolioVar2() {
  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-400">Variation 2: The Strategic Header</h2>
        <div className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-xs border border-purple-500/30">
          Mockup Mode
        </div>
      </div>

      {/* STRATEGIC HEADER BANNER */}
      <div className="relative overflow-hidden rounded-2xl border border-gray-800 bg-gray-900/80 backdrop-blur-xl">
        {/* Background Gradient Mesh */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 opacity-20">
          <div className="absolute top-[-50%] left-[-10%] w-[50%] h-[150%] bg-blue-600/30 blur-[100px] rounded-full"></div>
          <div className="absolute bottom-[-50%] right-[-10%] w-[50%] h-[150%] bg-purple-600/30 blur-[100px] rounded-full"></div>
        </div>

        <div className="relative z-10 p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          {/* Left: Market Sentiment */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${MOCK_FEAR_GREED.bgColor} ${MOCK_FEAR_GREED.borderColor} border`}>
                <Brain className={`w-6 h-6 ${MOCK_FEAR_GREED.color}`} />
              </div>
              <h3 className="text-lg font-medium text-gray-200">Market Context</h3>
            </div>
            
            <div>
              <div className="flex items-baseline gap-3">
                <span className={`text-5xl font-bold ${MOCK_FEAR_GREED.color}`}>
                  {MOCK_FEAR_GREED.value}
                </span>
                <span className={`text-xl font-medium ${MOCK_FEAR_GREED.color}`}>
                  {MOCK_FEAR_GREED.status}
                </span>
              </div>
              <p className="text-gray-400 mt-2 text-lg italic border-l-2 border-gray-700 pl-4 py-1">
                "{MOCK_FEAR_GREED.quote}"
              </p>
            </div>
          </div>

          {/* Right: Strategic Rebalance */}
          <div className="bg-black/20 rounded-xl p-5 border border-white/5">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-sm font-medium text-gray-300 flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-purple-400" />
                Strategic Rebalance
              </h4>
              <span className="text-xs text-purple-300 bg-purple-500/10 px-2 py-1 rounded border border-purple-500/20">
                Recommended
              </span>
            </div>

            <div className="space-y-4">
              {/* Visualization of Shift */}
              <div className="grid grid-cols-[1fr,auto,1fr] gap-2 items-center text-center">
                <div className="space-y-1">
                  <div className="text-xs text-gray-500">Current</div>
                  <div className="h-16 bg-gray-800 rounded-lg flex flex-col overflow-hidden">
                    <div style={{ height: `${MOCK_ALLOCATION.crypto}%` }} className="bg-purple-500/40 w-full flex items-center justify-center text-[10px] text-white">Crypto {MOCK_ALLOCATION.crypto}%</div>
                    <div style={{ height: `${MOCK_ALLOCATION.stable}%` }} className="bg-blue-500/40 w-full flex items-center justify-center text-[10px] text-white">Stable {MOCK_ALLOCATION.stable}%</div>
                  </div>
                </div>

                <div className="text-gray-500">
                  <ArrowRight className="w-5 h-5" />
                </div>

                <div className="space-y-1">
                  <div className="text-xs text-purple-300">Target</div>
                  <div className="h-16 bg-gray-800 rounded-lg flex flex-col overflow-hidden ring-2 ring-purple-500/30">
                    <div style={{ height: `${MOCK_ALLOCATION.targetCrypto}%` }} className="bg-purple-500 w-full flex items-center justify-center text-[10px] text-white font-bold">Crypto {MOCK_ALLOCATION.targetCrypto}%</div>
                    <div style={{ height: `${MOCK_ALLOCATION.targetStable}%` }} className="bg-blue-500 w-full flex items-center justify-center text-[10px] text-white font-bold">Stable {MOCK_ALLOCATION.targetStable}%</div>
                  </div>
                </div>
              </div>

              <button className="w-full py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors text-sm font-medium border border-white/5">
                Execute Rebalance
              </button>
            </div>
          </div>
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

        <WalletActions
          onZapInClick={() => {}}
          onZapOutClick={() => {}}
          onOptimizeClick={() => {}}
          disabled={false}
        />
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
