import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth();
    if (!session?.user?.id)
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const body = await req.json();

    const prompt = await prisma.prompt.findFirst({
        where: { id, userId: session.user.id },
        include: { versions: true },
    });

    if (!prompt)
        return NextResponse.json({ error: "Not found" }, { status: 404 });

    const nextVersion = `v${prompt.versions.length + 1}`;

    const version = await prisma.promptVersion.create({
        data: {
            promptId: id,
            versionLabel: body.versionLabel ?? nextVersion,
            modelTarget: body.modelTarget ?? "universal",
            content: body.content,
            systemPrompt: body.systemPrompt || null,
            notes: body.notes || null,
            variables: body.variables || null,
        },
    });

    return NextResponse.json(version, { status: 201 });
}
