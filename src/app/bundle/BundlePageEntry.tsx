"use client";

import { useSearchParams } from "next/navigation";

import { logger } from "../../utils/logger";
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

  // V22 layout with horizontal navigation and 3 tabs
  return walletId ? (
    <BundlePageClientV22 userId={userId} walletId={walletId} />
  ) : (
    <BundlePageClientV22 userId={userId} />
  );
}
