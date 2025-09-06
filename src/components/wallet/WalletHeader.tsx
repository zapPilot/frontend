import { Check, Copy, DollarSign, Eye, EyeOff, Wallet } from "lucide-react";
import React, { useState } from "react";
import { useBalanceVisibility } from "../../contexts/BalanceVisibilityContext";
import { useToast } from "../../hooks/useToast";
import { GRADIENTS } from "../../styles/design-tokens";

interface WalletHeaderProps {
  onWalletManagerClick: () => void;
  onToggleBalance?: () => void;
  balanceHidden?: boolean;
  isOwnBundle?: boolean | undefined;
  bundleUserName?: string | undefined;
  bundleUrl?: string | undefined;
}

export const WalletHeader = React.memo<WalletHeaderProps>(
  ({
    onWalletManagerClick,
    onToggleBalance,
    balanceHidden,
    isOwnBundle = true,
    bundleUserName,
    bundleUrl,
  }) => {
    const { balanceHidden: ctxHidden, toggleBalanceVisibility } =
      useBalanceVisibility();
    const resolvedHidden = balanceHidden ?? ctxHidden;
    const handleToggle = onToggleBalance ?? toggleBalanceVisibility;
    
    // Copy link functionality
    const [copied, setCopied] = useState(false);
    const { showToast } = useToast();
    
    const handleCopyLink = async () => {
      if (!bundleUrl) return;
      
      try {
        await navigator.clipboard.writeText(bundleUrl);
        setCopied(true);
        showToast({
          title: "Link copied!",
          message: "Bundle link has been copied to clipboard",
          type: "success",
        });
        setTimeout(() => setCopied(false), 2000);
      } catch {
        showToast({
          title: "Copy failed",
          message: "Could not copy link to clipboard",
          type: "error",
        });
      }
    };
    return (
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div
            className={`w-12 h-12 rounded-2xl bg-gradient-to-r ${GRADIENTS.PRIMARY} flex items-center justify-center`}
          >
            <DollarSign className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">
              {isOwnBundle ? "My Portfolio" : `${bundleUserName || "User"}'s Portfolio`}
            </h1>
            {!isOwnBundle && (
              <p className="text-sm text-gray-400">Viewing public bundle</p>
            )}
          </div>
        </div>

        <div className="flex space-x-2">
            {bundleUrl && (
              <button
                onClick={handleCopyLink}
                className="p-3 rounded-xl glass-morphism hover:bg-white/10 transition-all duration-300 cursor-pointer"
                title="Copy bundle link"
              >
                {copied ? (
                  <Check className="w-5 h-5 text-green-400" />
                ) : (
                  <Copy className="w-5 h-5 text-gray-300" />
                )}
              </button>
            )}
          <button
            onClick={onWalletManagerClick}
            className="p-3 rounded-xl glass-morphism hover:bg-white/10 transition-all duration-300 cursor-pointer"
            title="Manage Wallets"
          >
            <Wallet className="w-5 h-5 text-gray-300" />
          </button>
          <button
            onClick={handleToggle}
            className="p-3 rounded-xl glass-morphism hover:bg-white/10 transition-all duration-300 cursor-pointer"
            title={resolvedHidden ? "Show Balance" : "Hide Balance"}
          >
            {resolvedHidden ? (
              <EyeOff className="w-5 h-5 text-gray-300" />
            ) : (
              <Eye className="w-5 h-5 text-gray-300" />
            )}
          </button>
        </div>
      </div>
    );
  }
);

WalletHeader.displayName = "WalletHeader";
