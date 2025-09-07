"use client";

import { QuickSwitchFAB } from "@/components/bundle";
import { EmailReminderBanner } from "@/components/EmailReminderBanner";
import { DashboardShell } from "@/components/DashboardShell";
import { BundleNotFound } from "@/components/ui";
import type { WalletManagerProps } from "@/components/WalletManager";
import { HEADER, Z_INDEX } from "@/constants/design-system";
import { useUser } from "@/contexts/UserContext";
import { bundleService, BundleUser } from "@/services/bundleService";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import {
  ComponentType,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

const WalletManager: ComponentType<WalletManagerProps> = dynamic(
  () =>
    import("@/components/WalletManager").then(mod => ({
      default: mod.WalletManager,
    })),
  {
    loading: () => null, // Modal doesn't need loading state when closed
  }
);

interface BundlePageClientProps {
  userId: string;
}

export function BundlePageClient({ userId }: BundlePageClientProps) {
  const router = useRouter();
  const { userInfo, isConnected } = useUser();
  const [showSwitchPrompt, setShowSwitchPrompt] = useState(false);
  const [dismissedSwitchPrompt, setDismissedSwitchPrompt] = useState(false);
  const [bundleUser, setBundleUser] = useState<BundleUser | null>(null);
  const [bundleNotFound, setBundleNotFound] = useState(false);
  const [isWalletManagerOpen, setIsWalletManagerOpen] = useState(false);
  const [emailBannerDismissed, setEmailBannerDismissed] = useState(false);

  // Computed values
  const isOwnBundle = bundleService.isOwnBundle(userId, userInfo?.userId);
  const bundleUrl = bundleService.generateBundleUrl(userId);
  const showQuickSwitch = isConnected && !isOwnBundle && userInfo?.userId;
  const showEmailBanner =
    isConnected && isOwnBundle && !userInfo?.email && !emailBannerDismissed;

  // Read dismissed switch prompt from localStorage after mount
  useEffect(() => {
    if (typeof window !== "undefined" && userId) {
      const dismissed =
        localStorage.getItem(`dismissed-switch-${userId}`) === "true";
      setDismissedSwitchPrompt(dismissed);
    }
  }, [userId]);

  // Load bundle user info
  useEffect(() => {
    const loadBundleUser = async () => {
      if (!userId) {
        setBundleNotFound(true);
        return;
      }

      try {
        const user = await bundleService.getBundleUser(userId);
        if (user) {
          setBundleUser(user);
          setBundleNotFound(false);
        } else {
          setBundleNotFound(true);
        }
      } catch (error) {
        console.error("Failed to load bundle user:", error);
        setBundleNotFound(true);
      }
    };
    loadBundleUser();
  }, [userId]);

  // Redirect to home when user disconnects from their own bundle page
  useEffect(() => {
    const isOwnBundle = userInfo?.userId === userId;

    // If this was the user's own bundle but they've disconnected, redirect to home
    if (!isConnected && isOwnBundle) {
      // Preserve query parameters
      const searchParams = new URLSearchParams(window.location.search);
      const queryString = searchParams.toString();
      const newUrl = `/${queryString ? `?${queryString}` : ""}`;

      // Replace current history entry to avoid navigation loops
      router.replace(newUrl);
    }
  }, [isConnected, userInfo?.userId, userId, router]);

  // Offer to switch to the connected user's own bundle when viewing someone else's
  useEffect(() => {
    const isDifferentUser = !!(
      isConnected &&
      userInfo?.userId &&
      userInfo.userId !== userId
    );
    if (isDifferentUser && !dismissedSwitchPrompt) {
      setShowSwitchPrompt(true);
    } else {
      setShowSwitchPrompt(false);
    }
  }, [isConnected, userInfo?.userId, userId, dismissedSwitchPrompt]);

  const handleSwitchToMyBundle = useCallback(() => {
    if (!userInfo?.userId) return;
    const params = new URLSearchParams(window.location.search);
    params.set("userId", userInfo.userId);
    const queryString = params.toString();
    router.replace(`/bundle${queryString ? `?${queryString}` : ""}`);
  }, [router, userInfo?.userId]);

  const handleStayHere = useCallback(() => {
    setDismissedSwitchPrompt(true);
    setShowSwitchPrompt(false);
    // Persist dismissal to localStorage
    if (typeof window !== "undefined" && userId) {
      localStorage.setItem(`dismissed-switch-${userId}`, "true");
    }
  }, [userId]);

  const handleEmailSubscribe = useCallback(() => {
    setIsWalletManagerOpen(true);
  }, []);

  const handleEmailReminderDismiss = useCallback(() => {
    setEmailBannerDismissed(true);
  }, []);

  // Header banners (switch prompt + email banner)
  const headerBanners = useMemo(
    () => (
      <>
        {showSwitchPrompt && (
          <div
            className={`sticky ${HEADER.TOP_OFFSET} ${Z_INDEX.BANNER} mx-4 lg:mx-8 mt-4`}
          >
            <div className="rounded-lg border border-indigo-500/30 bg-indigo-950/40 backdrop-blur px-4 py-3 text-indigo-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="text-sm">
                You&apos;re viewing another user&apos;s bundle. Switch to your
                own bundle?
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={handleStayHere}
                  className="px-3 py-1.5 text-sm rounded-md bg-white/10 hover:bg-white/20 transition"
                >
                  Stay
                </button>
                <button
                  onClick={handleSwitchToMyBundle}
                  className="px-3 py-1.5 text-sm rounded-md bg-indigo-500 hover:bg-indigo-400 text-white transition"
                  data-testid="switch-to-my-bundle"
                >
                  Switch to my bundle
                </button>
              </div>
            </div>
          </div>
        )}

        {showEmailBanner && (
          <EmailReminderBanner
            onSubscribe={handleEmailSubscribe}
            onDismiss={handleEmailReminderDismiss}
          />
        )}
      </>
    ),
    [
      showSwitchPrompt,
      showEmailBanner,
      handleStayHere,
      handleSwitchToMyBundle,
      handleEmailSubscribe,
      handleEmailReminderDismiss,
    ]
  );

  // Footer overlays (quick switch FAB + wallet manager modal)
  const footerOverlays = (
    <>
      {showQuickSwitch && (
        <QuickSwitchFAB onSwitchToMyBundle={handleSwitchToMyBundle} />
      )}
      <WalletManager
        isOpen={isWalletManagerOpen}
        onClose={() => setIsWalletManagerOpen(false)}
        onEmailSubscribed={() => {
          setEmailBannerDismissed(true);
        }}
      />
    </>
  );

  // Handle bundle not found case
  if (bundleNotFound) {
    return (
      <BundleNotFound
        message="Bundle not found"
        showConnectCTA={!isConnected}
        onConnectClick={() => setIsWalletManagerOpen(true)}
      />
    );
  }

  return (
    <DashboardShell
      urlUserId={userId}
      isOwnBundle={isOwnBundle}
      {...(bundleUser?.displayName && {
        bundleUserName: bundleUser.displayName,
      })}
      bundleUrl={bundleUrl}
      headerBanners={headerBanners}
      footerOverlays={footerOverlays}
    />
  );
}
