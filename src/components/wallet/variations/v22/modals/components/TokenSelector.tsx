"use client";

import { useMemo, useState } from "react";

import type {
  TokenBalance,
  TransactionToken,
} from "@/types/domain/transaction";

interface TokenSelectorProps {
  tokens: TransactionToken[];
  selectedToken?: string | null;
  onSelect: (tokenAddress: string) => void;
  balances?: Record<string, TokenBalance>;
  loading?: boolean;
}

export function TokenSelector({
  tokens,
  selectedToken,
  onSelect,
  balances = {},
  loading = false,
}: TokenSelectorProps) {
  const [search, setSearch] = useState("");

  const filteredTokens = useMemo(() => {
    const searchLower = search.toLowerCase();
    return tokens.filter(token =>
      [token.symbol, token.name].some(value =>
        value.toLowerCase().includes(searchLower)
      )
    );
  }, [search, tokens]);

  const popularTokens = useMemo(
    () => tokens.filter(token => token.popular),
    [tokens]
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-500">
            Select Token
          </p>
          <p className="text-sm text-gray-400">
            Search any supported token or pick a popular choice.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 rounded-xl border border-gray-800 bg-gray-900/60 px-3 py-2">
        <input
          type="search"
          value={search}
          onChange={event => setSearch(event.target.value)}
          placeholder="Search token by name or symbol"
          className="w-full bg-transparent text-white placeholder:text-gray-500 focus:outline-none"
          data-testid="token-search"
        />
        <span className="text-xs text-gray-500">⌘K</span>
      </div>

      {popularTokens.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {popularTokens.map(token => (
            <button
              key={token.address}
              type="button"
              onClick={() => onSelect(token.address)}
              data-testid={`popular-token-${token.symbol.toLowerCase()}`}
              className={`rounded-full border px-3 py-1 text-xs font-semibold transition-all duration-150 ${
                selectedToken === token.address
                  ? "border-purple-500/60 bg-purple-500/10 text-white"
                  : "border-gray-800 bg-gray-900/60 text-gray-300 hover:border-purple-500/30 hover:text-white"
              }`}
            >
              {token.symbol}
            </button>
          ))}
        </div>
      ) : null}

      <div className="max-h-60 overflow-y-auto rounded-xl border border-gray-800 bg-gray-900/60">
        {loading ? (
          <div className="p-4 text-sm text-gray-400">Loading tokens…</div>
        ) : filteredTokens.length === 0 ? (
          <div className="p-4 text-sm text-gray-400">No tokens found</div>
        ) : (
          filteredTokens.map(token => {
            const balance = balances[token.address];
            const isSelected = token.address === selectedToken;
            return (
              <button
                key={token.address}
                type="button"
                onClick={() => onSelect(token.address)}
                data-testid={`token-option-${token.symbol.toLowerCase()}`}
                className={`flex w-full items-center justify-between px-4 py-3 text-left transition-colors first:rounded-t-xl last:rounded-b-xl ${
                  isSelected
                    ? "bg-purple-500/10 text-white"
                    : "hover:bg-gray-800/70 text-gray-200"
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{token.symbol}</span>
                    <span className="text-xs text-gray-500">{token.name}</span>
                    {token.category === "stable" ? (
                      <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-emerald-300">
                        Stable
                      </span>
                    ) : null}
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
