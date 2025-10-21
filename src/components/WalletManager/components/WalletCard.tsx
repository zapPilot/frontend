import { memo } from "react";
import { motion } from "framer-motion";
import { LoadingSpinner } from "@/components/ui";
import { formatAddress } from "@/lib/formatters";
import { WalletActionMenu } from "./WalletActionMenu";
import type { WalletData } from "@/services/userService";
import type { WalletOperations } from "../types/wallet.types";
import { fadeInUp, SMOOTH_TRANSITION } from "@/lib/animationVariants";

interface WalletCardProps {
  wallet: WalletData;
  operations: WalletOperations;
  isOwner: boolean;
  onCopyAddress: (address: string, walletId: string) => void;
  onEditWallet: (walletId: string, label: string) => void;
  onDeleteWallet: (walletId: string) => void;
  openDropdown: string | null;
  menuPosition: { top: number; left: number } | null;
  onToggleDropdown: (walletId: string, element: HTMLElement) => void;
  onCloseDropdown: () => void;
}

export const WalletCard = memo(
  ({
    wallet,
    operations,
    isOwner,
    onCopyAddress,
    onEditWallet,
    onDeleteWallet,
    openDropdown,
    menuPosition,
    onToggleDropdown,
    onCloseDropdown,
  }: WalletCardProps) => {
    return (
      <motion.div
        key={wallet.id}
        layout
        {...fadeInUp}
        transition={SMOOTH_TRANSITION}
        className="p-4 rounded-xl border transition-all duration-200 glass-morphism border-gray-700 hover:border-gray-600"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-medium text-white truncate">
                {wallet.label}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <code className="font-mono text-xs sm:text-sm truncate">
                {formatAddress(wallet.address)}
              </code>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {operations.editing[wallet.id]?.isLoading && (
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <LoadingSpinner size="sm" />
                <span className="hidden sm:inline">Updating...</span>
              </div>
            )}
            {operations.removing[wallet.id]?.isLoading && (
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <LoadingSpinner size="sm" />
                <span className="hidden sm:inline">Removing...</span>
              </div>
            )}
            <WalletActionMenu
              wallet={wallet}
              isOpen={openDropdown === wallet.id}
              menuPosition={menuPosition}
              operations={operations}
              isOwner={isOwner}
              onCopyAddress={onCopyAddress}
              onEditWallet={onEditWallet}
              onDeleteWallet={onDeleteWallet}
              onToggleDropdown={onToggleDropdown}
              onCloseDropdown={onCloseDropdown}
            />
          </div>
        </div>

        {/* Show operation errors */}
        {(operations.removing[wallet.id]?.error ||
          operations.editing[wallet.id]?.error) && (
          <div className="mt-3 p-2 bg-red-600/10 border border-red-600/20 rounded-lg">
            <p className="text-xs text-red-300">
              {operations.removing[wallet.id]?.error ||
                operations.editing[wallet.id]?.error}
            </p>
          </div>
        )}
      </motion.div>
    );
  }
);

WalletCard.displayName = "WalletCard";
