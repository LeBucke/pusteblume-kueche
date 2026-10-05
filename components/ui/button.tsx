import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary";
type Size = "md" | "lg";

const variants: Record<Variant, string> = {
  primary: "bg-primary text-surface hover:bg-primary-ink",
  secondary: "border border-line bg-surface text-ink hover:border-primary",
};

// md: Teamansichten (mindestens 44 px), lg: Küche (mindestens 52 px)
const sizes: Record<Size, string> = {
  md: "min-h-touch px-5 text-base",
  lg: "min-h-touch-kitchen px-6 text-lg",
};

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
};

export function Button({
  variant = "primary",
  size = "md",
  type = "button",
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex cursor-pointer items-center justify-center gap-2 rounded-full font-display font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-50",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  );
}
