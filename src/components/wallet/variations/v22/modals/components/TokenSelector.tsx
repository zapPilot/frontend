"use client";

import { useMemo, useState } from "react";

import { SelectorHeader } from "@/components/wallet/variations/v22/modals/components/SelectorHeader";
import { TokenSelectorList } from "@/components/wallet/variations/v22/modals/components/TokenSelectorList";

import {
  filterTokensBySearch,
  type TokenSelectorBaseProps,
} from "./tokenSelectorUtils";

type TokenSelectorProps = TokenSelectorBaseProps;

export function TokenSelector({
  tokens,
  selectedToken,
  onSelect,
  balances = {},
  loading = false,
}: TokenSelectorProps) {
  const [search, setSearch] = useState("");

  const filteredTokens = useMemo(
    () => filterTokensBySearch(tokens, search),
    [search, tokens]
  );

  const popularTokens = useMemo(
    () => tokens.filter(token => token.popular),
    [tokens]
  );

  return (
    <div className="space-y-3">
      <SelectorHeader
        title="Select Token"
        description="Search any supported token or pick a popular choice."
      />
      <TokenSelectorList
        search={search}
        onSearchChange={setSearch}
        searchLabel="Search tokens"
        searchPlaceholder="Search token by name or symbol"
        selectedToken={selectedToken ?? null}
        tokens={filteredTokens}
        popularTokens={popularTokens}
        balances={balances}
        loading={loading}
        emptyState="No tokens found"
        onSelect={onSelect}
      />
    </div>
  );
}
