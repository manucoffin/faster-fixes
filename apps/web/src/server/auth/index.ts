import { prisma } from "@workspace/db";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { admin, lastLoginMethod } from "better-auth/plugins";
import { after } from "next/server";
import { databaseHooks } from "./config/database-hooks";
import { emailAndPassword } from "./config/email-and-password";
import { emailVerification } from "./config/email-verification";
import { customSessionPlugin } from "./plugins/custom-session";
import { organizationPlugin } from "./plugins/organization";
import { stripePlugin } from "./plugins/stripe";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  trustedOrigins: [
    `https://${process.env.DOMAIN_NAME}`,
    `https://www.${process.env.DOMAIN_NAME}`,
  ],
  emailAndPassword,
  emailVerification,
  databaseHooks,
  rateLimit: {
    enabled: true,
    storage: "database",
    customRules: {
      "/api/auth/sign-in/email": { window: 60, max: 5 },
      "/api/auth/sign-up/email": { window: 60, max: 3 },
      "/api/auth/change-password": { window: 60, max: 3 },
    },
  },
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60,
      strategy: "jwe",
    },
  },
  user: {
    changeEmail: {
      enabled: true,
    },
    deleteUser: {
      enabled: true,
    },
  },
  advanced: {
    ipAddress: {
      ipAddressHeaders: ["x-forwarded-for", "x-real-ip"],
      ipv6Subnet: 64,
    },
    backgroundTasks: {
      handler: (promise) => after(promise),
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
