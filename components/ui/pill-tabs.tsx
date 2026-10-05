import Link from "next/link";
import { cn } from "@/lib/utils";

export type PillTabItem = {
  href: string;
  label: string;
  active: boolean;
};

type PillTabsProps = {
  items: PillTabItem[];
  label: string;
  /** top: Pillen in der Kopfzeile, bottom: gleich breite Felder in der unteren Leiste */
  layout?: "top" | "bottom";
  className?: string;
};

export function PillTabs({
  items,
  label,
  layout = "top",
  className,
}: PillTabsProps) {
  return (
    <nav aria-label={label} className={className}>
      <ul
        className={cn(
          "flex list-none",
          layout === "top" ? "gap-1.5" : "justify-between gap-1",
        )}
      >
        {items.map((item) => (
          <li key={item.href} className={layout === "bottom" ? "flex-1" : ""}>
            <Link
              href={item.href}
              aria-current={item.active ? "page" : undefined}
              className={cn(
                "flex items-center justify-center rounded-full border-[1.5px] font-display",
                layout === "top"
                  ? "min-h-touch px-4 text-lg lg:px-[18px]"
                  : "min-h-touch px-1 text-[13px]",
                item.active
                  ? "border-primary bg-surface font-bold text-ink"
                  : "border-transparent font-semibold text-muted hover:text-ink",
              )}
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
