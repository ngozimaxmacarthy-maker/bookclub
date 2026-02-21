import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import path from "path";

const globalForPrisma = globalThis as unknown as {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  prisma: any | undefined;
};

function createPrismaClient() {
  const dbUrl = process.env.DATABASE_URL ?? "file:./dev.db";
  const filePath = dbUrl.replace(/^file:/, "");
  const absolutePath = path.isAbsolute(filePath)
    ? filePath
    : path.join(process.cwd(), "prisma", path.basename(filePath));

  const adapter = new PrismaBetterSqlite3({ url: absolutePath });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return new (PrismaClient as any)({ adapter });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const prisma: PrismaClient = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
