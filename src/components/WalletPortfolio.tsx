"use client";

import { WalletPortfolioPresenterV22Container } from "@/components/wallet/WalletPortfolioPresenterV22Container";

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
  isOwnBundle,
}: WalletPortfolioProps = {}) {
  // V22 Layout: Use new portfolio presenter with real data transformation
  // Build props object with only defined values (strict exactOptionalPropertyTypes)
  const v22Props: Parameters<typeof WalletPortfolioPresenterV22Container>[0] = {
    userId: urlUserId ?? null,
    ...(onOptimizeClick && { onOptimizeClick }),
    ...(onZapInClick && { onZapInClick }),
    ...(onZapOutClick && { onZapOutClick }),
    ...(typeof isOwnBundle !== "undefined" && { isOwnBundle }),
    ...(typeof isOwnBundle !== "undefined" && {
      isVisitorMode: !isOwnBundle,
    }),
  };

  return <WalletPortfolioPresenterV22Container {...v22Props} />;
}
