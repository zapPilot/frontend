"use client";

import { createContext, useContext, useEffect, ReactNode } from "react";
import { useAnalytics, ConversionTracking } from "../lib/analytics";

interface AnalyticsContextType {
  track: (event: string, properties?: Record<string, any>) => void;
  trackConversion: (event: any) => void;
  trackPageView: (page: string, properties?: Record<string, any>) => void;
  trackFeatureUsage: (
    feature: string,
    properties?: Record<string, any>
  ) => void;
  trackSubscriptionGate: (
    feature: string,
    action: "viewed" | "upgrade_clicked",
    tier?: string
  ) => void;
  trackPaymentFlow: (step: string, properties?: Record<string, any>) => void;
  trackAPIUsage: (endpoint: string, properties?: Record<string, any>) => void;
  trackError: (error: string, properties?: Record<string, any>) => void;
  setUserId: (userId: string) => void;
  getConversionMetrics: () => any;
  getUserEngagement: () => any;
  ConversionTracking: typeof ConversionTracking;
}

const AnalyticsContext = createContext<AnalyticsContextType | null>(null);

interface AnalyticsProviderProps {
  children: ReactNode;
}

export function AnalyticsProvider({ children }: AnalyticsProviderProps) {
  const analytics = useAnalytics();

  useEffect(() => {
    // Track app initialization
    analytics.track("app_initialized", {
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
      screen: {
        width: window.screen.width,
        height: window.screen.height,
      },
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
      },
    });

    // Track session start
    analytics.track("session_started");

    // Track page visibility changes
    const handleVisibilityChange = () => {
      if (document.hidden) {
        analytics.track("page_hidden");
      } else {
        analytics.track("page_visible");
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Track session end on page unload
    const handleBeforeUnload = () => {
      const engagement = analytics.getUserEngagement();
      analytics.track("session_ended", {
        sessionLength: engagement.sessionLength,
        pageViews: engagement.pageViews,
        featuresUsed: engagement.featuresUsed.length,
      });
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [analytics]);

  const contextValue: AnalyticsContextType = {
    ...analytics,
    ConversionTracking,
  };

  return (
    <AnalyticsContext.Provider value={contextValue}>
      {children}
    </AnalyticsContext.Provider>
  );
}

export function useAnalyticsContext(): AnalyticsContextType {
  const context = useContext(AnalyticsContext);
  if (!context) {
    throw new Error(
      "useAnalyticsContext must be used within an AnalyticsProvider"
    );
  }
  return context;
}

// HOC for tracking component usage
export function withAnalytics<P extends object>(
  Component: React.ComponentType<P>,
  componentName: string
) {
  return function AnalyticsWrappedComponent(props: P) {
    const { trackFeatureUsage } = useAnalyticsContext();

    useEffect(() => {
      trackFeatureUsage(`component_rendered`, { component: componentName });
    }, [trackFeatureUsage]);

    return <Component {...props} />;
  };
}

// Analytics event tracking helper functions (to be used within components)
export const createAnalyticsEvents = (analytics: AnalyticsContextType) => ({
  // Wallet interactions
  walletConnectAttempted: (provider?: string) => {
    analytics.track("wallet_connect_attempted", { provider });
  },

  walletConnected: (address: string, chainId: number) => {
    analytics.setUserId(address);
    analytics.track("wallet_connected", { address, chainId });
  },

  walletDisconnected: () => {
    analytics.track("wallet_disconnected");
  },

  // Portfolio interactions
  portfolioRefreshed: (manual: boolean = false) => {
    analytics.track("portfolio_refreshed", { manual });
  },

  portfolioAnalyticsViewed: () => {
    analytics.trackFeatureUsage("portfolio_analytics");
  },

  // Investment interactions
  strategyViewed: (strategyId: string) => {
    analytics.track("strategy_viewed", { strategyId });
  },

  investmentInitiated: (strategyId: string, amount: number) => {
    analytics.track("investment_initiated", { strategyId, amount });
  },

  // Subscription interactions
  pricingPageViewed: (source?: string) => {
    ConversionTracking.pricingPageViewed(source);
  },

  subscriptionTierSelected: (tier: string) => {
    analytics.track("subscription_tier_selected", { tier });
  },

  paymentMethodSelected: (method: string, tier: string) => {
    analytics.track("payment_method_selected", { method, tier });
  },

  // Feature gate interactions
  featureGateEncountered: (feature: string, tier: string) => {
    ConversionTracking.featureGateViewed(feature, tier);
  },

  upgradeButtonClicked: (source: string, tier: string, feature?: string) => {
    analytics.track("upgrade_button_clicked", { source, tier, feature });

    if (feature) {
      ConversionTracking.upgradeFromGate(feature, tier);
    }
  },

  // API usage tracking
  apiCallMade: (endpoint: string, success: boolean, responseTime?: number) => {
    analytics.trackAPIUsage(endpoint, { success, responseTime });
  },

  // Error tracking
  errorEncountered: (error: string, context?: string) => {
    analytics.trackError(error, { context });
  },
});

// Hook to get analytics events
export function useAnalyticsEvents() {
  const analytics = useAnalyticsContext();
  return createAnalyticsEvents(analytics);
}
