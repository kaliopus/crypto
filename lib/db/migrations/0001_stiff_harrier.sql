DROP INDEX "watches_active_last_checked_idx";--> statement-breakpoint
ALTER TABLE "watches" ADD COLUMN "check_interval_minutes" integer DEFAULT 15 NOT NULL;--> statement-breakpoint
ALTER TABLE "watches" ADD COLUMN "next_check_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
CREATE INDEX "watches_active_next_check_idx" ON "watches" USING btree ("is_active","next_check_at");