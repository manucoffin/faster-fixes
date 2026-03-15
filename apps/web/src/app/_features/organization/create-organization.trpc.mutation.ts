"use server";

import { generateUniqueSlug } from "@/app/_features/organization/_utils/generate-unique-slug";
import { protectedProcedure } from "@/server/trpc/trpc";
import { inferProcedureOutput } from "@trpc/server";
import { CreateOrganizationSchema } from "./create-organization.schema";

export const createOrganization = protectedProcedure
  .input(CreateOrganizationSchema)
  .mutation(async ({ input, ctx }) => {
    const { prisma, session } = ctx;

    const slug = await generateUniqueSlug(input.name);

    const org = await prisma.organization.create({
      data: {
        name: input.name,
        slug,
        members: {
          create: [
            {
              userId: session.user.id,
              role: "owner",
            },
          ],
        },
      },
    });

    return {
      id: org.id,
      name: org.name,
      slug: org.slug,
    };
  });

export type CreateOrganizationOutput = inferProcedureOutput<
  typeof createOrganization
>;
