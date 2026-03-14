import { PrismaClient } from "../generated/prisma/client";

export async function cleanDatabase(prisma: PrismaClient) {
  const tables: { tablename: string }[] = await prisma.$queryRaw`
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public'
      AND tablename != '_prisma_migrations'
  `;

  const tableNames = tables.map((t) => t.tablename);

  if (tableNames.length > 0) {
    await prisma.$executeRawUnsafe(
      `TRUNCATE TABLE ${tableNames.map((name) => `"${name}"`).join(", ")} CASCADE`
    );
  }

  console.log(`Cleaned ${tableNames.length} tables: ${tableNames.join(", ")}`);
}
