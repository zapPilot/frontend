"use client";

import { useMemo } from "react";
import type { ApiCategoryKey } from "@/constants/portfolio";
import { transformToPieChartData } from "@/lib/chartUtils";
import type { LandingPageResponse } from "../services/analyticsService";
import type { PieChartData, PortfolioMetrics } from "../types/portfolio";
import {
  createCategoriesFromApiData,
  type CategorySummary,
} from "../utils/portfolio.utils";

interface WalletPortfolioTransformResult {
  pieChartData: PieChartData[] | null;
  categorySummaries: CategorySummary[];
  debtCategorySummaries: CategorySummary[];
  portfolioMetrics: PortfolioMetrics | null;
  hasZeroData: boolean;
}

const CATEGORY_ORDER: ApiCategoryKey[] = [
  "btc",
  "eth",
  "stablecoins",
  "others",
];

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

    const assetSummariesRaw = createCategoriesFromApiData(
      {
        btc: portfolioAllocation.btc.total_value,
        eth: portfolioAllocation.eth.total_value,
        stablecoins: portfolioAllocation.stablecoins.total_value,
        others: portfolioAllocation.others.total_value,
      },
      landingPageData.total_assets_usd
    );

    const assetSummaries = Array.isArray(assetSummariesRaw)
      ? assetSummariesRaw
      : [];

    const summaryMap = new Map(
      assetSummaries.map(summary => [summary.id as ApiCategoryKey, summary])
    );

    const pieChartData = transformToPieChartData(
      CATEGORY_ORDER.map(categoryId => {
        const summary = summaryMap.get(categoryId);
        return {
          id: categoryId,
          value: summary?.totalValue ?? 0,
          percentage: summary?.percentage ?? 0,
        };
      }),
      { deriveCategoryMetadata: true, colorVariant: "brand" }
    );

    const debtSummariesRaw = createCategoriesFromApiData(
      landingPageData.category_summary_debt || {
        btc: 0,
        eth: 0,
        stablecoins: 0,
        others: 0,
      },
      landingPageData.total_debt_usd || 0
    );

    const debtSummaries = Array.isArray(debtSummariesRaw)
      ? debtSummariesRaw
      : [];

    const portfolioMetrics: PortfolioMetrics = {
      totalValue: landingPageData.total_net_usd,
      totalChange24h: 0,
      totalChangePercentage: 0,
    };

    return {
      pieChartData: pieChartData.length > 0 ? pieChartData : null,
      categorySummaries: assetSummaries,
      debtCategorySummaries: debtSummaries,
      portfolioMetrics,
      hasZeroData: hasZeroPortfolioData,
    };
  }, [landingPageData]);
}
