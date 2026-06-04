CREATE TABLE "codef_session" (
	"id" text PRIMARY KEY NOT NULL,
	"data_cipher" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "insurance_query_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_key" text NOT NULL,
	"queried_at" timestamp with time zone DEFAULT now() NOT NULL,
	"env" text NOT NULL,
	"name_masked" text,
	"contract_count" integer DEFAULT 0 NOT NULL,
	"total_premium" integer DEFAULT 0 NOT NULL,
	"payload_cipher" text NOT NULL
);
--> statement-breakpoint
CREATE INDEX "iqh_user_key_idx" ON "insurance_query_history" USING btree ("user_key");