/**
 * V22 Container Component
 *
 * Fetches data from existing APIs and transforms it into V22 format.
 * Acts as a data layer between API hooks and the V22 presenter component.
 */

"use client";

import { useMemo } from "react";

import {
    createV22ErrorState,
    createV22LoadingState,
    transformToV22Data,
    type V22PortfolioData,
} from "@/adapters/walletPortfolioV22Adapter";
import { WalletPortfolioPresenterV22 } from "@/components/wallet/variations/WalletPortfolioPresenterV22";
import { useLandingPageData } from "@/hooks/queries/usePortfolioQuery";
import { useSentimentData } from "@/services/sentimentService";
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
 * 3. Transform into V22 format via adapter
 * 4. Pass to V22 presenter component
 */
export function WalletPortfolioPresenterV22Container({
  userId,
}: WalletPortfolioPresenterV22ContainerProps) {
  // Fetch portfolio data
  const {
    data: landingData,
    isLoading: isLandingLoading,
    error: landingError,
  } = useLandingPageData(userId);

  // Fetch market sentiment data
  const {
    data: sentimentData,
    error: sentimentError,
  } = useSentimentData();

  // Transform data to V22 format
  const v22Data: V22PortfolioData = useMemo(() => {
    // Handle loading state
    if (isLandingLoading) {
      return createV22LoadingState();
    }

    // Handle error state
    if (landingError || !landingData) {
      logger.error("Failed to load portfolio data for V22", {
        landingError,
        userId,
      });
      return createV22ErrorState();
    }

    // Log sentiment errors but don't block rendering
    if (sentimentError) {
      logger.warn("Failed to load sentiment data for V22, using fallback", {
        sentimentError,
      });
    }

    // Transform to V22 format
    return transformToV22Data(
      landingData,
      sentimentData ?? null
    );
  }, [
    landingData,
    sentimentData,
    isLandingLoading,
    landingError,
    sentimentError,
    userId,
  ]);

  // Note: Action handlers and flags will be implemented during production migration
  return <WalletPortfolioPresenterV22 data={v22Data} />;
}
