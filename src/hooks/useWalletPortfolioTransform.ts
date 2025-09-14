"use client";

import { useMemo } from "react";
import type { LandingPageResponse } from "../services/analyticsService";
import type { PieChartData, PortfolioMetrics } from "../types/portfolio";
import {
  createCategoriesFromApiData,
  type CategorySummary,
} from "../utils/portfolio.utils";

export interface WalletPortfolioTransformResult {
  pieChartData: PieChartData[] | null;
  categorySummaries: CategorySummary[];
  debtCategorySummaries: CategorySummary[];
  portfolioMetrics: PortfolioMetrics | null;
  hasZeroData: boolean;
}

export function useWalletPortfolioTransform(
  landingPageData: LandingPageResponse | undefined
): WalletPortfolioTransformResult {
  return useMemo<WalletPortfolioTransformResult>(() => {
    if (!landingPageData) {
      return {
        pieChartData: null,
        categorySummaries: [],
        debtCategorySummaries: [],
        portfolioMetrics: null,
        hasZeroData: false,
      };
    }

    const portfolioAllocation = landingPageData.portfolio_allocation;

    const hasZeroPortfolioData =
      portfolioAllocation.btc.total_value === 0 &&
      portfolioAllocation.eth.total_value === 0 &&
      portfolioAllocation.stablecoins.total_value === 0 &&
      portfolioAllocation.others.total_value === 0 &&
      landingPageData.total_net_usd === 0;

    const transformedPieChartData: PieChartData[] = [
      {
        label: "Bitcoin",
        value: portfolioAllocation.btc.total_value,
        percentage: portfolioAllocation.btc.percentage_of_portfolio,
        color: "#F7931A",
      },
      {
        label: "Ethereum",
        value: portfolioAllocation.eth.total_value,
        percentage: portfolioAllocation.eth.percentage_of_portfolio,
        color: "#627EEA",
      },
      {
        label: "Stablecoins",
        value: portfolioAllocation.stablecoins.total_value,
        percentage: portfolioAllocation.stablecoins.percentage_of_portfolio,
        color: "#26A69A",
      },
      {
        label: "Others",
        value: portfolioAllocation.others.total_value,
        percentage: portfolioAllocation.others.percentage_of_portfolio,
        color: "#AB47BC",
      },
    ].filter(item => item.value > 0);

    const assetSummaries = createCategoriesFromApiData(
      {
        btc: portfolioAllocation.btc.total_value,
        eth: portfolioAllocation.eth.total_value,
        stablecoins: portfolioAllocation.stablecoins.total_value,
        others: portfolioAllocation.others.total_value,
      },
      landingPageData.total_assets_usd
    );

    const debtSummaries = createCategoriesFromApiData(
      landingPageData.category_summary_debt || {
        btc: 0,
        eth: 0,
        stablecoins: 0,
        others: 0,
      },
      landingPageData.total_debt_usd || 0
    );

    const portfolioMetrics: PortfolioMetrics = {
      totalValue: landingPageData.total_net_usd,
      totalChange24h: 0,
      totalChangePercentage: 0,
    };

    return {
      pieChartData:
        transformedPieChartData.length > 0 ? transformedPieChartData : null,
      categorySummaries: assetSummaries,
      debtCategorySummaries: debtSummaries,
      portfolioMetrics,
      hasZeroData: hasZeroPortfolioData,
    };
  }, [landingPageData]);
}
