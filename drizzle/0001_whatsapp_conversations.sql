CREATE TABLE "whatsapp_conversations" (
	"phone" text PRIMARY KEY NOT NULL,
	"contact_name" text,
	"cart" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"bot_paused_until" timestamp with time zone,
	"last_handoff_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "whatsapp_messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"phone" text NOT NULL,
	"wa_message_id" text,
	"role" text NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "whatsapp_messages_wa_message_id_unique" UNIQUE("wa_message_id")
);
--> statement-breakpoint
ALTER TABLE "whatsapp_messages" ADD CONSTRAINT "whatsapp_messages_phone_whatsapp_conversations_phone_fk" FOREIGN KEY ("phone") REFERENCES "public"."whatsapp_conversations"("phone") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "whatsapp_messages_phone_created_idx" ON "whatsapp_messages" USING btree ("phone","created_at");