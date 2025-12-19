"use client";

import { useMemo, useState } from "react";

import { CategoryPills } from "@/components/wallet/variations/v22/modals/components/CategoryPills";
import { SelectorHeader } from "@/components/wallet/variations/v22/modals/components/SelectorHeader";
import { FOCUS_STYLES } from "@/constants/design-system";
import {
  type CategoryFilter,
  filterTokensByCategory,
  getTokenCountsByCategory,
} from "@/lib/assetCategoryUtils";
import type {
  TokenBalance,
  TransactionToken,
} from "@/types/domain/transaction";

interface TokenSelectorWithCategoriesProps {
  tokens: TransactionToken[];
  selectedToken?: string | null;
  onSelect: (tokenAddress: string) => void;
  balances?: Record<string, TokenBalance>;
  loading?: boolean;
}

export function TokenSelectorWithCategories({
  tokens,
  selectedToken,
  onSelect,
  balances = {},
  loading = false,
}: TokenSelectorWithCategoriesProps) {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>("all");

  // Get token counts by category
  const tokenCounts = useMemo(
    () => getTokenCountsByCategory(tokens),
    [tokens]
  );

  // Filter by category first, then by search
  const filteredTokens = useMemo(() => {
    let filtered = filterTokensByCategory(tokens, activeCategory);

    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(token =>
        [token.symbol, token.name].some(value =>
          value.toLowerCase().includes(searchLower)
        )
      );
    }

    return filtered;
  }, [tokens, activeCategory, search]);

  // Popular tokens filtered by active category
  const popularTokens = useMemo(() => {
    const categoryFiltered = filterTokensByCategory(tokens, activeCategory);
    return categoryFiltered.filter(token => token.popular);
  }, [tokens, activeCategory]);

  const categoryLabel =
    activeCategory === "all" ? "all tokens" : `${activeCategory} tokens`;

  return (
    <div className="space-y-3">
      <SelectorHeader
        title="Select Token"
        description="Filter by category, search, or pick a popular token."
      />

      {/* Category Pills */}
      <CategoryPills
        activeCategory={activeCategory}
        onCategoryChange={setActiveCategory}
        tokenCounts={tokenCounts}
        showCounts={true}
      />

      {/* Search Input */}
      <div className="flex items-center gap-2 rounded-xl border border-gray-800 bg-gray-900/60 px-3 py-2">
        <input
          type="search"
          role="combobox"
          aria-controls="token-listbox"
          aria-expanded={filteredTokens.length > 0}
          aria-autocomplete="list"
          aria-activedescendant={
            selectedToken ? `token-option-${selectedToken}` : undefined
          }
          aria-label={`Search ${categoryLabel}`}
          value={search}
          onChange={event => setSearch(event.target.value)}
          placeholder={`Search ${categoryLabel}...`}
          className={`w-full bg-transparent text-white placeholder:text-gray-500 ${FOCUS_STYLES}`}
          data-testid="token-search"
        />
        <span className="text-xs text-gray-500" aria-hidden="true">
          ⌘K
        </span>
      </div>

      {/* Popular Tokens Section */}
      {popularTokens.length > 0 && (
        <div role="group" aria-label="Popular tokens">
          <div className="mb-2 text-[11px] font-bold uppercase tracking-wider text-gray-500">
            Popular
          </div>
          <div className="flex flex-wrap gap-2">
            {popularTokens.map(token => (
              <button
                key={token.address}
                type="button"
                aria-label={`Select ${token.symbol}`}
                aria-pressed={selectedToken === token.address}
                onClick={() => onSelect(token.address)}
                data-testid={`popular-token-${token.symbol.toLowerCase()}`}
                className={`rounded-full border px-3 py-1 text-xs font-semibold transition-all duration-150 ${FOCUS_STYLES} ${
                  selectedToken === token.address
                    ? "border-purple-500/60 bg-purple-500/10 text-white"
                    : "border-gray-800 bg-gray-900/60 text-gray-300 hover:border-purple-500/30 hover:text-white"
                }`}
              >
                {token.symbol}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Token List */}
      <div
        id="token-listbox"
        role="listbox"
        aria-label="Available tokens"
        className="max-h-60 overflow-y-auto rounded-xl border border-gray-800 bg-gray-900/60"
      >
        {loading ? (
          <div className="p-4 text-sm text-gray-400">Loading tokens…</div>
        ) : filteredTokens.length === 0 ? (
          <div className="p-4 text-center text-sm text-gray-400">
            {search
              ? `No tokens found matching "${search}"`
              : `No ${categoryLabel} available`}
          </div>
        ) : (
          filteredTokens.map(token => {
            const balance = balances[token.address];
            const isSelected = token.address === selectedToken;
            return (
              <button
                key={token.address}
                id={`token-option-${token.address}`}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => onSelect(token.address)}
                data-testid={`token-option-${token.symbol.toLowerCase()}`}
                className={`flex w-full items-center justify-between px-4 py-3 text-left transition-colors first:rounded-t-xl last:rounded-b-xl ${FOCUS_STYLES} ${
                  isSelected
                    ? "bg-purple-500/10 text-white"
                    : "text-gray-200 hover:bg-gray-800/70"
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{token.symbol}</span>
                    <span className="text-xs text-gray-500">{token.name}</span>
                    {token.category === "stable" && (
                      <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-emerald-300">
                        Stable
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500">
                    {balance
                      ? `${balance.balance} • ~$${balance.usdValue.toLocaleString()}`
                      : "Balance fetching…"}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-white">
                    ${token.usdPrice?.toLocaleString() ?? "—"}
                  </div>
                  <div className="text-[11px] text-gray-500">
                    Chain {token.chainId}
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
