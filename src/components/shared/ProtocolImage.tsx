import React from "react";
import { BaseComponentProps } from "../../types/ui.types";
import { ImageWithFallback } from "./ImageWithFallback";
import { normalizeProtocolName } from "../../lib/stringUtils";

interface ProtocolImageProps extends BaseComponentProps {
  protocol: {
    name?: string;
    logo_url?: string;
  };
  size?: number;
}

const ZAP_ASSET_WORKER_BASE_URL =
  "https://zap-assets-worker.davidtnfsh.workers.dev";

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
    return `${ZAP_ASSET_WORKER_BASE_URL}/projectPictures/${normalizedName}.webp`;
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
