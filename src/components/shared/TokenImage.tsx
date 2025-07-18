import React from "react";

interface TokenImageProps {
  token: {
    symbol?: string;
    optimized_symbol?: string;
    logo_url?: string;
  };
  size?: number;
  className?: string;
}

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

    // Fallback to a placeholder or generate from symbol
    const symbol = getTokenSymbol().toLowerCase();
    return `/tokenPictures/${symbol}.webp`;
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    // Fallback to a generic token placeholder
    e.currentTarget.src = "/tokenPictures/usdc.webp";
  };

  return (
    <div
      className={`relative flex items-center justify-center rounded-full bg-gray-600 ${className}`}
      style={{ width: size, height: size }}
    >
      <img
        src={getImageSrc()}
        alt={getTokenSymbol()}
        width={size}
        height={size}
        className="rounded-full"
        onError={handleImageError}
      />
    </div>
  );
};
