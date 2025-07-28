import { HelpCircle } from "lucide-react";
import React, { useCallback, useState } from "react";

interface ImageWithFallbackProps {
  src: string;
  alt: string;
  fallbackType: "token" | "chain" | "project";
  size?: number;
  className?: string;
  symbol?: string;
}

export const ImageWithFallback: React.FC<ImageWithFallbackProps> = ({
  src,
  alt,
  fallbackType,
  size = 24,
  className = "",
  symbol,
}) => {
  const [hasError, setHasError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(src);
  const [hasFallbackAttempted, setHasFallbackAttempted] = useState(false);

  // Reset state when src changes
  React.useEffect(() => {
    setCurrentSrc(src);
    setHasError(false);
    setHasFallbackAttempted(false);
  }, [src]);

  const getFallbackSrc = useCallback(
    (type: string, symbol?: string): string | null => {
      const lowerSymbol = symbol?.toLowerCase()?.trim() || "";

      // Don't try fallback if no symbol provided
      if (!lowerSymbol) {
        return null;
      }

      switch (type) {
        case "token":
          return `https://zap-assets-worker.davidtnfsh.workers.dev/tokenPictures/${lowerSymbol}.webp`;
        case "chain":
          return `https://zap-assets-worker.davidtnfsh.workers.dev/chainPicturesWebp/${lowerSymbol}.webp`;
        case "project":
          return `https://zap-assets-worker.davidtnfsh.workers.dev/projectPictures/${lowerSymbol}.webp`;
        default:
          return null;
      }
    },
    []
  );

  const handleImageError = useCallback(() => {
    if (!hasFallbackAttempted) {
      // Try one fallback attempt
      const fallbackSrc = getFallbackSrc(fallbackType, symbol);
      if (fallbackSrc) {
        setCurrentSrc(fallbackSrc);
        setHasFallbackAttempted(true);
        return;
      }
    }

    // All attempts failed, show error state
    setHasError(true);
  }, [hasFallbackAttempted, fallbackType, symbol, getFallbackSrc]);

  // If image failed, show question mark icon
  if (hasError) {
    return (
      <div
        className={`flex items-center justify-center rounded-full bg-gray-700 ${className}`}
        style={{ width: size, height: size }}
        title={`${fallbackType} image not found: ${alt}`}
      >
        <HelpCircle size={size * 0.6} className="text-gray-400" />
      </div>
    );
  }

  return (
    <div
      className={`flex items-center justify-center rounded-full bg-gray-600 ${className}`}
      style={{ width: size, height: size }}
    >
      <img
        src={currentSrc}
        alt={alt}
        width={size}
        height={size}
        className="rounded-full"
        onError={handleImageError}
      />
    </div>
  );
};
