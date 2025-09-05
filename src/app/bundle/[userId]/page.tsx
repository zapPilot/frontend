import { BundlePageClient } from "./BundlePageClient";

interface BundlePageProps {
  params: Promise<{
    userId: string;
  }>;
}

export default async function BundlePage({ params }: BundlePageProps) {
  const { userId } = await params;
  return <BundlePageClient userId={userId} />;
}

// For static export builds, pre-generate allowed dynamic routes.
// Returning an empty array ensures no dynamic paths are generated at build time.
export const dynamicParams = false;

export async function generateStaticParams(): Promise<{ userId: string }[]> {
  return [];
}
