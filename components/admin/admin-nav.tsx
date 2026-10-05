"use client";

import { usePathname } from "next/navigation";
import { PillTabs } from "@/components/ui/pill-tabs";

const ITEMS = [
  { href: "/admin/nutzer", label: "Nutzer" },
  { href: "/admin/einstellungen", label: "Einstellungen" },
  { href: "/admin/lieferanten", label: "Lieferanten" },
  { href: "/admin/warengruppen", label: "Warengruppen" },
  { href: "/admin/allergene", label: "Allergene prüfen" },
  { href: "/zutaten", label: "Zutaten" },
];

/** Unterseiten des Adminbereichs. Auf dem Handy scrollt die Leiste seitlich. */
export function AdminNav() {
  const pathname = usePathname();

  return (
    <div className="-mx-4 overflow-x-auto px-4 pb-1 md:mx-0 md:px-0">
      <PillTabs
        label="Adminbereich"
        className="w-max"
        items={ITEMS.map((item) => ({
          ...item,
          active: pathname === item.href || pathname.startsWith(`${item.href}/`),
        }))}
      />
    </div>
  );
}
