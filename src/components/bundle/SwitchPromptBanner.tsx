import React from "react";

import { StickyBannerShell } from "../shared/StickyBannerShell";

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
    <StickyBannerShell data-testid="switch-prompt-banner">
      <div className="text-sm">
        You&apos;re viewing another user&apos;s bundle. Switch to your own
        bundle?
      </div>
      <div className="flex gap-2 justify-end">
        <button
          data-testid="stay-button"
          onClick={onStay}
          className="px-3 py-1.5 text-sm rounded-md bg-white/10 hover:bg-white/20 transition"
        >
          Stay
        </button>
        <button
          data-testid="switch-button"
          onClick={onSwitch}
          className="px-3 py-1.5 text-sm rounded-md bg-indigo-500 hover:bg-indigo-400 text-white transition"
        >
          Switch to my bundle
        </button>
      </div>
    </StickyBannerShell>
  );
}
