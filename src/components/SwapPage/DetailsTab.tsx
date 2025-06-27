"use client";

import { Info } from "lucide-react";
import { getRiskLevelClasses } from "../../lib/utils";
import { InvestmentOpportunity } from "../../types/investment";
import { AssetCategory } from "../../types/portfolio";
import { AssetCategoriesDetail } from "../AssetCategoriesDetail";

interface DetailsTabProps {
  strategy: InvestmentOpportunity;
  portfolioData: AssetCategory[];
  expandedCategory: string | null;
  onCategoryToggle: (categoryName: string) => void;
}

export function DetailsTab({
  strategy,
  portfolioData,
  expandedCategory,
  onCategoryToggle,
}: DetailsTabProps) {
  return (
    <div className="space-y-6" data-testid="details-tab">
      <div
        className="glass-morphism rounded-3xl p-6 border border-gray-800"
        data-testid="strategy-overview"
      >
        <div className="flex items-start space-x-4">
          <Info className="w-6 h-6 text-blue-400 mt-1" />
          <div>
            <h3 className="text-xl font-bold gradient-text mb-3">
              Strategy Overview
            </h3>
            <p
              className="text-gray-300 leading-relaxed mb-4"
              data-testid="strategy-description"
            >
              {strategy.description}
            </p>
            <div
              className="grid grid-cols-1 md:grid-cols-3 gap-4"
              data-testid="strategy-metrics"
            >
              <div
                className="p-3 rounded-xl bg-gray-900/30"
                data-testid="apr-metric"
              >
                <div className="text-sm text-gray-400">APR</div>
                <div className="text-lg font-bold text-green-400">
                  {strategy.apr}%
                </div>
              </div>
              <div
                className="p-3 rounded-xl bg-gray-900/30"
                data-testid="risk-metric"
              >
                <div className="text-sm text-gray-400">Risk Level</div>
                <div
                  className={`text-lg font-bold ${getRiskLevelClasses(strategy.risk)}`}
                >
                  {strategy.risk}
                </div>
              </div>
              <div
                className="p-3 rounded-xl bg-gray-900/30"
                data-testid="tvl-metric"
              >
                <div className="text-sm text-gray-400">TVL</div>
                <div className="text-lg font-bold text-white">
                  {strategy.tvl}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {portfolioData.length > 0 && (
        <div data-testid="asset-categories">
          <AssetCategoriesDetail
            portfolioData={portfolioData}
            expandedCategory={expandedCategory}
            onCategoryToggle={onCategoryToggle}
            title="Strategy Assets"
          />
        </div>
      )}
    </div>
  );
}
