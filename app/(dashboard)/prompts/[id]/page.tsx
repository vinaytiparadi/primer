"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

interface Version {
    id: string;
    versionLabel: string;
    modelTarget: string;
    content: string;
    systemPrompt: string | null;
    notes: string | null;
    tokenEstimate: number | null;
    isActive: boolean;
    createdAt: string;
}

interface PromptData {
    id: string;
    title: string;
    description: string | null;
    isFavorite: boolean;
    isPinned: boolean;
    usageCount: number;
    category: { id: string; name: string; color: string | null } | null;
    versions: Version[];
    tags: { tag: { id: string; name: string } }[];
}

export default function PromptDetailPage() {
    const { id } = useParams();
    const router = useRouter();
    const [prompt, setPrompt] = useState<PromptData | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeVersion, setActiveVersion] = useState(0);
    const [editing, setEditing] = useState(false);
    const [editContent, setEditContent] = useState("");
    const [editSystem, setEditSystem] = useState("");
    const [copied, setCopied] = useState(false);
    const [saving, setSaving] = useState(false);

    const fetchPrompt = useCallback(async () => {
        const res = await fetch(`/api/prompts/${id}`);
        if (!res.ok) {
            router.push("/prompts");
            return;
        }
        const data = await res.json();
        setPrompt(data);
        setLoading(false);
    }, [id, router]);

    useEffect(() => {
        fetchPrompt();
    }, [fetchPrompt]);

    function startEdit(version: Version) {
        setEditContent(version.content);
        setEditSystem(version.systemPrompt || "");
        setEditing(true);
    }

    async function saveEdit() {
        if (!prompt) return;
        setSaving(true);
        const version = prompt.versions[activeVersion];
        await fetch(`/api/prompts/${id}/versions/${version.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                content: editContent,
                systemPrompt: editSystem || null,
            }),
        });
        setEditing(false);
        setSaving(false);
        fetchPrompt();
    }

    async function copyToClipboard() {
        if (!prompt) return;
        const version = prompt.versions[activeVersion];
        await navigator.clipboard.writeText(version.content);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }

    async function toggleFavorite() {
        if (!prompt) return;
        await fetch(`/api/prompts/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ isFavorite: !prompt.isFavorite }),
        });
        setPrompt({ ...prompt, isFavorite: !prompt.isFavorite });
    }

    async function deletePrompt() {
        if (!confirm("Delete this prompt? This cannot be undone.")) return;
        await fetch(`/api/prompts/${id}`, { method: "DELETE" });
        router.push("/prompts");
    }

    async function duplicatePrompt() {
        const res = await fetch(`/api/prompts/${id}/copy`, { method: "POST" });
        const data = await res.json();
        router.push(`/prompts/${data.id}`);
    }

    async function addVersion() {
        const modelTarget = window.prompt("Model target (e.g. claude, gpt-4, gemini, universal):", "universal");
        if (!modelTarget) return;
        await fetch(`/api/prompts/${id}/versions`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                modelTarget,
                content: prompt?.versions[activeVersion]?.content || "Write your prompt here...",
            }),
        });
        fetchPrompt();
    }

    if (loading) {
        return (
            <div className="animate-fade-in" style={{ maxWidth: 800 }}>
                <div className="skeleton" style={{ width: "40%", height: 28, marginBottom: 12 }} />
                <div className="skeleton" style={{ width: "60%", height: 16, marginBottom: 32 }} />
                <div className="skeleton" style={{ width: "100%", height: 200 }} />
            </div>
        );
    }

    if (!prompt) return null;

    const currentVersion = prompt.versions[activeVersion];

    return (
        <div className="animate-fade-in" style={{ maxWidth: 800 }}>
            <div style={{ marginBottom: "var(--space-4)" }}>
                <Link href="/prompts" className="btn btn-ghost btn-sm" style={{ marginBottom: "var(--space-4)" }}>
                    ← Back to Prompts
                </Link>
            </div>

            <div className="page-header">
                <div>
                    <h1 className="page-title">{prompt.title}</h1>
                    {prompt.description && <p className="page-subtitle">{prompt.description}</p>}
                    <div style={{ display: "flex", gap: "var(--space-2)", marginTop: "var(--space-2)", flexWrap: "wrap" }}>
                        {prompt.category && <span className="badge badge-accent">{prompt.category.name}</span>}
                        {prompt.tags.map((t) => (
                            <span key={t.tag.id} className="badge badge-default">{t.tag.name}</span>
                        ))}
                        <span className="badge badge-model">Used {prompt.usageCount}×</span>
                    </div>
                </div>

                <div style={{ display: "flex", gap: "var(--space-2)" }}>
                    <button className="btn btn-ghost btn-icon" onClick={toggleFavorite} title={prompt.isFavorite ? "Unfavorite" : "Favorite"}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill={prompt.isFavorite ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={prompt.isFavorite ? { color: "var(--color-warning)" } : {}}>
                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                        </svg>
                    </button>
                    <button className="btn btn-ghost btn-sm" onClick={duplicatePrompt}>Duplicate</button>
                    <button className="btn btn-danger btn-sm" onClick={deletePrompt}>Delete</button>
                </div>
            </div>

            {/* Version Tabs */}
            <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", marginBottom: "var(--space-4)" }}>
                <div className="version-tabs" style={{ flex: 1 }}>
                    {prompt.versions.map((v, i) => (
                        <button
                            key={v.id}
                            className={`version-tab ${i === activeVersion ? "active" : ""}`}
                            onClick={() => { setActiveVersion(i); setEditing(false); }}
                        >
                            <span>{v.versionLabel}</span>
                            <span className="badge badge-model" style={{ fontSize: "0.625rem", height: 18 }}>
                                {v.modelTarget}
                            </span>
                        </button>
                    ))}
                </div>
                <button className="btn btn-secondary btn-sm" onClick={addVersion}>
                    + Version
                </button>
            </div>

            {/* Content Area */}
            {currentVersion && (
                <div className="card" style={{ marginBottom: "var(--space-4)" }}>
                    {currentVersion.systemPrompt && !editing && (
                        <div style={{ marginBottom: "var(--space-4)", padding: "var(--space-3)", background: "var(--bg-tertiary)", borderRadius: "var(--radius-md)", fontSize: "0.8125rem" }}>
                            <div style={{ fontWeight: 600, marginBottom: "var(--space-1)", color: "var(--text-secondary)" }}>System Prompt</div>
                            <div style={{ whiteSpace: "pre-wrap", color: "var(--text-primary)" }}>{currentVersion.systemPrompt}</div>
                        </div>
                    )}

                    {editing ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
                            <div className="form-group">
                                <label className="form-label">System Prompt</label>
                                <textarea
                                    value={editSystem}
                                    onChange={(e) => setEditSystem(e.target.value)}
                                    className="form-input form-textarea"
                                    style={{ minHeight: 80 }}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Content</label>
                                <textarea
                                    value={editContent}
                                    onChange={(e) => setEditContent(e.target.value)}
                                    className="form-input form-textarea prompt-editor-textarea"
                                    style={{ minHeight: 200 }}
                                    autoFocus
                                />
                                <div className="prompt-editor-footer">
                                    <span>{editContent.length} characters</span>
                                    <span>~{Math.ceil(editContent.length / 4)} tokens</span>
                                </div>
                            </div>
                            <div style={{ display: "flex", gap: "var(--space-3)", justifyContent: "flex-end" }}>
                                <button className="btn btn-secondary btn-sm" onClick={() => setEditing(false)}>Cancel</button>
                                <button className="btn btn-primary btn-sm" onClick={saveEdit} disabled={saving}>
                                    {saving ? "Saving…" : "Save Changes"}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div style={{ whiteSpace: "pre-wrap", fontFamily: "'JetBrains Mono', monospace", fontSize: "0.875rem", lineHeight: 1.7 }}>
                                {currentVersion.content}
                            </div>
                            <div style={{ display: "flex", gap: "var(--space-3)", marginTop: "var(--space-4)", justifyContent: "flex-end" }}>
                                <button className="btn btn-ghost btn-sm" onClick={() => startEdit(currentVersion)}>
                                    Edit
                                </button>
                                <button className="btn btn-primary btn-sm" onClick={copyToClipboard}>
                                    {copied ? "✓ Copied!" : "Copy to Clipboard"}
                                </button>
                            </div>
                        </>
                    )}
                </div>
            )}

            {currentVersion?.notes && (
                <div style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>
                    <strong>Notes:</strong> {currentVersion.notes}
                </div>
            )}
        </div>
    );
}
