import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.id)
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const q = req.nextUrl.searchParams.get("q") ?? "";

    if (!q.trim()) {
        return NextResponse.json({ results: [] });
    }

    // Simple search using Prisma (works without pg_trgm extension)
    const results = await prisma.prompt.findMany({
        where: {
            userId: session.user.id,
            OR: [
                { title: { contains: q, mode: "insensitive" } },
                { description: { contains: q, mode: "insensitive" } },
                {
                    versions: {
                        some: { content: { contains: q, mode: "insensitive" } },
                    },
                },
            ],
        },
        include: {
            category: true,
            versions: { take: 1, orderBy: { createdAt: "desc" } },
        },
        orderBy: { updatedAt: "desc" },
        take: 20,
    });

    return NextResponse.json({ results });
}
