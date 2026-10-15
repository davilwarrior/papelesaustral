CREATE TABLE "product_lines" (
	"key" text PRIMARY KEY NOT NULL,
	"source_name" text NOT NULL,
	"name" text NOT NULL,
	"family_id" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "products" (
	"code" text PRIMARY KEY NOT NULL,
	"description" text NOT NULL,
	"line_key" text NOT NULL,
	"brand" text,
	"grammage" numeric(7, 1),
	"size" text,
	"caliper" numeric(5, 1),
	"thickness_mm" numeric(5, 2),
	"sheets_per_pack" integer,
	"price_per_pack" numeric(10, 2),
	"tags" text[] DEFAULT '{}' NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"source_row" integer NOT NULL,
	"last_synced_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sync_runs" (
	"id" serial PRIMARY KEY NOT NULL,
	"trigger" text NOT NULL,
	"status" text NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"finished_at" timestamp with time zone,
	"products_synced" integer DEFAULT 0 NOT NULL,
	"products_deactivated" integer DEFAULT 0 NOT NULL,
	"rows_excluded" integer DEFAULT 0 NOT NULL,
	"issues" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"error" text
);
--> statement-breakpoint
CREATE TABLE "tags" (
	"name" text PRIMARY KEY NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_line_key_product_lines_key_fk" FOREIGN KEY ("line_key") REFERENCES "public"."product_lines"("key") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "products_line_key_idx" ON "products" USING btree ("line_key");--> statement-breakpoint
CREATE INDEX "products_tags_idx" ON "products" USING gin ("tags");