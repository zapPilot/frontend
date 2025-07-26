"use client";

import {
  CheckCircle,
  ExternalLink,
  X,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { useEffect, useState } from "react";

export interface Toast {
  id: string;
  type: "success" | "error" | "info";
  title: string;
  message?: string;
  link?:
    | {
        text: string;
        url: string;
      }
    | undefined;
  duration?: number;
}

interface ToastNotificationProps {
  toast: Toast;
  onClose: (id: string) => void;
}

export function ToastNotification({ toast, onClose }: ToastNotificationProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Animate in
    setIsVisible(true);

    // Auto-dismiss
    const duration = toast.duration || 6000;
    const timer = setTimeout(() => {
      handleClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [toast.duration]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      onClose(toast.id);
    }, 300);
  };

  const getIcon = () => {
    switch (toast.type) {
      case "success":
        return <CheckCircle size={20} className="text-green-400" />;
      case "error":
        return <XCircle size={20} className="text-red-400" />;
      case "info":
        return <AlertCircle size={20} className="text-blue-400" />;
      default:
        return <CheckCircle size={20} className="text-green-400" />;
    }
  };

  const getBorderColor = () => {
    switch (toast.type) {
      case "success":
        return "border-green-600/30";
      case "error":
        return "border-red-600/30";
      case "info":
        return "border-blue-600/30";
      default:
        return "border-green-600/30";
    }
  };

  const getBackgroundColor = () => {
    switch (toast.type) {
      case "success":
        return "bg-green-900/20";
      case "error":
        return "bg-red-900/20";
      case "info":
        return "bg-blue-900/20";
      default:
        return "bg-green-900/20";
    }
  };

  return (
    <div
      className={`
        mb-3 w-80 rounded-lg border backdrop-blur-sm transition-all duration-300 ease-out
        ${getBorderColor()} ${getBackgroundColor()}
        ${
          isVisible && !isExiting
            ? "translate-x-0 opacity-100"
            : "translate-x-full opacity-0"
        }
      `}
    >
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            {getIcon()}
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-white text-sm">
                {toast.title}
              </h4>
              {toast.message && (
                <p className="text-xs text-gray-300 mt-1">{toast.message}</p>
              )}
              {toast.link && (
                <a
                  href={toast.link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 mt-2 text-xs text-blue-400 hover:text-blue-300 transition-colors"
                >
                  {toast.link.text}
                  <ExternalLink size={12} />
                </a>
              )}
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white transition-colors ml-2"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
