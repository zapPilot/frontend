/**
 * Wallet Portfolio Container
 *
 * Fetches data from existing APIs and transforms it into the wallet portfolio format.
 * Acts as a data layer between API hooks and the presenter component.
 */

"use client";

import {
  createWalletPortfolioErrorState,
  createWalletPortfolioLoadingState,
} from "@/adapters/walletPortfolio";
import { usePortfolioData } from "@/hooks/queries/usePortfolioData";
import { logger } from "@/utils/logger";

import { WalletPortfolioPresenter } from "./WalletPortfolioPresenter";

interface WalletPortfolioProps {
  /** User ID for portfolio data fetching */
  userId?: string | null;

  /** Action handlers from parent (not yet implemented in presenter) */
  onOptimizeClick?: () => void;
  onZapInClick?: () => void;
  onZapOutClick?: () => void;
  onWalletManagerClick?: () => void;
  onCategoryClick?: (categoryId: string) => void;

  /** Additional flags (not yet implemented in presenter) */
  isOwnBundle?: boolean;
  isVisitorMode?: boolean;
  bundleUserName?: string;
  bundleUrl?: string;
}

/**
 * Container component that handles data fetching and transformation
 * for WalletPortfolioPresenter.
 *
 * Data Flow:
 * 1. Fetch landing page data (portfolio metrics)
 * 2. Fetch sentiment data (market regime)
 * 3. Fetch regime history data (directional strategy, optional)
 * 4. Transform into portfolio format via unified hook
 * 5. Pass to presenter component
 */
export function WalletPortfolio({ userId }: WalletPortfolioProps) {
  // Fetch and transform all portfolio data via unified hook
  // Includes landing data, sentiment, and regime history (if enabled)
  const { data, isLoading, error } = usePortfolioData(userId ?? "");

  // Handle loading state
  if (isLoading) {
    return (
      <WalletPortfolioPresenter
        data={createWalletPortfolioLoadingState()}
        userId={userId ?? ""}
      />
    );
  }

  // Handle error state
  if (error || !data) {
    logger.error("Failed to load portfolio data for wallet portfolio", {
      error,
      userId,
    });
    return (
      <WalletPortfolioPresenter
        data={createWalletPortfolioErrorState()}
        userId={userId ?? ""}
      />
    );
  }

  // Note: Action handlers and flags will be implemented during production migration
  return <WalletPortfolioPresenter data={data} userId={userId ?? ""} />;
}
