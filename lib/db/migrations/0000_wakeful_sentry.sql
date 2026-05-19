CREATE TABLE "alert_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"watch_id" uuid,
	"snapshot_id" uuid,
	"channel" text NOT NULL,
	"status" text NOT NULL,
	"reason" text,
	"payload_json" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "billing_subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"provider" text DEFAULT 'stripe' NOT NULL,
	"provider_customer_id" text,
	"provider_subscription_id" text,
	"status" text DEFAULT 'free' NOT NULL,
	"plan_key" text DEFAULT 'free' NOT NULL,
	"current_period_end" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "risk_snapshots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"watch_id" uuid,
	"wallet_address" text NOT NULL,
	"chain_key" text NOT NULL,
	"protocol_key" text NOT NULL,
	"block_number" bigint,
	"health_factor" numeric,
	"health_factor_raw" text,
	"total_collateral_base" text,
	"total_debt_base" text,
	"current_liquidation_threshold" text,
	"ltv" text,
	"available_borrows_base" text,
	"risk_level" text NOT NULL,
	"danger_reason" text,
	"repay_to_target_base" text,
	"collateral_to_target_base" text,
	"raw_json" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text,
	"telegram_chat_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "watches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"wallet_address" text NOT NULL,
	"chain_key" text NOT NULL,
	"protocol_key" text NOT NULL,
	"min_health_factor" numeric DEFAULT '1.25' NOT NULL,
	"target_health_factor" numeric DEFAULT '1.40' NOT NULL,
	"telegram_chat_id" text,
	"alert_cooldown_minutes" integer DEFAULT 30 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_checked_at" timestamp with time zone,
	"last_alerted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "alert_events" ADD CONSTRAINT "alert_events_watch_id_watches_id_fk" FOREIGN KEY ("watch_id") REFERENCES "public"."watches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "alert_events" ADD CONSTRAINT "alert_events_snapshot_id_risk_snapshots_id_fk" FOREIGN KEY ("snapshot_id") REFERENCES "public"."risk_snapshots"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "billing_subscriptions" ADD CONSTRAINT "billing_subscriptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "risk_snapshots" ADD CONSTRAINT "risk_snapshots_watch_id_watches_id_fk" FOREIGN KEY ("watch_id") REFERENCES "public"."watches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "watches" ADD CONSTRAINT "watches_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "risk_snapshots_watch_created_idx" ON "risk_snapshots" USING btree ("watch_id","created_at");--> statement-breakpoint
CREATE INDEX "risk_snapshots_chain_protocol_created_idx" ON "risk_snapshots" USING btree ("chain_key","protocol_key","created_at");--> statement-breakpoint
CREATE INDEX "risk_snapshots_risk_created_idx" ON "risk_snapshots" USING btree ("risk_level","created_at");--> statement-breakpoint
CREATE INDEX "watches_active_last_checked_idx" ON "watches" USING btree ("is_active","last_checked_at");--> statement-breakpoint
CREATE INDEX "watches_identity_idx" ON "watches" USING btree ("wallet_address","chain_key","protocol_key");