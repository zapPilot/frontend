import { createWallet, type Wallet } from "thirdweb/wallets";

import { getThirdWebChains } from "@/config/chains";

type WalletId = Parameters<typeof createWallet>[0];

// Ambire is currently supported at runtime but omitted from thirdweb's WalletId union.
const AMBIRE_WALLET_ID = "com.ambire" as unknown as WalletId;

export const DEFAULT_WALLETS = [
  createWallet(AMBIRE_WALLET_ID) as Wallet,
  createWallet("io.metamask") as Wallet,
];

export const DEFAULT_SUPPORTED_CHAINS = getThirdWebChains();
