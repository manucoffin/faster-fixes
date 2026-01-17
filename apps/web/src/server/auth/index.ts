import { prisma } from "@workspace/db";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { admin, lastLoginMethod } from "better-auth/plugins";
import { customSessionPlugin } from "./plugins/custom-session";
import { organizationPlugin } from "./plugins/organization";
import { stripePlugin } from "./plugins/stripe";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  trustedOrigins: ["https://www.tobalgo.com", "https://tobalgo.com"],
  // emailAndPassword,
  // emailVerification,
  // databaseHooks,
  session: {
    // Cache the session value for 5 minutes
    // This avoid making database calls everytime we get the session
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // Cache duration in seconds
    },
  },
  user: {
    deleteUser: {
      enabled: true,
    },
  },
  plugins: [
    customSessionPlugin,
    admin(),
    organizationPlugin,
    stripePlugin,
    lastLoginMethod(),
    nextCookies(), // must be last plugin of the array
  ],
});
