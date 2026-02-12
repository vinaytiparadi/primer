import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.id)
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const format = req.nextUrl.searchParams.get("format") ?? "json";

    const prompts = await prisma.prompt.findMany({
        where: { userId: session.user.id },
        include: {
            category: true,
            versions: true,
        },
        orderBy: { updatedAt: "desc" },
    });

    if (format === "csv") {
        const headers = "Title,Description,Category,Model,Content\n";
        const rows = prompts
            .map((p) => {
                const version = p.versions[0];
                return [
                    `"${(p.title || "").replace(/"/g, '""')}"`,
                    `"${(p.description || "").replace(/"/g, '""')}"`,
                    `"${p.category?.name || ""}"`,
                    `"${version?.modelTarget || ""}"`,
                    `"${(version?.content || "").replace(/"/g, '""')}"`,
                ].join(",");
            })
            .join("\n");

        return new NextResponse(headers + rows, {
            headers: {
                "Content-Type": "text/csv",
                "Content-Disposition": 'attachment; filename="primer-prompts.csv"',
            },
        });
    }

    const data = prompts.map((p) => ({
        title: p.title,
        description: p.description,
        category: p.category?.name || null,
        isFavorite: p.isFavorite,
        versions: p.versions.map((v) => ({
            label: v.versionLabel,
            model: v.modelTarget,
            content: v.content,
            systemPrompt: v.systemPrompt,
            notes: v.notes,
        })),
    }));

    return new NextResponse(JSON.stringify(data, null, 2), {
        headers: {
            "Content-Type": "application/json",
            "Content-Disposition": 'attachment; filename="primer-prompts.json"',
        },
    });
}
