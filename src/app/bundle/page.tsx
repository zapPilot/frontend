"use client";

import { useSearchParams } from "next/navigation";
import { BundlePageClient } from "./BundlePageClient";

export default function BundlePage() {
  const searchParams = useSearchParams();
  const userId = searchParams.get("userId") ?? "";
  return <BundlePageClient userId={userId} />;
}
