"use client";

import { WalletPortfolioPresenter } from "@/components/wallet/WalletPortfolioPresenter";
import { WalletPortfolioPresenterV22Container } from "@/components/wallet/WalletPortfolioPresenterV22Container";
import { FEATURE_FLAGS } from "@/config/featureFlags";
import { useWalletPortfolioState } from "@/hooks/useWalletPortfolioState";

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

  // V22 Layout: Use new portfolio presenter with real data transformation
  if (FEATURE_FLAGS.USE_V22_LAYOUT) {
    // Build props object with only defined values (strict exactOptionalPropertyTypes)
    const v22Props: Parameters<typeof WalletPortfolioPresenterV22Container>[0] =
      {
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

  // V1 Layout: Legacy portfolio presenter (fallback)
  return <WalletPortfolioPresenter vm={vm} />;
}
