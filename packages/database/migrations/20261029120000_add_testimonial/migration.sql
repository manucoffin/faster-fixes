-- CreateTable
CREATE TABLE "testimonial" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "statusChangedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "rating" INTEGER NOT NULL,
    "text" TEXT NOT NULL,
    "authorName" TEXT NOT NULL,
    "authorTitle" TEXT,
    "organizationName" TEXT NOT NULL,
    "websiteUrl" TEXT,
    "photoKey" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "consentAt" TIMESTAMP(3) NOT NULL,
    "testimonialRequestId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "organizationId" TEXT,

    CONSTRAINT "testimonial_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "testimonial_testimonialRequestId_key" ON "testimonial"("testimonialRequestId");

-- CreateIndex
CREATE INDEX "testimonial_status_createdAt_idx" ON "testimonial"("status", "createdAt");

-- CreateIndex
CREATE INDEX "testimonial_userId_idx" ON "testimonial"("userId");

-- CreateIndex
CREATE INDEX "testimonial_organizationId_idx" ON "testimonial"("organizationId");

-- AddForeignKey
ALTER TABLE "testimonial" ADD CONSTRAINT "testimonial_testimonialRequestId_fkey" FOREIGN KEY ("testimonialRequestId") REFERENCES "testimonial_request"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "testimonial" ADD CONSTRAINT "testimonial_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "testimonial" ADD CONSTRAINT "testimonial_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;
