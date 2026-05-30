import { prisma } from "@workspace/db";
import crypto from "crypto";

/**
 * Resolves a Project from the identifier in the X-API-Key header.
 *
 * New installs send the public Project ID (`proj_...`), resolved directly by
 * publicId (indexed). Legacy installs send a `ff_...` API key, resolved by
 * SHA-256 hash; legacy resolutions are logged so the fallback — and the
 * apiKeyHash/apiKeyLastFour columns — can be retired once legacy usage reaches
 * zero. See docs/adr/0005-widget-identity-public-id-origin-auth.md.
 *
 * Returns the project with its widget config, or null if not found.
 */
export async function resolveProject(token: string | null) {
  if (!token) return null;

  if (token.startsWith("proj_")) {
    return prisma.project.findFirst({
      where: { publicId: token },
      include: { widgetConfig: true },
    });
  }

  // Legacy ff_ API key path — remove once legacy usage reaches zero.
  const hash = crypto.createHash("sha256").update(token).digest("hex");
  const project = await prisma.project.findFirst({
    where: { apiKeyHash: hash },
    include: { widgetConfig: true },
  });
  if (project) {
    console.warn(
      `[resolve-project] legacy ff_ API key resolved for project ${project.id} — migrate to publicId`,
    );
  }
  return project;
}
