import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
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

    const existing = await prisma.collection.findFirst({
        where: { id, userId: session.user.id },
    });

    if (!existing)
        return NextResponse.json({ error: "Not found" }, { status: 404 });

    const collection = await prisma.collection.update({
        where: { id },
        data: {
            ...(body.name !== undefined && { name: body.name }),
            ...(body.description !== undefined && { description: body.description }),
        },
    });

    return NextResponse.json(collection);
}

export async function DELETE(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth();
    if (!session?.user?.id)
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;

    const existing = await prisma.collection.findFirst({
        where: { id, userId: session.user.id },
    });

    if (!existing)
        return NextResponse.json({ error: "Not found" }, { status: 404 });

    await prisma.collection.delete({ where: { id } });

    return NextResponse.json({ success: true });
}
