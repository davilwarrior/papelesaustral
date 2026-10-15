import { timingSafeEqual } from "node:crypto";
import { revalidatePath } from "next/cache";
import type { SyncTrigger } from "@/application/catalog-sync/sync-catalog";
import { runCatalogSync } from "@/infrastructure/catalog-sync";

export const maxDuration = 60;

function hasValidToken(request: Request, secret: string | undefined): boolean {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  if (!secret || !token) return false;
  const a = Buffer.from(token);
  const b = Buffer.from(secret);
  return a.length === b.length && timingSafeEqual(a, b);
}

async function handle(trigger: SyncTrigger) {
  try {
    const result = await runCatalogSync(trigger);
    revalidatePath("/cotizador");
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
  if (!hasValidToken(request, process.env.SYNC_WEBHOOK_SECRET)) {
    return Response.json({ ok: false, error: "No autorizado" }, { status: 401 });
  }
  return handle("webhook");
}

/** Cron diario de Vercel (envía Authorization: Bearer CRON_SECRET). */
export async function GET(request: Request) {
  if (!hasValidToken(request, process.env.CRON_SECRET)) {
    return Response.json({ ok: false, error: "No autorizado" }, { status: 401 });
  }
  return handle("cron");
}
