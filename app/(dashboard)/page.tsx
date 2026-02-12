import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function DashboardPage() {
    const session = await auth();
    if (!session?.user?.id) return null;

    const [promptCount, categoryCount, favoriteCount, recentPrompts] =
        await Promise.all([
            prisma.prompt.count({ where: { userId: session.user.id } }),
            prisma.category.count({ where: { userId: session.user.id } }),
            prisma.prompt.count({
                where: { userId: session.user.id, isFavorite: true },
            }),
            prisma.prompt.findMany({
                where: { userId: session.user.id },
                orderBy: { updatedAt: "desc" },
                take: 5,
                include: {
                    category: true,
                    versions: { take: 1, orderBy: { createdAt: "desc" } },
                    tags: { include: { tag: true } },
                },
            }),
        ]);

    return (
        <div className="animate-fade-in">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Dashboard</h1>
                    <p className="page-subtitle">
                        Welcome back, {session.user.name || session.user.email}
                    </p>
                </div>
                <Link href="/prompts/new" className="btn btn-primary">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    New Prompt
                </Link>
            </div>

            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-label">Total Prompts</div>
                    <div className="stat-value">{promptCount}</div>
                </div>
                <div className="stat-card">
                    <div className="stat-label">Categories</div>
                    <div className="stat-value">{categoryCount}</div>
                </div>
                <div className="stat-card">
                    <div className="stat-label">Favorites</div>
                    <div className="stat-value">{favoriteCount}</div>
                </div>
            </div>

            <div>
                <div className="page-header">
                    <h2 style={{ fontSize: "1.125rem", fontWeight: 600 }}>
                        Recent Prompts
                    </h2>
                    <Link href="/prompts" className="btn btn-ghost btn-sm">
                        View all →
                    </Link>
                </div>

                {recentPrompts.length === 0 ? (
                    <div className="empty-state">
                        <svg className="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
                            <path d="M14 2v6h6" />
                        </svg>
                        <h3 className="empty-state-title">No prompts yet</h3>
                        <p className="empty-state-description">
                            Create your first prompt to get started. Organize them with
                            categories and tags.
                        </p>
                        <Link href="/prompts/new" className="btn btn-primary">
                            Create your first prompt
                        </Link>
                    </div>
                ) : (
                    <div className="prompt-list">
                        {recentPrompts.map((prompt) => (
                            <Link
                                key={prompt.id}
                                href={`/prompts/${prompt.id}`}
                                className="prompt-item"
                            >
                                <div className="prompt-item-content">
                                    <div className="prompt-item-title">{prompt.title}</div>
                                    {prompt.description && (
                                        <div className="prompt-item-desc">
                                            {prompt.description}
                                        </div>
                                    )}
                                    <div className="prompt-item-meta">
                                        {prompt.category && (
                                            <span className="badge badge-accent">
                                                {prompt.category.name}
                                            </span>
                                        )}
                                        {prompt.versions[0] && (
                                            <span className="badge badge-model">
                                                {prompt.versions[0].modelTarget}
                                            </span>
                                        )}
                                        {prompt.tags.map((t) => (
                                            <span key={t.tagId} className="badge badge-default">
                                                {t.tag.name}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
