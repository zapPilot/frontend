import React from "react";

import { BaseComponentProps } from '@/types/ui/ui.types';

import { getAssetUrl } from "../../config/assets";
import { normalizeProtocolName } from "../../lib/stringUtils";
import { ImageWithFallback } from "./ImageWithFallback";

interface ProtocolImageProps extends BaseComponentProps {
  protocol: {
    name?: string;
    logo_url?: string;
  };
  size?: number;
}

export function ProtocolImage({
  protocol,
  size = 24,
  className = "",
}: ProtocolImageProps) {
  const getProtocolName = () => protocol.name || "UNKNOWN";

  const getImageSrc = () => {
    // If protocol has logo_url, use it
    if (protocol.logo_url) {
      return protocol.logo_url;
    }

    // Normalize protocol name: lowercase + strip version suffixes
    const normalizedName = normalizeProtocolName(protocol.name);
    return getAssetUrl("protocol", normalizedName);
  };

  return (
    <ImageWithFallback
      src={getImageSrc()}
      alt={getProtocolName()}
      fallbackType="project"
      symbol={normalizeProtocolName(protocol.name)}
      size={size}
      className={className}
    />
  );
}
