import React from "react";

import { getAssetUrl } from "../../config/assets";
import { BaseComponentProps } from '@/types/ui/ui.types';
import { ImageWithFallback } from "./ImageWithFallback";

interface TokenImageProps extends BaseComponentProps {
  token: {
    symbol?: string;
    optimized_symbol?: string;
    logo_url?: string;
  };
  size?: number;
}

export function TokenImage({
  token,
  size = 32,
  className = "",
}: TokenImageProps) {
  const getTokenSymbol = () => {
    return token.optimized_symbol || token.symbol || "UNKNOWN";
  };

  const getImageSrc = () => {
    // If token has logo_url, use it
    if (token.logo_url) {
      return token.logo_url;
    }

    const symbol = getTokenSymbol().toLowerCase();
    return getAssetUrl("token", symbol);
  };

  return (
    <ImageWithFallback
      src={getImageSrc()}
      alt={getTokenSymbol()}
      fallbackType="token"
      symbol={getTokenSymbol()}
      size={size}
      className={className}
    />
  );
}
