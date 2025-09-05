import { Suspense } from "react";
import { BundlePageEntry } from "./BundlePageEntry";

export default function BundlePage() {
  return (
    <Suspense fallback={<div />}>
      <BundlePageEntry />
    </Suspense>
  );
}
