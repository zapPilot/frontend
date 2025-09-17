"use client";

import { useWalletPortfolioState } from "@/hooks/useWalletPortfolioState";
import { WalletPortfolioPresenter } from "@/components/wallet/WalletPortfolioPresenter";

interface WalletPortfolioProps {
  urlUserId?: string;
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
  onOptimizeClick,
  onZapInClick,
  onZapOutClick,
  onCategoryClick,
  isOwnBundle,
  bundleUserName,
  bundleUrl,
}: WalletPortfolioProps = {}) {
  const vm = useWalletPortfolioState({
    ...(urlUserId ? { urlUserId } : {}),
    ...(onOptimizeClick ? { onOptimizeClick } : {}),
    ...(onZapInClick ? { onZapInClick } : {}),
    ...(onZapOutClick ? { onZapOutClick } : {}),
    ...(onCategoryClick ? { onCategoryClick } : {}),
    ...(typeof isOwnBundle !== "undefined" ? { isOwnBundle } : {}),
    ...(bundleUserName ? { bundleUserName } : {}),
    ...(bundleUrl ? { bundleUrl } : {}),
  });

  return (
    <WalletPortfolioPresenter
      vm={vm}
      {...(onCategoryClick ? { onCategoryClick } : {})}
    />
  );
}
