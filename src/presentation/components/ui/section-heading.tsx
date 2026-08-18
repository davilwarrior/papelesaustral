import { cn } from "../../lib/cn";
import { Reveal } from "./reveal";

interface SectionHeadingProps {
  eyebrow: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  dark?: boolean;
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "center",
  dark = false,
}: SectionHeadingProps) {
  return (
    <Reveal
      className={cn(
        "max-w-2xl",
        align === "center" && "mx-auto text-center",
      )}
    >
      <p
        className={cn(
          "text-xs font-bold uppercase tracking-[0.2em]",
          dark ? "text-forest-300" : "text-forest-600",
        )}
      >
        {eyebrow}
      </p>
      <h2
        className={cn(
          "mt-3 font-display text-3xl font-bold tracking-tight text-balance sm:text-4xl lg:text-[2.75rem] lg:leading-[1.1]",
          dark ? "text-white" : "text-navy-800",
        )}
      >
        {title}
      </h2>
      {description && (
        <p
          className={cn(
            "mt-4 text-base leading-relaxed text-pretty sm:text-lg",
            dark ? "text-navy-100/80" : "text-navy-800/70",
          )}
        >
          {description}
        </p>
      )}
    </Reveal>
  );
}
