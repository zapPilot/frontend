"use client";

import { useSearchParams } from "next/navigation";

import { logger } from "../../utils/logger";
import { BundlePageClient } from "./BundlePageClient";

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

  // Only pass walletId if it's defined (for TypeScript strict optional properties)
  return walletId ? (
    <BundlePageClient userId={userId} walletId={walletId} />
  ) : (
    <BundlePageClient userId={userId} />
  );
}
