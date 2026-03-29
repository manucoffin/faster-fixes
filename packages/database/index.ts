import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaNeon } from "@prisma/adapter-neon";
import "dotenv/config";
import { PrismaClient } from "./generated/prisma/client";

const connectionString = `${process.env.DATABASE_URL}`;

// Neon's serverless driver uses HTTP, avoiding TCP cold-start overhead in production.
// Fall back to the standard pg adapter for local development.
const adapter = process.env.NODE_ENV === "production"
  ? new PrismaNeon({ connectionString })
  : new PrismaPg({ connectionString });

const prisma = new PrismaClient({ adapter });

export { prisma };
