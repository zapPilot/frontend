import { BarChart3, Gift, Settings,Users, Wallet } from "lucide-react";

import { NavItem } from "../types/navigation";

export const NAVIGATION_ITEMS: NavItem[] = [
  {
    id: "wallet",
    label: "Portfolio",
    icon: Wallet,
    description: "Your wallet overview",
  },
  {
    id: "analytics",
    label: "Analytics",
    icon: BarChart3,
    description: "Performance metrics & charts",
  },
  {
    id: "community",
    label: "Community",
    icon: Users,
    description: "Social & ecosystem",
  },
  {
    id: "airdrop",
    label: "Airdrop",
    icon: Gift,
    description: "Token rewards & airdrops",
  },
  {
    id: "settings",
    label: "Settings",
    icon: Settings,
    description: "App preferences & help",
  },
] as const;
