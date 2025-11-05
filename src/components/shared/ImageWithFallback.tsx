import { HelpCircle } from "lucide-react";
import Image from "next/image";
import React, { useState } from "react";

import { normalizeForComparison } from "../../lib/stringUtils";
import { BaseComponentProps } from "../../types/ui.types";

interface ImageWithFallbackProps extends BaseComponentProps {
  src: string;
  alt: string;
  fallbackType: "token" | "chain" | "project";
  size?: number;
  symbol?: string;
}

export function ImageWithFallback({
  src,
  alt,
  fallbackType,
  size = 24,
  className = "",
  symbol,
}: ImageWithFallbackProps) {
  const [imageState, setImageState] = useState({
    status: "loading" as "loading" | "fallback" | "error",
    currentSrc: src,
    attemptedFallback: false,
  });

  // Reset state when src changes
  React.useEffect(() => {
    setImageState({
      status: "loading",
      currentSrc: src,
      attemptedFallback: false,
    });
  }, [src]);

  const getFallbackSrc = (type: string, symbol?: string): string | null => {
    const lowerSymbol = normalizeForComparison(symbol);

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
  };

  const handleImageError = () => {
    if (!imageState.attemptedFallback) {
      // Try one fallback attempt
      const fallbackSrc = getFallbackSrc(fallbackType, symbol);
      if (fallbackSrc && fallbackSrc !== imageState.currentSrc) {
        setImageState({
          status: "fallback",
          currentSrc: fallbackSrc,
          attemptedFallback: true,
        });
        return;
      }
    }

    // All attempts failed, show error state
    setImageState(prev => ({ ...prev, status: "error" }));
  };

  // If image failed, show question mark icon
  if (imageState.status === "error") {
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
      className={`flex items-center justify-center rounded-full bg-gray-600 overflow-hidden ${className}`}
      style={{ width: size, height: size }}
    >
      <Image
        src={imageState.currentSrc}
        alt={alt}
        width={size}
        height={size}
        className="rounded-full object-cover"
        key={imageState.currentSrc} // Force re-render on src change
        onError={handleImageError}
        loading={size <= 48 ? "eager" : "lazy"}
        unoptimized // Disable Next.js optimization for external URLs
      />
    </div>
  );
}
