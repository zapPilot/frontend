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
