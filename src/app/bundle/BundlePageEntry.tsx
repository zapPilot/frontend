"use client";

import { useSearchParams } from "next/navigation";

import { logger } from "../../utils/logger";
import { BundlePageClient } from "./BundlePageClient";

export function BundlePageEntry() {
  const searchParams = useSearchParams();

  let userId = "";
  if (searchParams) {
    try {
      userId = searchParams.get("userId") ?? "";
    } catch (error) {
      if (process.env.NODE_ENV !== "production") {
        logger.error("Failed to read search params", error, "BundlePageEntry");
      }
    }
  }

  return <BundlePageClient userId={userId} />;
}
