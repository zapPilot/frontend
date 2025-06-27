"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { useStrategyPortfolio } from "../../hooks/useStrategyPortfolio";
import { InvestmentOpportunity } from "../../types/investment";
import { SwapToken } from "../../types/swap";
import { MOCK_TOKENS } from "../../constants/swap";
import { SwapPageHeader } from "./SwapPageHeader";
import { TabNavigation, TabType } from "./TabNavigation";
import { SwapTab } from "./SwapTab";
import { PerformanceTab } from "./PerformanceTab";
import { DetailsTab } from "./DetailsTab";
import { TokenSelectorModal } from "./TokenSelectorModal";
import { PortfolioOverview } from "../PortfolioOverview";

interface SwapPageProps {
  strategy: InvestmentOpportunity;
  onBack: () => void;
}

export function SwapPage({ strategy, onBack }: SwapPageProps) {
  const [fromToken, setFromToken] = useState<SwapToken>(MOCK_TOKENS[0]!);
  const [fromAmount, setFromAmount] = useState("");
  const [showTokenSelector, setShowTokenSelector] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>("swap");

  const {
    portfolioData,
    expandedCategory,
    pieChartData,
    toggleCategoryExpansion,
  } = useStrategyPortfolio(strategy.id);

  const handleTokenSelect = (token: SwapToken) => {
    setFromToken(token);
    setShowTokenSelector(false);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "swap":
        return (
          <SwapTab
            strategy={strategy}
            fromToken={fromToken}
            fromAmount={fromAmount}
            onFromAmountChange={setFromAmount}
            onTokenSelectorOpen={() => setShowTokenSelector(true)}
          />
        );
      case "allocation":
        return (
          <PortfolioOverview
            portfolioData={portfolioData}
            pieChartData={pieChartData}
            title="Portfolio Allocation"
            testId="allocation-tab"
          />
        );
      case "performance":
        return <PerformanceTab />;
      case "details":
        return (
          <DetailsTab
            strategy={strategy}
            portfolioData={portfolioData}
            expandedCategory={expandedCategory}
            onCategoryToggle={toggleCategoryExpansion}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6" data-testid="swap-page">
      <SwapPageHeader strategy={strategy} onBack={onBack} />

      <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />

      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="min-h-[600px]"
        data-testid="tab-content"
      >
        {renderTabContent()}
      </motion.div>

      {showTokenSelector && (
        <TokenSelectorModal
          tokens={MOCK_TOKENS}
          onTokenSelect={handleTokenSelect}
          onClose={() => setShowTokenSelector(false)}
        />
      )}
    </div>
  );
}
