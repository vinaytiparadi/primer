"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Collection {
    id: string;
    name: string;
    description: string | null;
    _count: { prompts: number };
    updatedAt: string;
}

export default function CollectionsPage() {
    const [collections, setCollections] = useState<Collection[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [creating, setCreating] = useState(false);

    useEffect(() => {
        fetchCollections();
    }, []);

    async function fetchCollections() {
        const res = await fetch("/api/collections");
        const data = await res.json();
        setCollections(data);
        setLoading(false);
    }

    async function createCollection(e: React.FormEvent) {
        e.preventDefault();
        if (!name.trim()) return;
        setCreating(true);
        await fetch("/api/collections", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, description: description || null }),
        });
        setName("");
        setDescription("");
        setShowCreate(false);
        setCreating(false);
        fetchCollections();
    }

    async function deleteCollection(id: string) {
        if (!confirm("Delete this collection?")) return;
        await fetch(`/api/collections/${id}`, { method: "DELETE" });
        fetchCollections();
    }

    return (
        <div className="animate-fade-in">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Collections</h1>
                    <p className="page-subtitle">Curated groups of prompts</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowCreate(!showCreate)}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    New Collection
                </button>
            </div>

            {showCreate && (
                <form onSubmit={createCollection} className="card animate-slide-up" style={{ marginBottom: "var(--space-6)" }}>
                    <h3 style={{ fontSize: "0.9375rem", fontWeight: 600, marginBottom: "var(--space-4)" }}>Create Collection</h3>
                    <div className="form-group">
                        <label className="form-label">Name</label>
                        <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="form-input" placeholder="e.g. My Best Prompts" required autoFocus />
                    </div>
                    <div className="form-group" style={{ marginTop: "var(--space-3)" }}>
                        <label className="form-label">Description (optional)</label>
                        <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} className="form-input" placeholder="What's this collection about?" />
                    </div>
                    <div style={{ display: "flex", gap: "var(--space-3)", justifyContent: "flex-end", marginTop: "var(--space-4)" }}>
                        <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowCreate(false)}>Cancel</button>
                        <button type="submit" className="btn btn-primary btn-sm" disabled={creating}>{creating ? "Creating…" : "Create"}</button>
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
            ) : collections.length === 0 ? (
                <div className="empty-state">
                    <svg className="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                        <polyline points="17 21 17 13 7 13 7 21" />
                    </svg>
                    <h3 className="empty-state-title">No collections yet</h3>
                    <p className="empty-state-description">Create collections to curate groups of related prompts.</p>
                </div>
            ) : (
                <div className="prompt-grid">
                    {collections.map((col) => (
                        <div key={col.id} className="card">
                            <div className="card-header">
                                <Link href={`/collections/${col.id}`} style={{ textDecoration: "none" }}>
                                    <div className="card-title">{col.name}</div>
                                </Link>
                                <button className="btn btn-ghost btn-icon btn-sm" onClick={() => deleteCollection(col.id)} title="Delete">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="3 6 5 6 21 6" />
                                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                    </svg>
                                </button>
                            </div>
                            {col.description && <p className="card-description">{col.description}</p>}
                            <div style={{ marginTop: "var(--space-3)", fontSize: "0.8125rem", color: "var(--text-tertiary)" }}>
                                {col._count.prompts} prompt{col._count.prompts !== 1 ? "s" : ""}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
