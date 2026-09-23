/*
lib/prisma.ts

role:           Singleton Prisma 7 avec adaptateur SQLite. Évite de
                  recréer un client à chaque rechargement en dev.

  flow:           Importé par toutes les Server Actions et Server
                  Components. L'URL SQLite vient de DATABASE_URL.

  imports:        server-only, @prisma/adapter-better-sqlite3,
                  @/generated/prisma/client.

  structure:      - fonction createClient
                  - constante prisma (singleton)

  ecosysteme:     Lib

  usedBy:         app/actions/*, lib/auth/auth.ts, scripts.
*/

import "server-only";

import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "@/lib/generated/prisma/client";
import { env } from "@/lib/env";

function createClient() {
  const adapter = new PrismaBetterSqlite3({ url: env.DATABASE_URL });
  return new PrismaClient({ adapter });
}

const globalForPrisma = globalThis as unknown as {
  prisma?: ReturnType<typeof createClient>;
};

export const prisma = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;
