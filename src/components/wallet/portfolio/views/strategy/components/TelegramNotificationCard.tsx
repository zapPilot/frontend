"use client";

import { motion } from "framer-motion";
import {
  CheckCircle,
  ExternalLink,
  LinkIcon,
  Loader2,
  MessageCircle,
  Unlink,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { BaseCard } from "@/components/ui/BaseCard";
import { Spinner } from "@/components/ui/LoadingSystem";

import {
  useTelegramConnect,
  useTelegramDisconnect,
  useTelegramStatus,
} from "../hooks/useTelegramConnection";

interface TelegramNotificationCardProps {
  userId: string | undefined;
}

/**
 * TelegramNotificationCard - Manages Telegram notification connection
 *
 * Displays connection status and allows users to connect/disconnect
 * their Telegram account for receiving portfolio notifications.
 *
 * Connection flow:
 * 1. User clicks "Connect Telegram"
 * 2. Token is requested from backend
 * 3. Deep link opens Telegram bot
 * 4. User sends /start with token in Telegram
 * 5. Component polls for connection status
 * 6. UI updates when connected
 */
export function TelegramNotificationCard({
  userId,
}: TelegramNotificationCardProps) {
  const [isPolling, setIsPolling] = useState(false);
  const [showDisconnectConfirm, setShowDisconnectConfirm] = useState(false);

  // Queries and mutations
  const {
    data: status,
    isLoading: isLoadingStatus,
    error: statusError,
  } = useTelegramStatus(userId, {
    polling: isPolling,
    pollingInterval: 3000,
  });

  const {
    mutate: connect,
    isPending: isConnecting,
    error: connectError,
  } = useTelegramConnect();

  const { mutate: disconnect, isPending: isDisconnecting } =
    useTelegramDisconnect();

  // Stop polling when connected
  useEffect(() => {
    if (status?.isConnected && isPolling) {
      setIsPolling(false);
    }
  }, [status?.isConnected, isPolling]);

  // Auto-stop polling after 2 minutes (token expiry)
  useEffect(() => {
    if (!isPolling) return;

    const timeout = setTimeout(
      () => {
        setIsPolling(false);
      },
      2 * 60 * 1000
    );

    return () => clearTimeout(timeout);
  }, [isPolling]);

  const handleConnect = useCallback(() => {
    if (!userId) return;

    connect(userId, {
      onSuccess: ({ deepLink }) => {
        // Open Telegram in new tab
        window.open(deepLink, "_blank", "noopener,noreferrer");
        // Start polling for connection status
        setIsPolling(true);
      },
    });
  }, [userId, connect]);

  const handleDisconnect = useCallback(() => {
    if (!userId) return;

    disconnect(userId, {
      onSuccess: () => {
        setShowDisconnectConfirm(false);
      },
    });
  }, [userId, disconnect]);

  // Don't render if no userId
  if (!userId) {
    return null;
  }

  // Loading state
  if (isLoadingStatus) {
    return (
      <BaseCard variant="glass" className="p-6">
        <div className="flex items-center justify-center py-4">
          <Spinner size="md" color="primary" />
        </div>
      </BaseCard>
    );
  }

  // Error state
  if (statusError) {
    return (
      <BaseCard variant="glass" className="p-6">
        <div className="flex items-center gap-3 text-red-400">
          <MessageCircle className="w-5 h-5" />
          <span className="text-sm">Failed to load Telegram status</span>
        </div>
      </BaseCard>
    );
  }

  const isConnected = status?.isConnected ?? false;

  return (
    <BaseCard variant="glass" className="p-6">
      <div className="flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-500/20">
            <MessageCircle className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h3 className="font-semibold text-white">Telegram Notifications</h3>
            <p className="text-sm text-gray-400">
              Get daily strategy alerts on Telegram
            </p>
          </div>
        </div>

        {/* Status & Actions */}
        {isConnected ? (
          <ConnectedState
            username={status?.username}
            onDisconnect={() => setShowDisconnectConfirm(true)}
            isDisconnecting={isDisconnecting}
            showConfirm={showDisconnectConfirm}
            onConfirmDisconnect={handleDisconnect}
            onCancelDisconnect={() => setShowDisconnectConfirm(false)}
          />
        ) : (
          <DisconnectedState
            onConnect={handleConnect}
            isConnecting={isConnecting}
            isPolling={isPolling}
            error={connectError}
          />
        )}
      </div>
    </BaseCard>
  );
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

interface ConnectedStateProps {
  username: string | null | undefined;
  onDisconnect: () => void;
  isDisconnecting: boolean;
  showConfirm: boolean;
  onConfirmDisconnect: () => void;
  onCancelDisconnect: () => void;
}

function ConnectedState({
  username,
  onDisconnect,
  isDisconnecting,
  showConfirm,
  onConfirmDisconnect,
  onCancelDisconnect,
}: ConnectedStateProps) {
  return (
    <div className="space-y-3">
      {/* Connected badge */}
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-500/10 border border-green-500/20">
        <CheckCircle className="w-4 h-4 text-green-400" />
        <span className="text-sm text-green-400">
          Connected{username ? ` as @${username}` : ""}
        </span>
      </div>

      {/* Disconnect section */}
      {showConfirm ? (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="flex flex-col gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20"
        >
          <p className="text-sm text-gray-300">
            Stop receiving Telegram notifications?
          </p>
          <div className="flex gap-2">
            <button
              onClick={onConfirmDisconnect}
              disabled={isDisconnecting}
              className="flex-1 px-3 py-2 text-sm font-medium text-white bg-red-500/20 hover:bg-red-500/30 rounded-lg transition-colors disabled:opacity-50"
            >
              {isDisconnecting ? (
                <Loader2 className="w-4 h-4 animate-spin mx-auto" />
              ) : (
                "Yes, disconnect"
              )}
            </button>
            <button
              onClick={onCancelDisconnect}
              disabled={isDisconnecting}
              className="flex-1 px-3 py-2 text-sm font-medium text-gray-400 hover:text-white bg-gray-800/50 hover:bg-gray-800 rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </motion.div>
      ) : (
        <button
          onClick={onDisconnect}
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-red-400 transition-colors"
        >
          <Unlink className="w-4 h-4" />
          <span>Disconnect</span>
        </button>
      )}
    </div>
  );
}

interface DisconnectedStateProps {
  onConnect: () => void;
  isConnecting: boolean;
  isPolling: boolean;
  error: Error | null;
}

function DisconnectedState({
  onConnect,
  isConnecting,
  isPolling,
  error,
}: DisconnectedStateProps) {
  const isWaiting = isConnecting || isPolling;

  return (
    <div className="space-y-3">
      {/* Error message */}
      {error && (
        <div className="px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20">
          <p className="text-sm text-red-400">{error.message}</p>
        </div>
      )}

      {/* Waiting state */}
      {isPolling && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-500/10 border border-blue-500/20"
        >
          <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
          <span className="text-sm text-blue-400">
            Waiting for Telegram connection...
          </span>
        </motion.div>
      )}

      {/* Connect button */}
      <motion.button
        whileHover={isWaiting ? {} : { scale: 1.02 }}
        whileTap={isWaiting ? {} : { scale: 0.98 }}
        onClick={onConnect}
        disabled={isWaiting}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium text-white bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isConnecting ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Requesting token...</span>
          </>
        ) : isPolling ? (
          <>
            <ExternalLink className="w-5 h-5" />
            <span>Complete setup in Telegram</span>
          </>
        ) : (
          <>
            <LinkIcon className="w-5 h-5" />
            <span>Connect Telegram</span>
          </>
        )}
      </motion.button>

      {/* Helper text */}
      {!isWaiting && (
        <p className="text-xs text-gray-500 text-center">
          Opens Telegram to complete connection
        </p>
      )}
    </div>
  );
}
