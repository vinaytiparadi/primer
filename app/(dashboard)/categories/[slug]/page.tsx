import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function CategoryDetailPage({
    params,
}: {
    params: Promise<{ slug: string }>;
}) {
    const session = await auth();
    if (!session?.user?.id) return null;

    const { slug } = await params;

    const category = await prisma.category.findFirst({
        where: { userId: session.user.id, slug },
        include: {
            prompts: {
                orderBy: { updatedAt: "desc" },
                include: {
                    versions: { take: 1, orderBy: { createdAt: "desc" } },
                    tags: { include: { tag: true } },
                },
            },
        },
    });

    if (!category) return notFound();

    return (
        <div className="animate-fade-in">
            <div style={{ marginBottom: "var(--space-4)" }}>
                <Link href="/categories" className="btn btn-ghost btn-sm">
                    ← Back to Categories
                </Link>
            </div>

            <div className="page-header">
                <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
                    <div className="category-dot" style={{ width: 12, height: 12, background: category.color || "var(--accent-500)" }} />
                    <div>
                        <h1 className="page-title">{category.name}</h1>
                        {category.description && <p className="page-subtitle">{category.description}</p>}
                    </div>
                </div>
            </div>

            {category.prompts.length === 0 ? (
                <div className="empty-state">
                    <h3 className="empty-state-title">No prompts in this category</h3>
                    <p className="empty-state-description">Assign prompts to this category from the prompt editor.</p>
                    <Link href="/prompts/new" className="btn btn-primary">Create a prompt</Link>
                </div>
            ) : (
                <div className="prompt-list">
                    {category.prompts.map((prompt) => (
                        <Link key={prompt.id} href={`/prompts/${prompt.id}`} className="prompt-item">
                            <div className="prompt-item-content">
                                <div className="prompt-item-title">{prompt.title}</div>
                                {prompt.description && <div className="prompt-item-desc">{prompt.description}</div>}
                                <div className="prompt-item-meta">
                                    {prompt.versions[0] && (
                                        <span className="badge badge-model">{prompt.versions[0].modelTarget}</span>
                                    )}
                                    {prompt.tags.map((t) => (
                                        <span key={t.tag.id} className="badge badge-default">{t.tag.name}</span>
                                    ))}
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
