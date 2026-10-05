"use client";

import { usePathname } from "next/navigation";
import { PillTabs } from "@/components/ui/pill-tabs";

// Ab Paket 03 filtert die Rolle diese Liste.
const items = [
  { href: "/heute", label: "Heute" },
  { href: "/plan", label: "Speiseplan" },
  { href: "/rezepte", label: "Rezepte" },
  { href: "/vorlagen", label: "Vorlagen" },
  { href: "/einkauf", label: "Einkauf" },
  { href: "/admin", label: "Admin" },
];

type AppNavProps = {
  layout: "top" | "bottom";
  className?: string;
};

export function AppNav({ layout, className }: AppNavProps) {
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
