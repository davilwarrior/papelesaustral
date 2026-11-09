export type WhatsAppMessageRole = "user" | "assistant" | "agent";

export interface WhatsAppConversation {
  /** Solo dígitos, con código de país. */
  readonly phone: string;
  readonly contactName: string | null;
  /** Paquetes por código de producto. */
  readonly cart: Readonly<Record<string, number>>;
  /** Mientras esté en el futuro, atiende un asesor y el bot no responde. */
  readonly botPausedUntil: Date | null;
}

export interface WhatsAppStoredMessage {
  readonly id: number;
  readonly role: WhatsAppMessageRole;
  readonly content: string;
  readonly createdAt: Date;
}

export interface NewWhatsAppMessage {
  /** wamid de Meta; sirve para ignorar reintentos del webhook. */
  readonly waMessageId?: string | null;
  readonly role: WhatsAppMessageRole;
  readonly content: string;
}

export interface WhatsAppConversationChanges {
  readonly cart?: Readonly<Record<string, number>>;
  readonly botPausedUntil?: Date | null;
  readonly lastHandoffAt?: Date;
}

export interface WhatsAppConversationRepository {
  /** Devuelve la conversación del número, creándola si no existe. */
  getOrCreate(phone: string, contactName?: string | null): Promise<WhatsAppConversation>;
  /** Guarda el mensaje y devuelve su id, o null si ya estaba guardado (mensaje repetido). */
  saveMessage(phone: string, message: NewWhatsAppMessage): Promise<number | null>;
  /** Últimos mensajes desde una fecha, en orden cronológico. */
  recentMessages(phone: string, limit: number, since: Date): Promise<WhatsAppStoredMessage[]>;
  /** Reemplaza el texto de un mensaje (por ejemplo, con la transcripción de una nota de voz). */
  updateMessageContent(id: number, content: string): Promise<void>;
  /** Id del último mensaje del cliente, para saber si llegó otro mientras se respondía. */
  lastUserMessageId(phone: string): Promise<number | null>;
  countUserMessagesSince(phone: string, since: Date): Promise<number>;
  update(phone: string, changes: WhatsAppConversationChanges): Promise<void>;
}
