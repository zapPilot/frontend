"use client";

import { BaseCard } from "@/components/ui";
import { HEADER, Z_INDEX } from "@/constants/design-system";

interface EmailReminderBannerProps {
  onSubscribe: () => void;
  onDismiss: () => void;
}

export function EmailReminderBanner({
  onSubscribe,
  onDismiss,
}: EmailReminderBannerProps) {
  return (
    <div
      className={`sticky ${HEADER.TOP_OFFSET} ${Z_INDEX.BANNER} mx-4 lg:mx-8 mt-4`}
    >
      <BaseCard
        variant="glass"
        padding="sm"
        borderRadius="md"
        className="border-indigo-500/30 bg-indigo-950/40 px-4 py-3 text-indigo-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
      >
        <div className="text-sm">
          💡 Subscribe to email reports for daily data updates. Currently
          updating weekly only.
        </div>
        <div className="flex gap-2 justify-end">
          <button
            onClick={onDismiss}
            className="px-3 py-1.5 text-sm rounded-md bg-white/10 hover:bg-white/20 transition"
          >
            Later
          </button>
          <button
            onClick={onSubscribe}
            className="px-3 py-1.5 text-sm rounded-md bg-indigo-600 hover:bg-indigo-700 transition text-white"
          >
            Subscribe Now
          </button>
        </div>
      </BaseCard>
    </div>
  );
}
