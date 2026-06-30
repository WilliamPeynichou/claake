-- Add Stripe webhook idempotency and unique payment identifiers.

CREATE TABLE IF NOT EXISTS "stripe_webhook_events" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "event_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "processed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stripe_webhook_events_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "stripe_webhook_events_event_id_key" ON "stripe_webhook_events"("event_id");
CREATE INDEX IF NOT EXISTS "stripe_webhook_events_type_idx" ON "stripe_webhook_events"("type");

CREATE UNIQUE INDEX IF NOT EXISTS "purchases_stripe_payment_id_key"
ON "purchases"("stripe_payment_id")
WHERE "stripe_payment_id" IS NOT NULL;
