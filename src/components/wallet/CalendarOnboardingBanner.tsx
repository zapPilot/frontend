import { Calendar } from "lucide-react";
import { useEffect, useState } from "react";

import { StickyBannerShell } from "../shared/StickyBannerShell";

const STORAGE_KEY = "zap-pilot-calendar-onboarding-dismissed";

interface CalendarOnboardingBannerProps {
  isOwnBundle: boolean;
  isCalendarConnected: boolean;
  onConnect: () => void;
}

export function CalendarOnboardingBanner({
  isOwnBundle,
  isCalendarConnected,
  onConnect,
}: CalendarOnboardingBannerProps) {
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    const isDismissed = localStorage.getItem(STORAGE_KEY);
    if (!isDismissed && isOwnBundle && !isCalendarConnected) {
      setDismissed(false);
    }
  }, [isOwnBundle, isCalendarConnected]);

  const handleDismiss = () => {
    localStorage.setItem(STORAGE_KEY, "true");
    setDismissed(true);
  };

  if (dismissed || !isOwnBundle || isCalendarConnected) return null;

  return (
    <StickyBannerShell>
      <div className="flex items-center gap-3 flex-1">
        <div className="p-2 bg-blue-500/20 rounded-lg border border-blue-500/30">
          <Calendar className="w-5 h-5 text-blue-400" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-semibold text-white">
              Never miss a buy-the-dip opportunity
            </span>
            <span className="px-2 py-0.5 text-xs font-bold bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full">
              NEW
            </span>
          </div>
          <p className="text-xs text-gray-300">
            Get automatic calendar reminders when Fear & Greed Index hits
            Extreme Fear or Extreme Greed
          </p>
        </div>
      </div>
      <div className="flex gap-2">
        <button
          onClick={handleDismiss}
          className="px-3 py-1.5 text-sm rounded-md bg-white/10 hover:bg-white/20 transition text-gray-300"
        >
          Maybe Later
        </button>
        <button
          onClick={() => {
            onConnect();
            handleDismiss();
          }}
          className="px-4 py-1.5 text-sm rounded-md bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white transition font-medium"
        >
          Connect Calendar
        </button>
      </div>
    </StickyBannerShell>
  );
}
