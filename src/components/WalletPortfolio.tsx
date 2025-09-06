"use client";

import { logger } from "@/utils/logger";
import dynamic from "next/dynamic";
import { ComponentType } from "react";
import { BalanceVisibilityProvider } from "../contexts/BalanceVisibilityContext";
import { useUser } from "../contexts/UserContext";
import { useLandingPageData } from "../hooks/queries/usePortfolioQuery";
import { usePortfolio } from "../hooks/usePortfolio";
import { usePortfolioData } from "../hooks/usePortfolioData";
import { usePortfolioState } from "../hooks/usePortfolioState";
import { useWalletModal } from "../hooks/useWalletModal";
import { ErrorBoundary } from "./errors/ErrorBoundary";
import { PortfolioOverview } from "./PortfolioOverview";
import { GlassCard } from "./ui";
import { WalletActions } from "./wallet/WalletActions";
import { WalletHeader } from "./wallet/WalletHeader";
import { WalletMetrics } from "./wallet/WalletMetrics";

// Import component props interfaces for proper typing
import type { WalletManagerProps } from "./WalletManager";

const WalletManager: ComponentType<WalletManagerProps> = dynamic(
  () => import("./WalletManager").then(mod => ({ default: mod.WalletManager })),
  {
    loading: () => null, // Modal doesn't need loading state when closed
  }
);

const walletPortfolioLogger = logger.createContextLogger("WalletPortfolio");

interface WalletPortfolioProps {
  urlUserId?: string;
  onAnalyticsClick?: (() => void) | undefined;
  onOptimizeClick?: (() => void) | undefined;
  onZapInClick?: (() => void) | undefined;
  onZapOutClick?: (() => void) | undefined;
  onCategoryClick?: (categoryId: string) => void;
  isOwnBundle?: boolean | undefined;
  bundleUserName?: string | undefined;
  bundleUrl?: string;
}

export function WalletPortfolio({
  urlUserId,
  onAnalyticsClick,
  onOptimizeClick,
  onZapInClick,
  onZapOutClick,
  onCategoryClick,
  isOwnBundle,
  bundleUserName,
  bundleUrl,
}: WalletPortfolioProps = {}) {
  // Get user data for landing page
  const { userInfo, isConnected } = useUser();

  // Resolve which userId to use for data fetching
  // Prefer explicit urlUserId (shared view), else fallback to connected user's id
  const resolvedUserId = urlUserId || userInfo?.userId || null;

  // Unified data fetching - single API call for all landing page data
  const landingPageQuery = useLandingPageData(resolvedUserId);
  const landingPageData = landingPageQuery.data;

  // Transform landing page data for pie chart and category summaries
  const {
    pieChartData,
    categorySummaries,
    debtCategorySummaries,
    portfolioMetrics,
    hasZeroData,
  } = usePortfolioData(landingPageData);

  // Centralized portfolio state management
  const portfolioState = usePortfolioState({
    isConnected,
    isLoading: landingPageQuery.isLoading,
    isRetrying: landingPageQuery.isRefetching,
    error: landingPageQuery.error?.message || null,
    landingPageData,
    hasZeroData,
  });

  // Portfolio UI state management (simplified since we have pre-formatted data)
  const { balanceHidden, toggleBalanceVisibility } = usePortfolio([]);

  // Wallet modal state
  const {
    isOpen: isWalletManagerOpen,
    openModal: openWalletManager,
    closeModal: closeWalletManager,
  } = useWalletModal();

  return (
    <ErrorBoundary
      onError={error =>
        walletPortfolioLogger.error("WalletPortfolio Error", error)
      }
      resetKeys={[
        userInfo?.userId || "no-user",
        isConnected ? "connected" : "disconnected",
      ]}
    >
      <BalanceVisibilityProvider
        value={{ balanceHidden, toggleBalanceVisibility }}
      >
        <div className="space-y-6">
          {/* Wallet Header */}
          <ErrorBoundary
            onError={error =>
              walletPortfolioLogger.error("WalletHeader Error", error)
            }
          >
            <GlassCard>
              <WalletHeader
                onWalletManagerClick={openWalletManager}
                isOwnBundle={isOwnBundle}
                bundleUserName={bundleUserName}
                bundleUrl={bundleUrl}
              />

              <WalletMetrics
                portfolioState={portfolioState}
                portfolioChangePercentage={
                  portfolioMetrics?.totalChangePercentage || 0
                }
                userId={resolvedUserId}
                landingPageData={landingPageData}
              />

              <WalletActions
                onZapInClick={onZapInClick}
                onZapOutClick={onZapOutClick}
                onOptimizeClick={onOptimizeClick}
              />
            </GlassCard>
          </ErrorBoundary>

          {/* Asset Distribution with Horizontal Layout */}
          <ErrorBoundary
            onError={error =>
              walletPortfolioLogger.error("PortfolioOverview Error", error)
            }
          >
            <PortfolioOverview
              portfolioState={portfolioState}
              categorySummaries={categorySummaries}
              debtCategorySummaries={debtCategorySummaries}
              pieChartData={pieChartData || []}
              balanceHidden={balanceHidden}
              title="Asset Distribution"
              onRetry={landingPageQuery.refetch}
              testId="wallet-portfolio-overview"
              {...(onCategoryClick && { onCategoryClick })}
            />
          </ErrorBoundary>

          {/* Wallet Manager Modal */}
          <ErrorBoundary
            onError={error =>
              walletPortfolioLogger.error("WalletManager Error", error)
            }
          >
            <WalletManager
              isOpen={isWalletManagerOpen}
              onClose={closeWalletManager}
              {...(urlUserId && { urlUserId })}
            />
          </ErrorBoundary>
        </div>
      </BalanceVisibilityProvider>
    </ErrorBoundary>
  );
}
