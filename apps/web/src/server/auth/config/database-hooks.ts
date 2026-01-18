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
            error
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
    },
  },
};
