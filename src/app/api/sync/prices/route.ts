import { timingSafeEqual } from "node:crypto";
import { revalidatePath } from "next/cache";
import type { SyncTrigger } from "@/application/catalog-sync/sync-catalog";
import { runCatalogSync } from "@/infrastructure/catalog-sync";
import { PRICE_LIST_PATHS } from "@/infrastructure/price-list";

export const maxDuration = 60;

/** Quita espacios y comillas que se cuelan al copiar el valor desde el .env. */
function cleanSecret(value: string | null | undefined): string {
  return (value ?? "").trim().replace(/^(["'])(.*)\1$/, "$2").trim();
}

function hasValidToken(request: Request, secretName: string): boolean {
  const secret = cleanSecret(process.env[secretName]);
  const token = cleanSecret(request.headers.get("authorization")?.replace(/^\s*Bearer\s+/i, ""));
  const a = Buffer.from(token);
  const b = Buffer.from(secret);
  const valid = secret !== "" && a.length === b.length && timingSafeEqual(a, b);
  if (!valid) {
    // Solo longitudes: suficiente para diagnosticar sin exponer el secreto.
    console.warn(`[sync] 401: ${secretName}`, {
      secretConfigured: secret !== "",
      secretLength: secret.length,
      tokenLength: token.length,
    });
  }
  return valid;
}

async function handle(trigger: SyncTrigger) {
  try {
    const result = await runCatalogSync(trigger);
    for (const path of ["/", "/cotizador", ...Object.values(PRICE_LIST_PATHS)]) {
      revalidatePath(path);
    }
    return Response.json({
      ok: true,
      runId: result.runId,
      productsSynced: result.productsSynced,
      productsDeactivated: result.productsDeactivated,
      rowsExcluded: result.rowsExcluded,
    });
  } catch (error) {
    console.error("[sync] Falló la sincronización", error);
    return Response.json(
      { ok: false, error: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 },
    );
  }
}

/** Webhook que llama Apps Script cuando se edita el Sheet. */
export async function POST(request: Request) {
  if (!hasValidToken(request, "SYNC_WEBHOOK_SECRET")) {
    return Response.json({ ok: false, error: "No autorizado" }, { status: 401 });
  }
  return handle("webhook");
}

/** Cron diario de Vercel (envía Authorization: Bearer CRON_SECRET). */
export async function GET(request: Request) {
  if (!hasValidToken(request, "CRON_SECRET")) {
    return Response.json({ ok: false, error: "No autorizado" }, { status: 401 });
  }
  return handle("cron");
}
