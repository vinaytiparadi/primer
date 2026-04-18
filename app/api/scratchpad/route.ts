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
    const content = typeof body?.content === "string" ? body.content : "";

    const scratchpad = await prisma.scratchpad.upsert({
        where: { userId: session.user.id },
        update: { content },
        create: { userId: session.user.id, content },
    });

    return NextResponse.json(scratchpad);
}
