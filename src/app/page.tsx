"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { DashboardShell } from "@/components/DashboardShell";
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
        const newUrl = `/bundle${queryString ? `?${queryString}` : ""}`;

        // Replace current history entry to avoid redirect loops
        router.replace(newUrl);
      }
    }
  }, [isConnected, userInfo?.userId, router]);

  // While redirecting from root to /bundle, avoid mounting heavy components
  const isOnRoot =
    typeof window !== "undefined" && window.location.pathname === "/";
  const pendingRedirect = isOnRoot && isConnected && !!userInfo?.userId;

  return (
    <DashboardShell
      pendingState={{
        isPending: pendingRedirect,
        message: "Opening your bundle...",
      }}
    />
  );
}
