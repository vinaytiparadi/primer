"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Prompt {
    id: string;
    title: string;
    description: string | null;
    isFavorite: boolean;
    usageCount: number;
    updatedAt: string;
    category: { id: string; name: string; color: string | null } | null;
    versions: { id: string; modelTarget: string; versionLabel: string }[];
    tags: { tag: { id: string; name: string } }[];
}

export default function PromptsPage() {
    const [prompts, setPrompts] = useState<Prompt[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [total, setTotal] = useState(0);

    useEffect(() => {
        fetchPrompts();
    }, []);

    async function fetchPrompts() {
        setLoading(true);
        const res = await fetch("/api/prompts");
        const data = await res.json();
        setPrompts(data.prompts || []);
        setTotal(data.total || 0);
        setLoading(false);
    }

    async function searchPrompts(q: string) {
        if (!q.trim()) {
            fetchPrompts();
            return;
        }
        setLoading(true);
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
        const data = await res.json();
        setPrompts(data.results || []);
        setTotal(data.results?.length || 0);
        setLoading(false);
    }

    async function toggleFavorite(e: React.MouseEvent, id: string, current: boolean) {
        e.preventDefault();
        e.stopPropagation();
        await fetch(`/api/prompts/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ isFavorite: !current }),
        });
        setPrompts((prev) =>
            prev.map((p) => (p.id === id ? { ...p, isFavorite: !current } : p))
        );
    }

    function copyContent(e: React.MouseEvent, prompt: Prompt) {
        e.preventDefault();
        e.stopPropagation();
        const content = prompt.versions[0]?.modelTarget
            ? prompt.versions.find((v) => v.modelTarget)
            : prompt.versions[0];
        if (content) {
            navigator.clipboard.writeText(prompt.title);
        }
    }

    return (
        <div className="animate-fade-in">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Prompts</h1>
                    <p className="page-subtitle">{total} prompts</p>
                </div>
                <Link href="/prompts/new" className="btn btn-primary">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    New Prompt
                </Link>
            </div>

            <div className="filter-bar">
                <div className="search-container" style={{ maxWidth: 360 }}>
                    <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="11" cy="11" r="8" />
                        <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                    <input
                        type="text"
                        className="search-input"
                        placeholder="Search prompts…"
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value);
                            searchPrompts(e.target.value);
                        }}
                    />
                </div>
            </div>

            {loading ? (
                <div className="prompt-list">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="prompt-item" style={{ cursor: "default" }}>
                            <div className="prompt-item-content">
                                <div className="skeleton" style={{ width: "60%", height: 18, marginBottom: 8 }} />
                                <div className="skeleton" style={{ width: "80%", height: 14 }} />
                            </div>
                        </div>
                    ))}
                </div>
            ) : prompts.length === 0 ? (
                <div className="empty-state">
                    <svg className="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
                        <path d="M14 2v6h6" />
                    </svg>
                    <h3 className="empty-state-title">
                        {search ? "No results found" : "No prompts yet"}
                    </h3>
                    <p className="empty-state-description">
                        {search
                            ? `No prompts match "${search}". Try different keywords.`
                            : "Create your first prompt to get started."}
                    </p>
                    {!search && (
                        <Link href="/prompts/new" className="btn btn-primary">
                            Create your first prompt
                        </Link>
                    )}
                </div>
            ) : (
                <div className="prompt-list">
                    {prompts.map((prompt) => (
                        <Link key={prompt.id} href={`/prompts/${prompt.id}`} className="prompt-item">
                            <div className="prompt-item-content">
                                <div className="prompt-item-title">{prompt.title}</div>
                                {prompt.description && (
                                    <div className="prompt-item-desc">{prompt.description}</div>
                                )}
                                <div className="prompt-item-meta">
                                    {prompt.category && (
                                        <span className="badge badge-accent">{prompt.category.name}</span>
                                    )}
                                    {prompt.versions.slice(0, 3).map((v) => (
                                        <span key={v.id} className="badge badge-model">
                                            {v.modelTarget}
                                        </span>
                                    ))}
                                    {prompt.tags.slice(0, 3).map((t) => (
                                        <span key={t.tag.id} className="badge badge-default">
                                            {t.tag.name}
                                        </span>
                                    ))}
                                </div>
                            </div>
                            <div className="prompt-item-actions">
                                <button
                                    className="btn btn-ghost btn-icon"
                                    onClick={(e) => toggleFavorite(e, prompt.id, prompt.isFavorite)}
                                    title={prompt.isFavorite ? "Unfavorite" : "Favorite"}
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill={prompt.isFavorite ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={prompt.isFavorite ? { color: "var(--color-warning)" } : {}}>
                                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                                    </svg>
                                </button>
                                <button className="btn btn-ghost btn-icon" onClick={(e) => copyContent(e, prompt)} title="Copy">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                                    </svg>
                                </button>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
