import { createWallet, type Wallet } from "thirdweb/wallets";

import { getThirdWebChains } from "@/config/chains";

export const DEFAULT_WALLETS = [
  createWallet("com.ambire") as Wallet,
  createWallet("io.metamask") as Wallet,
];

export const DEFAULT_SUPPORTED_CHAINS = getThirdWebChains();
