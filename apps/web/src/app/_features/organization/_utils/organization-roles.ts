export const ORGANIZATION_ROLES = {
  owner: "Propriétaire",
  admin: "Administrateur",
  member: "Membre",
} as const;

export type OrganizationRole = keyof typeof ORGANIZATION_ROLES;

export function getRoleLabel(role: string): string {
  return ORGANIZATION_ROLES[role as OrganizationRole] ?? role;
}

export function canManageMembers(role: string): boolean {
  return role === "owner" || role === "admin";
}

export function canManageInvitations(role: string): boolean {
  return role === "owner" || role === "admin";
}
