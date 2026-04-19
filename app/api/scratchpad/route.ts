import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
    const session = await auth();
    if (!session?.user?.id)
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const scratchpad = await prisma.scratchpad.upsert({
        where: { userId: session.user.id },
        update: {},
        create: { userId: session.user.id, content: "" },
    });

    return NextResponse.json(scratchpad);
}

export async function PUT(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.id)
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const content = typeof body?.content === "string" ? body.content : undefined;
    const autoSave = typeof body?.autoSave === "boolean" ? body.autoSave : undefined;

    if (content === undefined && autoSave === undefined) {
        return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    const update: { content?: string; autoSave?: boolean } = {};
    if (content !== undefined) update.content = content;
    if (autoSave !== undefined) update.autoSave = autoSave;

    const scratchpad = await prisma.scratchpad.upsert({
        where: { userId: session.user.id },
        update,
        create: {
            userId: session.user.id,
            content: content ?? "",
            autoSave: autoSave ?? true,
        },
    });

    return NextResponse.json(scratchpad);
}
