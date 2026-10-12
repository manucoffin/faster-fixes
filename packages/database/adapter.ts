import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaPg } from "@prisma/adapter-pg";

export function createDatabaseAdapter(env: NodeJS.ProcessEnv = process.env) {
  // Prisma connects on first query, so builds and injected tests need no database.
  const connectionString = env.DATABASE_URL ?? "";
  const hostname = URL.canParse(connectionString)
    ? new URL(connectionString).hostname.toLowerCase()
    : "";
  const provider =
    env.DATABASE_PROVIDER ??
    (hostname.endsWith(".neon.tech") ? "neon" : "postgres");

  switch (provider) {
    case "postgres":
      return new PrismaPg({ connectionString });
    case "neon":
      return new PrismaNeon({ connectionString });
    default:
      throw new Error(`Unsupported database provider: ${provider}`);
  }
}
