"use client";

import type { ReactNode } from "react";

import { cn } from "@/lib/ui/classNames";

interface SectionHeaderProps {
  title: string;
  rightContent?: ReactNode;
  className?: string;
}

export function SectionHeader({
  title,
  rightContent,
  className,
}: SectionHeaderProps) {
  return (
    <div className={cn("flex items-center justify-between", className)}>
      <h3 className="text-lg font-medium text-white">{title}</h3>
      {rightContent}
    </div>
  );
}
