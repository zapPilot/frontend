"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  Check,
  ChevronDown,
  Copy,
  LogOut,
  Plus,
  Settings,
  Wallet,
} from "lucide-react";
import { type ReactElement, useRef, useState } from "react";
import { useConnectModal } from "thirdweb/react";

import { ConnectWalletButton } from "@/components/WalletManager/components/ConnectWalletButton";
import { DEFAULT_SUPPORTED_CHAINS, DEFAULT_WALLETS } from "@/config/wallets";
import { WALLET_LABELS } from "@/constants/wallet";
import { useClickOutside } from "@/hooks/ui/useClickOutside";
import { dropdownMenu } from "@/lib/ui/animationVariants";
import { useWalletProvider } from "@/providers/WalletProvider";
import { formatAddress } from "@/utils/formatters";
import THIRDWEB_CLIENT from "@/utils/thirdweb";

interface WalletMenuProps {
  onOpenWalletManager?: () => void;
  onOpenSettings: () => void;
}

type CopyButtonVariant = "text" | "icon-only";

interface CopyAddressButtonProps {
  address: string;
  copiedAddress: string | null;
  onCopyAddress: (address: string) => void;
  variant?: CopyButtonVariant;
}

function getCopyButtonClassName(variant: CopyButtonVariant): string {
  if (variant === "text") {
    return "text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1 transition-colors";
  }

  return "text-xs text-gray-400 hover:text-purple-300 transition-colors";
}

function CopyAddressButton({
  address,
  copiedAddress,
  onCopyAddress,
  variant = "text",
}: CopyAddressButtonProps): ReactElement {
  const buttonClassName = getCopyButtonClassName(variant);
  const isCopied = copiedAddress === address;
  function handleCopyClick(): void {
    onCopyAddress(address);
  }

  return (
    <button onClick={handleCopyClick} className={buttonClassName}>
      {isCopied ? (
        <>
          <Check className="w-3 h-3" />
          {variant === "text" && "Copied"}
        </>
      ) : (
        <>
          <Copy className="w-3 h-3" />
          {variant === "text" && "Copy"}
        </>
      )}
    </button>
  );
}

interface WalletMenuItemsProps {
  onOpenWalletManager: (() => void) | undefined;
  onOpenSettings: () => void;
  onCloseMenu: () => void;
}

function WalletMenuItems({
  onOpenWalletManager,
  onOpenSettings,
  onCloseMenu,
}: WalletMenuItemsProps): ReactElement {
  function handleOpenWalletManager(): void {
    onCloseMenu();
    onOpenWalletManager?.();
  }

  function handleOpenSettings(): void {
    onCloseMenu();
    onOpenSettings();
  }

  return (
    <>
      {onOpenWalletManager && (
        <button
          onClick={handleOpenWalletManager}
          className="w-full px-4 py-2.5 text-left text-sm text-gray-200 hover:bg-purple-500/10 hover:text-white transition-colors flex items-center gap-3"
        >
          <Wallet className="w-4 h-4 text-purple-400" />
          View Bundles
        </button>
      )}
      <button
        onClick={handleOpenSettings}
        className="w-full px-4 py-2.5 text-left text-sm text-gray-200 hover:bg-purple-500/10 hover:text-white transition-colors flex items-center gap-3"
      >
        <Settings className="w-4 h-4 text-purple-400" />
        Settings
      </button>
    </>
  );
}

interface DisconnectButtonProps {
  label: string;
  onDisconnect: () => void;
}

function DisconnectButton({
  label,
  onDisconnect,
}: DisconnectButtonProps): ReactElement {
  return (
    <div className="border-t border-gray-800 py-1">
      <button
        onClick={onDisconnect}
        className="w-full px-4 py-2.5 text-left text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors flex items-center gap-3"
      >
        <LogOut className="w-4 h-4" />
        {label}
      </button>
    </div>
  );
}

interface WalletSectionActionsProps extends WalletMenuItemsProps {
  onDisconnect: () => void;
}

interface WalletSectionFooterProps extends WalletSectionActionsProps {
  disconnectLabel: string;
}

function WalletSectionFooter({
  onOpenWalletManager,
  onOpenSettings,
  onCloseMenu,
  onDisconnect,
  disconnectLabel,
}: WalletSectionFooterProps): ReactElement {
  return (
    <>
      <div className="py-1">
        <WalletMenuItems
          onOpenWalletManager={onOpenWalletManager}
          onOpenSettings={onOpenSettings}
          onCloseMenu={onCloseMenu}
        />
      </div>
      <DisconnectButton label={disconnectLabel} onDisconnect={onDisconnect} />
    </>
  );
}

function getMenuButtonClassName(isConnecting: boolean): string {
  return `h-10 px-2 md:px-4 bg-gray-800/50 hover:bg-gray-800 border border-purple-500/20 hover:border-purple-500/40 rounded-lg transition-all duration-200 flex items-center gap-2 text-sm font-medium text-gray-200 hover:text-white ${
    isConnecting ? "opacity-50 cursor-wait" : ""
  }`;
}

function getChevronClassName(isMenuOpen: boolean): string {
  return `w-4 h-4 transition-transform duration-200 ${
    isMenuOpen ? "rotate-180" : ""
  }`;
}

interface ConnectedWalletItem {
  address: string;
  isActive?: boolean;
}

interface WalletMenuButtonProps {
  isConnected: boolean;
  isConnecting: boolean;
  isMenuOpen: boolean;
  accountAddress: string | undefined;
  hasMultipleWallets: boolean;
  connectedWalletCount: number;
  onConnectClick: () => Promise<void>;
  onToggleMenu: () => void;
}

function WalletMenuButton({
  isConnected,
  isConnecting,
  isMenuOpen,
  accountAddress,
  hasMultipleWallets,
  connectedWalletCount,
  onConnectClick,
  onToggleMenu,
}: WalletMenuButtonProps): ReactElement {
  const showConnectedAddress = isConnected && Boolean(accountAddress);
  function handleButtonClick(): void {
    if (!isConnected) {
      void onConnectClick();
      return;
    }

    onToggleMenu();
  }

  return (
    <button
      data-testid="unified-wallet-menu-button"
      onClick={handleButtonClick}
      disabled={isConnecting}
      className={getMenuButtonClassName(isConnecting)}
      aria-expanded={isMenuOpen}
      aria-haspopup="menu"
    >
      <Wallet className="w-4 h-4 text-purple-400" />
      {!isConnected && (
        <span className="hidden sm:inline">{WALLET_LABELS.CONNECT}</span>
      )}
      {showConnectedAddress && accountAddress && (
        <>
          <span className="font-mono hidden sm:inline">
            {formatAddress(accountAddress)}
          </span>
          {hasMultipleWallets && (
            <span className="ml-1 px-1.5 py-0.5 bg-purple-500/20 text-purple-300 rounded text-xs font-bold hidden sm:inline">
              {connectedWalletCount}
            </span>
          )}
        </>
      )}
      <ChevronDown className={getChevronClassName(isMenuOpen)} />
    </button>
  );
}

interface WalletSectionCopyProps extends WalletSectionActionsProps {
  copiedAddress: string | null;
  onCopyAddress: (address: string) => void;
}

interface WalletSingleWalletSectionProps extends WalletSectionCopyProps {
  accountAddress: string;
}

function WalletSingleWalletSection({
  accountAddress,
  copiedAddress,
  onCopyAddress,
  onOpenWalletManager,
  onOpenSettings,
  onCloseMenu,
  onDisconnect,
}: WalletSingleWalletSectionProps): ReactElement {
  return (
    <div className="py-2">
      <div className="px-4 py-3 border-b border-gray-800">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-gray-400 uppercase tracking-wide">
            Connected Wallet
          </span>
          <CopyAddressButton
            address={accountAddress}
            copiedAddress={copiedAddress}
            onCopyAddress={onCopyAddress}
            variant="text"
          />
        </div>
        <div className="font-mono text-sm text-white">
          {formatAddress(accountAddress)}
        </div>
      </div>

      <WalletSectionFooter
        onOpenWalletManager={onOpenWalletManager}
        onOpenSettings={onOpenSettings}
        onCloseMenu={onCloseMenu}
        onDisconnect={onDisconnect}
        disconnectLabel="Disconnect"
      />
    </div>
  );
}

interface WalletMultipleWalletSectionProps extends WalletSectionCopyProps {
  connectedWallets: ConnectedWalletItem[];
}

function getWalletItemClassName(isActive: boolean | undefined): string {
  if (isActive) {
    return "p-3 rounded-lg border transition-all bg-purple-500/10 border-purple-500/30";
  }

  return "p-3 rounded-lg border transition-all bg-gray-800/30 border-gray-700/50 hover:border-gray-600";
}

function getWalletStatusDotClassName(isActive: boolean | undefined): string {
  if (isActive) {
    return "w-2 h-2 rounded-full bg-purple-400 animate-pulse";
  }

  return "w-2 h-2 rounded-full bg-gray-600";
}

function WalletMultipleWalletSection({
  connectedWallets,
  copiedAddress,
  onCopyAddress,
  onOpenWalletManager,
  onOpenSettings,
  onCloseMenu,
  onDisconnect,
}: WalletMultipleWalletSectionProps): ReactElement {
  return (
    <div className="py-2">
      <div className="px-4 py-2 border-b border-gray-800">
        <div className="text-xs text-gray-400 uppercase tracking-wide mb-3">
          Connected Wallets
        </div>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {connectedWallets.map(wallet => (
            <div
              key={wallet.address}
              className={getWalletItemClassName(wallet.isActive)}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <div
                    className={getWalletStatusDotClassName(wallet.isActive)}
                  />
                  <span className="font-mono text-sm text-white">
                    {formatAddress(wallet.address)}
                  </span>
                </div>
                <CopyAddressButton
                  address={wallet.address}
                  copiedAddress={copiedAddress}
                  onCopyAddress={onCopyAddress}
                  variant="icon-only"
                />
              </div>
              {wallet.isActive && (
                <div className="text-xs text-purple-400 font-bold flex items-center gap-1">
                  Active Wallet
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="px-4 py-3 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          <ConnectWalletButton className="flex-1 text-sm" />
        </div>
      </div>

      <WalletSectionFooter
        onOpenWalletManager={onOpenWalletManager}
        onOpenSettings={onOpenSettings}
        onCloseMenu={onCloseMenu}
        onDisconnect={onDisconnect}
        disconnectLabel="Disconnect All"
      />
    </div>
  );
}

interface WalletMenuDropdownProps extends WalletSectionCopyProps {
  isConnected: boolean;
  isMenuOpen: boolean;
  hasMultipleWallets: boolean;
  accountAddress: string | undefined;
  connectedWallets: ConnectedWalletItem[];
}

function WalletMenuDropdown({
  isConnected,
  isMenuOpen,
  hasMultipleWallets,
  accountAddress,
  connectedWallets,
  copiedAddress,
  onCopyAddress,
  onOpenWalletManager,
  onOpenSettings,
  onCloseMenu,
  onDisconnect,
}: WalletMenuDropdownProps): ReactElement | null {
  if (!isConnected || !isMenuOpen) {
    return null;
  }

  const showSingleWalletState = Boolean(accountAddress) && !hasMultipleWallets;
  const showMultipleWalletState = hasMultipleWallets;
  const sharedSectionProps: WalletSectionCopyProps = {
    copiedAddress,
    onCopyAddress,
    onOpenWalletManager,
    onOpenSettings,
    onCloseMenu,
    onDisconnect,
  };

  return (
    <motion.div
      data-testid="unified-wallet-menu-dropdown"
      variants={dropdownMenu}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.15, ease: "easeOut" }}
      className="absolute top-full right-0 mt-2 w-80 bg-gray-900 border border-purple-500/30 rounded-xl shadow-2xl shadow-purple-500/10 backdrop-blur-xl z-50 overflow-hidden"
      role="menu"
      aria-label="Wallet menu"
    >
      {showSingleWalletState && accountAddress && (
        <WalletSingleWalletSection
          accountAddress={accountAddress}
          {...sharedSectionProps}
        />
      )}

      {showMultipleWalletState && (
        <WalletMultipleWalletSection
          connectedWallets={connectedWallets}
          {...sharedSectionProps}
        />
      )}
    </motion.div>
  );
}

/**
 * Unified Wallet Menu
 * Single entry point for ALL wallet operations that adapts to user state.
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

  // ThirdWeb connect modal hook
  const { connect, isConnecting } = useConnectModal();

  // Handle direct wallet connection (1-step flow)
  async function handleConnectClick(): Promise<void> {
    await connect({
      client: THIRDWEB_CLIENT,
      wallets: DEFAULT_WALLETS,
      chains: DEFAULT_SUPPORTED_CHAINS,
      theme: "dark",
      size: "compact",
      title: WALLET_LABELS.CONNECT,
      showThirdwebBranding: false,
    });
  }

  function closeMenu(): void {
    setIsMenuOpen(false);
  }

  function toggleMenu(): void {
    setIsMenuOpen(prevIsOpen => !prevIsOpen);
  }

  // Click outside and Escape key handler
  useClickOutside(menuRef, closeMenu, isMenuOpen);

  async function copyAddress(address: string): Promise<void> {
    await navigator.clipboard.writeText(address);
    setCopiedAddress(address);
    setTimeout(() => setCopiedAddress(null), 2000);
  }

  async function disconnectWallet(): Promise<void> {
    await disconnect();
    setIsMenuOpen(false);
  }

  function handleCopyAddress(address: string): void {
    void copyAddress(address);
  }

  function handleDisconnect(): void {
    void disconnectWallet();
  }

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
          onCopyAddress={handleCopyAddress}
          onOpenWalletManager={onOpenWalletManager}
          onOpenSettings={onOpenSettings}
          onCloseMenu={closeMenu}
          onDisconnect={handleDisconnect}
        />
      </AnimatePresence>
    </div>
  );
}
