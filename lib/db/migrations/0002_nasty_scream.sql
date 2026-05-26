CREATE INDEX "alert_events_watch_id_idx" ON "alert_events" USING btree ("watch_id");--> statement-breakpoint
CREATE INDEX "alert_events_snapshot_id_idx" ON "alert_events" USING btree ("snapshot_id");--> statement-breakpoint
CREATE INDEX "billing_subscriptions_user_id_idx" ON "billing_subscriptions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "watches_user_id_idx" ON "watches" USING btree ("user_id");--> statement-breakpoint
REVOKE ALL ON TABLE "alert_events", "billing_subscriptions", "risk_snapshots", "users", "watches" FROM anon, authenticated;--> statement-breakpoint
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon, authenticated;--> statement-breakpoint
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM anon, authenticated;--> statement-breakpoint
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM anon, authenticated;--> statement-breakpoint
REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM anon, authenticated, public;
