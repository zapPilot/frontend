"use client";

import { useMemo, useState } from "react";

import { CategoryPills } from "./CategoryPills";
import { SelectorHeader } from "./SelectorHeader";
import { TokenSelectorList } from "./TokenSelectorList";
import {
  filterTokensByCategory,
  getTokenCountsByCategory,
} from "@/lib/assetCategoryUtils";

import {
  filterTokensBySearch,
  type TokenSelectorBaseProps,
} from "./tokenSelectorUtils";

type CategoryFilter = Parameters<typeof filterTokensByCategory>[1];

type TokenSelectorWithCategoriesProps = TokenSelectorBaseProps;

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
  const tokenCounts = useMemo(() => getTokenCountsByCategory(tokens), [tokens]);

  // Filter by category first, then by search
  const filteredTokens = useMemo(() => {
    const categoryFiltered = filterTokensByCategory(tokens, activeCategory);
    return filterTokensBySearch(categoryFiltered, search);
  }, [tokens, activeCategory, search]);

  // Popular tokens filtered by active category
  const popularTokens = useMemo(() => {
    const categoryFiltered = filterTokensByCategory(tokens, activeCategory);
    return categoryFiltered.filter(token => token.popular);
  }, [tokens, activeCategory]);

  const categoryLabel =
    activeCategory === "all" ? "all tokens" : `${activeCategory} tokens`;
  const emptyState = search
    ? `No tokens found matching "${search}"`
    : `No ${categoryLabel} available`;

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

      <TokenSelectorList
        search={search}
        onSearchChange={setSearch}
        searchLabel={`Search ${categoryLabel}`}
        searchPlaceholder={`Search ${categoryLabel}...`}
        selectedToken={selectedToken ?? null}
        tokens={filteredTokens}
        popularTokens={popularTokens}
        balances={balances}
        loading={loading}
        emptyState={emptyState}
        popularLabel="Popular"
        onSelect={onSelect}
      />
    </div>
  );
}
