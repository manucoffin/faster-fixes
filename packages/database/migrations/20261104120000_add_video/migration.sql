-- AlterTable
ALTER TABLE "assets" ALTER COLUMN "size" SET DATA TYPE BIGINT;

-- AlterTable
ALTER TABLE "reviewer" ADD COLUMN     "videoId" TEXT;

-- AlterTable
ALTER TABLE "feedback" ADD COLUMN     "endMs" INTEGER,
ADD COLUMN     "frameHeight" DOUBLE PRECISION,
ADD COLUMN     "frameWidth" DOUBLE PRECISION,
ADD COLUMN     "frameX" DOUBLE PRECISION,
ADD COLUMN     "frameY" DOUBLE PRECISION,
ADD COLUMN     "startMs" INTEGER,
ADD COLUMN     "videoId" TEXT;

-- CreateTable
CREATE TABLE "video" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "projectId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "state" TEXT NOT NULL DEFAULT 'uploading',
    "size" BIGINT NOT NULL,
    "durationMs" INTEGER,
    "width" INTEGER,
    "height" INTEGER,
    "videoCodec" TEXT,
    "hasFastStart" BOOLEAN,
    "fileAssetId" TEXT,
    "posterAssetId" TEXT,
    "shareTokenHash" TEXT NOT NULL,
    "shareTokenEncrypted" TEXT NOT NULL,
    "annotationsOpen" BOOLEAN NOT NULL DEFAULT true,
    "uploadedById" TEXT,

    CONSTRAINT "video_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "video_shareTokenHash_key" ON "video"("shareTokenHash");

-- CreateIndex
CREATE INDEX "video_projectId_idx" ON "video"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "reviewer_videoId_name_key" ON "reviewer"("videoId", "name");

-- CreateIndex
CREATE INDEX "feedback_videoId_idx" ON "feedback"("videoId");

-- AddForeignKey
ALTER TABLE "reviewer" ADD CONSTRAINT "reviewer_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES "video"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feedback" ADD CONSTRAINT "feedback_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES "video"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "video" ADD CONSTRAINT "video_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "video" ADD CONSTRAINT "video_fileAssetId_fkey" FOREIGN KEY ("fileAssetId") REFERENCES "assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "video" ADD CONSTRAINT "video_posterAssetId_fkey" FOREIGN KEY ("posterAssetId") REFERENCES "assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "video" ADD CONSTRAINT "video_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
