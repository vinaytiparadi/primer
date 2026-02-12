import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.id)
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const searchParams = req.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") ?? "1");
    const limit = parseInt(searchParams.get("limit") ?? "20");
    const categoryId = searchParams.get("category");
    const favorite = searchParams.get("favorite");
    const tag = searchParams.get("tag");
    const sort = searchParams.get("sort") ?? "updatedAt";

    const where = {
        userId: session.user.id,
        ...(categoryId && { categoryId }),
        ...(favorite === "true" && { isFavorite: true }),
        ...(tag && {
            tags: { some: { tag: { name: tag } } },
        }),
    };

    const orderBy =
        sort === "title"
            ? { title: "asc" as const }
            : sort === "usageCount"
                ? { usageCount: "desc" as const }
                : { updatedAt: "desc" as const };

    const [prompts, total] = await Promise.all([
        prisma.prompt.findMany({
            where,
            include: {
                category: true,
                versions: { orderBy: { createdAt: "asc" } },
                tags: { include: { tag: true } },
            },
            orderBy,
            skip: (page - 1) * limit,
            take: limit,
        }),
        prisma.prompt.count({ where }),
    ]);

    return NextResponse.json({
        prompts,
        total,
        page,
        totalPages: Math.ceil(total / limit),
    });
}

export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.id)
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();

    if (!body.title || !body.content) {
        return NextResponse.json(
            { error: "Title and content are required" },
            { status: 400 }
        );
    }

    const prompt = await prisma.prompt.create({
        data: {
            title: body.title,
            description: body.description,
            categoryId: body.categoryId || null,
            userId: session.user.id,
            versions: {
                create: {
                    versionLabel: "v1",
                    modelTarget: body.modelTarget ?? "universal",
                    content: body.content,
                    systemPrompt: body.systemPrompt || null,
                },
            },
            ...(body.tags?.length && {
                tags: {
                    create: body.tags.map((tagId: string) => ({ tagId })),
                },
            }),
        },
        include: {
            versions: true,
            tags: { include: { tag: true } },
            category: true,
        },
    });

    return NextResponse.json(prompt, { status: 201 });
}
