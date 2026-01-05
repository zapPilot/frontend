"use client";

import { useSearchParams } from "next/navigation";

import { logger } from "../../utils/logger";
import { BundlePageClient } from "./BundlePageClient";

export function BundlePageEntry() {
  const searchParams = useSearchParams();

  let userId = "";
  let walletId: string | null = null;
  let etlJobId: string | null = null;
  if (searchParams) {
    try {
      userId = searchParams.get("userId") ?? "";
      walletId = searchParams.get("walletId");
      etlJobId = searchParams.get("etlJobId");
    } catch (error) {
      if (process.env.NODE_ENV !== "production") {
        logger.error("Failed to read search params", error, "BundlePageEntry");
      }
    }
  }

  // V1 layout (default)
  return walletId || etlJobId ? (
    <BundlePageClient
      userId={userId}
      {...(walletId ? { walletId } : {})}
      {...(etlJobId ? { etlJobId } : {})}
    />
  ) : (
    <BundlePageClient userId={userId} />
  );
}
