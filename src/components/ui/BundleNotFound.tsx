"use client";

import { AlertCircle, ArrowRight } from "lucide-react";

import { BaseCard } from "./BaseCard";
import { GradientButton } from "./GradientButton";

interface BundleNotFoundProps {
  message?: string;
  showConnectCTA?: boolean;
  onConnectClick?: () => void;
}

export function BundleNotFound({
  message = "Bundle not found",
  showConnectCTA = true,
  onConnectClick,
}: BundleNotFoundProps) {
  return (
    <div className="flex items-center justify-center min-h-[400px] p-6">
      <BaseCard variant="glass" className="max-w-md w-full text-center">
        <div className="space-y-6">
          {/* Error Icon */}
          <div className="flex justify-center">
            <div className="p-3 bg-orange-500/20 rounded-full">
              <AlertCircle className="w-8 h-8 text-orange-400" />
            </div>
          </div>

          {/* Error Message */}
          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-white">{message}</h2>
            <p className="text-gray-300 text-sm">
              This bundle doesn&apos;t exist or isn&apos;t available.
              {showConnectCTA &&
                " Try connecting your wallet to view your own portfolio."}
            </p>
          </div>

          {/* Connect CTA */}
          {showConnectCTA && onConnectClick && (
            <div className="pt-4">
              <GradientButton
                gradient="from-indigo-500 to-purple-600"
                shadowColor="indigo-500"
                icon={ArrowRight}
                onClick={onConnectClick}
                className="w-full"
              >
                <span className="text-sm">Connect Wallet</span>
              </GradientButton>
            </div>
          )}
        </div>
      </BaseCard>
    </div>
  );
}
