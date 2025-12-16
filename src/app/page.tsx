"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { useUser } from "@/contexts/UserContext";

export default function DashboardApp() {
  const router = useRouter();
  const { userInfo, isConnected } = useUser();

  // Redirect to user's bundle page after wallet connection
  useEffect(() => {
    if (isConnected && userInfo?.userId) {
      // Only redirect if we're on the root path
      if (window.location.pathname === "/") {
        // Preserve query parameters
        const searchParams = new URLSearchParams(window.location.search);
        // Ensure the userId is part of the query for static export routing
        searchParams.set("userId", userInfo.userId);
        const queryString = searchParams.toString();
        const newUrl =
          queryString.length > 0 ? `/bundle?${queryString}` : "/bundle";

        // Replace current history entry to avoid redirect loops
        router.replace(newUrl);
      }
    }
  }, [isConnected, userInfo?.userId, router]);

  // While redirecting from root to /bundle, show simple loading state
  const isOnRoot =
    typeof window !== "undefined" && window.location.pathname === "/";
  const pendingRedirect = isOnRoot && isConnected && !!userInfo?.userId;

  if (pendingRedirect) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 text-lg">Opening your bundle...</div>
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-500 border-t-transparent mx-auto" />
        </div>
      </div>
    );
  }

  // Default landing page - simple wallet connection prompt
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold">Welcome to Zap Pilot</h1>
        <p className="text-lg text-gray-400">
          Connect your wallet to view your portfolio
        </p>
      </div>
    </div>
  );
}
