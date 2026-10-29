-- CreateTable
CREATE TABLE "testimonial_request" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "token" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "feedbackCount" INTEGER NOT NULL,
    "firstEmailSentAt" TIMESTAMP(3),
    "reminderSentAt" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "userId" TEXT,
    "organizationId" TEXT,

    CONSTRAINT "testimonial_request_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "testimonial_request_token_key" ON "testimonial_request"("token");

-- CreateIndex
CREATE UNIQUE INDEX "testimonial_request_userId_key" ON "testimonial_request"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "testimonial_request_organizationId_key" ON "testimonial_request"("organizationId");

-- CreateIndex
CREATE INDEX "testimonial_request_status_idx" ON "testimonial_request"("status");

-- AddForeignKey
ALTER TABLE "testimonial_request" ADD CONSTRAINT "testimonial_request_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "testimonial_request" ADD CONSTRAINT "testimonial_request_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;
