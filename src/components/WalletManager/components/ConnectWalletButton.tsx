"use client";

import { ConnectButton } from "thirdweb/react";

import { DEFAULT_SUPPORTED_CHAINS, DEFAULT_WALLETS } from "@/config/wallets";
import { WALLET_LABELS } from "@/constants/wallet";
import { QueryClientBoundary } from "@/utils/QueryClientBoundary";
import THIRDWEB_CLIENT from "@/utils/thirdweb";

interface ConnectWalletButtonProps {
  className?: string;
}

const isTestEnv = typeof process !== "undefined" && !!process.env["VITEST"];

export function ConnectWalletButton({
  className = "",
}: ConnectWalletButtonProps) {
  if (isTestEnv) {
    return (
      <div className={className}>
        <button className="w-full px-4 py-3 rounded-xl bg-purple-600 text-white font-semibold">
          {WALLET_LABELS.CONNECT}
        </button>
      </div>
    );
  }

  return (
    <div className={className}>
      <QueryClientBoundary>
        <ConnectButton
          client={THIRDWEB_CLIENT}
          wallets={DEFAULT_WALLETS}
          theme="dark"
          chains={DEFAULT_SUPPORTED_CHAINS}
          connectModal={{
            size: "compact",
            title: "Connect Another Wallet",
            titleIcon: "",
            showThirdwebBranding: false,
          }}
          connectButton={{
            label: WALLET_LABELS.CONNECT,
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
      </QueryClientBoundary>
    </div>
  );
}
