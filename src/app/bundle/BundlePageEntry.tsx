"use client";

import { useSearchParams } from "next/navigation";

import { isUserInV22Rollout } from "@/config/featureFlags";

import { logger } from "../../utils/logger";
import { BundlePageClient } from "./BundlePageClient";
import { BundlePageClientV22 } from "./BundlePageClientV22";

export function BundlePageEntry() {
  const searchParams = useSearchParams();

  let userId = "";
  let walletId: string | null = null;
  if (searchParams) {
    try {
      userId = searchParams.get("userId") ?? "";
      walletId = searchParams.get("walletId");
    } catch (error) {
      if (process.env.NODE_ENV !== "production") {
        logger.error("Failed to read search params", error, "BundlePageEntry");
      }
    }
  }

  // Feature flag decision point for V22 layout migration
  // Uses percentage-based rollout for gradual deployment
  const shouldUseV22 = isUserInV22Rollout(userId);

  if (shouldUseV22) {
    // V22 layout with horizontal navigation and 3 tabs
    return walletId ? (
      <BundlePageClientV22 userId={userId} walletId={walletId} />
    ) : (
      <BundlePageClientV22 userId={userId} />
    );
  }

  // V1 layout (fallback/rollback path)
  return walletId ? (
    <BundlePageClient userId={userId} walletId={walletId} />
  ) : (
    <BundlePageClient userId={userId} />
  );
}
