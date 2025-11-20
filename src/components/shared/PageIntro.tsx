"use client";

import type { ReactNode } from "react";

import { FadeInSection } from "./FadeInSection";

interface PageIntroProps {
  title: string;
  subtitle: string;
  children?: ReactNode;
}

export function PageIntro({ title, subtitle, children }: PageIntroProps) {
  return (
    <FadeInSection yOffset={-20} className="text-center">
      <h1 className="text-3xl font-bold gradient-text mb-2">{title}</h1>
      <p className="text-gray-400">{subtitle}</p>
      {children}
    </FadeInSection>
  );
}
