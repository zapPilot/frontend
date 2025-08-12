import { BarChart3, DollarSign, Eye, EyeOff, Wallet } from "lucide-react";
import React from "react";
import { GRADIENTS } from "../../styles/design-tokens";

interface WalletHeaderProps {
  onAnalyticsClick?: () => void;
  onWalletManagerClick: () => void;
  onToggleBalance: () => void;
  balanceHidden: boolean;
}

export const WalletHeader = React.memo<WalletHeaderProps>(
  ({
    onAnalyticsClick,
    onWalletManagerClick,
    onToggleBalance,
    balanceHidden,
  }) => {
    return (
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div
            className={`w-12 h-12 rounded-2xl bg-gradient-to-r ${GRADIENTS.PRIMARY} flex items-center justify-center`}
          >
            <DollarSign className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">My Wallet</h1>
            <p className="text-sm text-gray-400">DeFi Portfolio Overview</p>
          </div>
        </div>

        <div className="flex space-x-2">
          {onAnalyticsClick && (
            <button
              onClick={onAnalyticsClick}
              className="p-3 rounded-xl glass-morphism hover:bg-white/10 transition-all duration-300 cursor-pointer"
              title="View Analytics"
            >
              <BarChart3 className="w-5 h-5 text-gray-300" />
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
            onClick={onToggleBalance}
            className="p-3 rounded-xl glass-morphism hover:bg-white/10 transition-all duration-300 cursor-pointer"
            title={balanceHidden ? "Show Balance" : "Hide Balance"}
          >
            {balanceHidden ? (
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
