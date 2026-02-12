import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth();
    if (!session?.user?.id)
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const body = await req.json();

    const existing = await prisma.category.findFirst({
        where: { id, userId: session.user.id },
    });

    if (!existing)
        return NextResponse.json({ error: "Not found" }, { status: 404 });

    const category = await prisma.category.update({
        where: { id },
        data: {
            ...(body.name !== undefined && { name: body.name, slug: slugify(body.name) }),
            ...(body.description !== undefined && { description: body.description }),
            ...(body.color !== undefined && { color: body.color }),
            ...(body.icon !== undefined && { icon: body.icon }),
            ...(body.sortOrder !== undefined && { sortOrder: body.sortOrder }),
        },
    });

    return NextResponse.json(category);
}

export async function DELETE(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth();
    if (!session?.user?.id)
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;

    const existing = await prisma.category.findFirst({
        where: { id, userId: session.user.id },
    });

    if (!existing)
        return NextResponse.json({ error: "Not found" }, { status: 404 });

    await prisma.category.delete({ where: { id } });

    return NextResponse.json({ success: true });
}
