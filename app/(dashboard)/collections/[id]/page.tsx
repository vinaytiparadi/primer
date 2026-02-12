import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function CollectionDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const session = await auth();
    if (!session?.user?.id) return null;

    const { id } = await params;

    const collection = await prisma.collection.findFirst({
        where: { id, userId: session.user.id },
        include: {
            prompts: {
                orderBy: { sortOrder: "asc" },
                include: {
                    prompt: {
                        include: {
                            category: true,
                            versions: { take: 1, orderBy: { createdAt: "desc" } },
                            tags: { include: { tag: true } },
                        },
                    },
                },
            },
        },
    });

    if (!collection) return notFound();

    return (
        <div className="animate-fade-in">
            <div style={{ marginBottom: "var(--space-4)" }}>
                <Link href="/collections" className="btn btn-ghost btn-sm">
                    ← Back to Collections
                </Link>
            </div>

            <div className="page-header">
                <div>
                    <h1 className="page-title">{collection.name}</h1>
                    {collection.description && <p className="page-subtitle">{collection.description}</p>}
                </div>
            </div>

            {collection.prompts.length === 0 ? (
                <div className="empty-state">
                    <h3 className="empty-state-title">Empty collection</h3>
                    <p className="empty-state-description">Add prompts to this collection from the prompt detail page.</p>
                </div>
            ) : (
                <div className="prompt-list">
                    {collection.prompts.map((cp) => (
                        <Link key={cp.promptId} href={`/prompts/${cp.promptId}`} className="prompt-item">
                            <div className="prompt-item-content">
                                <div className="prompt-item-title">{cp.prompt.title}</div>
                                {cp.prompt.description && <div className="prompt-item-desc">{cp.prompt.description}</div>}
                                <div className="prompt-item-meta">
                                    {cp.prompt.category && <span className="badge badge-accent">{cp.prompt.category.name}</span>}
                                    {cp.prompt.versions[0] && <span className="badge badge-model">{cp.prompt.versions[0].modelTarget}</span>}
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
