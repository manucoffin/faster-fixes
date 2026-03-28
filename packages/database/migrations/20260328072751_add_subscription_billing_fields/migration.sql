-- AlterTable
ALTER TABLE "subscription" ADD COLUMN     "billingInterval" TEXT,
ADD COLUMN     "stripeScheduleId" TEXT;
