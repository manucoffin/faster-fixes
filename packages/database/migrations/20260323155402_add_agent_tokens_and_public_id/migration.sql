/*
  Warnings:

  - A unique constraint covering the columns `[publicId]` on the table `project` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `publicId` to the `project` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "project" ADD COLUMN     "publicId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "agent_token" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "tokenLastFour" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "scopes" TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastUsedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "agent_token_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agent_audit_log" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "agentTokenId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "resourceId" TEXT,
    "metadata" JSONB,
    "statusCode" INTEGER NOT NULL,
    "ipAddress" TEXT,

    CONSTRAINT "agent_audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "agent_token_tokenHash_key" ON "agent_token"("tokenHash");

-- CreateIndex
CREATE INDEX "agent_token_organizationId_idx" ON "agent_token"("organizationId");

-- CreateIndex
CREATE INDEX "agent_token_tokenHash_idx" ON "agent_token"("tokenHash");

-- CreateIndex
CREATE INDEX "agent_audit_log_agentTokenId_idx" ON "agent_audit_log"("agentTokenId");

-- CreateIndex
CREATE INDEX "agent_audit_log_createdAt_idx" ON "agent_audit_log"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "project_publicId_key" ON "project"("publicId");

-- CreateIndex
CREATE INDEX "project_publicId_idx" ON "project"("publicId");

-- AddForeignKey
ALTER TABLE "agent_token" ADD CONSTRAINT "agent_token_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_audit_log" ADD CONSTRAINT "agent_audit_log_agentTokenId_fkey" FOREIGN KEY ("agentTokenId") REFERENCES "agent_token"("id") ON DELETE CASCADE ON UPDATE CASCADE;
