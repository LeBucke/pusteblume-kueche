import { cn } from "@/lib/utils";

export type ChipVariant =
  | "neutral"
  | "allergen"
  | "info"
  | "closed"
  | "starter"
  | "main"
  | "dessert";

// Pastelltöne nur als Fläche, der Text darauf immer in der dunklen Variante (SPEC 7a).
const variants: Record<ChipVariant, string> = {
  neutral: "bg-surface text-muted border border-line",
  allergen: "bg-allergen text-allergen-ink",
  info: "bg-info text-info-ink",
  closed: "bg-closed text-closed-ink",
  starter: "bg-course-starter text-ink",
  main: "bg-course-main-surface text-course-main-ink",
  dessert: "bg-course-dessert-surface text-course-dessert-ink",
};

type ChipProps = React.HTMLAttributes<HTMLSpanElement> & {
  variant?: ChipVariant;
};

export function Chip({ variant = "neutral", className, ...props }: ChipProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-0.5 text-sm font-bold",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}

type Course = "starter" | "main" | "dessert";

const dotColors: Record<Course, string> = {
  starter: "bg-course-starter",
  main: "bg-course-main",
  dessert: "bg-course-dessert",
};

/** Farbiger Punkt, der einen Gang überall gleich kennzeichnet. */
export function CourseDot({
  course,
  className,
}: {
  course: Course;
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-block size-3 shrink-0 rounded-full",
        dotColors[course],
        className,
      )}
    />
  );
}
