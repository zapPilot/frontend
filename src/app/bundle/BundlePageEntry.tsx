"use client";

import { useSearchParams } from "next/navigation";

import { logger } from "../../utils/logger";
import { BundlePageClient } from "./BundlePageClient";

export function BundlePageEntry() {
  const searchParams = useSearchParams();

  let userId = "";
  let walletId: string | null = null;
  let etlJobId: string | null = null;
  let isNewUser = false;
  if (searchParams) {
    try {
      userId = searchParams.get("userId") ?? "";
      walletId = searchParams.get("walletId");
      etlJobId = searchParams.get("etlJobId");
      isNewUser = searchParams.get("isNewUser") === "true";
    } catch (error) {
      if (process.env.NODE_ENV !== "production") {
        logger.error("Failed to read search params", error, "BundlePageEntry");
      }
    }
  }

  // V1 layout (default)
  return walletId || etlJobId || isNewUser ? (
    <BundlePageClient
      userId={userId}
      {...(walletId ? { walletId } : {})}
      {...(etlJobId ? { etlJobId } : {})}
      {...(isNewUser ? { isNewUser } : {})}
    />
  ) : (
    <BundlePageClient userId={userId} />
  );
}
