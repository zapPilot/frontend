"use client";

import { useCallback } from "react";

interface NavigationEvent {
  fromTab: string;
  toTab: string;
  method: "bottom-nav" | "sidebar" | "direct";
  timestamp: number;
}

interface WalletEvent {
  action: "connect" | "disconnect" | "chain-switch" | "connection-attempt";
  success: boolean;
  chainId?: number;
  walletType?: string;
  errorMessage?: string;
  timestamp: number;
}

interface UserJourneyEvent {
  step: string;
  category: "onboarding" | "navigation" | "transaction" | "feature-discovery";
  metadata?: Record<string, any>;
  timestamp: number;
}

export const useAnalytics = () => {
  const trackNavigation = useCallback(
    (
      fromTab: string,
      toTab: string,
      method: NavigationEvent["method"] = "direct"
    ) => {
      const event: NavigationEvent = {
        fromTab,
        toTab,
        method,
        timestamp: Date.now(),
      };

      // Send to analytics service
      if (typeof window !== "undefined") {
        // Google Analytics 4
        if (window.gtag) {
          window.gtag("event", "navigation", {
            from_tab: fromTab,
            to_tab: toTab,
            method,
            custom_parameter: "zap_pilot_navigation",
          });
        }

        // Store locally for analysis
        const events = JSON.parse(
          localStorage.getItem("zap_pilot_navigation_events") || "[]"
        );
        events.push(event);
        // Keep only last 100 events
        if (events.length > 100) events.shift();
        localStorage.setItem(
          "zap_pilot_navigation_events",
          JSON.stringify(events)
        );
      }
    },
    []
  );

  const trackWalletInteraction = useCallback(
    (
      action: WalletEvent["action"],
      success: boolean,
      metadata: {
        chainId?: number;
        walletType?: string;
        errorMessage?: string;
      } = {}
    ) => {
      const event: WalletEvent = {
        action,
        success,
        timestamp: Date.now(),
        ...(metadata.chainId !== undefined && { chainId: metadata.chainId }),
        ...(metadata.walletType !== undefined && {
          walletType: metadata.walletType,
        }),
        ...(metadata.errorMessage !== undefined && {
          errorMessage: metadata.errorMessage,
        }),
      };

      if (typeof window !== "undefined") {
        // Google Analytics 4
        if (window.gtag) {
          window.gtag("event", "wallet_interaction", {
            action,
            success,
            chain_id: metadata.chainId,
            wallet_type: metadata.walletType,
            custom_parameter: "zap_pilot_wallet",
          });
        }

        // Store locally
        const events = JSON.parse(
          localStorage.getItem("zap_pilot_wallet_events") || "[]"
        );
        events.push(event);
        if (events.length > 50) events.shift();
        localStorage.setItem("zap_pilot_wallet_events", JSON.stringify(events));
      }
    },
    []
  );

  const trackUserJourney = useCallback(
    (
      step: string,
      category: UserJourneyEvent["category"],
      metadata: Record<string, any> = {}
    ) => {
      const event: UserJourneyEvent = {
        step,
        category,
        metadata,
        timestamp: Date.now(),
      };

      if (typeof window !== "undefined") {
        // Google Analytics 4
        if (window.gtag) {
          window.gtag("event", "user_journey", {
            step,
            category,
            custom_parameter: "zap_pilot_journey",
            ...metadata,
          });
        }

        // Store locally
        const events = JSON.parse(
          localStorage.getItem("zap_pilot_journey_events") || "[]"
        );
        events.push(event);
        if (events.length > 200) events.shift();
        localStorage.setItem(
          "zap_pilot_journey_events",
          JSON.stringify(events)
        );
      }
    },
    []
  );

  const getAnalyticsData = useCallback(() => {
    if (typeof window === "undefined") return null;

    return {
      navigation: JSON.parse(
        localStorage.getItem("zap_pilot_navigation_events") || "[]"
      ),
      wallet: JSON.parse(
        localStorage.getItem("zap_pilot_wallet_events") || "[]"
      ),
      journey: JSON.parse(
        localStorage.getItem("zap_pilot_journey_events") || "[]"
      ),
    };
  }, []);

  return {
    trackNavigation,
    trackWalletInteraction,
    trackUserJourney,
    getAnalyticsData,
  };
};

// Global type declaration for gtag
declare global {
  interface Window {
    gtag?: (command: string, targetId: string, config?: any) => void;
  }
}
