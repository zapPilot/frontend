import type {
  TokenBalance,
  TransactionToken,
} from "@/types/domain/transaction";

export interface TokenSelectorBaseProps {
  tokens: TransactionToken[];
  selectedToken?: string | null;
  onSelect: (tokenAddress: string) => void;
  balances?: Record<string, TokenBalance>;
  loading?: boolean;
}

export function filterTokensBySearch(
  tokens: TransactionToken[],
  search: string
): TransactionToken[] {
  if (!search) return tokens;
  const searchLower = search.toLowerCase();
  return tokens.filter(token =>
    [token.symbol, token.name].some(value =>
      value.toLowerCase().includes(searchLower)
    )
  );
}
