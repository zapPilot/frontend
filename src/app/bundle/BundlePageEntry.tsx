"use client";

import { useSearchParams } from "next/navigation";
import { BundlePageClient } from "./BundlePageClient";

export function BundlePageEntry() {
  const searchParams = useSearchParams();

  let userId = "";
  if (searchParams) {
    try {
      userId = searchParams.get("userId") ?? "";
    } catch (error) {
      if (process.env.NODE_ENV !== "production") {
        // eslint-disable-next-line no-console
        console.error("[BundlePageEntry] Failed to read search params", error);
      }
    }
  }

  return <BundlePageClient userId={userId} />;
}
