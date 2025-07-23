import React, { useState, useCallback } from "react";
import { HelpCircle } from "lucide-react";

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
  const [imageState, setImageState] = useState<"loading" | "loaded" | "error">(
    "loading"
  );
  const [currentSrc, setCurrentSrc] = useState(src);
  const [fallbackAttempt, setFallbackAttempt] = useState(0);

  const getFallbackSrc = useCallback(
    (attempt: number, type: string, symbol?: string): string | null => {
      const lowerSymbol = symbol?.toLowerCase() || "";

      switch (attempt) {
        case 0:
          return src; // Original source
        case 1:
          // Try CDN fallback
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
        case 2:
          // Try local assets
          switch (type) {
            case "token":
              return `/tokenPictures/${lowerSymbol}.webp`;
            case "chain":
              return `/chainPicturesWebp/${lowerSymbol}.webp`;
            case "project":
              return `/projectPictures/${lowerSymbol}.webp`;
            default:
              return null;
          }
        case 3:
          // Try generic fallbacks
          switch (type) {
            case "token":
              return "/tokenPictures/usdc.webp";
            case "chain":
              return "/chainPicturesWebp/ethereum.webp";
            case "project":
              return "/projectPictures/uniswap.webp";
            default:
              return null;
          }
        default:
          return null; // Will show question mark
      }
    },
    [src]
  );

  const handleImageError = useCallback(() => {
    const nextAttempt = fallbackAttempt + 1;
    const nextSrc = getFallbackSrc(nextAttempt, fallbackType, symbol);

    if (nextSrc) {
      setCurrentSrc(nextSrc);
      setFallbackAttempt(nextAttempt);
      setImageState("loading");
    } else {
      setImageState("error");
    }
  }, [fallbackAttempt, fallbackType, symbol, getFallbackSrc]);

  const handleImageLoad = useCallback(() => {
    setImageState("loaded");
  }, []);

  // If all fallbacks failed, show question mark icon
  if (imageState === "error") {
    return (
      <div
        className={`relative flex items-center justify-center rounded-full bg-gray-700 ${className}`}
        style={{ width: size, height: size }}
        title={`${fallbackType} image not found: ${alt}`}
      >
        <HelpCircle size={size * 0.6} className="text-gray-400" />
      </div>
    );
  }

  return (
    <div
      className={`relative flex items-center justify-center rounded-full bg-gray-600 ${className}`}
      style={{ width: size, height: size }}
    >
      <img
        src={currentSrc}
        alt={alt}
        width={size}
        height={size}
        className="rounded-full"
        onError={handleImageError}
        onLoad={handleImageLoad}
        style={{
          opacity: imageState === "loaded" ? 1 : 0.7,
          transition: "opacity 0.2s ease-in-out",
        }}
      />
      {imageState === "loading" && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
};
