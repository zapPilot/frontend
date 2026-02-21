"use client";

import { useSearchParams } from "next/navigation";
import type { ReactElement } from "react";

import { logger } from "../../utils/logger";
import { BundlePageClient } from "./BundlePageClient";

export function BundlePageEntry(): ReactElement {
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

  const bundlePageClientProps: {
    userId: string;
    walletId?: string;
    etlJobId?: string;
    isNewUser?: boolean;
  } = { userId };

  if (walletId) {
    bundlePageClientProps.walletId = walletId;
  }

  if (etlJobId) {
    bundlePageClientProps.etlJobId = etlJobId;
  }

  if (isNewUser) {
    bundlePageClientProps.isNewUser = true;
  }

  return <BundlePageClient {...bundlePageClientProps} />;
}
