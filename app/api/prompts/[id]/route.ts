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
            versions: { orderBy: { createdAt: "asc" } },
        },
    });

    if (!prompt)
        return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Increment usage count without updating updatedAt
    // Using raw SQL to avoid Prisma's @updatedAt auto-update behavior
    await prisma.$executeRaw`UPDATE prompts SET "usageCount" = "usageCount" + 1 WHERE id = ${id}`;

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

    const contentFields: Record<string, unknown> = {};
    const metadataFields: Record<string, unknown> = {};

    // Content changes - these SHOULD update updatedAt
    if (body.title !== undefined) contentFields.title = body.title;
    if (body.description !== undefined) contentFields.description = body.description;

    // Metadata changes - these should NOT update updatedAt
    if (body.isFavorite !== undefined) metadataFields.isFavorite = body.isFavorite;
    if (body.isPinned !== undefined) metadataFields.isPinned = body.isPinned;
    if (body.categoryId !== undefined) metadataFields.categoryId = body.categoryId || null;

    // Apply metadata changes via raw SQL to avoid @updatedAt trigger
    if (Object.keys(metadataFields).length > 0) {
        const setClauses: string[] = [];
        const values: unknown[] = [];

        if (metadataFields.isFavorite !== undefined) {
            setClauses.push(`"isFavorite" = $${values.length + 1}`);
            values.push(metadataFields.isFavorite);
        }
        if (metadataFields.isPinned !== undefined) {
            setClauses.push(`"isPinned" = $${values.length + 1}`);
            values.push(metadataFields.isPinned);
        }
        if (metadataFields.categoryId !== undefined) {
            setClauses.push(`"categoryId" = $${values.length + 1}`);
            values.push(metadataFields.categoryId);
        }

        if (setClauses.length > 0) {
            const query = `UPDATE prompts SET ${setClauses.join(', ')} WHERE id = $${values.length + 1}`;
            await prisma.$executeRawUnsafe(query, ...values, id);
        }
    }

    // Apply content changes via Prisma update (this correctly updates updatedAt)
    if (Object.keys(contentFields).length > 0) {
        await prisma.prompt.update({
            where: { id },
            data: contentFields,
        });
    }

    // Fetch the updated prompt to return
    const prompt = await prisma.prompt.findFirst({
        where: { id },
        include: {
            category: true,
            versions: { orderBy: { createdAt: "asc" } },
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
