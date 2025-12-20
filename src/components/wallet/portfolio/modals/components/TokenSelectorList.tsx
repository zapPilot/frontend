"use client";

import { FOCUS_STYLES } from "@/constants/design-system";
import type {
  TokenBalance,
  TransactionToken,
} from "@/types/domain/transaction";

interface TokenSelectorListProps {
  search: string;
  onSearchChange: (value: string) => void;
  searchLabel: string;
  searchPlaceholder: string;
  selectedToken?: string | null;
  tokens: TransactionToken[];
  popularTokens: TransactionToken[];
  balances?: Record<string, TokenBalance>;
  loading?: boolean;
  emptyState: string;
  popularLabel?: string;
  onSelect: (tokenAddress: string) => void;
}

export function TokenSelectorList({
  search,
  onSearchChange,
  searchLabel,
  searchPlaceholder,
  selectedToken,
  tokens,
  popularTokens,
  balances = {},
  loading = false,
  emptyState,
  popularLabel,
  onSelect,
}: TokenSelectorListProps) {
  return (
    <>
      <div className="flex items-center gap-2 rounded-xl border border-gray-800 bg-gray-900/60 px-3 py-2">
        <input
          type="search"
          role="combobox"
          aria-controls="token-listbox"
          aria-expanded={tokens.length > 0}
          aria-autocomplete="list"
          aria-activedescendant={
            selectedToken ? `token-option-${selectedToken}` : undefined
          }
          aria-label={searchLabel}
          value={search}
          onChange={event => onSearchChange(event.target.value)}
          placeholder={searchPlaceholder}
          className={`w-full bg-transparent text-white placeholder:text-gray-500 ${FOCUS_STYLES}`}
          data-testid="token-search"
        />
        <span className="text-xs text-gray-500" aria-hidden="true">
          ⌘K
        </span>
      </div>

      {popularTokens.length > 0 ? (
        <div role="group" aria-label="Popular tokens">
          {popularLabel ? (
            <div className="mb-2 text-[11px] font-bold uppercase tracking-wider text-gray-500">
              {popularLabel}
            </div>
          ) : null}
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
      ) : null}

      <div
        id="token-listbox"
        role="listbox"
        aria-label="Available tokens"
        className="max-h-60 overflow-y-auto rounded-xl border border-gray-800 bg-gray-900/60"
      >
        {loading ? (
          <div className="p-4 text-sm text-gray-400">Loading tokens…</div>
        ) : tokens.length === 0 ? (
          <div className="p-4 text-sm text-gray-400">{emptyState}</div>
        ) : (
          tokens.map(token => {
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
    </>
  );
}
