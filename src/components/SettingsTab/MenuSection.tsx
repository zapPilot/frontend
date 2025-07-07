"use client";

import { motion } from "framer-motion";
import { ChevronRight, LucideIcon } from "lucide-react";

interface MenuItem {
  icon: LucideIcon;
  label: string;
  description: string;
  onClick?: () => void;
}

interface MenuSectionProps {
  title: string;
  items: MenuItem[];
  sectionIndex?: number;
  className?: string;
}

export function MenuSection({
  title,
  items,
  sectionIndex = 0,
  className = "",
}: MenuSectionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: sectionIndex * 0.1 }}
      className={`glass-morphism rounded-2xl border border-gray-800 overflow-hidden ${className}`}
    >
      <div className="p-4 border-b border-gray-800">
        <h2 className="text-lg font-semibold text-white">{title}</h2>
      </div>

      <div className="divide-y divide-gray-800">
        {items.map((item, itemIndex) => (
          <motion.button
            key={item.label}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: sectionIndex * 0.1 + itemIndex * 0.05 }}
            whileHover={{ backgroundColor: "rgba(55, 65, 81, 0.3)" }}
            onClick={item.onClick}
            className="w-full p-4 flex items-center justify-between hover:bg-gray-700/20 transition-all duration-200 cursor-pointer"
          >
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-xl bg-gray-800">
                <item.icon className="w-5 h-5 text-gray-300" />
              </div>
              <div className="text-left">
                <div className="font-medium text-white">{item.label}</div>
                <div className="text-sm text-gray-400">{item.description}</div>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}
