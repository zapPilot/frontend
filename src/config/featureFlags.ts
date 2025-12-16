/**
 * Feature Flags Configuration
 *
 * Centralized feature flag management for gradual rollouts and A/B testing.
 * Feature flags are controlled via environment variables.
 *
 * Usage:
 * ```typescript
 * import { FEATURE_FLAGS } from '@/config/featureFlags';
 *
 * if (FEATURE_FLAGS.USE_V22_LAYOUT) {
 *   // Use V22 layout
 * }
 * ```
 *
 * Environment Variables:
 * - NEXT_PUBLIC_USE_V22_LAYOUT: Enable V22 portfolio layout (default: false)
 */

export const FEATURE_FLAGS = {
  /**
   * V22 Layout Migration
   *
   * Enables the new V22 portfolio layout with:
   * - Dashboard with real-time regime detection
   * - Portfolio composition visualization
   * - Analytics tab (mock data)
   * - Backtesting tab (mock data)
   *
   * Rollout Plan:
   * - Week 1: Internal testing (manually enable via .env.local)
   * - Week 2: Canary (10% of users)
   * - Week 2-3: Gradual rollout (10% → 25% → 50% → 100%)
   *
   * @default false
   */
  USE_V22_LAYOUT: process.env["NEXT_PUBLIC_USE_V22_LAYOUT"] === "true",

  /**
   * Regime History Tracking
   *
   * @deprecated ALWAYS ENABLED - This flag is deprecated and will be removed.
   * The regime history feature is now permanently enabled for all V22 layouts.
   *
   * Migration: The feature flag check has been removed from service layer
   * (regimeHistoryService.ts) and hook layer (usePortfolioDataV22.ts).
   *
   * Keep this definition for backward compatibility until confirmed no other
   * references exist in the codebase.
   *
   * Features:
   * - Directional strategy indicators (fromLeft/fromRight)
   * - Regime duration display
   * - Transition animation cues
   *
   * Graceful Degradation:
   * - If API fails: Logs error but continues with default neutral regime
   * - Error handling in useRegimeHistory() ensures UI never breaks
   *
   * @default true (always enabled, env var ignored)
   */
  REGIME_HISTORY_ENABLED: true,
};

/**
 * Type-safe feature flag keys
 */
type FeatureFlagKey = keyof typeof FEATURE_FLAGS;

/**
 * Check if a feature flag is enabled
 *
 * @param flagKey - The feature flag key to check
 * @returns True if the feature is enabled
 *
 * @example
 * ```typescript
 * if (isFeatureEnabled('USE_V22_LAYOUT')) {
 *   // Feature is enabled
 * }
 * ```
 */
export function isFeatureEnabled(flagKey: FeatureFlagKey): boolean {
  return FEATURE_FLAGS[flagKey];
}

/**
 * Get all enabled feature flags
 *
 * Useful for debugging and logging active features.
 *
 * @returns Object with only enabled feature flags
 */
export function getEnabledFeatures(): Record<string, boolean> {
  return Object.entries(FEATURE_FLAGS)
    .filter(([, value]) => value === true)
    .reduce(
      (acc, [key, value]) => {
        acc[key] = value;
        return acc;
      },
      {} as Record<string, boolean>
    );
}

/**
 * Percentage-based V22 feature rollout
 *
 * Deterministic hash ensures same user always gets same experience.
 * Useful for gradual rollout: 10% → 25% → 50% → 75% → 90% → 100%
 *
 * @param userId - User ID (wallet address) for deterministic hashing
 * @returns True if user should see V22 layout
 *
 * @example
 * ```typescript
 * // In BundlePageEntry.tsx
 * const shouldUseV22 = isUserInV22Rollout(userId);
 * ```
 *
 * Environment Variables:
 * - NEXT_PUBLIC_USE_V22_LAYOUT: Master switch (must be 'true')
 * - NEXT_PUBLIC_V22_ROLLOUT_PERCENTAGE: Rollout percentage (0-100, default: 100)
 */
export function isUserInV22Rollout(userId: string): boolean {
  // Always respect explicit flag first
  if (!FEATURE_FLAGS.USE_V22_LAYOUT) return false;

  const percentage = parseInt(
    process.env["NEXT_PUBLIC_V22_ROLLOUT_PERCENTAGE"] || "100",
    10
  );

  // Full rollout
  if (percentage >= 100) return true;

  // No rollout
  if (percentage <= 0) return false;

  // Deterministic hash for stable rollout
  // Same user always gets same result
  const hash = userId.split("").reduce((acc, char) => {
    return acc + char.charCodeAt(0);
  }, 0);

  return hash % 100 < percentage;
}

/**
 * Development helper: Log feature flag status
 *
 * Only logs in development mode to avoid cluttering production logs.
 */
export function logFeatureFlags(): void {
  if (process.env.NODE_ENV === "development") {
    const enabled = getEnabledFeatures();
    const enabledCount = Object.keys(enabled).length;

    // eslint-disable-next-line no-console
    console.group("🚩 Feature Flags");
    // eslint-disable-next-line no-console
    console.log(
      `Enabled: ${enabledCount}/${Object.keys(FEATURE_FLAGS).length}`
    );

    if (enabledCount > 0) {
      // eslint-disable-next-line no-console
      console.table(enabled);
    } else {
      // eslint-disable-next-line no-console
      console.log("No features enabled");
    }

    // eslint-disable-next-line no-console
    console.groupEnd();
  }
}
