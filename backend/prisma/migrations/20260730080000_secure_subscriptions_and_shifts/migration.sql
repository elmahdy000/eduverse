-- Preserve financial attribution for subscription sales.
ALTER TABLE "customer_subscriptions"
  ADD COLUMN "invoiceId" UUID,
  ADD COLUMN "createdByUserId" UUID;

CREATE UNIQUE INDEX "customer_subscriptions_invoiceId_key"
  ON "customer_subscriptions"("invoiceId");
CREATE INDEX "customer_subscriptions_createdByUserId_idx"
  ON "customer_subscriptions"("createdByUserId");

ALTER TABLE "customer_subscriptions"
  ADD CONSTRAINT "customer_subscriptions_invoiceId_fkey"
  FOREIGN KEY ("invoiceId") REFERENCES "invoices"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "customer_subscriptions"
  ADD CONSTRAINT "customer_subscriptions_createdByUserId_fkey"
  FOREIGN KEY ("createdByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Enforce the business invariant even when multiple app instances race.
-- Reconcile duplicates created before the invariant existed: keep the newest
-- shift open and close each older shift at the next shift's start time.
WITH open_shifts AS (
  SELECT
    "id",
    "startTime",
    LEAD("startTime") OVER (
      PARTITION BY "userId" ORDER BY "startTime", "id"
    ) AS "nextStartTime"
  FROM "shifts"
  WHERE "status" = 'open'
), duplicate_open_shifts AS (
  SELECT * FROM open_shifts WHERE "nextStartTime" IS NOT NULL
)
UPDATE "shifts" AS shift_to_close
SET
  "status" = 'closed',
  "endTime" = GREATEST(
    shift_to_close."startTime",
    duplicate_open_shifts."nextStartTime"
  ),
  "notes" = CONCAT_WS(
    E'\n',
    NULLIF(shift_to_close."notes", ''),
    '[migration] Auto-closed duplicate open shift'
  )
FROM duplicate_open_shifts
WHERE shift_to_close."id" = duplicate_open_shifts."id";

CREATE UNIQUE INDEX "shifts_one_open_per_user_key"
  ON "shifts"("userId") WHERE "status" = 'open';
