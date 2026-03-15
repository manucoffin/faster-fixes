-- AlterTable
ALTER TABLE "organization" ADD COLUMN     "logoAssetId" TEXT;

-- AddForeignKey
ALTER TABLE "organization" ADD CONSTRAINT "organization_logoAssetId_fkey" FOREIGN KEY ("logoAssetId") REFERENCES "assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;
