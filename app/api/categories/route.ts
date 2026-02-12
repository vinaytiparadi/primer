import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.id)
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const categories = await prisma.category.findMany({
        where: { userId: session.user.id },
        orderBy: { sortOrder: "asc" },
        include: {
            _count: { select: { prompts: true } },
        },
    });

    return NextResponse.json(categories);
}

export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.id)
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();

    if (!body.name) {
        return NextResponse.json(
            { error: "Name is required" },
            { status: 400 }
        );
    }

    const slug = slugify(body.name);

    const existing = await prisma.category.findFirst({
        where: { userId: session.user.id, slug },
    });

    if (existing) {
        return NextResponse.json(
            { error: "Category with this name already exists" },
            { status: 409 }
        );
    }

    const category = await prisma.category.create({
        data: {
            name: body.name,
            slug,
            description: body.description || null,
            color: body.color || null,
            icon: body.icon || null,
            userId: session.user.id,
        },
    });

    return NextResponse.json(category, { status: 201 });
}
