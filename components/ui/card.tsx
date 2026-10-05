import { cn } from "@/lib/utils";

type CardProps = React.HTMLAttributes<HTMLDivElement> & {
  /** Kleinere Rundung (18 px) für Karten in Karten und enge Listen. */
  compact?: boolean;
};

export function Card({ compact = false, className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "bg-surface p-5 md:p-6",
        compact ? "rounded-card-sm" : "rounded-card",
        className,
      )}
      {...props}
    />
  );
}
