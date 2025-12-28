"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check, Copy, LogOut, Plus, Settings, Wallet } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useConnectModal } from "thirdweb/react";

import { ConnectWalletButton } from "@/components/WalletManager/components/ConnectWalletButton";
import { DEFAULT_SUPPORTED_CHAINS, DEFAULT_WALLETS } from "@/config/wallets";
import { WALLET_LABELS } from "@/constants/wallet";
import { dropdownMenu } from "@/lib/ui/animationVariants";
import { useWalletProvider } from "@/providers/WalletProvider";
import { formatAddress } from "@/utils/formatters";
import THIRDWEB_CLIENT from "@/utils/thirdweb";

interface WalletMenuProps {
  onOpenWalletManager?: () => void;
  onOpenSettings: () => void;
}

/**
 * Unified Wallet Menu
 * Single entry point for ALL wallet operations that adapts to user state.
 */
export function WalletMenu({
  onOpenWalletManager,
  onOpenSettings,
}: WalletMenuProps) {
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
  const handleConnectClick = async () => {
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

  // Click outside and Escape key handler
  useEffect(() => {
    if (!isMenuOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isMenuOpen]);

  const handleCopyAddress = async (address: string) => {
    await navigator.clipboard.writeText(address);
    setCopiedAddress(address);
    setTimeout(() => setCopiedAddress(null), 2000);
  };

  const handleDisconnect = async () => {
    await disconnect();
    setIsMenuOpen(false);
  };

  // Helper components to eliminate code duplication
  const MenuItems = () => (
    <>
      {onOpenWalletManager && (
        <button
          onClick={() => {
            setIsMenuOpen(false);
            onOpenWalletManager();
          }}
          className="w-full px-4 py-2.5 text-left text-sm text-gray-200 hover:bg-purple-500/10 hover:text-white transition-colors flex items-center gap-3"
        >
          <Wallet className="w-4 h-4 text-purple-400" />
          View Bundles
        </button>
      )}
      <button
        onClick={() => {
          setIsMenuOpen(false);
          onOpenSettings();
        }}
        className="w-full px-4 py-2.5 text-left text-sm text-gray-200 hover:bg-purple-500/10 hover:text-white transition-colors flex items-center gap-3"
      >
        <Settings className="w-4 h-4 text-purple-400" />
        Settings
      </button>
    </>
  );

  const DisconnectButton = ({ label }: { label: string }) => (
    <div className="border-t border-gray-800 py-1">
      <button
        onClick={handleDisconnect}
        className="w-full px-4 py-2.5 text-left text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors flex items-center gap-3"
      >
        <LogOut className="w-4 h-4" />
        {label}
      </button>
    </div>
  );

  return (
    <div className="relative" ref={menuRef}>
      {/* Unified Menu Button */}
      <button
        data-testid="unified-wallet-menu-button"
        onClick={
          !isConnected ? handleConnectClick : () => setIsMenuOpen(!isMenuOpen)
        }
        disabled={isConnecting}
        className={`h-10 px-2 md:px-4 bg-gray-800/50 hover:bg-gray-800 border border-purple-500/20 hover:border-purple-500/40 rounded-lg transition-all duration-200 flex items-center gap-2 text-sm font-medium text-gray-200 hover:text-white ${isConnecting ? "opacity-50 cursor-wait" : ""}`}
        aria-expanded={isMenuOpen}
        aria-haspopup="menu"
      >
        <Wallet className="w-4 h-4 text-purple-400" />
        {!isConnected && (
          <span className="hidden sm:inline">{WALLET_LABELS.CONNECT}</span>
        )}
        {isConnected && account?.address && (
          <>
            <span className="font-mono hidden sm:inline">
              {formatAddress(account.address)}
            </span>
            {hasMultipleWallets && (
              <span className="ml-1 px-1.5 py-0.5 bg-purple-500/20 text-purple-300 rounded text-xs font-bold hidden sm:inline">
                {connectedWallets.length}
              </span>
            )}
          </>
        )}
        <svg
          className={`w-4 h-4 transition-transform duration-200 ${isMenuOpen ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isConnected && isMenuOpen && (
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
            {/* Connected State - Single Wallet */}
            {isConnected && account?.address && !hasMultipleWallets && (
              <div className="py-2">
                {/* Address & Copy */}
                <div className="px-4 py-3 border-b border-gray-800">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-400 uppercase tracking-wide">
                      Connected Wallet
                    </span>
                    <button
                      onClick={() => handleCopyAddress(account.address)}
                      className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1 transition-colors"
                    >
                      {copiedAddress === account.address ? (
                        <>
                          <Check className="w-3 h-3" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          Copy
                        </>
                      )}
                    </button>
                  </div>
                  <div className="font-mono text-sm text-white">
                    {formatAddress(account.address)}
                  </div>
                </div>

                {/* Menu Items */}
                <div className="py-1">
                  <MenuItems />
                </div>

                {/* Disconnect */}
                <DisconnectButton label="Disconnect" />
              </div>
            )}

            {/* Connected State - Multiple Wallets */}
            {isConnected && hasMultipleWallets && (
              <div className="py-2">
                {/* Wallet List */}
                <div className="px-4 py-2 border-b border-gray-800">
                  <div className="text-xs text-gray-400 uppercase tracking-wide mb-3">
                    Connected Wallets
                  </div>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {connectedWallets.map(wallet => (
                      <div
                        key={wallet.address}
                        className={`p-3 rounded-lg border transition-all ${
                          wallet.isActive
                            ? "bg-purple-500/10 border-purple-500/30"
                            : "bg-gray-800/30 border-gray-700/50 hover:border-gray-600"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <div
                              className={`w-2 h-2 rounded-full ${wallet.isActive ? "bg-purple-400 animate-pulse" : "bg-gray-600"}`}
                            />
                            <span className="font-mono text-sm text-white">
                              {formatAddress(wallet.address)}
                            </span>
                          </div>
                          <button
                            onClick={() => handleCopyAddress(wallet.address)}
                            className="text-xs text-gray-400 hover:text-purple-300 transition-colors"
                          >
                            {copiedAddress === wallet.address ? (
                              <Check className="w-3 h-3" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
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

                {/* Add Wallet */}
                <div className="px-4 py-3 border-b border-gray-800">
                  <div className="flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    <ConnectWalletButton className="flex-1 text-sm" />
                  </div>
                </div>

                {/* Menu Items */}
                <div className="py-1">
                  <MenuItems />
                </div>

                {/* Disconnect All */}
                <DisconnectButton label="Disconnect All" />
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
