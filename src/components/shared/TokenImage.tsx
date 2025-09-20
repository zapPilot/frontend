import React from "react";
import { ImageWithFallback } from "./ImageWithFallback";

interface TokenImageProps {
  token: {
    symbol?: string;
    optimized_symbol?: string;
    logo_url?: string;
  };
  size?: number;
  className?: string;
}

const ZAP_ASSET_WORKER_BASE_URL =
  "https://zap-assets-worker.davidtnfsh.workers.dev";

export const TokenImage: React.FC<TokenImageProps> = ({
  token,
  size = 32,
  className = "",
}) => {
  const getTokenSymbol = () => {
    return token.optimized_symbol || token.symbol || "UNKNOWN";
  };

  const getImageSrc = () => {
    // If token has logo_url, use it
    if (token.logo_url) {
      return token.logo_url;
    }

    const symbol = getTokenSymbol().toLowerCase();
    return `${ZAP_ASSET_WORKER_BASE_URL}/tokenPictures/${symbol}.webp`;
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
};
