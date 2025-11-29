export interface SwapToken {
  symbol: string;
  name: string;
  address: string;
  chainId: number;
  decimals: number;
  balance?: number; // Optional - will be populated by frontend ethers calls later
  price?: number; // Optional - for future pricing integration
  logo_url?: string; // Backend token logo URL
  optimized_symbol?: string; // Backend optimized symbol for TokenImage
  icon?: string; // Keep for backward compatibility
  type?: "native" | "wrapped" | "erc20"; // Backend token category metadata
  wrappedVersion?: string;
  nativeVersion?: string;
  hasDeposit?: boolean;
}
