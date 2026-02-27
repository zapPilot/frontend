"use client";

import { AlertCircle, CheckCircle2, Loader2, Send, Unlink } from "lucide-react";
import {
  type ReactElement,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

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
import { getErrorMessage } from "@/utils";

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

interface ErrorStateProps {
  message: string;
  onRetry: () => void;
}

interface ConnectingStateProps {
  deepLink: string;
}

interface ConnectedStateProps {
  onDisconnect: () => void;
  isDisconnecting: boolean;
}

interface DisconnectedStateProps {
  onConnect: () => void;
}

interface RenderSettingsContentParams {
  userId?: string | undefined;
  view: ViewState;
  isDisconnecting: boolean;
  onRetry: () => void;
  onConnect: () => void;
  onDisconnect: () => void;
}

function renderSettingsContent({
  userId,
  view,
  isDisconnecting,
  onRetry,
  onConnect,
  onDisconnect,
}: RenderSettingsContentParams): ReactElement {
  if (!userId) {
    return <NoUserMessage />;
  }

  if (view.kind === "loading") {
    return <LoadingState />;
  }

  if (view.kind === "error") {
    return <ErrorState message={view.message} onRetry={onRetry} />;
  }

  if (view.kind === "connecting") {
    return <ConnectingState deepLink={view.deepLink} />;
  }

  if (view.status.isConnected) {
    return (
      <ConnectedState
        onDisconnect={onDisconnect}
        isDisconnecting={isDisconnecting}
      />
    );
  }

  return <DisconnectedState onConnect={onConnect} />;
}

export function SettingsModal({
  isOpen,
  onClose,
  userId,
}: SettingsModalProps): ReactElement {
  const [view, setView] = useState<ViewState>({ kind: "loading" });
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollStartRef = useRef<number>(0);

  const stopPolling = useCallback((): void => {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  }, []);

  const fetchStatus = useCallback(async (): Promise<TelegramStatus | null> => {
    if (!userId) {
      return null;
    }

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

  const handleConnect = async (): Promise<void> => {
    if (!userId) {
      return;
    }

    try {
      const { deepLink } = await requestTelegramToken(userId);
      window.open(deepLink, "_blank");
      setView({ kind: "connecting", deepLink });
      startPolling();
    } catch (err) {
      const message = getErrorMessage(
        err,
        "Failed to generate connection link."
      );
      setView({ kind: "error", message });
    }
  };

  const handleDisconnect = async (): Promise<void> => {
    if (!userId) {
      return;
    }

    setIsDisconnecting(true);
    try {
      await disconnectTelegram(userId);
      await fetchStatus();
    } catch (err) {
      const message = getErrorMessage(err, "Failed to disconnect Telegram.");
      setView({ kind: "error", message });
    } finally {
      setIsDisconnecting(false);
    }
  };

  const handleRetry = (): void => {
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
        {renderSettingsContent({
          userId,
          view,
          isDisconnecting,
          onRetry: handleRetry,
          onConnect: () => {
            void handleConnect();
          },
          onDisconnect: () => {
            void handleDisconnect();
          },
        })}
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

function NoUserMessage(): ReactElement {
  return (
    <p className="text-sm text-gray-400 text-center py-4">
      Connect your wallet first to enable notifications.
    </p>
  );
}

function LoadingState(): ReactElement {
  return (
    <div className="flex items-center justify-center py-8">
      <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
    </div>
  );
}

function ErrorState({ message, onRetry }: ErrorStateProps): ReactElement {
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

function ConnectingState({ deepLink }: ConnectingStateProps): ReactElement {
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

interface TelegramConnectionCardProps {
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  subtitle: React.ReactNode;
  action: React.ReactNode;
}

function TelegramConnectionCard({
  icon,
  iconBg,
  title,
  subtitle,
  action,
}: TelegramConnectionCardProps): ReactElement {
  return (
    <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-xl border border-gray-700/50">
      <div className="flex items-center gap-3">
        <div
          className={`w-10 h-10 rounded-lg ${iconBg} flex items-center justify-center`}
        >
          {icon}
        </div>
        <div>
          <div className="font-bold text-white text-sm">{title}</div>
          <div className="text-xs">{subtitle}</div>
        </div>
      </div>
      {action}
    </div>
  );
}

function ConnectedState({
  onDisconnect,
  isDisconnecting,
}: ConnectedStateProps): ReactElement {
  return (
    <TelegramConnectionCard
      icon={<CheckCircle2 className="w-5 h-5 text-green-400" />}
      iconBg="bg-green-500/20"
      title="Telegram"
      subtitle={<span className="text-green-400">Connected</span>}
      action={
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
      }
    />
  );
}

function DisconnectedState({
  onConnect,
}: DisconnectedStateProps): ReactElement {
  return (
    <TelegramConnectionCard
      icon={<Send className="w-5 h-5 text-blue-400" />}
      iconBg="bg-blue-500/20"
      title="Telegram"
      subtitle={
        <span className="text-gray-400">
          Receive alerts & daily suggestions
        </span>
      }
      action={
        <button
          onClick={onConnect}
          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition-colors"
        >
          Connect
        </button>
      }
    />
  );
}
