import { Calendar, Shield, TrendingUp, X } from "lucide-react";
import React from "react";

import { BaseCard, GradientButton, LoadingSpinner } from "@/components/ui";
import { ModalBackdrop } from "@/components/WalletManager/components/ModalBackdrop";

interface CalendarConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnect: () => void;
  isConnecting: boolean;
}

export const CalendarConnectModal: React.FC<CalendarConnectModalProps> = ({
  isOpen,
  onClose,
  onConnect,
  isConnecting,
}) => {
  if (!isOpen) return null;

  return (
    <ModalBackdrop onDismiss={onClose} innerClassName="w-full max-w-lg">
      <BaseCard variant="glass" className="p-0 overflow-hidden border-gray-700/50">
        {/* Header with gradient background */}
        <div className="relative bg-gradient-to-r from-blue-600/20 to-purple-600/20 p-6 border-b border-white/10">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-500/20 rounded-xl border border-blue-500/30">
              <Calendar className="w-8 h-8 text-blue-400" />
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">
            Smart Sentiment Reminders
          </h2>
          <p className="text-blue-200/80">
            Never miss a buy-the-dip opportunity again.
          </p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="mt-1">
                <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center border border-green-500/20">
                  <TrendingUp className="w-4 h-4 text-green-400" />
                </div>
              </div>
              <div>
                <h3 className="text-white font-semibold mb-1">
                  Market Timing Made Easy
                </h3>
                <p className="text-sm text-gray-400 leading-relaxed">
                  We&apos;ll automatically add a reminder to your calendar when the
                  Fear & Greed Index hits <span className="text-green-400">Extreme Fear</span> (Buy) or <span className="text-red-400">Extreme Greed</span> (Sell).
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="mt-1">
                <div className="w-8 h-8 rounded-full bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
                  <Shield className="w-4 h-4 text-purple-400" />
                </div>
              </div>
              <div>
                <h3 className="text-white font-semibold mb-1">
                  Private & Secure
                </h3>
                <p className="text-sm text-gray-400 leading-relaxed">
                  We only request permission to <strong>write events</strong>. We cannot read your personal schedule or see your other appointments.
                </p>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-white/5">
            <div className="flex gap-3">
              <GradientButton
                onClick={onConnect}
                gradient="from-blue-600 to-indigo-600"
                className="flex-1 py-3"
                disabled={isConnecting}
              >
                {isConnecting ? (
                  <div className="flex items-center justify-center gap-2">
                    <LoadingSpinner size="sm" color="white" />
                    <span>Connecting...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <img
                      src="https://www.google.com/favicon.ico"
                      alt="Google"
                      className="w-4 h-4"
                    />
                    <span>Connect Google Calendar</span>
                  </div>
                )}
              </GradientButton>
              <button
                onClick={onClose}
                disabled={isConnecting}
                className="px-6 py-3 glass-morphism rounded-xl hover:bg-white/10 transition-colors text-gray-300 font-medium"
              >
                Cancel
              </button>
            </div>
            <p className="text-xs text-center text-gray-500 mt-4">
              By connecting, you agree to receive automated calendar events based on market conditions.
            </p>
          </div>
        </div>
      </BaseCard>
    </ModalBackdrop>
  );
};
