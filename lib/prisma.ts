import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
        throw new Error("DATABASE_URL environment variable is not set");
    }
    // Optimization for Serverless (Vercel): 
    // Constrain the connection pool size per function instance. 
    // In serverless, it's highly recommended to use a connection pooler like PgBouncer or Prisma Accelerate.
    // Ensure your DATABASE_URL points to the pooled connection (e.g. Supabase pooler mode or Neon pooler).
    const pool = new pg.Pool({
        connectionString,
        max: process.env.NODE_ENV === "production" ? 1 : undefined
    });
    const adapter = new PrismaPg(pool);
    return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
