import Link from "next/link";
import type { ComponentProps } from "react";
import { cn } from "../../lib/cn";

type Variant = "primary" | "secondary" | "outline" | "ghost-light";
type Size = "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 rounded-full font-semibold tracking-tight transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest-500";

const variants: Record<Variant, string> = {
  primary:
    "bg-forest-500 text-white shadow-lg shadow-forest-500/25 hover:bg-forest-600 hover:shadow-forest-600/30 hover:-translate-y-0.5",
  secondary:
    "bg-navy-800 text-white shadow-lg shadow-navy-800/25 hover:bg-navy-700 hover:-translate-y-0.5",
  outline:
    "border-2 border-navy-800/15 bg-white/60 text-navy-800 backdrop-blur hover:border-navy-800/40 hover:-translate-y-0.5",
  "ghost-light":
    "border border-white/25 bg-white/10 text-white backdrop-blur hover:bg-white/20",
};

const sizes: Record<Size, string> = {
  md: "px-5 py-2.5 text-sm",
  lg: "px-7 py-3.5 text-base",
};

interface ButtonLinkProps extends ComponentProps<typeof Link> {
  variant?: Variant;
  size?: Size;
}

export function ButtonLink({
  variant = "primary",
  size = "md",
  className,
  ...props
}: ButtonLinkProps) {
  return (
    <Link
      className={cn(base, variants[variant], sizes[size], className)}
      {...props}
    />
  );
}
