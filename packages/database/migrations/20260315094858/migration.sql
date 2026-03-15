/*
  Warnings:

  - You are about to drop the column `logoAssetId` on the `organization` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "organization" DROP CONSTRAINT "organization_logoAssetId_fkey";

-- AlterTable
ALTER TABLE "organization" DROP COLUMN "logoAssetId";
