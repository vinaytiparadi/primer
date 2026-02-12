import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
    const session = await auth();
    if (!session?.user?.id)
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const collections = await prisma.collection.findMany({
        where: { userId: session.user.id },
        orderBy: { updatedAt: "desc" },
        include: {
            _count: { select: { prompts: true } },
        },
    });

    return NextResponse.json(collections);
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

    const collection = await prisma.collection.create({
        data: {
            name: body.name,
            description: body.description || null,
            userId: session.user.id,
        },
    });

    return NextResponse.json(collection, { status: 201 });
}
