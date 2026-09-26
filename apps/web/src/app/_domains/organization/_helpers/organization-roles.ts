export const ORGANIZATION_ROLES = {
  owner: "Owner",
  admin: "Admin",
  member: "Member",
} as const;

export function getRoleLabel(role: string): string {
  // Widened so an unknown role reads as `undefined` instead of being cast into a key.
  const labels: Record<string, string> = ORGANIZATION_ROLES;
  return labels[role] ?? role;
}

export function canManageMembers(role: string): boolean {
  return role === "owner" || role === "admin";
}

// Mirrors `authorizeBillingReference`, which refuses the billing portal to anyone else.
export function canManageBilling(role: string): boolean {
  return role === "owner";
}
