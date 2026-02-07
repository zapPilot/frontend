"use client";

import { motion } from "framer-motion";
import {
  Check,
  Loader2,
  Mail,
  MessageCircle,
  Plus,
  Settings,
  Trash2,
  X,
} from "lucide-react";
import { useState } from "react";

import { Spinner } from "@/components/ui/LoadingSystem";
import { cn } from "@/lib/ui/classNames";

import {
  useTelegramConnect,
  useTelegramDisconnect,
  useTelegramStatus,
} from "../../hooks/useTelegramConnection";

interface NotificationChannelsProps {
  userId?: string;
  emailSubscriptionProps: {
    email: string;
    subscribedEmail: string | null;
    isEditingSubscription: boolean;
    subscriptionOperation: {
      isLoading: boolean;
      error: Error | null;
    };
    onEmailChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onSubscribe: (e: React.FormEvent) => void;
    onUnsubscribe: () => void;
    onStartEditing: () => void;
    onCancelEditing: () => void;
  };
}

interface ChannelStatus {
  id: "telegram" | "email";
  name: string;
  icon: typeof MessageCircle;
  isConnected: boolean;
  identifier?: string | undefined; // @username or email
  color: string;
  bgColor: string;
  borderColor: string;
}

export function NotificationChannels({
  userId,
  emailSubscriptionProps,
}: NotificationChannelsProps) {
  const [isTelegramPolling, setIsTelegramPolling] = useState(false);

  // Telegram Hooks
  const { data: tgStatus, isLoading: isLoadingTg } = useTelegramStatus(userId, {
    polling: isTelegramPolling,
    pollingInterval: 3000,
  });

  const { mutate: connectTg, isPending: isConnectingTg } = useTelegramConnect();
  const { mutate: disconnectTg, isPending: isDisconnectingTg } =
    useTelegramDisconnect();

  // Stop polling when connected
  if (tgStatus?.isConnected && isTelegramPolling) {
    setIsTelegramPolling(false);
  }

  const handleConnectTelegram = () => {
    if (!userId) return;
    connectTg(userId, {
      onSuccess: ({ deepLink }: { deepLink: string }) => {
        window.open(deepLink, "_blank", "noopener,noreferrer");
        setIsTelegramPolling(true);
      },
    });
  };

  const handleDisconnectTelegram = () => {
    if (!userId) return;
    disconnectTg(userId);
  };

  const channels: ChannelStatus[] = [
    {
      id: "telegram",
      name: "Telegram",
      icon: MessageCircle,
      isConnected: tgStatus?.isConnected ?? false,
      identifier: tgStatus?.username ? `@${tgStatus.username}` : undefined,
      color: "text-blue-400",
      bgColor: "bg-blue-500/10",
      borderColor: "border-blue-500/20",
    },
    {
      id: "email",
      name: "Email",
      icon: Mail,
      isConnected: !!emailSubscriptionProps.subscribedEmail,
      identifier: emailSubscriptionProps.subscribedEmail ?? undefined,
      color: "text-purple-400",
      bgColor: "bg-purple-500/10",
      borderColor: "border-purple-500/20",
    },
  ];

  if (isLoadingTg) {
    return (
      <div className="bg-gray-900/40 backdrop-blur-sm border border-gray-800 rounded-2xl p-8 flex items-center justify-center">
        <Spinner size="md" color="primary" />
      </div>
    );
  }

  return (
    <div className="bg-gray-900/40 backdrop-blur-sm border border-gray-800 rounded-2xl p-8 flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Settings className="w-4 h-4 text-gray-400" />
          <span className="text-xs text-gray-500 font-bold uppercase tracking-widest">
            Notification Channels
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-3 flex-1">
        {channels.map(channel => (
          <div
            key={channel.id}
            className="group relative flex flex-col gap-3 p-3 rounded-xl border bg-gray-900/40 border-gray-800 hover:border-gray-700 transition-all"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div
                  className={cn(
                    "flex items-center justify-center w-10 h-10 rounded-lg border",
                    channel.bgColor,
                    channel.borderColor
                  )}
                >
                  <channel.icon className={cn("w-5 h-5", channel.color)} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-white">
                      {channel.name}
                    </span>
                    {channel.isConnected && (
                      <span className="flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 font-medium uppercase tracking-wide">
                        <Check className="w-3 h-3" /> Active
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">
                    {channel.isConnected
                      ? channel.identifier || "Connected"
                      : "Not connected"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {channel.isConnected ? (
                  <button
                    onClick={
                      channel.id === "telegram"
                        ? handleDisconnectTelegram
                        : emailSubscriptionProps.onUnsubscribe
                    }
                    disabled={
                      channel.id === "telegram"
                        ? isDisconnectingTg
                        : emailSubscriptionProps.subscriptionOperation.isLoading
                    }
                    className="p-2 rounded-lg text-gray-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                    title="Disconnect"
                  >
                    {(
                      channel.id === "telegram"
                        ? isDisconnectingTg
                        : emailSubscriptionProps.subscriptionOperation.isLoading
                    ) ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                ) : (
                  <button
                    onClick={
                      channel.id === "telegram"
                        ? handleConnectTelegram
                        : emailSubscriptionProps.onStartEditing
                    }
                    disabled={
                      channel.id === "telegram"
                        ? isConnectingTg || isTelegramPolling
                        : emailSubscriptionProps.isEditingSubscription
                    }
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide border transition-all",
                      "bg-white/5 text-white border-white/10 hover:bg-white/10 hover:border-white/20"
                    )}
                  >
                    {channel.id === "telegram" &&
                    (isConnectingTg || isTelegramPolling) ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Plus className="w-3 h-3" />
                    )}
                    {channel.id === "telegram" && isTelegramPolling
                      ? "Connecting..."
                      : "Connect"}
                  </button>
                )}
              </div>
            </div>

            {/* Email Edit Form */}
            {channel.id === "email" &&
              emailSubscriptionProps.isEditingSubscription &&
              !channel.isConnected && (
                <motion.form
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  onSubmit={e => {
                    e.preventDefault();
                    emailSubscriptionProps.onSubscribe(e);
                  }}
                  className="flex gap-2 mt-2"
                >
                  <input
                    type="email"
                    placeholder="Enter your email"
                    value={emailSubscriptionProps.email}
                    onChange={emailSubscriptionProps.onEmailChange}
                    className="flex-1 bg-gray-950/50 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50"
                    autoFocus
                  />
                  <button
                    type="submit"
                    disabled={
                      !emailSubscriptionProps.email ||
                      emailSubscriptionProps.subscriptionOperation.isLoading
                    }
                    className="px-3 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {emailSubscriptionProps.subscriptionOperation.isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      "Save"
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={emailSubscriptionProps.onCancelEditing}
                    className="p-2 text-gray-500 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </motion.form>
              )}
          </div>
        ))}
      </div>
    </div>
  );
}
