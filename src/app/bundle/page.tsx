import { Suspense } from "react";
import { BundlePageEntry } from "./BundlePageEntry";

export default function BundlePage() {
  return (
    <Suspense
      fallback={
        <div
          data-testid="bundle-suspense-fallback"
          aria-label="Loading bundle"
        />
      }
    >
      <BundlePageEntry />
    </Suspense>
  );
}
