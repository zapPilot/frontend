"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { useStrategyPortfolio } from "../../hooks/useStrategyPortfolio";
import { InvestmentOpportunity } from "../../types/investment";
import { SwapToken } from "../../types/swap";
import { MOCK_TOKENS } from "../../constants/swap";
import { mockInvestmentOpportunities } from "../../data/mockInvestments";
import { SwapPageHeader } from "./SwapPageHeader";
import { TabNavigation, TabType } from "./TabNavigation";
import { SwapTab } from "./SwapTab";
import { PerformanceTab } from "./PerformanceTab";
import { DetailsTab } from "./DetailsTab";
import { OptimizeTab } from "./OptimizeTab";
import { TokenSelectorModal } from "./TokenSelectorModal";
import { StrategySelectorModal } from "./StrategySelectorModal";
import { PortfolioOverview } from "../PortfolioOverview";

interface SwapPageProps {
  strategy: InvestmentOpportunity;
  onBack: () => void;
}

export function SwapPage({ strategy, onBack }: SwapPageProps) {
  const [fromToken, setFromToken] = useState<SwapToken>(MOCK_TOKENS[0]!);
  const [fromAmount, setFromAmount] = useState("");
  const [showTokenSelector, setShowTokenSelector] = useState(false);
  const [showStrategySelector, setShowStrategySelector] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>(
    strategy.id === "optimize-portfolio" ? "optimize" : "swap"
  );

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

  const handleStrategySelect = (selectedStrategy: InvestmentOpportunity) => {
    // Strategy selection logic - for now just log and close modal
    // In a real app, this would update the selected strategy state
    console.log("Strategy selected:", selectedStrategy);
    setShowStrategySelector(false);
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
            onStrategySelectorOpen={() => setShowStrategySelector(true)}
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
      case "optimize":
        return <OptimizeTab strategy={strategy} />;
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

      {showStrategySelector && (
        <StrategySelectorModal
          strategies={mockInvestmentOpportunities}
          onStrategySelect={handleStrategySelect}
          onClose={() => setShowStrategySelector(false)}
          title={
            strategy.navigationContext === "zapOut"
              ? "Select Position to Exit"
              : "Select Strategy to Invest"
          }
          description={
            strategy.navigationContext === "zapOut"
              ? "Choose a vault position to withdraw from"
              : "Choose a vault strategy to invest in"
          }
        />
      )}
    </div>
  );
}
