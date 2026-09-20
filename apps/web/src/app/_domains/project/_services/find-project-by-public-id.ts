import { prisma } from "@workspace/db";
import crypto from "crypto";

/**
 * The Project the identifier in the X-API-Key header belongs to, with its
 * widget config, or null when no Project matches.
 *
 * New installs send the Project public ID (`proj_...`), resolved directly by
 * publicId (indexed). Legacy installs send a `ff_...` API key, resolved by
 * SHA-256 hash; legacy resolutions are logged so the fallback — and the
 * apiKeyHash/apiKeyLastFour columns — can be retired once legacy usage reaches
 * zero. See docs/adr/0005-widget-identity-public-id-origin-auth.md.
 */
export async function findProjectByPublicId(token: string | null) {
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
      `[find-project-by-public-id] legacy ff_ API key resolved for project ${project.id}. Migrate to publicId`,
    );
  }
  return project;
}

export type FindProjectByPublicIdOutput = Awaited<
  ReturnType<typeof findProjectByPublicId>
>;
