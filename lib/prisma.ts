import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
    const raw = process.env.DATABASE_URL;
    if (!raw) {
        throw new Error("DATABASE_URL environment variable is not set");
    }
    // Opt into libpq-compatible SSL semantics to silence pg-connection-string v3
    // migration warning. Matches how Neon's pooled connections expect to be used.
    const url = new URL(raw);
    if (!url.searchParams.has("uselibpqcompat")) {
        url.searchParams.set("uselibpqcompat", "true");
    }
    const pool = new pg.Pool({
        connectionString: url.toString(),
        max: process.env.NODE_ENV === "production" ? 1 : undefined
    });
    const adapter = new PrismaPg(pool);
    return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
