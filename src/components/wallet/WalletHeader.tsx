import {
  Calendar,
  Check,
  DollarSign,
  Eye,
  EyeOff,
  Wallet,
} from "lucide-react";
import React, { useEffect, useState } from "react";

import { GRADIENTS } from "../../constants/design-system";
import { useBalanceVisibility } from "../../contexts/BalanceVisibilityContext";
import { useResolvedBalanceVisibility } from "../../hooks/useResolvedBalanceVisibility";
import { useToast } from "../../hooks/useToast";
import { CalendarConnectModal } from "./CalendarConnectModal";

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
    const { toggleBalanceVisibility } = useBalanceVisibility();
    const resolvedHidden = useResolvedBalanceVisibility(balanceHidden);
    const handleToggle = onToggleBalance ?? toggleBalanceVisibility;

    const { showToast } = useToast();

    // Calendar connection functionality
    const [isCalendarConnected, setIsCalendarConnected] = useState(() => {
      // Check localStorage on mount
      if (typeof window !== 'undefined') {
        return localStorage.getItem("zap-pilot-calendar-connected") === "true";
      }
      return false;
    });
    const [isConnectingCalendar, setIsConnectingCalendar] = useState(false);
    const [showCalendarModal, setShowCalendarModal] = useState(false);

    const handleConnectCalendar = async () => {
      setIsConnectingCalendar(true);
      // Simulate API call
      setTimeout(() => {
        setIsConnectingCalendar(false);
        setIsCalendarConnected(true);
        setShowCalendarModal(false);

        // Persist connection state
        localStorage.setItem("zap-pilot-calendar-connected", "true");

        showToast({
          title: "Calendar Connected",
          message: "Your Google Calendar has been successfully connected.",
          type: "success",
        });
      }, 1500);
    };

    // Event listener for calendar modal open events from post-ZapIn prompt
    useEffect(() => {
      const handleOpenModal = () => {
        if (!isCalendarConnected) {
          setShowCalendarModal(true);
        }
      };

      window.addEventListener('open-calendar-modal', handleOpenModal);
      return () => window.removeEventListener('open-calendar-modal', handleOpenModal);
    }, [isCalendarConnected]);

    return (
      <>
        <CalendarConnectModal
          isOpen={showCalendarModal}
          onClose={() => setShowCalendarModal(false)}
          onConnect={() => void handleConnectCalendar()}
          isConnecting={isConnectingCalendar}
        />
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div
              className={`w-12 h-12 rounded-2xl bg-gradient-to-r ${GRADIENTS.PRIMARY} flex items-center justify-center`}
            >
              <DollarSign className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">
                {isOwnBundle
                  ? "My Portfolio"
                  : `${bundleUserName || "User"}'s Portfolio`}
              </h1>
              {!isOwnBundle && (
                <p className="text-sm text-gray-400">Viewing public bundle</p>
              )}
            </div>
          </div>

          <div className="flex space-x-2">
            {/* Calendar Connect Button */}
            {isOwnBundle && (
              <button
                onClick={() => {
                  if (!isCalendarConnected) {
                    setShowCalendarModal(true);
                  }
                }}
                disabled={isConnectingCalendar || isCalendarConnected}
                className={`relative p-3 rounded-xl transition-all duration-300 cursor-pointer ${
                  isCalendarConnected
                    ? "bg-green-500/20 hover:bg-green-500/30 border border-green-500/50"
                    : "bg-gradient-to-r from-blue-500/20 to-purple-500/20 border-2 border-blue-500/50 shadow-lg shadow-blue-500/20 hover:scale-105 animate-pulse"
                }`}
                title={
                  isCalendarConnected
                    ? "Calendar Connected"
                    : "Connect Google Calendar - Never miss opportunities!"
                }
              >
                {/* NEW badge - only when not connected */}
                {!isCalendarConnected && !isConnectingCalendar && (
                  <span className="absolute -top-1 -right-1 px-1.5 py-0.5 text-[10px] font-bold bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full border border-white/20">
                    NEW
                  </span>
                )}

                {isConnectingCalendar ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : isCalendarConnected ? (
                  <Check className="w-5 h-5 text-green-400" />
                ) : (
                  <Calendar className="w-5 h-5 text-blue-400" />
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
      </>
    );
  }
);

WalletHeader.displayName = "WalletHeader";
