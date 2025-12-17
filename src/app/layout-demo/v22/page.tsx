"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

import { MOCK_DATA } from "@/components/wallet/variations/mockPortfolioData";
import {
  ErrorStateV22,
  LoadingStateV22,
} from "@/components/wallet/variations/v22/LoadingStates";
import { WalletPortfolioPresenterV22 } from "@/components/wallet/variations/WalletPortfolioPresenterV22";
import { usePortfolioDataV22 } from "@/hooks/queries/usePortfolioDataV22";

// Default UUID for testing (from production bundle route)
const DEFAULT_DEMO_UUID = "5fc63d4e-4e07-47d8-840b-ccd3420d553f";

/**
 * V22 Layout Demo Page Content
 *
 * Inner component that uses useSearchParams() - wrapped in Suspense boundary
 */
function LayoutDemoV22Content() {
  const searchParams = useSearchParams();

  // Read userId from URL query parameter (UUID format required)
  const userId = searchParams.get("userId") ?? DEFAULT_DEMO_UUID;

  const { data, isLoading, error, refetch } = usePortfolioDataV22(userId);

  // Loading state (initial load)
  if (isLoading && !data) {
    return <LoadingStateV22 />;
  }

  // Use real data if available, fallback to MOCK_DATA even when API fails
  const portfolioData = data ?? MOCK_DATA;
  const shouldShowError = Boolean(error && !data && !portfolioData);

  if (shouldShowError) {
    return <ErrorStateV22 error={error as Error} onRetry={refetch} />;
  }

  return <WalletPortfolioPresenterV22 data={portfolioData} userId={userId} />;
}

/**
 * V22 Layout Demo Page
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
    <Suspense fallback={<LoadingStateV22 />}>
      <LayoutDemoV22Content />
    </Suspense>
  );
}
