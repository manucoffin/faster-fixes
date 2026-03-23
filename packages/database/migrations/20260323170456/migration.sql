/*
  Warnings:

  - You are about to drop the `agent_audit_log` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "agent_audit_log" DROP CONSTRAINT "agent_audit_log_agentTokenId_fkey";

-- DropTable
DROP TABLE "agent_audit_log";
