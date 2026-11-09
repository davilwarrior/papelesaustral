import {
  boolean,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import type { ProductFamilyId } from "@/domain/entities/product";

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
};

/** Secciones del catálogo (pestaña LINEAS). */
export const productLines = pgTable("product_lines", {
  /** Nombre de la sección normalizado: sin tildes, minúsculas. */
  key: text("key").primaryKey(),
  sourceName: text("source_name").notNull(),
  name: text("name").notNull(),
  familyId: text("family_id").$type<ProductFamilyId>().notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  ...timestamps,
});

/** Usos que cruzan familias (pestaña TAGS). */
export const tags = pgTable("tags", {
  name: text("name").primaryKey(),
  description: text("description").notNull().default(""),
  sortOrder: integer("sort_order").notNull().default(0),
  ...timestamps,
});

export const products = pgTable(
  "products",
  {
    /** Código SAMMI. */
    code: text("code").primaryKey(),
    description: text("description").notNull(),
    lineKey: text("line_key")
      .notNull()
      .references(() => productLines.key),
    brand: text("brand"),
    grammage: numeric("grammage", { precision: 7, scale: 1, mode: "number" }),
    size: text("size"),
    caliper: numeric("caliper", { precision: 5, scale: 1, mode: "number" }),
    thicknessMm: numeric("thickness_mm", { precision: 5, scale: 2, mode: "number" }),
    sheetsPerPack: integer("sheets_per_pack"),
    /** USD, precio final. null = "Consultar". */
    pricePerPack: numeric("price_per_pack", { precision: 10, scale: 2, mode: "number" }),
    tags: text("tags").array().notNull().default([]),
    /** false cuando el producto deja de estar en el Sheet (se conserva para pedidos antiguos). */
    active: boolean("active").notNull().default(true),
    /** Fila del Sheet en la última sincronización, para mantener el mismo orden. */
    sourceRow: integer("source_row").notNull(),
    lastSyncedAt: timestamp("last_synced_at", { withTimezone: true }).notNull(),
    ...timestamps,
  },
  (table) => [
    index("products_line_key_idx").on(table.lineKey),
    index("products_tags_idx").using("gin", table.tags),
  ],
);

export const syncRuns = pgTable("sync_runs", {
  id: serial("id").primaryKey(),
  trigger: text("trigger").$type<"manual" | "webhook" | "cron">().notNull(),
  status: text("status").$type<"running" | "success" | "failed">().notNull(),
  startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
  finishedAt: timestamp("finished_at", { withTimezone: true }),
  productsSynced: integer("products_synced").notNull().default(0),
  productsDeactivated: integer("products_deactivated").notNull().default(0),
  rowsExcluded: integer("rows_excluded").notNull().default(0),
  issues: jsonb("issues").notNull().default([]),
  error: text("error"),
});

/** Conversaciones de WhatsApp: una por número de cliente. */
export const whatsappConversations = pgTable("whatsapp_conversations", {
  /** Número del cliente, solo dígitos con código de país (593...). */
  phone: text("phone").primaryKey(),
  contactName: text("contact_name"),
  /** Pedido en curso: paquetes por código de producto. */
  cart: jsonb("cart").$type<Record<string, number>>().notNull().default({}),
  /** El bot no responde hasta esta fecha (atiende un asesor). */
  botPausedUntil: timestamp("bot_paused_until", { withTimezone: true }),
  lastHandoffAt: timestamp("last_handoff_at", { withTimezone: true }),
  ...timestamps,
});

/** Mensajes de WhatsApp: historial para el modelo y control de duplicados. */
export const whatsappMessages = pgTable(
  "whatsapp_messages",
  {
    id: serial("id").primaryKey(),
    phone: text("phone")
      .notNull()
      .references(() => whatsappConversations.phone, { onDelete: "cascade" }),
    /** wamid de Meta; único para ignorar reintentos del webhook. */
    waMessageId: text("wa_message_id").unique(),
    /** user = cliente, assistant = bot, agent = asesor desde la app. */
    role: text("role").$type<"user" | "assistant" | "agent">().notNull(),
    content: text("content").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("whatsapp_messages_phone_created_idx").on(table.phone, table.createdAt)],
);
