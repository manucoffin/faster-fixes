// Internal accounts are the operator's own dogfooding and test Organizations:
// any Organization with a Member whose User holds the platform `admin` role.
// Every usage figure filters on this; billing figures never do. Plain Prisma
// where fragments, type-checked where the query spreads them.
const PLATFORM_ADMIN_ROLE = "admin";

export const nonInternalOrganizationWhere = {
  members: { none: { user: { role: PLATFORM_ADMIN_ROLE } } },
};

// `role` and `banned` are nullable, and SQL drops NULL rows from a bare `not`,
// so each exclusion spells out the NULL case.
export const nonInternalSignupWhere = {
  AND: [
    { OR: [{ role: null }, { role: { not: PLATFORM_ADMIN_ROLE } }] },
    { OR: [{ banned: null }, { banned: false }] },
    {
      members: {
        none: { organization: { NOT: nonInternalOrganizationWhere } },
      },
    },
  ],
};
