"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import {
  ArrowUp,
  Bot,
  Check,
  ClipboardList,
  Loader2,
  MessageCircle,
  RotateCcw,
  Search,
  Square,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import type { AssistantUIMessage } from "@/application/chat/assistant-tools";
import { formatUsd } from "@/application/use-cases/build-quote-message";
import { buildWhatsAppQuoteUrl } from "@/application/use-cases/build-whatsapp-quote-url";
import { cn } from "../../lib/cn";
import { quoteCart } from "../quote/quote-cart-store";

interface ChatWidgetProps {
  whatsappNumber: string;
}

const SUGGESTIONS = [
  "¿Qué cartulina me sirve para cajas?",
  "Quiero cotizar dúplex 250",
  "¿Hacen entregas fuera de Cuenca?",
  "Ver mi pedido",
];

type Part = AssistantUIMessage["parts"][number];

/** Mensaje legible a partir del error de la API ({ error: "..." }) o de red. */
function errorText(error: Error): string {
  try {
    const parsed = JSON.parse(error.message);
    if (typeof parsed?.error === "string") return parsed.error;
  } catch {
    // No era JSON: es un error de red o del stream.
  }
  return "No pude conectarme. Revisa tu conexión e intenta de nuevo.";
}

export function ChatWidget({ whatsappNumber }: ChatWidgetProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const appliedToolCalls = useRef(new Set<string>());

  const { messages, sendMessage, status, error, stop, setMessages, clearError } =
    useChat<AssistantUIMessage>({
      transport: new DefaultChatTransport({
        api: "/api/chat",
        // El servidor parte siempre del pedido real guardado en el navegador.
        body: () => ({ cart: quoteCart.snapshot() }),
      }),
    });

  const busy = status === "submitted" || status === "streaming";

  // Los cambios del asistente al pedido se aplican al mismo carrito del cotizador.
  useEffect(() => {
    for (const message of messages) {
      for (const part of message.parts) {
        if (part.type !== "tool-actualizar_pedido" || part.state !== "output-available") continue;
        if (appliedToolCalls.current.has(part.toolCallId)) continue;
        appliedToolCalls.current.add(part.toolCallId);
        for (const { codigo, paquetes } of part.output.cambios) quoteCart.setPacks(codigo, paquetes);
      }
    }
  }, [messages]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, status, open]);

  useEffect(() => {
    // En celulares no abrimos el teclado de golpe.
    if (open && window.matchMedia("(min-width: 640px)").matches) inputRef.current?.focus();
  }, [open]);

  function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || busy) return;
    if (error) clearError();
    sendMessage({ text: trimmed.slice(0, 1500) });
    setInput("");
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    send(input);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      send(input);
    }
  }

  function reset() {
    stop();
    setMessages([]);
    clearError();
    appliedToolCalls.current.clear();
  }

  const advisorUrl = buildWhatsAppQuoteUrl(whatsappNumber);
  // En el cotizador móvil hay una barra fija de pedido abajo.
  const raised = pathname === "/cotizador";

  return (
    <>
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Abrir asistente de Papeles Austral"
          className={cn(
            "fixed right-4 z-[55] flex items-center gap-2 rounded-full bg-navy-800 py-3 pr-5 pl-4 text-sm font-semibold text-white shadow-xl shadow-navy-900/25 transition-transform hover:-translate-y-0.5 hover:bg-navy-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest-500 sm:right-6",
            raised ? "bottom-24 xl:bottom-6" : "bottom-4 sm:bottom-6",
          )}
        >
          <span className="relative flex size-6 items-center justify-center rounded-full bg-forest-500">
            <Bot className="size-4" aria-hidden />
          </span>
          ¿Te ayudo?
        </button>
      )}

      {open && (
        <div
          role="dialog"
          aria-label="Asistente de Papeles Austral"
          className="fixed inset-0 z-[70] flex flex-col overflow-hidden bg-paper-50 sm:inset-auto sm:right-6 sm:bottom-6 sm:h-[min(640px,calc(100dvh-3rem))] sm:w-[400px] sm:rounded-2xl sm:border sm:border-navy-800/10 sm:shadow-2xl sm:shadow-navy-900/20"
        >
          {/* Encabezado */}
          <div className="flex items-center gap-3 bg-navy-800 px-4 py-3 text-white">
            <span className="flex size-9 items-center justify-center rounded-full bg-forest-500">
              <Bot className="size-5" aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-display text-[15px] leading-tight font-semibold">Asistente Papeles Austral</p>
              <p className="text-xs text-white/60">Dudas, precios y pedidos</p>
            </div>
            {messages.length > 0 && (
              <button
                type="button"
                onClick={reset}
                aria-label="Nueva conversación"
                title="Nueva conversación"
                className="rounded-lg p-2 text-white/70 hover:bg-white/10 hover:text-white"
              >
                <RotateCcw className="size-4" aria-hidden />
              </button>
            )}
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Cerrar asistente"
              className="rounded-lg p-2 text-white/70 hover:bg-white/10 hover:text-white"
            >
              <X className="size-5" aria-hidden />
            </button>
          </div>

          {/* Conversación */}
          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4" aria-live="polite">
            <Bubble role="assistant">
              ¡Hola! Soy el asistente de Papeles Austral. Te ayudo a elegir el material, ver precios y armar tu
              pedido. ¿Qué necesitas?
            </Bubble>

            {messages.length === 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {SUGGESTIONS.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => send(suggestion)}
                    className="rounded-full border border-navy-800/15 bg-white px-3 py-1.5 text-left text-[13px] text-navy-800 hover:border-forest-500 hover:text-forest-700"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}

            {messages.map((message) => (
              <div key={message.id} className="space-y-2">
                {/* El botón de envío va al final, después del texto que lo presenta. */}
                {[
                  ...message.parts.filter((p) => p.type !== "tool-preparar_envio"),
                  ...message.parts.filter((p) => p.type === "tool-preparar_envio"),
                ].map((part, i) => (
                  <MessagePart key={i} part={part} role={message.role} />
                ))}
              </div>
            ))}

            {status === "submitted" && (
              <div className="flex items-center gap-1.5 px-1 text-navy-800/50" aria-label="Escribiendo">
                <Dot delay="0ms" />
                <Dot delay="150ms" />
                <Dot delay="300ms" />
              </div>
            )}

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
                {errorText(error)}{" "}
                <a href={advisorUrl} target="_blank" rel="noopener noreferrer" className="font-semibold underline">
                  Escríbenos por WhatsApp
                </a>
              </div>
            )}
          </div>

          {/* Entrada */}
          <form onSubmit={handleSubmit} className="border-t border-navy-800/10 bg-white px-3 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            <div className="flex items-end gap-2 rounded-xl border border-navy-800/15 bg-white px-3 py-2 focus-within:border-forest-500 focus-within:ring-2 focus-within:ring-forest-500/20">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={1}
                maxLength={1500}
                placeholder="Escribe tu pregunta o pedido…"
                aria-label="Mensaje"
                className="max-h-28 min-h-6 flex-1 resize-none bg-transparent text-base sm:text-[15px] text-navy-900 outline-none [field-sizing:content] placeholder:text-navy-800/35"
              />
              {busy ? (
                <button
                  type="button"
                  onClick={stop}
                  aria-label="Detener respuesta"
                  className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-navy-800 text-white hover:bg-navy-700"
                >
                  <Square className="size-3.5 fill-current" aria-hidden />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={!input.trim()}
                  aria-label="Enviar mensaje"
                  className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-forest-500 text-white hover:bg-forest-600 disabled:bg-navy-800/15"
                >
                  <ArrowUp className="size-4" aria-hidden />
                </button>
              )}
            </div>
            <p className="mt-2 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 px-1 text-[11px] text-navy-800/45">
              <span>Asistente con IA: confirma los detalles con un asesor.</span>
              <a
                href={advisorUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-medium text-forest-700 hover:underline"
              >
                <MessageCircle className="size-3" aria-hidden />
                Hablar con un asesor
              </a>
            </p>
          </form>
        </div>
      )}
    </>
  );
}

function Bubble({ role, children }: { role: AssistantUIMessage["role"]; children: React.ReactNode }) {
  const isUser = role === "user";
  return (
    <div className={cn("flex", isUser && "justify-end")}>
      <div
        className={cn(
          "max-w-[85%] rounded-2xl px-3.5 py-2.5 text-[14.5px] leading-relaxed whitespace-pre-wrap",
          isUser
            ? "rounded-br-md bg-navy-800 text-white"
            : "rounded-bl-md border border-navy-800/10 bg-white text-navy-900",
        )}
      >
        {children}
      </div>
    </div>
  );
}

function Dot({ delay }: { delay: string }) {
  return <span className="size-1.5 animate-bounce rounded-full bg-current" style={{ animationDelay: delay }} />;
}

function Status({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return <p className="flex items-center gap-1.5 px-1 text-xs text-navy-800/50">{icon}{children}</p>;
}

function MessagePart({ part, role }: { part: Part; role: AssistantUIMessage["role"] }) {
  switch (part.type) {
    case "text":
      return part.text.trim() ? <Bubble role={role}>{part.text.trim()}</Bubble> : null;

    case "tool-buscar_productos":
    case "tool-ver_pedido":
      if (part.state === "output-available" || part.state === "output-error") return null;
      return (
        <Status icon={<Search className="size-3" aria-hidden />}>
          {part.type === "tool-ver_pedido" ? "Revisando tu pedido…" : "Buscando en el catálogo…"}
        </Status>
      );

    case "tool-actualizar_pedido": {
      if (part.state !== "output-available") {
        return part.state === "output-error" ? null : (
          <Status icon={<Loader2 className="size-3 animate-spin" aria-hidden />}>Actualizando tu pedido…</Status>
        );
      }
      const { cambios, pedido } = part.output;
      if (cambios.length === 0) return null;
      return (
        <div className="rounded-xl border border-forest-200 bg-forest-50 px-3 py-2.5 text-[13px] text-forest-900">
          <ul className="space-y-1">
            {cambios.map((c) => (
              <li key={c.codigo} className="flex gap-1.5">
                <Check className="mt-0.5 size-3.5 shrink-0 text-forest-600" aria-hidden />
                <span>
                  {c.paquetes > 0 ? `${c.paquetes} paq · ` : "Quitado · "}
                  {c.descripcion}
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-2 flex items-center justify-between border-t border-forest-200 pt-2">
            <span className="font-semibold">
              Total: {formatUsd(pedido.totalUsd)}
              {pedido.itemsPorConsultar > 0 && ` + ${pedido.itemsPorConsultar} a consultar`}
            </span>
            <Link href="/cotizador" className="inline-flex items-center gap-1 font-medium text-forest-700 hover:underline">
              <ClipboardList className="size-3.5" aria-hidden />
              Ver pedido
            </Link>
          </div>
        </div>
      );
    }

    case "tool-preparar_envio": {
      if (part.state !== "output-available" || !part.output.listo) return null;
      return (
        <a
          href={part.output.whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 rounded-xl bg-forest-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-forest-500/25 hover:bg-forest-600"
        >
          <MessageCircle className="size-4" aria-hidden />
          Enviar pedido por WhatsApp · {formatUsd(part.output.pedido.totalUsd)}
        </a>
      );
    }

    default:
      return null;
  }
}
