"use client";

import { AlertCircle, CheckCircle2, Loader2, Send, Unlink } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import {
  Modal,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "@/components/ui/modal";
import {
  disconnectTelegram,
  getTelegramStatus,
  requestTelegramToken,
  type TelegramStatus,
} from "@/services";

type ViewState =
  | { kind: "loading" }
  | { kind: "idle"; status: TelegramStatus }
  | { kind: "connecting"; deepLink: string }
  | { kind: "error"; message: string };

const POLL_INTERVAL_MS = 3_000;
const MAX_POLL_DURATION_MS = 120_000;

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId?: string | undefined;
}

export function SettingsModal({ isOpen, onClose, userId }: SettingsModalProps) {
  const [view, setView] = useState<ViewState>({ kind: "loading" });
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollStartRef = useRef<number>(0);

  const stopPolling = useCallback(() => {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  }, []);

  const fetchStatus = useCallback(async () => {
    if (!userId) return;
    try {
      const status = await getTelegramStatus(userId);
      setView({ kind: "idle", status });
      return status;
    } catch {
      setView({ kind: "error", message: "Failed to load Telegram status." });
      return null;
    }
  }, [userId]);

  useEffect(() => {
    if (isOpen && userId) {
      setView({ kind: "loading" });
      void fetchStatus();
    }
    return stopPolling;
  }, [isOpen, userId, fetchStatus, stopPolling]);

  const startPolling = useCallback(() => {
    stopPolling();
    pollStartRef.current = Date.now();

    pollTimerRef.current = setInterval(async () => {
      if (Date.now() - pollStartRef.current > MAX_POLL_DURATION_MS) {
        stopPolling();
        setView({
          kind: "error",
          message: "Connection timed out. Please try again.",
        });
        return;
      }
      if (!userId) return;

      try {
        const status = await getTelegramStatus(userId);
        if (status.isConnected) {
          stopPolling();
          setView({ kind: "idle", status });
        }
      } catch {
        // Keep polling on transient errors
      }
    }, POLL_INTERVAL_MS);
  }, [userId, stopPolling]);

  const handleConnect = async () => {
    if (!userId) return;
    try {
      const { deepLink } = await requestTelegramToken(userId);
      window.open(deepLink, "_blank");
      setView({ kind: "connecting", deepLink });
      startPolling();
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Failed to generate connection link.";
      setView({ kind: "error", message });
    }
  };

  const handleDisconnect = async () => {
    if (!userId) return;
    setIsDisconnecting(true);
    try {
      await disconnectTelegram(userId);
      await fetchStatus();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to disconnect Telegram.";
      setView({ kind: "error", message });
    } finally {
      setIsDisconnecting(false);
    }
  };

  const handleRetry = () => {
    stopPolling();
    setView({ kind: "loading" });
    void fetchStatus();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="md">
      <ModalHeader
        title="Notifications"
        subtitle="Connect Telegram to receive portfolio alerts and daily strategy suggestions."
        onClose={onClose}
      />
      <ModalContent>
        {!userId ? (
          <NoUserMessage />
        ) : view.kind === "loading" ? (
          <LoadingState />
        ) : view.kind === "error" ? (
          <ErrorState message={view.message} onRetry={handleRetry} />
        ) : view.kind === "connecting" ? (
          <ConnectingState deepLink={view.deepLink} />
        ) : view.kind === "idle" && view.status.isConnected ? (
          <ConnectedState
            onDisconnect={handleDisconnect}
            isDisconnecting={isDisconnecting}
          />
        ) : (
          <DisconnectedState onConnect={handleConnect} />
        )}
      </ModalContent>
      <ModalFooter className="justify-end">
        <button
          onClick={onClose}
          className="px-4 py-2 text-gray-400 hover:text-white text-sm font-medium transition-colors"
        >
          Close
        </button>
      </ModalFooter>
    </Modal>
  );
}

function NoUserMessage() {
  return (
    <p className="text-sm text-gray-400 text-center py-4">
      Connect your wallet first to enable notifications.
    </p>
  );
}

function LoadingState() {
  return (
    <div className="flex items-center justify-center py-8">
      <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
    </div>
  );
}

function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-3 py-4">
      <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center">
        <AlertCircle className="w-5 h-5 text-red-400" />
      </div>
      <p className="text-sm text-red-400 text-center">{message}</p>
      <button
        onClick={onRetry}
        className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-xs font-bold rounded-lg transition-colors"
      >
        Retry
      </button>
    </div>
  );
}

function ConnectingState({ deepLink }: { deepLink: string }) {
  return (
    <div className="flex flex-col items-center gap-4 py-4">
      <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
        <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
      </div>
      <div className="text-center">
        <p className="text-sm font-medium text-white">
          Waiting for confirmation...
        </p>
        <p className="text-xs text-gray-400 mt-1">
          Open Telegram and tap <span className="font-bold">Start</span> in the
          bot chat.
        </p>
      </div>
      <a
        href={deepLink}
        target="_blank"
        rel="noopener noreferrer"
        className="text-xs text-blue-400 hover:text-blue-300 underline transition-colors"
      >
        Re-open Telegram link
      </a>
    </div>
  );
}

function ConnectedState({
  onDisconnect,
  isDisconnecting,
}: {
  onDisconnect: () => void;
  isDisconnecting: boolean;
}) {
  return (
    <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-xl border border-gray-700/50">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
          <CheckCircle2 className="w-5 h-5 text-green-400" />
        </div>
        <div>
          <div className="font-bold text-white text-sm">Telegram</div>
          <div className="text-xs text-green-400">Connected</div>
        </div>
      </div>
      <button
        onClick={onDisconnect}
        disabled={isDisconnecting}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600/20 hover:bg-red-600/30 text-red-400 text-xs font-bold rounded-lg transition-colors disabled:opacity-50"
      >
        {isDisconnecting ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <Unlink className="w-3.5 h-3.5" />
        )}
        Disconnect
      </button>
    </div>
  );
}

function DisconnectedState({ onConnect }: { onConnect: () => void }) {
  return (
    <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-xl border border-gray-700/50">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-400">
          <Send className="w-5 h-5" />
        </div>
        <div>
          <div className="font-bold text-white text-sm">Telegram</div>
          <div className="text-xs text-gray-400">
            Receive alerts & daily suggestions
          </div>
        </div>
      </div>
      <button
        onClick={onConnect}
        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition-colors"
      >
        Connect
      </button>
    </div>
  );
}
