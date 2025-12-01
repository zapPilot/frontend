import { memo, type ReactNode } from "react";

interface PageSectionHeaderProps {
  title: string;
  subtitle: ReactNode;
  level?: "h1" | "h2";
}

export const PageSectionHeader = memo<PageSectionHeaderProps>(
  ({ title, subtitle, level = "h2" }) => {
    const Heading = level;
    return (
      <div className="text-center">
        <Heading
          className={`font-bold gradient-text mb-2 ${
            level === "h1" ? "text-3xl" : "text-2xl"
          }`}
        >
          {title}
        </Heading>
        <p className="text-gray-400">{subtitle}</p>
      </div>
    );
  }
);

PageSectionHeader.displayName = "PageSectionHeader";
