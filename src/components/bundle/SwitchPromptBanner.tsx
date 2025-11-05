import React from "react";

import { HEADER, Z_INDEX } from "@/constants/design-system";

interface SwitchPromptBannerProps {
  show: boolean;
  onStay: () => void;
  onSwitch: () => void;
}

export function SwitchPromptBanner({
  show,
  onStay,
  onSwitch,
}: SwitchPromptBannerProps) {
  if (!show) return null;
  return (
    <div
      className={`sticky ${HEADER.TOP_OFFSET} ${Z_INDEX.BANNER} mx-4 lg:mx-8 mt-4`}
    >
      <div className="rounded-lg border border-indigo-500/30 bg-indigo-950/40 backdrop-blur px-4 py-3 text-indigo-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="text-sm">
          You&apos;re viewing another user&apos;s bundle. Switch to your own
          bundle?
        </div>
        <div className="flex gap-2 justify-end">
          <button
            onClick={onStay}
            className="px-3 py-1.5 text-sm rounded-md bg-white/10 hover:bg-white/20 transition"
          >
            Stay
          </button>
          <button
            onClick={onSwitch}
            className="px-3 py-1.5 text-sm rounded-md bg-indigo-500 hover:bg-indigo-400 text-white transition"
            data-testid="switch-to-my-bundle"
          >
            Switch to my bundle
          </button>
        </div>
      </div>
    </div>
  );
}
