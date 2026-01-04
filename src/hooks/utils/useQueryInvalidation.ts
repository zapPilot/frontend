import { type QueryClient } from "@tanstack/react-query";

import { walletLogger } from "@/utils/logger";

/**
 * Query Invalidation Utilities
 *
 * Centralized utilities for handling React Query invalidation and refetch operations.
 * Reduces code duplication across mutation hooks.
 */

interface InvalidateAndRefetchOptions {
  queryClient: QueryClient;
  queryKey: readonly unknown[];
  refetch: () => Promise<unknown>;
  operationName?: string;
}

/**
 * Safely invalidates query cache and refetches data after a mutation.
 * Handles errors gracefully without throwing.
 *
 * @param options - Configuration for invalidation and refetch
 */
export async function invalidateAndRefetch({
  queryClient,
  queryKey,
  refetch,
  operationName = "operation",
}: InvalidateAndRefetchOptions): Promise<void> {
  // Invalidate query cache
  try {
    await queryClient.invalidateQueries({ queryKey });
  } catch (invalidateError) {
    walletLogger.error(
      `Failed to invalidate queries after ${operationName}`,
      invalidateError
    );
  }

  // Refetch data
  try {
    await refetch();
  } catch (refetchError) {
    walletLogger.error(
      `Failed to refetch data after ${operationName}`,
      refetchError
    );
  }
}
