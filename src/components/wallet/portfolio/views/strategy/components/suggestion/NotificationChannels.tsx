import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Mail, Send } from "lucide-react";
import { useState } from "react";

import { GradientButton, LoadingSpinner } from "@/components/ui";
import type { OperationState } from "@/components/WalletManager/types/wallet.types";

interface NotificationChannelsProps {
  userId?: string;
  emailSubscriptionProps: {
    email: string;
    subscribedEmail: string | null;
    isEditingSubscription: boolean;
    subscriptionOperation: OperationState;
    onEmailChange: (email: string) => void;
    onSubscribe: () => void;
    onUnsubscribe: () => void;
    onStartEditing: () => void;
    onCancelEditing: () => void;
  };
}

export function NotificationChannels({
  emailSubscriptionProps,
}: NotificationChannelsProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="bg-gray-900/40 backdrop-blur-sm border border-gray-800 rounded-2xl p-6">
      <div
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div>
          <h3 className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-1">
            Notification Channels
          </h3>
          <p className="text-sm text-gray-400">
            Get strategy updates via your preferred channels
          </p>
        </div>
        <div
          className={`p-2 rounded-full bg-gray-800 text-gray-400 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
        >
          <ChevronDown className="w-5 h-5" />
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="pt-6 space-y-4">
              {/* Telegram Channel */}
              <div className="flex items-center justify-between p-4 bg-gray-800/30 rounded-xl border border-gray-700/50">
                <div className="flex items-center gap-4">
                  <div className="p-2.5 bg-[#229ED9]/10 rounded-lg">
                    <Send className="w-5 h-5 text-[#229ED9]" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Telegram</h4>
                    <p className="text-xs text-gray-400">
                      Receive instant trade alerts
                    </p>
                  </div>
                </div>
                <a
                  href="https://t.me/AllWeatherProtocolBot"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 text-xs font-bold text-white bg-[#229ED9] hover:bg-[#229ED9]/90 rounded-lg transition-colors"
                >
                  Connect
                </a>
              </div>

              {/* Email Channel */}
              <div className="p-4 bg-gray-800/30 rounded-xl border border-gray-700/50">
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-2.5 bg-purple-500/10 rounded-lg">
                    <Mail className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">
                      Email Reports
                    </h4>
                    <p className="text-xs text-gray-400">
                      Weekly PnL and strategy summaries
                    </p>
                  </div>
                </div>

                {/* Email Form Logic integrated inline */}
                {emailSubscriptionProps.subscribedEmail &&
                !emailSubscriptionProps.isEditingSubscription ? (
                  <div className="flex items-center justify-between pl-14">
                    <p className="text-xs text-gray-300">
                      Subscribed as{" "}
                      <span className="text-white font-medium">
                        {emailSubscriptionProps.subscribedEmail}
                      </span>
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={emailSubscriptionProps.onStartEditing}
                        className="px-3 py-1.5 text-xs text-gray-400 hover:text-white transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={emailSubscriptionProps.onUnsubscribe}
                        className="px-3 py-1.5 text-xs text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-lg transition-colors"
                      >
                        Unsubscribe
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="pl-14">
                    <div className="flex gap-2">
                      <input
                        type="email"
                        placeholder="Enter your email"
                        value={emailSubscriptionProps.email}
                        onChange={e =>
                          emailSubscriptionProps.onEmailChange(e.target.value)
                        }
                        className="flex-1 bg-gray-900/50 text-sm text-white px-3 py-2 rounded-lg border border-gray-700 focus:border-purple-500 outline-none transition-colors"
                      />
                      <GradientButton
                        onClick={emailSubscriptionProps.onSubscribe}
                        disabled={
                          emailSubscriptionProps.subscriptionOperation.isLoading
                        }
                        className="px-4 py-2 text-xs whitespace-nowrap"
                        gradient="from-purple-600 to-blue-600"
                      >
                        {emailSubscriptionProps.subscriptionOperation
                          .isLoading ? (
                          <LoadingSpinner size="sm" color="white" />
                        ) : emailSubscriptionProps.subscribedEmail ? (
                          "Save"
                        ) : (
                          "Subscribe"
                        )}
                      </GradientButton>
                      {emailSubscriptionProps.subscribedEmail && (
                        <button
                          onClick={emailSubscriptionProps.onCancelEditing}
                          className="px-3 py-2 text-xs text-gray-400 hover:text-white transition-colors"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                    {emailSubscriptionProps.subscriptionOperation.error && (
                      <p className="mt-2 text-xs text-red-400">
                        {emailSubscriptionProps.subscriptionOperation.error}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
