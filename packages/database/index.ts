import "dotenv/config";
import { createDatabaseAdapter } from "./adapter";
import { PrismaClient } from "./generated/prisma/client";

const adapter = createDatabaseAdapter();

const prisma = new PrismaClient({ adapter });

export { prisma };
