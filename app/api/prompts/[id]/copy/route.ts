import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth();
    if (!session?.user?.id)
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;

    const original = await prisma.prompt.findFirst({
        where: { id, userId: session.user.id },
        include: {
            versions: true,
            tags: true,
        },
    });

    if (!original)
        return NextResponse.json({ error: "Not found" }, { status: 404 });

    const copy = await prisma.prompt.create({
        data: {
            title: `${original.title} (copy)`,
            description: original.description,
            categoryId: original.categoryId,
            userId: session.user.id,
            versions: {
                create: original.versions.map((v) => ({
                    versionLabel: v.versionLabel,
                    modelTarget: v.modelTarget,
                    content: v.content,
                    systemPrompt: v.systemPrompt,
                    variables: v.variables === null ? undefined : v.variables,
                    notes: v.notes,
                })),
            },
            tags: {
                create: original.tags.map((t) => ({ tagId: t.tagId })),
            },
        },
        include: {
            versions: true,
            tags: { include: { tag: true } },
            category: true,
        },
    });

    return NextResponse.json(copy, { status: 201 });
}
