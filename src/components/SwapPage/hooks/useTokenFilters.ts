import { useMemo } from "react";
import { DustToken } from "../../../types/optimize";

interface UseTokenFiltersProps {
  tokens: DustToken[];
  deletedIds: Set<string>;
}

interface UseTokenFiltersReturn {
  filteredTokens: DustToken[];
  activeTokensCount: number;
  deletedTokensCount: number;
}

/**
 * Hook for filtering tokens based on deletion state
 * Extracted from the original complex useTokenState hook
 */
export function useTokenFilters({
  tokens,
  deletedIds,
}: UseTokenFiltersProps): UseTokenFiltersReturn {
  // Performance optimization: Filter tokens using useMemo
  // Previously filtered tokens on every render, which can be expensive for large token lists.
  // Now memoized to only recalculate when token data or deleted IDs change.
  const filteredTokens = useMemo(
    () => tokens.filter(token => !deletedIds.has(token.id)),
    [tokens, deletedIds]
  );

  const activeTokensCount = filteredTokens.length;
  const deletedTokensCount = deletedIds.size;

  return {
    filteredTokens,
    activeTokensCount,
    deletedTokensCount,
  };
}
