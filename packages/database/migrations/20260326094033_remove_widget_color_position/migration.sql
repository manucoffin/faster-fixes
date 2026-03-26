/*
  Warnings:

  - You are about to drop the column `color` on the `widget_config` table. All the data in the column will be lost.
  - You are about to drop the column `position` on the `widget_config` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "widget_config" DROP COLUMN "color",
DROP COLUMN "position";
