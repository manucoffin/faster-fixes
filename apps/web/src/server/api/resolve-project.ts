import { prisma } from "@workspace/db";
import crypto from "crypto";

/**
 * Resolves a project from an API key sent in the X-API-Key header.
 * Returns the project with its widget config, or null if not found.
 */
export async function resolveProject(apiKey: string | null) {
  if (!apiKey) return null;
  const hash = crypto.createHash("sha256").update(apiKey).digest("hex");
  return prisma.project.findFirst({
    where: { apiKeyHash: hash },
    include: { widgetConfig: true },
  });
}
