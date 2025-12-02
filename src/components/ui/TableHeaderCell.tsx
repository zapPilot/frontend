import React from "react";

interface TableHeaderCellProps {
  children: React.ReactNode;
  className?: string;
  align?: "left" | "center" | "right";
}

/**
 * Consistent table header cell with default styling
 * Provides uniform appearance for table headers across the application
 *
 * @example
 * ```tsx
 * <thead>
 *   <tr>
 *     <TableHeaderCell align="left">Asset</TableHeaderCell>
 *     <TableHeaderCell align="right">Value</TableHeaderCell>
 *   </tr>
 * </thead>
 * ```
 */
export function TableHeaderCell({
  children,
  className = "",
  align = "right",
}: TableHeaderCellProps) {
  const alignClass = {
    left: "text-left",
    center: "text-center",
    right: "text-right",
  }[align];

  return (
    <th
      className={`${alignClass} px-3 py-2 text-xs font-semibold uppercase tracking-wider text-gray-400 ${className}`}
    >
      {children}
    </th>
  );
}
