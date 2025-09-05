"use client";

import { useSearchParams } from "next/navigation";
import { BundlePageClient } from "./BundlePageClient";

export function BundlePageEntry() {
  const searchParams = useSearchParams();
  const userId = searchParams?.get("userId") ?? "";
  return <BundlePageClient userId={userId} />;
}
