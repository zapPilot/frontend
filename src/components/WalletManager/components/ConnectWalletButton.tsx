"use client";

import { ConnectButton } from "thirdweb/react";
import { createWallet, Wallet } from "thirdweb/wallets";

import { getThirdWebChains } from "@/config/chains";
import THIRDWEB_CLIENT from "@/utils/thirdweb";

const WALLETS = [
  createWallet("com.ambire"),
  createWallet("io.metamask"),
] as Wallet[];

const SUPPORTED_CHAINS = getThirdWebChains();

interface ConnectWalletButtonProps {
  className?: string;
}

export function ConnectWalletButton({
  className = "",
}: ConnectWalletButtonProps) {
  return (
    <div className={className}>
      <ConnectButton
        client={THIRDWEB_CLIENT}
        wallets={WALLETS}
        theme="dark"
        chains={SUPPORTED_CHAINS}
        connectModal={{
          size: "compact",
          title: "Connect Another Wallet",
          titleIcon: "",
          showThirdwebBranding: false,
        }}
        connectButton={{
          label: "Connect Wallet",
          style: {
            width: "100%",
            padding: "12px 16px",
            background:
              "linear-gradient(135deg, rgb(168 85 247) 0%, rgb(124 58 237) 100%)",
            border: "1px solid rgba(168, 85, 247, 0.3)",
            borderRadius: "12px",
            color: "white",
            fontWeight: "600",
            fontSize: "14px",
            cursor: "pointer",
            transition: "all 0.2s",
          },
        }}
      />
    </div>
  );
}
