"use client";

import { useSearchParams } from "next/navigation";

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
  const searchParams = useSearchParams();

  // Read userId from URL query parameter (UUID format required)
  const userId = searchParams.get("userId") ?? DEFAULT_DEMO_UUID;

  const { data, isLoading, error, refetch } = usePortfolioDataV22(userId);

  // Loading state (initial load)
  if (isLoading && !data) {
    return <LoadingStateV22 />;
  }

  // Error state with retry
  if (error && !data) {
    return <ErrorStateV22 error={error as Error} onRetry={refetch} />;
  }

  // Use real data if available, fallback to MOCK_DATA
  const portfolioData = data ?? MOCK_DATA;

  return <WalletPortfolioPresenterV22 data={portfolioData} />;
}
