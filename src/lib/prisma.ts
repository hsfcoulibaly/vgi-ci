import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import path from "path";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

function createPrisma() {
  const url = process.env.DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;

  // Production: use Turso cloud database
  if (url && url.startsWith("libsql://")) {
    const adapter = new PrismaLibSql({ url, authToken });
    return new PrismaClient({ adapter } as ConstructorParameters<typeof PrismaClient>[0]);
  }

  // Development: use local SQLite file
  const dbPath = path.resolve(process.cwd(), "dev.db");
  const adapter = new PrismaLibSql({ url: `file:${dbPath}` });
  return new PrismaClient({ adapter } as ConstructorParameters<typeof PrismaClient>[0]);
}

export const prisma = globalForPrisma.prisma || createPrisma();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
