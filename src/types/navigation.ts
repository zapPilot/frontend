export interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

export type TabType = "wallet" | "invest" | "analytics" | "more";
export type MoreTabType = "pricing" | "community" | "airdrop" | "settings";
