"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";

interface SearchResult {
    id: string;
    title: string;
    description: string | null;
    category: { name: string } | null;
}

export default function CommandPalette() {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<SearchResult[]>([]);
    const [selected, setSelected] = useState(0);
    const [loading, setLoading] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const router = useRouter();

    const search = useCallback(async (q: string) => {
        if (!q.trim()) {
            setResults([]);
            return;
        }
        setLoading(true);
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
        const data = await res.json();
        setResults(data.results || []);
        setSelected(0);
        setLoading(false);
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => search(query), 200);
        return () => clearTimeout(timer);
    }, [query, search]);

    useEffect(() => {
        function handleKeyDown(e: KeyboardEvent) {
            if ((e.metaKey || e.ctrlKey) && e.key === "k") {
                e.preventDefault();
                setOpen((prev) => !prev);
            }

            if (!open) return;

            if (e.key === "Escape") {
                setOpen(false);
                setQuery("");
                setResults([]);
            }

            if (e.key === "ArrowDown") {
                e.preventDefault();
                setSelected((s) => Math.min(s + 1, results.length - 1));
            }

            if (e.key === "ArrowUp") {
                e.preventDefault();
                setSelected((s) => Math.max(s - 1, 0));
            }

            if (e.key === "Enter" && results[selected]) {
                e.preventDefault();
                router.push(`/prompts/${results[selected].id}`);
                setOpen(false);
                setQuery("");
                setResults([]);
            }
        }

        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [open, results, selected, router]);

    useEffect(() => {
        if (open) {
            setTimeout(() => inputRef.current?.focus(), 50);
        }
    }, [open]);

    if (!open) return null;

    return (
        <div
            className="command-palette-overlay"
            onClick={(e) => {
                if (e.target === e.currentTarget) {
                    setOpen(false);
                    setQuery("");
                    setResults([]);
                }
            }}
        >
            <div className="command-palette animate-slide-up">
                <input
                    ref={inputRef}
                    type="text"
                    className="command-palette-input"
                    placeholder="Search prompts…"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                />

                <div className="command-palette-results">
                    {loading && (
                        <div className="command-palette-empty">Searching…</div>
                    )}

                    {!loading && query && results.length === 0 && (
                        <div className="command-palette-empty">
                            No results for &ldquo;{query}&rdquo;
                        </div>
                    )}

                    {!loading && !query && (
                        <div className="command-palette-empty">
                            Type to search your prompts
                        </div>
                    )}

                    {results.map((result, i) => (
                        <div
                            key={result.id}
                            className={`command-palette-item ${i === selected ? "selected" : ""}`}
                            onClick={() => {
                                router.push(`/prompts/${result.id}`);
                                setOpen(false);
                                setQuery("");
                                setResults([]);
                            }}
                            onMouseEnter={() => setSelected(i)}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
                                <path d="M14 2v6h6" />
                            </svg>
                            <div className="command-palette-item-label">{result.title}</div>
                            {result.category && (
                                <span className="command-palette-item-hint">
                                    {result.category.name}
                                </span>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
