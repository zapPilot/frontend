import { BarChart3, Plus, Settings } from "lucide-react";
import { NavItem } from "../types/navigation";

export const NAVIGATION_ITEMS: NavItem[] = [
  {
    id: "portfolio",
    label: "Portfolio",
    icon: BarChart3,
    description: "View your DeFi portfolio overview",
  },
  {
    id: "invest",
    label: "Invest",
    icon: Plus,
    description: "Discover new investment opportunities",
  },
  {
    id: "more",
    label: "More",
    icon: Settings,
    description: "Settings and additional features",
  },
] as const;
