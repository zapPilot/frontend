"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useCallback,
} from "react";
import {
  FeatureFlag,
  FeatureFlagConfig,
  FeatureFlagContext,
  FeatureFlagValue,
  FEATURE_FLAGS,
  FeatureFlagKey,
} from "@/types/features";

const FeatureFlagContextProvider = createContext<FeatureFlagContext | null>(
  null
);

interface FeatureFlagProviderProps {
  children: ReactNode;
  config?: Partial<FeatureFlagConfig>;
  userId?: string; // Wallet address or user ID for targeted rollouts
}

/**
 * Feature Flag Provider
 *
 * Manages feature flags with support for:
 * - Local storage persistence
 * - Remote config fetching
 * - Rollout percentages
 * - User targeting
 * - Environment-based flags
 */
export function FeatureFlagProvider({
  children,
  config = {},
  userId,
}: FeatureFlagProviderProps) {
  const [flags, setFlags] = useState<Record<string, FeatureFlag>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Default configuration
  const defaultConfig: FeatureFlagConfig = {
    flags: {},
    global: {
      enabled: true,
      debug: process.env.NODE_ENV === "development",
      refreshInterval: 5 * 60 * 1000, // 5 minutes
    },
  };

  const finalConfig = { ...defaultConfig, ...config };

  /**
   * Initialize flags from defaults and local storage
   */
  const initializeFlags = useCallback(() => {
    const initialFlags: Record<string, FeatureFlag> = {};

    // Start with predefined flags
    Object.entries(FEATURE_FLAGS).forEach(([key, flagTemplate]) => {
      const now = new Date().toISOString();

      initialFlags[key] = {
        ...flagTemplate,
        value: flagTemplate.defaultValue,
        updatedAt: now,
      };
    });

    // Override with local storage values (development only)
    if (
      typeof window !== "undefined" &&
      process.env.NODE_ENV === "development"
    ) {
      const now = new Date().toISOString();
      try {
        const storedFlags = localStorage.getItem("zap-pilot-feature-flags");
        if (storedFlags) {
          const parsed = JSON.parse(storedFlags);
          Object.entries(parsed).forEach(([key, value]) => {
            if (initialFlags[key]) {
              initialFlags[key].value = value as FeatureFlagValue;
              initialFlags[key].updatedAt = now;
              initialFlags[key].updatedBy = "local-override";
            }
          });
        }
      } catch (err) {
        console.warn("Failed to parse stored feature flags:", err);
      }
    }

    // Apply rollout logic
    Object.entries(initialFlags).forEach(([key, flag]) => {
      if (flag.rolloutPercentage !== undefined && flag.type === "boolean") {
        const shouldEnable = isUserInRollout(
          key,
          flag.rolloutPercentage,
          userId
        );
        if (!shouldEnable && initialFlags[key]) {
          initialFlags[key].value = false;
        }
      }

      // Check environment restrictions
      if (flag.environment && flag.environment !== "all") {
        const currentEnv = process.env.NODE_ENV;
        if (flag.environment !== currentEnv) {
          // Disable flags not meant for current environment
          if (flag.type === "boolean" && initialFlags[key]) {
            initialFlags[key].value = false;
          }
        }
      }

      // Check user allowlist
      if (flag.allowedUsers && userId) {
        const isAllowed = flag.allowedUsers.includes(userId);
        if (!isAllowed && flag.type === "boolean" && initialFlags[key]) {
          initialFlags[key].value = false;
        }
      }
    });

    setFlags(initialFlags);
  }, [userId]);

  /**
   * Determine if a user should be included in a rollout
   */
  const isUserInRollout = (
    flagKey: string,
    percentage: number,
    userId?: string
  ): boolean => {
    if (percentage >= 100) return true;
    if (percentage <= 0) return false;

    // Use consistent hashing based on flag key and user ID
    const seed = userId || "anonymous";
    const hash = simpleHash(flagKey + seed);
    const userPercentile = hash % 100;

    return userPercentile < percentage;
  };

  /**
   * Simple hash function for consistent rollout decisions
   */
  const simpleHash = (str: string): number => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  };

  /**
   * Fetch flags from remote config
   */
  const refreshFlags = useCallback(async () => {
    if (!finalConfig.global.remoteConfigUrl) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(finalConfig.global.remoteConfigUrl);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const remoteFlags = await response.json();

      setFlags(currentFlags => {
        const updatedFlags = { ...currentFlags };

        Object.entries(remoteFlags).forEach(([key, remoteFlag]) => {
          if (updatedFlags[key] && typeof remoteFlag === "object") {
            updatedFlags[key] = {
              ...updatedFlags[key],
              ...(remoteFlag as Partial<FeatureFlag>),
              updatedAt: new Date().toISOString(),
              updatedBy: "remote-config",
            };
          }
        });

        return updatedFlags;
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(`Failed to fetch remote config: ${errorMessage}`);
      console.error("Feature flag remote config error:", err);
    } finally {
      setIsLoading(false);
    }
  }, [finalConfig.global.remoteConfigUrl]);

  /**
   * Get a feature flag value with type safety
   */
  const getFlag = useCallback(
    <T extends FeatureFlagValue = boolean>(key: string): T => {
      if (!finalConfig.global.enabled) {
        const flag = FEATURE_FLAGS[key as FeatureFlagKey];
        return (flag?.defaultValue as T) || (false as T);
      }

      const flag = flags[key];
      if (!flag) {
        console.warn(`Feature flag "${key}" not found`);
        return false as T;
      }

      return flag.value as T;
    },
    [flags, finalConfig.global.enabled]
  );

  /**
   * Check if a boolean feature is enabled
   */
  const isEnabled = useCallback(
    (key: string): boolean => {
      return getFlag<boolean>(key);
    },
    [getFlag]
  );

  /**
   * Get all flags (for debug/admin purposes)
   */
  const getAllFlags = useCallback((): Record<string, FeatureFlag> => {
    return { ...flags };
  }, [flags]);

  /**
   * Set a flag value (development only)
   */
  const setFlag = useCallback((key: string, value: FeatureFlagValue) => {
    if (process.env.NODE_ENV !== "development") {
      console.warn("setFlag is only available in development mode");
      return;
    }

    setFlags(currentFlags => {
      const updatedFlags = { ...currentFlags };
      if (updatedFlags[key]) {
        updatedFlags[key] = {
          ...updatedFlags[key],
          value,
          updatedAt: new Date().toISOString(),
          updatedBy: "manual-override",
        };
      }

      // Persist to local storage
      try {
        const flagValues: Record<string, FeatureFlagValue> = {};
        Object.entries(updatedFlags).forEach(([k, flag]) => {
          flagValues[k] = flag.value;
        });
        localStorage.setItem(
          "zap-pilot-feature-flags",
          JSON.stringify(flagValues)
        );
      } catch (err) {
        console.warn("Failed to persist feature flags to localStorage:", err);
      }

      return updatedFlags;
    });
  }, []);

  // Initialize flags on mount
  useEffect(() => {
    initializeFlags();
  }, [initializeFlags]);

  // Set up periodic refresh for remote config
  useEffect(() => {
    if (
      !finalConfig.global.remoteConfigUrl ||
      !finalConfig.global.refreshInterval
    ) {
      return;
    }

    // Initial fetch
    refreshFlags();

    // Set up periodic refresh
    const interval = setInterval(
      refreshFlags,
      finalConfig.global.refreshInterval
    );

    return () => clearInterval(interval);
  }, [
    refreshFlags,
    finalConfig.global.remoteConfigUrl,
    finalConfig.global.refreshInterval,
  ]);

  const contextValue: FeatureFlagContext = {
    getFlag,
    isEnabled,
    getAllFlags,
    setFlag,
    refreshFlags,
    isLoading,
    error,
  };

  return (
    <FeatureFlagContextProvider.Provider value={contextValue}>
      {children}
      {finalConfig.global.debug && process.env.NODE_ENV === "development" && (
        <FeatureFlagDebugPanel />
      )}
    </FeatureFlagContextProvider.Provider>
  );
}

/**
 * Hook to use feature flags
 */
export function useFeatureFlags(): FeatureFlagContext {
  const context = useContext(FeatureFlagContextProvider);

  if (!context) {
    throw new Error(
      "useFeatureFlags must be used within a FeatureFlagProvider"
    );
  }

  return context;
}

/**
 * Hook to check if a specific feature is enabled
 */
export function useFeatureFlag(key: FeatureFlagKey): boolean {
  const { isEnabled } = useFeatureFlags();
  return isEnabled(key);
}

/**
 * Hook to get a feature flag value with type safety
 */
export function useFeatureFlagValue<T extends FeatureFlagValue = boolean>(
  key: FeatureFlagKey
): T {
  const { getFlag } = useFeatureFlags();
  return getFlag<T>(key);
}

/**
 * Debug panel for development
 */
function FeatureFlagDebugPanel() {
  const { getAllFlags, setFlag, refreshFlags, isLoading, error } =
    useFeatureFlags();
  const [isOpen, setIsOpen] = useState(false);
  const flags = getAllFlags();

  if (process.env.NODE_ENV !== "development") {
    return null;
  }

  return (
    <>
      {/* Toggle button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 right-4 z-50 bg-purple-600 text-white px-3 py-2 rounded-lg shadow-lg text-sm font-medium hover:bg-purple-700 transition-colors"
        title="Feature Flags Debug Panel"
      >
        🚩 Flags
      </button>

      {/* Debug panel */}
      {isOpen && (
        <div className="fixed bottom-16 right-4 z-50 bg-gray-900 border border-gray-700 rounded-lg shadow-xl p-4 max-w-md max-h-96 overflow-y-auto">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-white font-semibold text-sm">Feature Flags</h3>
            <div className="flex items-center gap-2">
              {isLoading && (
                <div className="w-4 h-4 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
              )}
              <button
                onClick={refreshFlags}
                className="text-purple-400 hover:text-purple-300 text-xs"
                title="Refresh remote config"
              >
                ↻
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-white text-xs"
              >
                ✕
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-900/50 border border-red-700 rounded p-2 mb-3 text-red-300 text-xs">
              {error}
            </div>
          )}

          <div className="space-y-2">
            {Object.entries(flags).map(([key, flag]) => (
              <div key={key} className="border border-gray-700 rounded p-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-white text-xs font-medium">
                    {flag.name}
                  </span>
                  <span className="text-gray-400 text-xs">{flag.category}</span>
                </div>
                <div className="text-gray-300 text-xs mb-2">
                  {flag.description}
                </div>

                {flag.type === "boolean" && (
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={flag.value as boolean}
                      onChange={e => setFlag(key, e.target.checked)}
                      className="rounded"
                    />
                    <span className="text-xs text-gray-300">Enabled</span>
                  </label>
                )}

                {flag.type === "string" && (
                  <input
                    type="text"
                    value={flag.value as string}
                    onChange={e => setFlag(key, e.target.value)}
                    className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1 text-xs text-white"
                  />
                )}

                {flag.type === "number" && (
                  <input
                    type="number"
                    value={flag.value as number}
                    onChange={e =>
                      setFlag(key, parseFloat(e.target.value) || 0)
                    }
                    className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1 text-xs text-white"
                  />
                )}

                {flag.rolloutPercentage !== undefined && (
                  <div className="text-xs text-gray-400 mt-1">
                    Rollout: {flag.rolloutPercentage}%
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

export default FeatureFlagProvider;
