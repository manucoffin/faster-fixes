export const ORGANIZATION_ROLES = {
  owner: "Owner",
  admin: "Admin",
  member: "Member",
} as const;

export type OrganizationRole = keyof typeof ORGANIZATION_ROLES;

export function getRoleLabel(role: string): string {
  return ORGANIZATION_ROLES[role as OrganizationRole] ?? role;
}

export function canManageMembers(role: string): boolean {
  return role === "owner" || role === "admin";
}

// Mirrors `authorizeBillingReference`, which refuses the billing portal to anyone else.
export function canManageBilling(role: string): boolean {
  return role === "owner";
}

export function canManageInvitations(role: string): boolean {
  return role === "owner" || role === "admin";
}
