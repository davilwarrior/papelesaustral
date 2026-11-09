import { and, count, desc, eq, gte, sql } from "drizzle-orm";
import type {
  NewWhatsAppMessage,
  WhatsAppConversation,
  WhatsAppConversationChanges,
  WhatsAppConversationRepository,
  WhatsAppStoredMessage,
} from "@/domain/repositories/whatsapp-conversation-repository";
import { getDb } from "../db/client";
import { whatsappConversations, whatsappMessages } from "../db/schema";

export class DrizzleWhatsAppConversationRepository implements WhatsAppConversationRepository {
  async getOrCreate(phone: string, contactName?: string | null): Promise<WhatsAppConversation> {
    const [row] = await getDb()
      .insert(whatsappConversations)
      .values({ phone, contactName: contactName ?? null })
      .onConflictDoUpdate({
        target: whatsappConversations.phone,
        // Conserva el nombre conocido si este evento no lo trae.
        set: {
          contactName: sql`coalesce(${contactName ?? null}, ${whatsappConversations.contactName})`,
          updatedAt: new Date(),
        },
      })
      .returning();
    return {
      phone: row.phone,
      contactName: row.contactName,
      cart: row.cart,
      botPausedUntil: row.botPausedUntil,
    };
  }

  async saveMessage(phone: string, message: NewWhatsAppMessage): Promise<number | null> {
    const [row] = await getDb()
      .insert(whatsappMessages)
      .values({
        phone,
        waMessageId: message.waMessageId ?? null,
        role: message.role,
        content: message.content,
      })
      .onConflictDoNothing({ target: whatsappMessages.waMessageId })
      .returning({ id: whatsappMessages.id });
    return row?.id ?? null;
  }

  async recentMessages(phone: string, limit: number): Promise<WhatsAppStoredMessage[]> {
    const rows = await getDb()
      .select({
        id: whatsappMessages.id,
        role: whatsappMessages.role,
        content: whatsappMessages.content,
        createdAt: whatsappMessages.createdAt,
      })
      .from(whatsappMessages)
      .where(eq(whatsappMessages.phone, phone))
      .orderBy(desc(whatsappMessages.id))
      .limit(limit);
    return rows.reverse();
  }

  async lastUserMessageId(phone: string): Promise<number | null> {
    const [row] = await getDb()
      .select({ id: whatsappMessages.id })
      .from(whatsappMessages)
      .where(and(eq(whatsappMessages.phone, phone), eq(whatsappMessages.role, "user")))
      .orderBy(desc(whatsappMessages.id))
      .limit(1);
    return row?.id ?? null;
  }

  async countUserMessagesSince(phone: string, since: Date): Promise<number> {
    const [row] = await getDb()
      .select({ total: count() })
      .from(whatsappMessages)
      .where(
        and(
          eq(whatsappMessages.phone, phone),
          eq(whatsappMessages.role, "user"),
          gte(whatsappMessages.createdAt, since),
        ),
      );
    return row?.total ?? 0;
  }

  async update(phone: string, changes: WhatsAppConversationChanges): Promise<void> {
    await getDb()
      .update(whatsappConversations)
      .set({ ...changes, cart: changes.cart ? { ...changes.cart } : undefined, updatedAt: new Date() })
      .where(eq(whatsappConversations.phone, phone));
  }
}
