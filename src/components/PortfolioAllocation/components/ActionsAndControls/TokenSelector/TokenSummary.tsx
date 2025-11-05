"use client";

import { TokenImage } from "@/components/shared/TokenImage";
import { FLEX_PATTERNS } from "@/constants/design-system";
import { formatCurrency, formatTokenAmount } from "@/lib/formatters";
import type { SwapToken } from "@/types/swap";

interface TokenSummaryProps {
  token: SwapToken;
  className?: string;
}

export const TokenSummary = ({ token, className = "" }: TokenSummaryProps) => {
  const containerClassName = className
    ? `${FLEX_PATTERNS.CENTER_GAP_3} ${className}`
    : FLEX_PATTERNS.CENTER_GAP_3;

  const balanceAmount = token.balance;
  const priceValue = typeof token.price === "number" ? token.price : null;

  const formattedBalance =
    typeof balanceAmount === "number"
      ? formatTokenAmount(balanceAmount, token.symbol)
      : null;
  const formattedUsd =
    typeof balanceAmount === "number" && priceValue !== null
      ? formatCurrency(balanceAmount * priceValue)
      : null;

  return (
    <div className={containerClassName}>
      <TokenImage
        token={{
          symbol: token.symbol,
          ...(token.optimized_symbol && {
            optimized_symbol: token.optimized_symbol,
          }),
          ...(token.logo_url && {
            logo_url: token.logo_url,
          }),
        }}
        size={32}
        className="w-8 h-8 flex-shrink-0"
      />
      <div className="flex-1 min-w-0 text-left">
        <div className={`${FLEX_PATTERNS.CENTER_GAP_2} text-sm leading-tight`}>
          <span className="truncate font-semibold text-white">
            {token.symbol}
          </span>
          {formattedBalance && (
            <span className="ml-auto text-sm font-medium text-white">
              {formattedBalance}
            </span>
          )}
        </div>
        <div className={`${FLEX_PATTERNS.CENTER_GAP_2} text-xs leading-tight`}>
          <span className="truncate text-gray-400">{token.name}</span>
          {formattedUsd && (
            <span className="ml-auto text-gray-500">{formattedUsd}</span>
          )}
        </div>
      </div>
    </div>
  );
};
