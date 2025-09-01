import { useCallback, useState } from "react";

interface UseTokenActionsReturn {
  deletedIds: Set<string>;
  deleteToken: (tokenId: string) => void;
  restoreTokens: () => void;
}

/**
 * Hook for managing token actions (delete, restore)
 * Extracted from the original complex useTokenState hook
 */
export function useTokenActions(): UseTokenActionsReturn {
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set());

  const deleteToken = useCallback((tokenId: string) => {
    setDeletedIds(prev => new Set([...prev, tokenId]));
  }, []);

  const restoreTokens = useCallback(() => {
    setDeletedIds(new Set());
  }, []);

  return {
    deletedIds,
    deleteToken,
    restoreTokens,
  };
}
