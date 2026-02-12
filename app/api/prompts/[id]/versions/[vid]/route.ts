import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string; vid: string }> }
) {
    const session = await auth();
    if (!session?.user?.id)
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id, vid } = await params;
    const body = await req.json();

    const prompt = await prisma.prompt.findFirst({
        where: { id, userId: session.user.id },
    });

    if (!prompt)
        return NextResponse.json({ error: "Not found" }, { status: 404 });

    const version = await prisma.promptVersion.update({
        where: { id: vid },
        data: {
            ...(body.content !== undefined && { content: body.content }),
            ...(body.systemPrompt !== undefined && { systemPrompt: body.systemPrompt }),
            ...(body.modelTarget !== undefined && { modelTarget: body.modelTarget }),
            ...(body.versionLabel !== undefined && { versionLabel: body.versionLabel }),
            ...(body.notes !== undefined && { notes: body.notes }),
            ...(body.variables !== undefined && { variables: body.variables }),
            ...(body.isActive !== undefined && { isActive: body.isActive }),
        },
    });

    return NextResponse.json(version);
}

export async function DELETE(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string; vid: string }> }
) {
    const session = await auth();
    if (!session?.user?.id)
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id, vid } = await params;

    const prompt = await prisma.prompt.findFirst({
        where: { id, userId: session.user.id },
    });

    if (!prompt)
        return NextResponse.json({ error: "Not found" }, { status: 404 });

    await prisma.promptVersion.delete({ where: { id: vid } });

    return NextResponse.json({ success: true });
}
