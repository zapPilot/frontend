"use client";

import {
  createV22ErrorState,
  createV22LoadingState,
} from "@/adapters/walletPortfolioV22Adapter";
import { WalletPortfolioPresenterV22 } from "@/components/wallet/WalletPortfolioPresenterV22";
import { usePortfolioDataV22 } from "@/hooks/queries/usePortfolioDataV22";

interface BundlePageClientV22Props {
  userId: string;
  walletId?: string;
}

export function BundlePageClientV22({ userId }: BundlePageClientV22Props) {
  const { data, isLoading, error } = usePortfolioDataV22(userId);

  if (isLoading) {
    const loadingData = createV22LoadingState();
    return (
      <div data-testid="v22-loading">
        <WalletPortfolioPresenterV22 data={loadingData} userId={userId} />
      </div>
    );
  }

  if (error) {
    const errorData = createV22ErrorState();
    return (
      <div data-testid="v22-error">
        <WalletPortfolioPresenterV22 data={errorData} userId={userId} />
      </div>
    );
  }

  if (!data) {
    const errorData = createV22ErrorState();
    return (
      <div data-testid="v22-error">
        <WalletPortfolioPresenterV22 data={errorData} userId={userId} />
      </div>
    );
  }

  return <WalletPortfolioPresenterV22 data={data} userId={userId} />;
}
