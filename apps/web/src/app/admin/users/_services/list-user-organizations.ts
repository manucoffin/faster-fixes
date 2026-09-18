import { prisma } from "@workspace/db";

export async function listUserOrganizations({ userId }: { userId: string }) {
  const members = await prisma.member.findMany({
    where: { userId },
    select: {
      organization: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
    },
  });

  return members.map((member) => ({
    id: member.organization.id,
    name: member.organization.name,
    slug: member.organization.slug,
  }));
}

export type ListUserOrganizationsOutput = Awaited<
  ReturnType<typeof listUserOrganizations>
>;
