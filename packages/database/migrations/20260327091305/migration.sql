-- DropForeignKey
ALTER TABLE "github_installation" DROP CONSTRAINT "github_installation_installedById_fkey";

-- AlterTable
ALTER TABLE "github_installation" ALTER COLUMN "installedById" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "github_installation" ADD CONSTRAINT "github_installation_installedById_fkey" FOREIGN KEY ("installedById") REFERENCES "member"("id") ON DELETE SET NULL ON UPDATE CASCADE;
