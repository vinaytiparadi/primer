"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Category {
    id: string;
    name: string;
}

export default function NewPromptPage() {
    const router = useRouter();
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [content, setContent] = useState("");
    const [systemPrompt, setSystemPrompt] = useState("");
    const [modelTarget, setModelTarget] = useState("universal");
    const [categoryId, setCategoryId] = useState("");
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        fetch("/api/categories")
            .then((r) => r.json())
            .then((data) => setCategories(data));
    }, []);

    const tokenEstimate = Math.ceil(content.length / 4);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!title.trim() || !content.trim()) {
            setError("Title and content are required");
            return;
        }
        setError("");
        setLoading(true);

        const res = await fetch("/api/prompts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                title,
                description: description || null,
                content,
                systemPrompt: systemPrompt || null,
                modelTarget,
                categoryId: categoryId || null,
            }),
        });

        if (!res.ok) {
            const data = await res.json();
            setError(data.error || "Failed to create prompt");
            setLoading(false);
            return;
        }

        const prompt = await res.json();
        router.push(`/prompts/${prompt.id}`);
    }

    return (
        <div className="animate-fade-in" style={{ maxWidth: 720 }}>
            <div className="page-header">
                <div>
                    <h1 className="page-title">New Prompt</h1>
                    <p className="page-subtitle">Create a new AI prompt</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "var(--space-5)" }}>
                {error && <div className="auth-error">{error}</div>}

                <div className="form-group">
                    <label htmlFor="title" className="form-label">Title</label>
                    <input
                        id="title"
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="form-input"
                        placeholder="e.g. Code Review Prompt"
                        required
                        autoFocus
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="description" className="form-label">Description (optional)</label>
                    <input
                        id="description"
                        type="text"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="form-input"
                        placeholder="Brief description of what this prompt does"
                    />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-4)" }}>
                    <div className="form-group">
                        <label htmlFor="model" className="form-label">Target Model</label>
                        <select
                            id="model"
                            value={modelTarget}
                            onChange={(e) => setModelTarget(e.target.value)}
                            className="form-input form-select"
                        >
                            <option value="universal">Universal</option>
                            <option value="claude">Claude</option>
                            <option value="gpt-4">GPT-4</option>
                            <option value="gemini">Gemini</option>
                            <option value="other">Other</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label htmlFor="category" className="form-label">Category (optional)</label>
                        <select
                            id="category"
                            value={categoryId}
                            onChange={(e) => setCategoryId(e.target.value)}
                            className="form-input form-select"
                        >
                            <option value="">No category</option>
                            {categories.map((c) => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="form-group">
                    <label htmlFor="systemPrompt" className="form-label">System Prompt (optional)</label>
                    <textarea
                        id="systemPrompt"
                        value={systemPrompt}
                        onChange={(e) => setSystemPrompt(e.target.value)}
                        className="form-input form-textarea"
                        placeholder="System-level instructions for the AI…"
                        style={{ minHeight: 80 }}
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="content" className="form-label">Prompt Content</label>
                    <textarea
                        id="content"
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        className="form-input form-textarea prompt-editor-textarea"
                        placeholder="Write your prompt here. Use {{variable}} for template variables…"
                        required
                        style={{ minHeight: 200 }}
                    />
                    <div className="prompt-editor-footer">
                        <span>{content.length} characters</span>
                        <span>~{tokenEstimate} tokens</span>
                    </div>
                </div>

                <div style={{ display: "flex", gap: "var(--space-3)", justifyContent: "flex-end" }}>
                    <button type="button" className="btn btn-secondary" onClick={() => router.back()}>
                        Cancel
                    </button>
                    <button type="submit" className="btn btn-primary" disabled={loading}>
                        {loading ? "Creating…" : "Create Prompt"}
                    </button>
                </div>
            </form>
        </div>
    );
}
