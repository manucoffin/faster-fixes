import { generateUniqueSlug } from "@/app/_features/organization/_utils/generate-unique-slug";
import { prisma } from "@workspace/db";
import type { BetterAuthOptions } from "better-auth";

export const databaseHooks: NonNullable<BetterAuthOptions["databaseHooks"]> = {
  user: {
    create: {
      after: async (user) => {
        // Create marketing preferences record
        await prisma.marketingPreferences.create({
          data: {
            userId: user.id,
            acceptsNewsletter: false,
            acceptsMarketing: false,
          },
        });

        // Generate a unique slug for the default organization
        const organizationSlug = await generateUniqueSlug("My organization");

        // Create a default organization for every new user
        await prisma.organization.create({
          data: {
            name: "My organization",
            slug: organizationSlug,
            isDefault: true,
            members: {
              create: [
                {
                  userId: user.id,
                  role: "owner",
                },
              ],
            },
          },
        });
      },
    },
    update: {
      // Better Auth passes the updated user directly, not { data, oldData }
      after: async (user) => {
        console.log(`[audit] user.updated userId=${user.id}`);
      },
    },
  },

  session: {
    create: {
      before: async (session) => {
        try {
          // Retrieve the user's default organization
          const defaultOrg = await prisma.organization.findFirst({
            where: {
              members: {
                some: {
                  userId: session.userId,
                },
              },
              isDefault: true,
            },
          });

          // Return the modified session with activeOrganizationId set
          // This directly modifies the session before database persistence
          return {
            data: {
              ...session,
              activeOrganizationId: defaultOrg?.id || null,
            },
          };
        } catch (error) {
          console.error(
            "Error setting default organization for user session:",
            error,
          );

          // Return session without active organization on error
          return {
            data: {
              ...session,
              activeOrganizationId: null,
            },
          };
        }
      },
      after: async (session) => {
        console.log(`[audit] session.created userId=${session.userId}`);
      },
    },
  },
};
