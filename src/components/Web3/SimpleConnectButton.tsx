"use client";

import React, { memo } from "react";
import { ConnectButton, useActiveAccount } from "thirdweb/react";
import {
  createWallet,
  walletConnect,
  inAppWallet,
  Wallet,
} from "thirdweb/wallets";
import THIRDWEB_CLIENT from "@/utils/thirdweb";
import { arbitrum, optimism, base } from "thirdweb/chains";
import { defineChain } from "thirdweb";

const WALLETS = [
  createWallet("io.metamask"),
  createWallet("io.rabby"),
  createWallet("app.phantom"),
  createWallet("com.coinbase.wallet"),
  walletConnect(),
  inAppWallet({
    auth: {
      options: ["google", "telegram", "x", "passkey", "facebook", "apple"],
    },
  }),
] as Wallet[];

const SUPPORTED_CHAINS = [arbitrum, base, defineChain(1088), optimism];

const AddressDisplay = memo(function AddressDisplay({
  address,
}: {
  address?: string;
}) {
  if (!address) return <span className="font-mono inline">No Address</span>;
  return (
    <span className="font-mono inline">
      {`${address.slice(0, 5)}...${address.slice(-4)}`}
    </span>
  );
});

const DetailsButton = memo(function DetailsButton({
  address,
}: {
  address?: string;
}) {
  return (
    <div className="flex items-center gap-3 p-2 rounded-md bg-white/10 text-xs cursor-pointer hover:bg-white/20 transition-colors">
      <div className="flex items-center gap-2 p-1">
        {address && <AddressDisplay address={address} />}
        {!address && <AddressDisplay />}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className="size-4"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z"
            clipRule="evenodd"
          />
        </svg>
      </div>
    </div>
  );
});

interface SimpleConnectButtonProps {
  className?: string;
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
}

export function SimpleConnectButton({
  className = "",
  variant = "primary",
  size = "md",
}: SimpleConnectButtonProps) {
  const activeAccount = useActiveAccount();

  const getButtonTheme = () => {
    switch (variant) {
      case "primary":
        return "light";
      case "secondary":
        return "dark";
      case "ghost":
        return "light";
      default:
        return "light";
    }
  };

  const getSizeConfig = () => {
    switch (size) {
      case "sm":
        return "compact";
      case "md":
        return "wide";
      case "lg":
        return "wide";
      default:
        return "wide";
    }
  };

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {/* Connect Button */}
      <ConnectButton
        client={THIRDWEB_CLIENT}
        autoConnect={true}
        wallets={WALLETS}
        theme={getButtonTheme()}
        chains={SUPPORTED_CHAINS}
        connectModal={{
          size: getSizeConfig() as "compact" | "wide",
          title: "Connect Wallet",
          titleIcon: "",
          showThirdwebBranding: false,
        }}
        detailsButton={{
          render() {
            const address = activeAccount?.address;
            return address ? (
              <DetailsButton address={address} />
            ) : (
              <DetailsButton />
            );
          },
          style: { borderRadius: "8px" },
        }}
        switchButton={{
          style: {
            borderRadius: "8px",
            background: "rgba(255, 255, 255, 0.1)",
            border: "1px solid rgba(255, 255, 255, 0.2)",
          },
        }}
      />
    </div>
  );
}

export default SimpleConnectButton;
