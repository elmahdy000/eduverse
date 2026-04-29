/*
  Warnings:

  - Made the column `customerId` on table `bar_orders` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "bar_orders" DROP CONSTRAINT "bar_orders_customerId_fkey";

-- Update existing NULL customerIds to use sessionId's customer
UPDATE "bar_orders"
SET "customerId" = (
  SELECT "customerId"
  FROM "sessions"
  WHERE "sessions"."id" = "bar_orders"."sessionId"
)
WHERE "customerId" IS NULL AND "sessionId" IS NOT NULL;

-- Delete any remaining bar_orders without a customer (edge case)
DELETE FROM "bar_orders" WHERE "customerId" IS NULL;

-- AlterTable
ALTER TABLE "bar_orders" ALTER COLUMN "customerId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "bar_orders" ADD CONSTRAINT "bar_orders_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
