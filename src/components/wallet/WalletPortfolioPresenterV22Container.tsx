/**
 * V22 Container Component
 *
 * Fetches data from existing APIs and transforms it into V22 format.
 * Acts as a data layer between API hooks and the V22 presenter component.
 */

"use client";

import {
  createV22ErrorState,
  createV22LoadingState,
} from "@/adapters/walletPortfolioV22Adapter";
import { WalletPortfolioPresenterV22 } from "@/components/wallet/variations/WalletPortfolioPresenterV22";
import { usePortfolioDataV22 } from "@/hooks/queries/usePortfolioDataV22";
import { logger } from "@/utils/logger";

interface WalletPortfolioPresenterV22ContainerProps {
  /** User ID for portfolio data fetching */
  userId?: string | null;

  /** Action handlers from parent (not yet implemented in V22 presenter) */
  onOptimizeClick?: () => void;
  onZapInClick?: () => void;
  onZapOutClick?: () => void;
  onWalletManagerClick?: () => void;

  /** Additional flags (not yet implemented in V22 presenter) */
  isOwnBundle?: boolean;
  isVisitorMode?: boolean;
}

/**
 * Container component that handles data fetching and transformation
 * for WalletPortfolioPresenterV22.
 *
 * Data Flow:
 * 1. Fetch landing page data (portfolio metrics)
 * 2. Fetch sentiment data (market regime)
 * 3. Fetch regime history data (directional strategy, optional)
 * 4. Transform into V22 format via unified hook
 * 5. Pass to V22 presenter component
 */
export function WalletPortfolioPresenterV22Container({
  userId,
}: WalletPortfolioPresenterV22ContainerProps) {
  // Fetch and transform all portfolio data via unified hook
  // Includes landing data, sentiment, and regime history (if enabled)
  const { data, isLoading, error } = usePortfolioDataV22(userId ?? "");

  // Handle loading state
  if (isLoading) {
    return <WalletPortfolioPresenterV22 data={createV22LoadingState()} />;
  }

  // Handle error state
  if (error || !data) {
    logger.error("Failed to load portfolio data for V22", {
      error,
      userId,
    });
    return <WalletPortfolioPresenterV22 data={createV22ErrorState()} />;
  }

  // Note: Action handlers and flags will be implemented during production migration
  return <WalletPortfolioPresenterV22 data={data} />;
}
