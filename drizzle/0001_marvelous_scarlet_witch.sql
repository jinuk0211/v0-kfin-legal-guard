CREATE TABLE "registered_user" (
	"user_key" text PRIMARY KEY NOT NULL,
	"cred_cipher" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
