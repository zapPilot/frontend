"use client";

import { AnimatePresence } from "framer-motion";
import { type ReactElement, useRef, useState } from "react";
import { useConnectModal } from "thirdweb/react";

import { DEFAULT_SUPPORTED_CHAINS, DEFAULT_WALLETS } from "@/config/wallets";
import { WALLET_LABELS } from "@/constants/wallet";
import { useClickOutside } from "@/hooks/ui/useClickOutside";
import { useWalletProvider } from "@/providers/WalletProvider";
import { copyTextToClipboard } from "@/utils";
import THIRDWEB_CLIENT from "@/utils/thirdweb";

import { WalletMenuButton, WalletMenuDropdown } from "./WalletMenuContent";

interface WalletMenuProps {
  onOpenWalletManager?: () => void;
  onOpenSettings: () => void;
}

/**
 * Unified wallet menu that adapts its content to the current wallet state.
 */
export function WalletMenu({
  onOpenWalletManager,
  onOpenSettings,
}: WalletMenuProps): ReactElement {
  const {
    connectedWallets,
    hasMultipleWallets,
    account,
    isConnected,
    disconnect,
  } = useWalletProvider();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const { connect, isConnecting } = useConnectModal();

  const closeMenu = (): void => {
    setIsMenuOpen(false);
  };

  const toggleMenu = (): void => {
    setIsMenuOpen(previousIsOpen => !previousIsOpen);
  };

  useClickOutside(menuRef, closeMenu, isMenuOpen);

  const handleConnectClick = async (): Promise<void> => {
    await connect({
      client: THIRDWEB_CLIENT,
      wallets: DEFAULT_WALLETS,
      chains: DEFAULT_SUPPORTED_CHAINS,
      theme: "dark",
      size: "compact",
      title: WALLET_LABELS.CONNECT,
      showThirdwebBranding: false,
    });
  };

  const copyAddress = async (address: string): Promise<void> => {
    await copyTextToClipboard(address);
    setCopiedAddress(address);
    setTimeout(() => setCopiedAddress(null), 2000);
  };

  const disconnectWallet = async (): Promise<void> => {
    await disconnect();
    setIsMenuOpen(false);
  };

  const handleDisconnect = (): void => {
    void disconnectWallet();
  };

  return (
    <div className="relative" ref={menuRef}>
      <WalletMenuButton
        isConnected={isConnected}
        isConnecting={isConnecting}
        isMenuOpen={isMenuOpen}
        accountAddress={account?.address}
        hasMultipleWallets={hasMultipleWallets}
        connectedWalletCount={connectedWallets.length}
        onConnectClick={handleConnectClick}
        onToggleMenu={toggleMenu}
      />

      <AnimatePresence>
        <WalletMenuDropdown
          isConnected={isConnected}
          isMenuOpen={isMenuOpen}
          hasMultipleWallets={hasMultipleWallets}
          accountAddress={account?.address}
          connectedWallets={connectedWallets}
          copiedAddress={copiedAddress}
          onCopyAddress={address => {
            void copyAddress(address);
          }}
          onOpenWalletManager={onOpenWalletManager}
          onOpenSettings={onOpenSettings}
          onCloseMenu={closeMenu}
          onDisconnect={handleDisconnect}
        />
      </AnimatePresence>
    </div>
  );
}
