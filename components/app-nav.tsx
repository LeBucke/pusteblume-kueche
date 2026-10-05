"use client";

import { usePathname } from "next/navigation";
import { PillTabs } from "@/components/ui/pill-tabs";
import type { NavItem } from "@/lib/roles";

type AppNavProps = {
  /** Die Punkte, die die Rollen des Nutzers sehen dürfen (siehe lib/roles.ts). */
  items: NavItem[];
  layout: "top" | "bottom";
  className?: string;
};

export function AppNav({ items, layout, className }: AppNavProps) {
  const pathname = usePathname();

  return (
    <PillTabs
      label="Bereiche"
      layout={layout}
      className={className}
      items={items.map((item) => ({
        ...item,
        active: pathname === item.href || pathname.startsWith(`${item.href}/`),
      }))}
    />
  );
}
