import { useActiveMember, useActiveOrganization } from "@/lib/auth";
import * as React from "react";

type OrgMember = {
  id: string;
  name: string | null;
  image: string | null;
};

export function useOrgMembers() {
  const { data: activeOrg } = useActiveOrganization();
  const { data: activeMember } = useActiveMember();

  const members: OrgMember[] = React.useMemo(() => {
    const raw = (activeOrg as Record<string, unknown> | undefined)
      ?.members as
      | Array<{
          id: string;
          userId: string;
          role: string;
          user: { id: string; name: string; email: string; image?: string };
        }>
      | undefined;

    return (
      raw?.map((m) => ({
        id: m.id,
        name: m.user.name || m.user.email,
        image: m.user.image ?? null,
      })) ?? []
    );
  }, [activeOrg]);

  const currentMemberId =
    ((activeMember as Record<string, unknown> | undefined)?.id as
      | string
      | undefined) ?? null;

  return { members, currentMemberId };
}
