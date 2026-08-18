interface RebrandBannerProps {
  formerName: string;
  name: string;
}

export function RebrandBanner({ formerName, name }: RebrandBannerProps) {
  const phrase = `${formerName} ahora es ${name}`;

  return (
    <div
      className="overflow-hidden border-y border-forest-600/30 bg-forest-500 py-3"
      aria-label={phrase}
    >
      <div className="animate-marquee flex w-max items-center gap-8 whitespace-nowrap">
        {Array.from({ length: 6 }, (_, i) => (
          <span
            key={i}
            aria-hidden={i > 0}
            className="flex items-center gap-8 text-sm font-bold tracking-wide text-white"
          >
            {phrase}
            <span className="size-1.5 rounded-full bg-white/60" />
            Misma calidad, nueva identidad
            <span className="size-1.5 rounded-full bg-white/60" />
          </span>
        ))}
      </div>
    </div>
  );
}
