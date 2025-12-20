"use client";

import { memo } from "react";
import { ConnectButton, useActiveAccount } from "thirdweb/react";

// Import from unified chain configuration
import { DEFAULT_SUPPORTED_CHAINS, DEFAULT_WALLETS } from "@/config/wallets";
import { formatAddress } from "@/lib/formatters";
import { QueryClientBoundary } from "@/utils/QueryClientBoundary";
import THIRDWEB_CLIENT from "@/utils/thirdweb";

const AddressDisplay = memo(function AddressDisplay({
  address,
}: {
  address?: string;
}) {
  if (!address) return <span className="font-mono inline">No Address</span>;
  return <span className="font-mono inline">{formatAddress(address)}</span>;
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
  size?: "sm" | "md" | "lg";
}

const isTestEnv = typeof process !== "undefined" && !!process.env["VITEST"];

export function SimpleConnectButton({
  className = "",
  size = "md",
}: SimpleConnectButtonProps) {
  const activeAccount = useActiveAccount();

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
      {isTestEnv ? (
        <button className="px-4 py-2 rounded-lg bg-purple-600 text-white text-sm font-semibold">
          Connect Wallet22
        </button>
      ) : (
        <QueryClientBoundary>
          <ConnectButton
            client={THIRDWEB_CLIENT}
            autoConnect={true}
            wallets={DEFAULT_WALLETS}
            theme="light"
            chains={DEFAULT_SUPPORTED_CHAINS}
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
        </QueryClientBoundary>
      )}
    </div>
  );
}
