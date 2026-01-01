import { Plus, Wallet } from "lucide-react";

import { GradientButton } from "@/components/ui";
import { GRADIENTS } from "@/constants/design-system";
import type { WalletData } from "@/lib/validation/walletUtils";

import { useWalletList } from "../contexts/WalletListContext";
import type { NewWallet } from "../types/wallet.types";
import { AddWalletForm } from "./AddWalletForm";
import { WalletCard } from "./WalletCard";

/**
 * Props for WalletList component (reduced from 17 to 9)
 * Operation handlers provided via WalletListContext
 */
interface WalletListProps {
  wallets: WalletData[];
  isOwner: boolean;
  isAdding: boolean;
  newWallet: NewWallet;
  validationError: string | null;
  onWalletChange: (wallet: Partial<NewWallet>) => void;
  onAddWallet: () => void;
  onStartAdding: () => void;
  onCancelAdding: () => void;
}

export const WalletList = ({
  wallets,
  isOwner,
  isAdding,
  newWallet,
  validationError,
  onWalletChange,
  onAddWallet,
  onStartAdding,
  onCancelAdding,
}: WalletListProps) => {
  // Get operation handlers from context (eliminates 8 props)
  const {
    operations,
    openDropdown,
    menuPosition,
    onCopyAddress,
    onEditWallet,
    onDeleteWallet,
    onToggleDropdown,
    onCloseDropdown,
  } = useWalletList();
  if (wallets.length === 0) {
    return (
      <div className="p-6 border-b border-gray-700/50">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-gray-300">
            Bundled Wallets (0)
          </h3>
        </div>
        <div className="text-center py-8 border-2 border-dashed border-gray-600 rounded-xl">
          <Wallet className="w-8 h-8 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-300 mb-4">
            {isOwner
              ? "Add wallets to your bundle"
              : "No wallets in this bundle"}
          </p>
          {isOwner && (
            <GradientButton
              onClick={onStartAdding}
              gradient={GRADIENTS.PRIMARY}
              icon={Plus}
            >
              Add Your First Wallet
            </GradientButton>
          )}
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Wallets Display */}
      <div className="p-6 border-b border-gray-700/50">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-gray-300">
            Bundled Wallets ({wallets.length})
          </h3>
        </div>

        <div className="space-y-3">
          {wallets.map(wallet => (
            <WalletCard
              key={wallet.id}
              wallet={wallet}
              operations={operations}
              isOwner={isOwner}
              onCopyAddress={onCopyAddress}
              onEditWallet={onEditWallet}
              onDeleteWallet={onDeleteWallet}
              openDropdown={openDropdown}
              menuPosition={menuPosition}
              onToggleDropdown={onToggleDropdown}
              onCloseDropdown={onCloseDropdown}
            />
          ))}
        </div>
      </div>

      {/* Add Another Wallet Section */}
      {isOwner && (
        <div className="p-6 border-b border-gray-700/50">
          <h3 className="text-sm font-medium text-gray-300 mb-4">
            Add Another Wallet
          </h3>
          <AddWalletForm
            isAdding={isAdding}
            newWallet={newWallet}
            operations={operations}
            validationError={validationError}
            onWalletChange={onWalletChange}
            onAddWallet={onAddWallet}
            onCancel={onCancelAdding}
            onStartAdding={onStartAdding}
          />
        </div>
      )}
    </>
  );
};
