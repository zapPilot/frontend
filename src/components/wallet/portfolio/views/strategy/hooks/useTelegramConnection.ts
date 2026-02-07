/**
 * React Query hooks for Telegram connection management.
 *
 * Provides:
 * - useTelegramStatus: Query hook for connection status with polling
 * - useTelegramConnect: Mutation for initiating connection flow
 * - useTelegramDisconnect: Mutation for disconnecting Telegram
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  disconnectTelegram,
  getTelegramStatus,
  requestTelegramToken,
  type TelegramDisconnectResponse,
  type TelegramStatus,
  type TelegramTokenResponse,
} from "@/services/telegramService";

// ============================================================================
// QUERY KEYS
// ============================================================================

/**
 * Query key factory for Telegram-related queries
 */
export const telegramKeys = {
  all: ["telegram"] as const,
  status: (userId: string) => [...telegramKeys.all, "status", userId] as const,
};

// ============================================================================
// STATUS QUERY
// ============================================================================

interface UseTelegramStatusOptions {
  /** Enable polling while waiting for connection */
  polling?: boolean;
  /** Polling interval in milliseconds (default: 3000) */
  pollingInterval?: number;
}

/**
 * Hook for fetching Telegram connection status.
 *
 * @param userId - User identifier
 * @param options - Configuration options including polling
 * @returns React Query result with Telegram status
 *
 * @example
 * ```tsx
 * // Basic usage
 * const { data, isLoading } = useTelegramStatus(userId);
 *
 * // With polling (for waiting on connection)
 * const { data } = useTelegramStatus(userId, {
 *   polling: isAwaitingConnection,
 *   pollingInterval: 2000
 * });
 * ```
 */
export function useTelegramStatus(
  userId: string | undefined,
  options: UseTelegramStatusOptions = {}
) {
  const { polling = false, pollingInterval = 3000 } = options;

  return useQuery<TelegramStatus, Error>({
    queryKey: telegramKeys.status(userId ?? ""),
    queryFn: () => {
      if (!userId) {
        throw new Error("User ID is required");
      }
      return getTelegramStatus(userId);
    },
    enabled: !!userId,
    staleTime: polling ? 0 : 30 * 1000, // No stale time during polling
    gcTime: 5 * 60 * 1000, // 5 minutes cache
    refetchInterval: polling ? pollingInterval : false,
    retry: 2,
  });
}

// ============================================================================
// CONNECT MUTATION
// ============================================================================

interface ConnectMutationContext {
  userId: string;
}

/**
 * Hook for initiating Telegram connection flow.
 *
 * Requests a verification token and opens the Telegram deep link.
 * The component should enable polling on useTelegramStatus after calling this.
 *
 * @returns Mutation for connecting Telegram
 *
 * @example
 * ```tsx
 * const { mutate: connect, isPending } = useTelegramConnect();
 *
 * const handleConnect = () => {
 *   connect(userId, {
 *     onSuccess: ({ deepLink }) => {
 *       window.open(deepLink, '_blank');
 *       setIsPolling(true);
 *     }
 *   });
 * };
 * ```
 */
export function useTelegramConnect() {
  return useMutation<
    TelegramTokenResponse,
    Error,
    string,
    ConnectMutationContext
  >({
    mutationFn: (userId: string) => requestTelegramToken(userId),
  });
}

// ============================================================================
// DISCONNECT MUTATION
// ============================================================================

/**
 * Hook for disconnecting Telegram account.
 *
 * Invalidates the status query on success to refresh the UI.
 *
 * @returns Mutation for disconnecting Telegram
 *
 * @example
 * ```tsx
 * const { mutate: disconnect, isPending } = useTelegramDisconnect();
 *
 * const handleDisconnect = () => {
 *   if (confirm('Disconnect Telegram?')) {
 *     disconnect(userId);
 *   }
 * };
 * ```
 */
export function useTelegramDisconnect() {
  const queryClient = useQueryClient();

  return useMutation<TelegramDisconnectResponse, Error, string>({
    mutationFn: (userId: string) => disconnectTelegram(userId),
    onSuccess: (_data, userId) => {
      // Invalidate status query to refresh UI
      void queryClient.invalidateQueries({
        queryKey: telegramKeys.status(userId),
      });
    },
  });
}
