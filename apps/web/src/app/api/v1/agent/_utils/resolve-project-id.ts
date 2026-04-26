/**
 * Resolves a project identifier (public ID or internal ID) to its internal ID,
 * scoped to the projects the agent token's organization owns.
 */
export function resolveProjectId(
  publicIdOrId: string,
  orgProjects: Array<{ id: string; publicId: string }>,
): string | null {
  const match = orgProjects.find(
    (p) => p.publicId === publicIdOrId || p.id === publicIdOrId,
  );
  return match?.id ?? null;
}
