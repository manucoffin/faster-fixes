/*
  Warnings:

  - You are about to drop the column `expiresAt` on the `rateLimit` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "rateLimit" DROP COLUMN "expiresAt";
