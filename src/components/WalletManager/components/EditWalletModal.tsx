import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import { Z_INDEX } from "@/constants/design-system";
import { GlassCard, GradientButton, LoadingSpinner } from "@/components/ui";
import { formatAddress } from "@/lib/formatters";
import type { EditingWallet, WalletOperations } from "../types/wallet.types";
import type { WalletData } from "@/services/userService";

interface EditWalletModalProps {
  editingWallet: EditingWallet | null;
  wallets: WalletData[];
  operations: WalletOperations;
  onSave: (walletId: string, newLabel: string) => void;
  onClose: () => void;
}

export const EditWalletModal = ({
  editingWallet,
  wallets,
  operations,
  onSave,
  onClose,
}: EditWalletModalProps) => {
  const [newLabel, setNewLabel] = useState("");

  // Update newLabel when editingWallet changes
  useEffect(() => {
    if (editingWallet) {
      setNewLabel(editingWallet.label);
    }
  }, [editingWallet]);

  if (!editingWallet) return null;

  const handleSave = () => {
    onSave(editingWallet.id, newLabel);
  };

  const handleClose = () => {
    onClose();
    setNewLabel("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSave();
    if (e.key === "Escape") handleClose();
  };

  const wallet = wallets.find(w => w.id === editingWallet.id);
  const isLoading = operations.editing[editingWallet.id]?.isLoading;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={`fixed inset-0 ${Z_INDEX.MODAL} bg-gray-950/80 backdrop-blur-lg flex items-center justify-center p-4`}
      onClick={handleClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="w-full max-w-md"
        onClick={e => e.stopPropagation()}
      >
        <GlassCard className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-white">Edit Wallet Label</h3>
            <button
              onClick={handleClose}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
          </div>

          <p className="text-sm text-gray-400 mb-4">
            Update the display name for{" "}
            {wallet ? formatAddress(wallet.address) : ""}
          </p>

          <div className="space-y-4">
            <input
              type="text"
              value={newLabel}
              onChange={e => setNewLabel(e.target.value)}
              placeholder="Enter wallet label"
              className="w-full bg-gray-800/50 text-white px-3 py-2 rounded-lg border border-gray-600 focus:border-purple-500 outline-none"
              autoFocus
              onKeyDown={handleKeyDown}
            />

            <div className="flex gap-3">
              <GradientButton
                onClick={handleSave}
                gradient="from-green-600 to-emerald-600"
                className="flex-1"
                disabled={!newLabel.trim() || Boolean(isLoading)}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <LoadingSpinner size="sm" color="white" />
                    <span>Saving...</span>
                  </div>
                ) : (
                  "Save Changes"
                )}
              </GradientButton>
              <button
                onClick={handleClose}
                className="px-4 py-2 glass-morphism rounded-lg hover:bg-white/10 transition-colors text-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </GlassCard>
      </motion.div>
    </motion.div>
  );
};
