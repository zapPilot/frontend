/**
 * Analytics and conversion tracking for Zap Pilot
 */

// Analytics events for tracking user behavior and conversions
export interface AnalyticsEvent {
  event: string;
  properties: Record<string, any>;
  timestamp: number;
  userId?: string;
  sessionId: string;
}

export interface ConversionEvent {
  event:
    | "subscription_upgrade"
    | "payment_initiated"
    | "payment_completed"
    | "feature_gate_viewed";
  tier?: string;
  amount?: number;
  currency?: string;
  feature?: string;
  source?: string;
}

class AnalyticsService {
  private userId: string | null = null;
  private sessionId: string;
  private events: AnalyticsEvent[] = [];

  constructor() {
    this.sessionId = this.generateSessionId();
    this.loadUserId();
  }

  // Initialize user tracking
  setUserId(userId: string) {
    this.userId = userId;
    if (typeof window !== "undefined" && window.localStorage) {
      localStorage.setItem("analytics_user_id", userId);
    }
  }

  // Track general events
  track(event: string, properties: Record<string, any> = {}) {
    const analyticsEvent: AnalyticsEvent = {
      event,
      properties: {
        ...properties,
        url: typeof window !== "undefined" ? window.location.href : "",
        referrer: typeof document !== "undefined" ? document.referrer : "",
        userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "",
        timestamp: Date.now(),
      },
      timestamp: Date.now(),
      userId: this.userId || undefined,
      sessionId: this.sessionId,
    };

    this.events.push(analyticsEvent);
    this.persistEvent(analyticsEvent);

    // Send to external analytics services
    this.sendToExternalServices(analyticsEvent);

    // Analytics Event logged
  }

  // Track subscription and conversion events
  trackConversion(event: ConversionEvent) {
    this.track(event.event, {
      tier: event.tier,
      amount: event.amount,
      currency: event.currency,
      feature: event.feature,
      source: event.source,
      conversion: true,
    });

    // Store conversion data for analysis
    this.storeConversionMetrics(event);
  }

  // Track page views
  trackPageView(page: string, properties: Record<string, any> = {}) {
    this.track("page_view", {
      page,
      ...properties,
    });
  }

  // Track feature usage
  trackFeatureUsage(feature: string, properties: Record<string, any> = {}) {
    this.track("feature_used", {
      feature,
      ...properties,
    });
  }

  // Track subscription gate interactions
  trackSubscriptionGate(
    feature: string,
    action: "viewed" | "upgrade_clicked",
    tier?: string
  ) {
    this.track("subscription_gate", {
      feature,
      action,
      tier,
      gate_interaction: true,
    });

    if (action === "viewed") {
      this.trackConversion({
        event: "feature_gate_viewed",
        feature,
        tier,
      });
    }
  }

  // Track payment flow
  trackPaymentFlow(step: string, properties: Record<string, any> = {}) {
    this.track("payment_flow", {
      step,
      ...properties,
      payment_funnel: true,
    });
  }

  // Track API usage (for rate limiting analysis)
  trackAPIUsage(endpoint: string, properties: Record<string, any> = {}) {
    this.track("api_usage", {
      endpoint,
      ...properties,
    });
  }

  // Track errors
  trackError(error: string, properties: Record<string, any> = {}) {
    this.track("error", {
      error,
      ...properties,
    });
  }

  // Get conversion metrics for dashboard
  getConversionMetrics(): {
    totalSessions: number;
    subscriptionViews: number;
    conversionRate: number;
    averageSessionTime: number;
    topFeatureGates: Array<{ feature: string; views: number }>;
  } {
    if (typeof window === "undefined" || !window.localStorage) {
      return {
        totalSessions: 0,
        subscriptionViews: 0,
        conversionRate: 0,
        averageSessionTime: 0,
        topFeatureGates: [],
      };
    }
    const stored = localStorage.getItem("conversion_metrics");
    if (!stored) {
      return {
        totalSessions: 0,
        subscriptionViews: 0,
        conversionRate: 0,
        averageSessionTime: 0,
        topFeatureGates: [],
      };
    }

    return JSON.parse(stored);
  }

  // Get user engagement metrics
  getUserEngagement(): {
    sessionLength: number;
    pageViews: number;
    featuresUsed: string[];
    lastActivity: number;
  } {
    const sessionStart =
      typeof window !== "undefined" && window.localStorage
        ? localStorage.getItem("session_start")
        : null;
    const currentEvents = this.events.filter(
      e => e.sessionId === this.sessionId
    );

    return {
      sessionLength: sessionStart ? Date.now() - parseInt(sessionStart) : 0,
      pageViews: currentEvents.filter(e => e.event === "page_view").length,
      featuresUsed: [
        ...new Set(
          currentEvents
            .filter(e => e.event === "feature_used")
            .map(e => e.properties.feature)
        ),
      ],
      lastActivity: Math.max(...currentEvents.map(e => e.timestamp), 0),
    };
  }

  // Private methods
  private generateSessionId(): string {
    // Check if we're in a browser environment
    if (typeof window === "undefined" || !window.sessionStorage) {
      return `sess_${Date.now()}_${Math.random().toString(36).substring(2)}`;
    }

    const existing = sessionStorage.getItem("analytics_session_id");
    if (existing) return existing;

    const sessionId = `sess_${Date.now()}_${Math.random().toString(36).substring(2)}`;
    sessionStorage.setItem("analytics_session_id", sessionId);
    localStorage.setItem("session_start", Date.now().toString());

    return sessionId;
  }

  private loadUserId(): void {
    if (typeof window === "undefined" || !window.localStorage) {
      return;
    }
    const stored = localStorage.getItem("analytics_user_id");
    if (stored) {
      this.userId = stored;
    }
  }

  private persistEvent(event: AnalyticsEvent): void {
    if (typeof window === "undefined" || !window.localStorage) {
      return;
    }
    const stored = localStorage.getItem("analytics_events") || "[]";
    const events = JSON.parse(stored);
    events.push(event);

    // Keep only last 1000 events
    if (events.length > 1000) {
      events.splice(0, events.length - 1000);
    }

    localStorage.setItem("analytics_events", JSON.stringify(events));
  }

  private storeConversionMetrics(event: ConversionEvent): void {
    if (typeof window === "undefined" || !window.localStorage) {
      return;
    }
    const stored = localStorage.getItem("conversion_metrics") || "{}";
    const metrics = JSON.parse(stored);

    // Update metrics based on event
    if (event.event === "feature_gate_viewed") {
      metrics.subscriptionViews = (metrics.subscriptionViews || 0) + 1;

      // Track top feature gates
      if (!metrics.topFeatureGates) metrics.topFeatureGates = [];
      const existing = metrics.topFeatureGates.find(
        (g: any) => g.feature === event.feature
      );
      if (existing) {
        existing.views += 1;
      } else {
        metrics.topFeatureGates.push({ feature: event.feature, views: 1 });
      }

      // Sort by views
      metrics.topFeatureGates.sort((a: any, b: any) => b.views - a.views);
      metrics.topFeatureGates = metrics.topFeatureGates.slice(0, 10);
    }

    if (event.event === "payment_completed") {
      metrics.conversions = (metrics.conversions || 0) + 1;
      metrics.conversionRate =
        metrics.conversions / (metrics.subscriptionViews || 1);
    }

    localStorage.setItem("conversion_metrics", JSON.stringify(metrics));
  }

  private sendToExternalServices(event: AnalyticsEvent): void {
    // Send to Google Analytics 4
    if (typeof gtag !== "undefined") {
      gtag("event", event.event, {
        event_category: "User Interaction",
        event_label: event.properties.feature || event.properties.page,
        value: event.properties.amount || 1,
        custom_parameters: event.properties,
      });
    }

    // Send to Mixpanel (if configured)
    if (typeof mixpanel !== "undefined") {
      mixpanel.track(event.event, event.properties);
    }

    // Send to custom analytics endpoint
    this.sendToCustomEndpoint(event);
  }

  private async sendToCustomEndpoint(event: AnalyticsEvent): Promise<void> {
    try {
      const endpoint = process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT;
      if (!endpoint) return;

      await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(event),
      });
    } catch {
      // Failed to send analytics event
    }
  }
}

// Global analytics instance
export const analytics = new AnalyticsService();

// React hook for analytics
export function useAnalytics() {
  return {
    track: analytics.track.bind(analytics),
    trackConversion: analytics.trackConversion.bind(analytics),
    trackPageView: analytics.trackPageView.bind(analytics),
    trackFeatureUsage: analytics.trackFeatureUsage.bind(analytics),
    trackSubscriptionGate: analytics.trackSubscriptionGate.bind(analytics),
    trackPaymentFlow: analytics.trackPaymentFlow.bind(analytics),
    trackAPIUsage: analytics.trackAPIUsage.bind(analytics),
    trackError: analytics.trackError.bind(analytics),
    setUserId: analytics.setUserId.bind(analytics),
    getConversionMetrics: analytics.getConversionMetrics.bind(analytics),
    getUserEngagement: analytics.getUserEngagement.bind(analytics),
  };
}

// Conversion tracking helpers
export const ConversionTracking = {
  // Track when user views pricing page
  pricingPageViewed: (source?: string) => {
    analytics.trackPageView("pricing", { source });
    analytics.trackConversion({
      event: "feature_gate_viewed",
      feature: "pricing_page",
      source,
    });
  },

  // Track subscription upgrade flow
  subscriptionUpgradeStarted: (tier: string, source?: string) => {
    analytics.trackPaymentFlow("upgrade_started", { tier, source });
    analytics.trackConversion({
      event: "payment_initiated",
      tier,
      source,
    });
  },

  // Track successful payment
  paymentCompleted: (tier: string, amount: number, currency: string) => {
    analytics.trackPaymentFlow("payment_completed", { tier, amount, currency });
    analytics.trackConversion({
      event: "payment_completed",
      tier,
      amount,
      currency,
    });
  },

  // Track feature gate interactions
  featureGateViewed: (feature: string, requiredTier: string) => {
    analytics.trackSubscriptionGate(feature, "viewed", requiredTier);
  },

  // Track upgrade button clicks from gates
  upgradeFromGate: (feature: string, tier: string) => {
    analytics.trackSubscriptionGate(feature, "upgrade_clicked", tier);
    analytics.track("conversion_trigger", {
      source: "feature_gate",
      feature,
      tier,
    });
  },
};

// Auto-track page views on route changes
if (typeof window !== "undefined") {
  let currentPath = window.location.pathname;

  const trackRouteChange = () => {
    const newPath = window.location.pathname;
    if (newPath !== currentPath) {
      analytics.trackPageView(newPath);
      currentPath = newPath;
    }
  };

  // Listen for route changes
  window.addEventListener("popstate", trackRouteChange);

  // Track initial page load
  analytics.trackPageView(currentPath);
}
