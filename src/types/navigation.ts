export interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

export type TabType = "portfolio" | "invest" | "more";
