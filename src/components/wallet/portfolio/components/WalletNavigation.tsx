import { History, LayoutDashboard, LineChart } from "lucide-react";

import { WalletMenu } from "@/components/wallet/portfolio/components/WalletMenu";

interface WalletNavigationProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenWalletManager?: () => void;
  onOpenSettings: () => void;
}

export function WalletNavigation({
  activeTab,
  setActiveTab,
  onOpenWalletManager,
  onOpenSettings,
}: WalletNavigationProps) {
  return (
    <nav className="h-16 border-b border-gray-800/50 bg-gray-950/80 backdrop-blur-md sticky top-0 z-50 px-4 md:px-8 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-purple-500/20">
          ZP
        </div>
        <span className="text-white font-bold tracking-tight hidden md:block">
          Zap Pilot
        </span>
      </div>

      <div className="flex items-center gap-1 bg-gray-900/50 p-1 rounded-full border border-gray-800/50">
        {[
          { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
          { id: "analytics", label: "Analytics", icon: LineChart },
          { id: "backtesting", label: "Backtesting", icon: History },
        ].map(tab => (
          <button
            key={tab.id}
            data-testid={`v22-tab-${tab.id}`}
            onClick={() => setActiveTab(tab.id)}
            role="button"
            aria-label={`${tab.label} tab`}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
              activeTab === tab.id
                ? "bg-gradient-to-r from-purple-500/10 to-blue-600/10 border border-purple-500/30 text-white shadow-sm"
                : "text-gray-400 hover:text-gray-200 hover:bg-gray-800/50 hover:border-purple-500/20 border border-transparent"
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="flex items-center gap-4">
        <WalletMenu
          {...(onOpenWalletManager && { onOpenWalletManager })}
          onOpenSettings={onOpenSettings}
        />
      </div>
    </nav>
  );
}
