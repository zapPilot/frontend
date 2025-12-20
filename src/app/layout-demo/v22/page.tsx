"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

import { MOCK_DATA } from "@/components/wallet/portfolio/data/mockPortfolioData";
import {
  WalletPortfolioErrorState,
  WalletPortfolioLoadingState,
} from "@/components/wallet/portfolio/views/LoadingStates";
import { WalletPortfolioPresenter } from "@/components/wallet/portfolio/WalletPortfolioPresenter";
import { usePortfolioData } from "@/hooks/queries/usePortfolioData";

// Default UUID for testing (from production bundle route)
const DEFAULT_DEMO_UUID = "5fc63d4e-4e07-47d8-840b-ccd3420d553f";

/**
 * Portfolio Layout Demo Page Content
 *
 * Inner component that uses useSearchParams() - wrapped in Suspense boundary
 */
function LayoutDemoV22Content() {
  const searchParams = useSearchParams();

  // Read userId from URL query parameter (UUID format required)
  const userId = searchParams.get("userId") ?? DEFAULT_DEMO_UUID;

  const { data, isLoading, error, refetch } = usePortfolioData(userId);

  // Loading state (initial load)
  if (isLoading && !data) {
    return <WalletPortfolioLoadingState />;
  }

  // Use real data if available, fallback to MOCK_DATA even when API fails
  const portfolioData = data ?? MOCK_DATA;
  const shouldShowError = Boolean(error && !data && !portfolioData);

  if (shouldShowError) {
    return <WalletPortfolioErrorState error={error as Error} onRetry={refetch} />;
  }

  return <WalletPortfolioPresenter data={portfolioData} userId={userId} />;
}

/**
 * Portfolio Layout Demo Page
 *
 * Demonstrates the V22 portfolio layout with real API data.
 * Uses UUID query parameter for user identification (matches production bundle route).
 *
 * @example
 * // With explicit UUID
 * http://localhost:3000/layout-demo/v22?userId=5fc63d4e-4e07-47d8-840b-ccd3420d553f
 *
 * // Without parameter (uses fallback UUID)
 * http://localhost:3000/layout-demo/v22
 */
export default function LayoutDemoV22Page() {
  return (
    <Suspense fallback={<WalletPortfolioLoadingState />}>
      <LayoutDemoV22Content />
    </Suspense>
  );
}
