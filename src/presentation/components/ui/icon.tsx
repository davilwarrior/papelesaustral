import {
  BookOpen,
  Box,
  Crosshair,
  FileStack,
  Handshake,
  Layers,
  Lightbulb,
  Package,
  PenTool,
  Printer,
  ShieldCheck,
  Sparkles,
  Store,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import type { ComponentProps } from "react";

const icons: Record<string, LucideIcon> = {
  "file-stack": FileStack,
  layers: Layers,
  package: Package,
  sparkles: Sparkles,
  printer: Printer,
  "pen-tool": PenTool,
  "book-open": BookOpen,
  store: Store,
  box: Box,
  crosshair: Crosshair,
  "shield-check": ShieldCheck,
  handshake: Handshake,
  lightbulb: Lightbulb,
  "trending-up": TrendingUp,
};

interface IconProps extends Omit<ComponentProps<"svg">, "name"> {
  name: string;
}

export function Icon({ name, ...props }: IconProps) {
  const LucideIcon = icons[name] ?? Sparkles;
  return <LucideIcon aria-hidden {...props} />;
}
