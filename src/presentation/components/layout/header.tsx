"use client";

import { Menu, MessageCircle, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { cn } from "../../lib/cn";

const navItems = [
  { href: "#productos", label: "Productos" },
  { href: "#quienes", label: "Para quién" },
  { href: "#nosotros", label: "Nosotros" },
  { href: "#logistica", label: "Logística" },
  { href: "#contacto", label: "Contacto" },
];

interface HeaderProps {
  whatsappUrl: string;
}

export function Header({ whatsappUrl }: HeaderProps) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const solid = scrolled || open;

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-300",
        solid
          ? "border-b border-navy-800/8 bg-paper-50/90 shadow-sm shadow-navy-950/5 backdrop-blur-xl"
          : "bg-transparent",
      )}
    >
      <div className="mx-auto flex h-18 w-full max-w-7xl items-center justify-between px-5 sm:px-8">
        <Link
          href="/"
          aria-label="Papeles Austral - inicio"
          className="relative shrink-0"
          onClick={() => setOpen(false)}
        >
          {/* Logo a color sobre píldora clara cuando el header es transparente */}
          <span
            className={cn(
              "inline-flex items-center rounded-full px-3.5 py-2 transition-colors duration-300",
              solid ? "bg-transparent" : "bg-white/95 shadow-lg shadow-navy-950/20",
            )}
          >
            <Image
              src="/images/logo.png"
              alt="Papeles Austral"
              width={1212}
              height={400}
              priority
              className="h-7 w-auto sm:h-8"
            />
          </span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Principal">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "rounded-full px-4 py-2 text-sm font-medium transition-colors",
                solid
                  ? "text-navy-800/75 hover:bg-navy-800/5 hover:text-navy-800"
                  : "text-white/80 hover:bg-white/10 hover:text-white",
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden items-center gap-2 rounded-full bg-forest-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-forest-500/25 transition-all hover:-translate-y-0.5 hover:bg-forest-600 sm:inline-flex"
          >
            <MessageCircle className="size-4" aria-hidden />
            Cotizar ahora
          </Link>

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-label={open ? "Cerrar menú" : "Abrir menú"}
            className={cn(
              "inline-flex size-10 items-center justify-center rounded-full transition-colors lg:hidden",
              solid ? "text-navy-800 hover:bg-navy-800/5" : "text-white hover:bg-white/10",
            )}
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {/* Menú móvil */}
      <div
        className={cn(
          "overflow-hidden transition-[max-height] duration-300 lg:hidden",
          open ? "max-h-96" : "max-h-0",
        )}
      >
        <nav
          className="space-y-1 border-t border-navy-800/8 bg-paper-50/95 px-5 py-4 backdrop-blur-xl"
          aria-label="Móvil"
        >
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="block rounded-xl px-4 py-3 text-base font-medium text-navy-800/80 transition-colors hover:bg-navy-800/5 hover:text-navy-800"
            >
              {item.label}
            </Link>
          ))}
          <Link
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 flex items-center justify-center gap-2 rounded-xl bg-forest-500 px-4 py-3 text-base font-semibold text-white"
          >
            <MessageCircle className="size-4" aria-hidden />
            Cotizar por WhatsApp
          </Link>
        </nav>
      </div>
    </header>
  );
}
