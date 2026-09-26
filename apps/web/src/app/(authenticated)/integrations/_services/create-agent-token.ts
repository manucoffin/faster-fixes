import { ForbiddenError } from "@/server/errors/domain-errors";
import { prisma } from "@workspace/db";
import crypto from "crypto";
import type { CreateAgentTokenInput } from "./create-agent-token.schema";

export async function createAgentToken(
  {
    organizationId,
    name,
    scopes,
    userId,
  }: CreateAgentTokenInput & { userId: string },
  db: typeof prisma = prisma,
) {
  // The denial needs the loaded membership and its role, so it belongs here.
  const membership = await db.member.findFirst({
    where: {
      organizationId,
      userId,
      role: { in: ["owner", "admin"] },
    },
  });

  if (!membership) {
    throw new ForbiddenError("Access denied.");
  }

  const raw = `ff_agent_${crypto.randomBytes(32).toString("hex")}`;
  const hash = crypto.createHash("sha256").update(raw).digest("hex");
  const lastFour = raw.slice(-4);

  await db.agentToken.create({
    data: {
      name,
      tokenHash: hash,
      tokenLastFour: lastFour,
      organizationId,
      scopes,
    },
  });

  // The raw token is returned once and never stored in clear: only its SHA-256
  // hash and its last four characters are persisted.
  return { rawToken: raw };
}
