import { openai, type OpenAILanguageModelResponsesOptions } from "@ai-sdk/openai";
import {
  convertToModelMessages,
  createUIMessageStreamResponse,
  isStepCount,
  safeValidateUIMessages,
  streamText,
  toUIMessageStream,
} from "ai";
import { buildAssistantInstructions } from "@/application/chat/assistant-instructions";
import {
  createAssistantTools,
  sanitizeCart,
  type AssistantUIMessage,
} from "@/application/chat/assistant-tools";
import { getCategories } from "@/application/use-cases/get-categories";
import { getProductCatalog } from "@/application/use-cases/get-product-catalog";
import { getSiteConfig } from "@/application/use-cases/get-site-config";
import type { ProductCatalog } from "@/domain/repositories/product-repository";
import {
  catalogRepository,
  productRepository,
  siteConfigRepository,
} from "@/infrastructure/container";

export const maxDuration = 60;

const MODEL = process.env.OPENAI_CHAT_MODEL || "gpt-5.4-mini";
/** Mensajes de historial que se envían al modelo; los más antiguos se descartan. */
const HISTORY_LIMIT = 24;
const MAX_MESSAGE_CHARS = 1500;
const MAX_CONVERSATION_MESSAGES = 80;
/** Peticiones por IP y minuto (por instancia del servidor; basta para frenar abusos simples). */
const RATE_LIMIT = 15;

const requestsByIp = new Map<string, number[]>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (requestsByIp.get(ip) ?? []).filter((t) => now - t < 60_000);
  recent.push(now);
  requestsByIp.set(ip, recent);
  if (requestsByIp.size > 5000) requestsByIp.clear();
  return recent.length > RATE_LIMIT;
}

/** El catálogo cambia solo al sincronizar el Sheet; 5 minutos evita una consulta por mensaje. */
let catalogCache: { value: Promise<ProductCatalog>; at: number } | null = null;

function loadCatalog(): Promise<ProductCatalog> {
  if (!catalogCache || Date.now() - catalogCache.at > 5 * 60_000) {
    const value = getProductCatalog(productRepository);
    value.catch(() => (catalogCache = null));
    catalogCache = { value, at: Date.now() };
  }
  return catalogCache.value;
}

function errorResponse(message: string, status: number) {
  return Response.json({ error: message }, { status });
}

export async function POST(request: Request) {
  if (!process.env.OPENAI_API_KEY) {
    console.error("[chat] Falta OPENAI_API_KEY");
    return errorResponse("El asistente no está disponible en este momento.", 503);
  }

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0].trim() || "local";
  if (isRateLimited(ip)) {
    return errorResponse("Estás enviando muchos mensajes. Espera un momento e intenta de nuevo.", 429);
  }

  const body = await request.json().catch(() => null);
  const validation = await safeValidateUIMessages<AssistantUIMessage>({ messages: body?.messages });
  if (!validation.success) return errorResponse("Mensajes inválidos.", 400);

  const messages = validation.data;
  const last = messages.at(-1);
  const lastText = last?.parts.map((p) => (p.type === "text" ? p.text : "")).join("") ?? "";
  if (last?.role !== "user" || lastText.length > MAX_MESSAGE_CHARS) {
    return errorResponse("El mensaje es demasiado largo.", 400);
  }
  if (messages.length > MAX_CONVERSATION_MESSAGES) {
    return errorResponse("La conversación es muy larga. Reiníciala para continuar.", 400);
  }

  const [site, catalog, categories] = await Promise.all([
    getSiteConfig(siteConfigRepository),
    loadCatalog(),
    getCategories(catalogRepository),
  ]);

  const cart = sanitizeCart(body?.cart, new Map(catalog.products.map((p) => [p.code, p])));
  const tools = createAssistantTools({
    catalog,
    whatsappNumber: site.contact.whatsappNumber,
    cart,
  });

  const result = streamText({
    model: openai(MODEL),
    instructions: buildAssistantInstructions({ site, catalog, categories, cartItems: cart.size }),
    messages: await convertToModelMessages(messages.slice(-HISTORY_LIMIT), { tools }),
    tools,
    stopWhen: isStepCount(6),
    reasoning: "low",
    maxOutputTokens: 1200,
    providerOptions: {
      openai: {
        store: false,
        textVerbosity: "low",
      } satisfies OpenAILanguageModelResponsesOptions,
    },
  });

  return createUIMessageStreamResponse({
    stream: toUIMessageStream({
      stream: result.stream,
      onError: (error) => {
        console.error("[chat] Error al generar la respuesta", error);
        return "No pude responder en este momento. Intenta de nuevo o escríbenos por WhatsApp.";
      },
    }),
  });
}
