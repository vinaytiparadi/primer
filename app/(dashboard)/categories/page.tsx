"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Category {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    color: string | null;
    _count: { prompts: number };
}

export default function CategoriesPage() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [color, setColor] = useState("#10b981");
    const [creating, setCreating] = useState(false);

    useEffect(() => {
        fetchCategories();
    }, []);

    async function fetchCategories() {
        const res = await fetch("/api/categories");
        const data = await res.json();
        setCategories(data);
        setLoading(false);
    }

    async function createCategory(e: React.FormEvent) {
        e.preventDefault();
        if (!name.trim()) return;
        setCreating(true);
        await fetch("/api/categories", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, description: description || null, color }),
        });
        setName("");
        setDescription("");
        setShowCreate(false);
        setCreating(false);
        fetchCategories();
    }

    async function deleteCategory(id: string) {
        if (!confirm("Delete this category? Prompts will become uncategorized.")) return;
        await fetch(`/api/categories/${id}`, { method: "DELETE" });
        fetchCategories();
    }

    return (
        <div className="animate-fade-in">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Categories</h1>
                    <p className="page-subtitle">Organize your prompts</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowCreate(!showCreate)}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    New Category
                </button>
            </div>

            {showCreate && (
                <form onSubmit={createCategory} className="card animate-slide-up" style={{ marginBottom: "var(--space-6)" }}>
                    <h3 style={{ fontSize: "0.9375rem", fontWeight: 600, marginBottom: "var(--space-4)" }}>Create Category</h3>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-4)" }}>
                        <div className="form-group">
                            <label className="form-label">Name</label>
                            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="form-input" placeholder="e.g. Coding" required autoFocus />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Color</label>
                            <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                                <input type="color" value={color} onChange={(e) => setColor(e.target.value)} style={{ width: 42, height: 42, border: "none", borderRadius: "var(--radius-md)", cursor: "pointer" }} />
                                <span style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>{color}</span>
                            </div>
                        </div>
                    </div>
                    <div className="form-group" style={{ marginTop: "var(--space-3)" }}>
                        <label className="form-label">Description (optional)</label>
                        <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} className="form-input" placeholder="Brief description" />
                    </div>
                    <div style={{ display: "flex", gap: "var(--space-3)", justifyContent: "flex-end", marginTop: "var(--space-4)" }}>
                        <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowCreate(false)}>Cancel</button>
                        <button type="submit" className="btn btn-primary btn-sm" disabled={creating}>
                            {creating ? "Creating…" : "Create"}
                        </button>
                    </div>
                </form>
            )}

            {loading ? (
                <div className="prompt-grid">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="card">
                            <div className="skeleton" style={{ width: "50%", height: 18, marginBottom: 8 }} />
                            <div className="skeleton" style={{ width: "30%", height: 14 }} />
                        </div>
                    ))}
                </div>
            ) : categories.length === 0 ? (
                <div className="empty-state">
                    <svg className="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                    </svg>
                    <h3 className="empty-state-title">No categories yet</h3>
                    <p className="empty-state-description">Create categories to organize your prompts.</p>
                </div>
            ) : (
                <div className="prompt-grid">
                    {categories.map((cat) => (
                        <div key={cat.id} className="card" style={{ position: "relative" }}>
                            <div className="card-header">
                                <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
                                    <div className="category-dot" style={{ background: cat.color || "var(--accent-500)" }} />
                                    <Link href={`/categories/${cat.slug}`} style={{ textDecoration: "none" }}>
                                        <div className="card-title">{cat.name}</div>
                                    </Link>
                                </div>
                                <button className="btn btn-ghost btn-icon btn-sm" onClick={() => deleteCategory(cat.id)} title="Delete">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="3 6 5 6 21 6" />
                                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                    </svg>
                                </button>
                            </div>
                            {cat.description && <p className="card-description">{cat.description}</p>}
                            <div style={{ marginTop: "var(--space-3)", fontSize: "0.8125rem", color: "var(--text-tertiary)" }}>
                                {cat._count.prompts} prompt{cat._count.prompts !== 1 ? "s" : ""}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
