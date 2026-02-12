import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
    const session = await auth();
    if (!session?.user?.id)
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const tags = await prisma.tag.findMany({
        where: { userId: session.user.id },
        orderBy: { name: "asc" },
        include: {
            _count: { select: { prompts: true } },
        },
    });

    return NextResponse.json(tags);
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

    const existing = await prisma.tag.findFirst({
        where: { userId: session.user.id, name: body.name.toLowerCase() },
    });

    if (existing) {
        return NextResponse.json(existing);
    }

    const tag = await prisma.tag.create({
        data: {
            name: body.name.toLowerCase(),
            userId: session.user.id,
        },
    });

    return NextResponse.json(tag, { status: 201 });
}
