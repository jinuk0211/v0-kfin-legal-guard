CREATE TABLE "analysis_cache" (
	"cache_key" text PRIMARY KEY NOT NULL,
	"report_json" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
