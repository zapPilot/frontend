"use client";

import { motion } from "framer-motion";
import {
  Check,
  ChevronDown,
  Copy,
  LogOut,
  Plus,
  Settings,
  Wallet,
} from "lucide-react";
import { type ReactElement } from "react";

import { ConnectWalletButton } from "@/components/WalletManager/components/ConnectWalletButton";
import { WALLET_LABELS } from "@/constants/wallet";
import { dropdownMenu } from "@/lib/ui/animationVariants";
import { formatAddress } from "@/utils/formatters";

export interface ConnectedWalletItem {
  address: string;
  isActive?: boolean;
}

type CopyButtonVariant = "text" | "icon-only";

interface CopyAddressButtonProps {
  address: string;
  copiedAddress: string | null;
  onCopyAddress: (address: string) => void;
  variant?: CopyButtonVariant;
}

interface WalletMenuItemsProps {
  onOpenWalletManager: (() => void) | undefined;
  onOpenSettings: () => void;
  onCloseMenu: () => void;
}

interface DisconnectButtonProps {
  label: string;
  onDisconnect: () => void;
}

interface WalletSectionActionsProps extends WalletMenuItemsProps {
  onDisconnect: () => void;
}

interface WalletSectionFooterProps extends WalletSectionActionsProps {
  disconnectLabel: string;
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

interface WalletSectionCopyProps extends WalletSectionActionsProps {
  copiedAddress: string | null;
  onCopyAddress: (address: string) => void;
}

interface WalletSingleWalletSectionProps extends WalletSectionCopyProps {
  accountAddress: string;
}

interface WalletMultipleWalletSectionProps extends WalletSectionCopyProps {
  connectedWallets: ConnectedWalletItem[];
}

interface WalletMenuDropdownProps extends WalletSectionCopyProps {
  isConnected: boolean;
  isMenuOpen: boolean;
  hasMultipleWallets: boolean;
  accountAddress: string | undefined;
  connectedWallets: ConnectedWalletItem[];
}

const getCopyButtonClassName = (variant: CopyButtonVariant): string => {
  if (variant === "text") {
    return "text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1 transition-colors";
  }

  return "text-xs text-gray-400 hover:text-purple-300 transition-colors";
};

const getMenuButtonClassName = (isConnecting: boolean): string =>
  `h-10 px-2 md:px-4 bg-gray-800/50 hover:bg-gray-800 border border-purple-500/20 hover:border-purple-500/40 rounded-lg transition-all duration-200 flex items-center gap-2 text-sm font-medium text-gray-200 hover:text-white ${
    isConnecting ? "opacity-50 cursor-wait" : ""
  }`;

const getChevronClassName = (isMenuOpen: boolean): string =>
  `w-4 h-4 transition-transform duration-200 ${isMenuOpen ? "rotate-180" : ""}`;

const getWalletItemClassName = (isActive: boolean | undefined): string => {
  if (isActive) {
    return "p-3 rounded-lg border transition-all bg-purple-500/10 border-purple-500/30";
  }

  return "p-3 rounded-lg border transition-all bg-gray-800/30 border-gray-700/50 hover:border-gray-600";
};

const getWalletStatusDotClassName = (isActive: boolean | undefined): string => {
  if (isActive) {
    return "w-2 h-2 rounded-full bg-purple-400 animate-pulse";
  }

  return "w-2 h-2 rounded-full bg-gray-600";
};

const CopyAddressButton = ({
  address,
  copiedAddress,
  onCopyAddress,
  variant = "text",
}: CopyAddressButtonProps): ReactElement => {
  const isCopied = copiedAddress === address;

  return (
    <button
      onClick={() => {
        onCopyAddress(address);
      }}
      className={getCopyButtonClassName(variant)}
    >
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
};

const WalletMenuItems = ({
  onOpenWalletManager,
  onOpenSettings,
  onCloseMenu,
}: WalletMenuItemsProps): ReactElement => {
  const handleOpenWalletManager = (): void => {
    onCloseMenu();
    onOpenWalletManager?.();
  };

  const handleOpenSettings = (): void => {
    onCloseMenu();
    onOpenSettings();
  };

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
};

const DisconnectButton = ({
  label,
  onDisconnect,
}: DisconnectButtonProps): ReactElement => (
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

const WalletSectionFooter = ({
  onOpenWalletManager,
  onOpenSettings,
  onCloseMenu,
  onDisconnect,
  disconnectLabel,
}: WalletSectionFooterProps): ReactElement => (
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

export const WalletMenuButton = ({
  isConnected,
  isConnecting,
  isMenuOpen,
  accountAddress,
  hasMultipleWallets,
  connectedWalletCount,
  onConnectClick,
  onToggleMenu,
}: WalletMenuButtonProps): ReactElement => {
  const showConnectedAddress = isConnected && Boolean(accountAddress);

  const handleButtonClick = (): void => {
    if (!isConnected) {
      void onConnectClick();
      return;
    }

    onToggleMenu();
  };

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
};

const WalletSingleWalletSection = ({
  accountAddress,
  copiedAddress,
  onCopyAddress,
  onOpenWalletManager,
  onOpenSettings,
  onCloseMenu,
  onDisconnect,
}: WalletSingleWalletSectionProps): ReactElement => (
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

const WalletMultipleWalletSection = ({
  connectedWallets,
  copiedAddress,
  onCopyAddress,
  onOpenWalletManager,
  onOpenSettings,
  onCloseMenu,
  onDisconnect,
}: WalletMultipleWalletSectionProps): ReactElement => (
  <div className="py-2">
    <div className="px-4 py-2 border-b border-gray-800">
      <div className="text-xs text-gray-400 uppercase tracking-wide mb-3">
        Connected Wallets
      </div>
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {connectedWallets.map(walletItem => (
          <div
            key={walletItem.address}
            className={getWalletItemClassName(walletItem.isActive)}
          >
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <div
                  className={getWalletStatusDotClassName(walletItem.isActive)}
                />
                <span className="font-mono text-sm text-white">
                  {formatAddress(walletItem.address)}
                </span>
              </div>
              <CopyAddressButton
                address={walletItem.address}
                copiedAddress={copiedAddress}
                onCopyAddress={onCopyAddress}
                variant="icon-only"
              />
            </div>
            {walletItem.isActive && (
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

export const WalletMenuDropdown = ({
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
}: WalletMenuDropdownProps): ReactElement | null => {
  if (!isConnected || !isMenuOpen) {
    return null;
  }

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
      {Boolean(accountAddress) && !hasMultipleWallets && accountAddress && (
        <WalletSingleWalletSection
          accountAddress={accountAddress}
          {...sharedSectionProps}
        />
      )}

      {hasMultipleWallets && (
        <WalletMultipleWalletSection
          connectedWallets={connectedWallets}
          {...sharedSectionProps}
        />
      )}
    </motion.div>
  );
};
