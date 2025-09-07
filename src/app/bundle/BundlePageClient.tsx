"use client";

import { QuickSwitchFAB } from "@/components/bundle";
import { EmailReminderBanner } from "@/components/EmailReminderBanner";
import { Navigation } from "@/components/Navigation";
import type { SwapPageProps } from "@/components/SwapPage/SwapPage";
import { LoadingState } from "@/components/ui/LoadingState";
import { WalletPortfolio } from "@/components/WalletPortfolio";
import type { WalletManagerProps } from "@/components/WalletManager";
import { HEADER, Z_INDEX } from "@/constants/design-system";
import { useUser } from "@/contexts/UserContext";
import { useOnboarding } from "@/providers/OnboardingProvider";
import { mockInvestmentOpportunities } from "@/data/mockInvestments";
import { bundleService, BundleUser } from "@/services/bundleService";
import { InvestmentOpportunity } from "@/types/investment";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { ComponentType, useCallback, useEffect, useState } from "react";

// Dynamic imports for code splitting
const AnalyticsTab: ComponentType<{ categoryFilter?: string | null }> = dynamic(
  () =>
    import("@/components/AnalyticsTab").then(mod => ({
      default: mod.AnalyticsTab,
    })),
  {
    loading: () => (
      <LoadingState
        variant="spinner"
        size="lg"
        message="Loading Analytics..."
        className="min-h-96"
      />
    ),
  }
);

const CommunityTab: ComponentType = dynamic(
  () =>
    import("@/components/CommunityTab").then(mod => ({
      default: mod.CommunityTab,
    })),
  {
    loading: () => (
      <LoadingState
        variant="spinner"
        size="lg"
        message="Loading Community..."
        className="min-h-96"
      />
    ),
  }
);

const AirdropTab: ComponentType = dynamic(
  () =>
    import("@/components/AirdropTab").then(mod => ({
      default: mod.AirdropTab,
    })),
  {
    loading: () => (
      <LoadingState
        variant="spinner"
        size="lg"
        message="Loading Airdrop..."
        className="min-h-96"
      />
    ),
  }
);

const SettingsTab: ComponentType = dynamic(
  () =>
    import("@/components/SettingsTab").then(mod => ({
      default: mod.SettingsTab,
    })),
  {
    loading: () => (
      <LoadingState
        variant="spinner"
        size="lg"
        message="Loading Settings..."
        className="min-h-96"
      />
    ),
  }
);

const SwapPage: ComponentType<SwapPageProps> = dynamic(
  () =>
    import("@/components/SwapPage").then(mod => ({ default: mod.SwapPage })),
  {
    loading: () => (
      <LoadingState
        variant="spinner"
        size="lg"
        message="Loading Swap Interface..."
        className="min-h-96"
      />
    ),
  }
);

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
  const { shouldShowHint, markStepCompleted, markEmailSubscribed } =
    useOnboarding();
  const [activeTab, setActiveTab] = useState("wallet");
  const [selectedStrategy, setSelectedStrategy] =
    useState<InvestmentOpportunity | null>(null);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<
    string | null
  >(null);
  const [showSwitchPrompt, setShowSwitchPrompt] = useState(false);
  const [dismissedSwitchPrompt, setDismissedSwitchPrompt] = useState(false);
  const [bundleUser, setBundleUser] = useState<BundleUser | null>(null);
  const [isWalletManagerOpen, setIsWalletManagerOpen] = useState(false);
  const [previousIsConnected, setPreviousIsConnected] = useState<
    boolean | null
  >(null);

  // Computed values
  const isOwnBundle = bundleService.isOwnBundle(userId, userInfo?.userId);
  const bundleUrl = bundleService.generateBundleUrl(userId);
  const showQuickSwitch = isConnected && !isOwnBundle && userInfo?.userId;

  // Load bundle user info
  useEffect(() => {
    const loadBundleUser = async () => {
      if (userId) {
        const user = await bundleService.getBundleUser(userId);
        setBundleUser(user);
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

  // Sync wallet connection state with OnboardingProvider
  useEffect(() => {
    // Initialize previous state on first render
    if (previousIsConnected === null) {
      setPreviousIsConnected(isConnected);
      return;
    }

    // Only mark as completed when transitioning from disconnected to connected
    if (!previousIsConnected && isConnected) {
      markStepCompleted("wallet-connected");
    }

    // Update previous state for next comparison
    setPreviousIsConnected(isConnected);
  }, [isConnected, previousIsConnected, markStepCompleted]);

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
  }, []);

  const handleEmailSubscribe = useCallback(() => {
    setIsWalletManagerOpen(true);
  }, []);

  const handleEmailReminderDismiss = useCallback(() => {
    markStepCompleted("email-subscription-reminder");
  }, [markStepCompleted]);

  // Navigation handlers with context awareness
  const handleBackToPortfolio = useCallback(() => {
    setSelectedStrategy(null);
  }, []);

  const handleTabChange = useCallback(
    (tab: string) => {
      setActiveTab(tab);
      // Reset strategy when switching tabs
      if (selectedStrategy) {
        setSelectedStrategy(null);
      }
    },
    [selectedStrategy]
  );
  const handleCategoryClick = useCallback(
    (categoryId: string) => {
      setSelectedCategoryFilter(categoryId);
      setActiveTab("analytics");
      if (selectedStrategy) {
        setSelectedStrategy(null);
      }
    },
    [selectedStrategy]
  );

  const handleOptimizeClick = useCallback(() => {
    const optimizeStrategy = mockInvestmentOpportunities.find(
      strategy => strategy.id === "optimize-portfolio"
    );
    if (optimizeStrategy) {
      setSelectedStrategy({ ...optimizeStrategy, navigationContext: "invest" });
    }
  }, []);

  const handleZapInClick = useCallback(() => {
    const zapInStrategy = mockInvestmentOpportunities.find(
      strategy => strategy.id === "zap-in"
    );
    if (zapInStrategy) {
      setSelectedStrategy({ ...zapInStrategy, navigationContext: "zapIn" });
    }
  }, []);

  const handleZapOutClick = useCallback(() => {
    const zapOutStrategy = mockInvestmentOpportunities.find(
      strategy => strategy.id === "zap-out"
    );
    if (zapOutStrategy) {
      setSelectedStrategy({ ...zapOutStrategy, navigationContext: "zapOut" });
    }
  }, []);

  const renderTabContent = () => {
    if (selectedStrategy) {
      return (
        <SwapPage strategy={selectedStrategy} onBack={handleBackToPortfolio} />
      );
    }

    switch (activeTab) {
      case "wallet":
        return (
          <WalletPortfolio
            urlUserId={userId}
            onOptimizeClick={handleOptimizeClick}
            onZapInClick={handleZapInClick}
            onZapOutClick={handleZapOutClick}
            onCategoryClick={handleCategoryClick}
            isOwnBundle={isOwnBundle}
            bundleUserName={bundleUser?.displayName}
            bundleUrl={bundleUrl}
          />
        );
      case "analytics":
        return <AnalyticsTab categoryFilter={selectedCategoryFilter} />;
      case "community":
        return <CommunityTab />;
      case "airdrop":
        return <AirdropTab />;
      case "settings":
        return <SettingsTab />;
      default:
        return (
          <WalletPortfolio
            urlUserId={userId}
            onOptimizeClick={handleOptimizeClick}
            onZapInClick={handleZapInClick}
            onZapOutClick={handleZapOutClick}
            onCategoryClick={handleCategoryClick}
            isOwnBundle={isOwnBundle}
            bundleUserName={bundleUser?.displayName}
            bundleUrl={bundleUrl}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-gray-950 to-blue-900/20" />

      {/* Navigation */}
      <Navigation activeTab={activeTab} onTabChange={handleTabChange} />

      {/* Main content */}
      <div className={`relative ${Z_INDEX.CONTENT} lg:pl-72`}>
        {/* Switch Prompt Banner */}
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

        {/* Email Subscription Reminder Banner */}
        {shouldShowHint("email-subscription-reminder") && isOwnBundle && (
          <EmailReminderBanner
            onSubscribe={handleEmailSubscribe}
            onDismiss={handleEmailReminderDismiss}
          />
        )}
        {/* Mobile header spacing */}
        <div className="lg:hidden h-16" />

        {/* Desktop header spacing */}
        <div className="hidden lg:block h-16" />

        <main className="px-4 py-8 lg:px-8 pb-20 lg:pb-8">
          <div className="max-w-7xl mx-auto">{renderTabContent()}</div>
        </main>

        {/* Mobile bottom nav spacing */}
        <div className="lg:hidden h-20" />
      </div>

      {/* Quick Switch FAB */}
      {showQuickSwitch && (
        <QuickSwitchFAB onSwitchToMyBundle={handleSwitchToMyBundle} />
      )}

      {/* Wallet Manager Modal */}
      <WalletManager
        isOpen={isWalletManagerOpen}
        onClose={() => setIsWalletManagerOpen(false)}
        onEmailSubscribed={() => {
          markEmailSubscribed();
          markStepCompleted("email-subscription-reminder");
        }}
      />
    </div>
  );
}
