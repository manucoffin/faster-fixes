-- CreateTable
CREATE TABLE "project" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "apiKeyHash" TEXT NOT NULL,
    "apiKeyLastFour" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,

    CONSTRAINT "project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "widget_config" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "projectId" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#6366f1',
    "position" TEXT NOT NULL DEFAULT 'bottom-right',

    CONSTRAINT "widget_config_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reviewer" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "reviewer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "feedback" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "projectId" TEXT NOT NULL,
    "reviewerId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'new',
    "comment" TEXT NOT NULL,
    "pageUrl" TEXT NOT NULL,
    "clickX" DOUBLE PRECISION,
    "clickY" DOUBLE PRECISION,
    "selector" TEXT,
    "browserName" TEXT,
    "browserVersion" TEXT,
    "os" TEXT,
    "viewportWidth" INTEGER,
    "viewportHeight" INTEGER,
    "metadata" JSONB,
    "screenshotId" TEXT,

    CONSTRAINT "feedback_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "project_organizationId_idx" ON "project"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "widget_config_projectId_key" ON "widget_config"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "reviewer_token_key" ON "reviewer"("token");

-- CreateIndex
CREATE INDEX "reviewer_projectId_idx" ON "reviewer"("projectId");

-- CreateIndex
CREATE INDEX "feedback_projectId_idx" ON "feedback"("projectId");

-- CreateIndex
CREATE INDEX "feedback_reviewerId_idx" ON "feedback"("reviewerId");

-- AddForeignKey
ALTER TABLE "project" ADD CONSTRAINT "project_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "widget_config" ADD CONSTRAINT "widget_config_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviewer" ADD CONSTRAINT "reviewer_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feedback" ADD CONSTRAINT "feedback_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feedback" ADD CONSTRAINT "feedback_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "reviewer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feedback" ADD CONSTRAINT "feedback_screenshotId_fkey" FOREIGN KEY ("screenshotId") REFERENCES "assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;
