import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth();
    if (!session?.user?.id)
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;

    const prompt = await prisma.prompt.findFirst({
        where: { id, userId: session.user.id },
        include: {
            category: true,
            versions: { orderBy: { createdAt: "desc" } },
            tags: { include: { tag: true } },
            collections: { include: { collection: true } },
        },
    });

    if (!prompt)
        return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Increment usage count
    await prisma.prompt.update({
        where: { id },
        data: { usageCount: { increment: 1 } },
    });

    return NextResponse.json(prompt);
}

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth();
    if (!session?.user?.id)
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const body = await req.json();

    const existing = await prisma.prompt.findFirst({
        where: { id, userId: session.user.id },
    });

    if (!existing)
        return NextResponse.json({ error: "Not found" }, { status: 404 });

    const prompt = await prisma.prompt.update({
        where: { id },
        data: {
            ...(body.title !== undefined && { title: body.title }),
            ...(body.description !== undefined && { description: body.description }),
            ...(body.categoryId !== undefined && { categoryId: body.categoryId || null }),
            ...(body.isFavorite !== undefined && { isFavorite: body.isFavorite }),
            ...(body.isPinned !== undefined && { isPinned: body.isPinned }),
        },
        include: {
            category: true,
            versions: { orderBy: { createdAt: "desc" } },
            tags: { include: { tag: true } },
        },
    });

    return NextResponse.json(prompt);
}

export async function DELETE(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth();
    if (!session?.user?.id)
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;

    const existing = await prisma.prompt.findFirst({
        where: { id, userId: session.user.id },
    });

    if (!existing)
        return NextResponse.json({ error: "Not found" }, { status: 404 });

    await prisma.prompt.delete({ where: { id } });

    return NextResponse.json({ success: true });
}
