"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Check, Loader2, CloudOff, Save } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type SaveState = "idle" | "saving" | "saved" | "error";

export function ScratchpadEditor({
    initialContent,
    initialUpdatedAt,
    initialAutoSave,
}: {
    initialContent: string;
    initialUpdatedAt: string;
    initialAutoSave: boolean;
}) {
    const [content, setContent] = useState(initialContent);
    const [state, setState] = useState<SaveState>("idle");
    const [lastSaved, setLastSaved] = useState<Date | null>(null);
    const [now, setNow] = useState<Date | null>(null);
    const [innerWidth, setInnerWidth] = useState(0);
    const [wrapCounts, setWrapCounts] = useState<number[]>([]);
    const [autoSave, setAutoSave] = useState(initialAutoSave);
    const [dirty, setDirty] = useState(false);
    const [isMac, setIsMac] = useState(false);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const latestContentRef = useRef(initialContent);
    const inFlightRef = useRef(false);
    const pendingRef = useRef(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const mirrorRef = useRef<HTMLDivElement>(null);

    async function flush() {
        if (inFlightRef.current) {
            pendingRef.current = true;
            return;
        }
        inFlightRef.current = true;
        setState("saving");
        try {
            const res = await fetch("/api/scratchpad", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ content: latestContentRef.current }),
            });
            if (!res.ok) throw new Error("save failed");
            const data = await res.json();
            setLastSaved(data?.updatedAt ? new Date(data.updatedAt) : new Date());
            setDirty(false);
            setState("saved");
            if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
            savedTimerRef.current = setTimeout(() => setState("idle"), 1500);
        } catch {
            setState("error");
        } finally {
            inFlightRef.current = false;
            if (pendingRef.current) {
                pendingRef.current = false;
                flush();
            }
        }
    }

    function onChange(value: string) {
        setContent(value);
        latestContentRef.current = value;
        setDirty(true);
        if (!autoSave) {
            if (timerRef.current) clearTimeout(timerRef.current);
            return;
        }
        setState("saving");
        if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(flush, 600);
    }

    function saveNow() {
        if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
        }
        flush();
    }

    useEffect(() => {
        const el = textareaRef.current;
        if (el) {
            const end = el.value.length;
            el.focus();
            el.setSelectionRange(end, end);
            el.scrollIntoView({ block: "end", inline: "nearest" });
        }
        setLastSaved(new Date(initialUpdatedAt));
        setNow(new Date());
        setIsMac(/mac/i.test(navigator.platform));
        const id = setInterval(() => setNow(new Date()), 30_000);
        return () => {
            clearInterval(id);
            if (timerRef.current) clearTimeout(timerRef.current);
            if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
        };
    }, [initialUpdatedAt]);

    async function toggleAutoSave(next: boolean) {
        setAutoSave(next);
        try {
            await fetch("/api/scratchpad", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ autoSave: next }),
            });
        } catch {}
        if (next && dirty) {
            if (timerRef.current) clearTimeout(timerRef.current);
            flush();
        }
    }

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
                e.preventDefault();
                if (dirty) saveNow();
            }
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dirty]);

    useEffect(() => {
        const ta = textareaRef.current;
        if (!ta) return;
        const measure = () => {
            const cs = getComputedStyle(ta);
            const pl = parseFloat(cs.paddingLeft) || 0;
            const pr = parseFloat(cs.paddingRight) || 0;
            setInnerWidth(Math.max(0, ta.clientWidth - pl - pr));
        };
        measure();
        const ro = new ResizeObserver(measure);
        ro.observe(ta);
        return () => ro.disconnect();
    }, []);

    useLayoutEffect(() => {
        const mirror = mirrorRef.current;
        const ta = textareaRef.current;
        if (!mirror || !ta || innerWidth === 0) return;
        const cs = getComputedStyle(ta);
        const lineHeight = parseFloat(cs.lineHeight);
        if (!lineHeight) return;
        const lines = content.split("\n");
        const counts = lines.map((line) => {
            mirror.textContent = line === "" ? "\u00A0" : line;
            return Math.max(1, Math.round(mirror.scrollHeight / lineHeight));
        });
        setWrapCounts((prev) => {
            if (prev.length === counts.length && prev.every((v, i) => v === counts[i])) return prev;
            return counts;
        });
    }, [content, innerWidth]);

    const lineItems = useMemo(() => {
        const items: (number | null)[] = [];
        const lines = content.split("\n");
        lines.forEach((_, idx) => {
            items.push(idx + 1);
            const rows = wrapCounts[idx] ?? 1;
            for (let i = 1; i < rows; i++) items.push(null);
        });
        return items;
    }, [content, wrapCounts]);

    const parts = useMemo(() => parseLinks(content), [content]);

    const trimmed = content.trim();
    const wordCount = trimmed ? trimmed.split(/\s+/).length : 0;

    return (
        <div className="flex flex-col">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Scratchpad</h1>
                    <p className="text-muted-foreground">Paste, think, come back later.</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    {!autoSave && (
                        <Button
                            size="sm"
                            onClick={saveNow}
                            disabled={!dirty || state === "saving"}
                            title={isMac ? "Save (⌘S)" : "Save (Ctrl+S)"}
                            className="h-7 gap-1.5 text-xs"
                        >
                            <Save className="h-3 w-3" />
                            {state === "saving" ? "Saving" : "Save"}
                        </Button>
                    )}
                    <SaveIndicator state={state} dirty={dirty} autoSave={autoSave} />
                </div>
            </div>

            <div className="group relative overflow-hidden rounded-2xl bg-card/60 ring-1 ring-border/60 shadow-sm backdrop-blur-sm transition-all duration-200 focus-within:ring-primary/30 focus-within:shadow-md">
                <div
                    aria-hidden
                    className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent opacity-0 transition-opacity duration-300 group-focus-within:opacity-100"
                />
                <div
                    className="flex min-h-[60vh] cursor-text font-mono text-[14px] leading-6"
                    onMouseDown={(e) => {
                        const ta = textareaRef.current;
                        if (!ta || e.target === ta) return;
                        const target = e.target as HTMLElement;
                        if (target.closest("a")) return;
                        const rect = ta.getBoundingClientRect();
                        if (e.clientY <= rect.bottom) return;
                        e.preventDefault();
                        const end = ta.value.length;
                        ta.focus();
                        ta.setSelectionRange(end, end);
                    }}
                >
                    <div
                        aria-hidden
                        className="shrink-0 select-none border-r border-border/40 bg-muted/30 pt-4 pb-8 pl-4 pr-3 text-right text-muted-foreground/50 tabular-nums"
                    >
                        {lineItems.map((n, i) => (
                            <div key={i}>{n ?? "\u00A0"}</div>
                        ))}
                    </div>
                    <div className="relative flex-1 min-w-0">
                        <textarea
                            ref={textareaRef}
                            rows={Math.max(1, lineItems.length)}
                            value={content}
                            onChange={(e) => onChange(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Tab" && !e.shiftKey) {
                                    e.preventDefault();
                                    const ta = e.currentTarget;
                                    ta.setRangeText("\t", ta.selectionStart, ta.selectionEnd, "end");
                                    onChange(ta.value);
                                }
                            }}
                            placeholder="Start typing or paste anything here…"
                            className="block w-full resize-none bg-transparent pl-4 pr-5 pt-4 pb-8 outline-none text-transparent placeholder:text-muted-foreground/40 selection:bg-primary/20 break-all"
                            style={{ caretColor: "var(--color-foreground, currentColor)" }}
                            spellCheck={false}
                        />
                        <div
                            aria-hidden
                            className="pointer-events-none absolute inset-0 pl-4 pr-5 pt-4 pb-8 text-foreground break-all"
                            style={{ whiteSpace: "pre-wrap" }}
                        >
                            {parts.map((p, i) =>
                                p.type === "link" ? (
                                    <a
                                        key={i}
                                        href={p.value}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-primary underline underline-offset-2 decoration-primary/60 hover:decoration-primary"
                                        style={{ pointerEvents: "auto" }}
                                    >
                                        {p.value}
                                    </a>
                                ) : (
                                    <span key={i}>{p.value}</span>
                                )
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div
                ref={mirrorRef}
                aria-hidden
                className="font-mono text-[14px] leading-6 break-all"
                style={{
                    position: "absolute",
                    visibility: "hidden",
                    pointerEvents: "none",
                    left: "-9999px",
                    top: 0,
                    width: innerWidth > 0 ? `${innerWidth}px` : undefined,
                    whiteSpace: "pre-wrap",
                    boxSizing: "content-box",
                    padding: 0,
                    border: 0,
                }}
            />

            <footer className="flex flex-wrap items-center justify-between gap-3 pt-3 px-1 text-xs text-muted-foreground/70 tabular-nums">
                <span>
                    {wordCount} {wordCount === 1 ? "word" : "words"}
                    <span className="mx-2 text-muted-foreground/40">·</span>
                    {content.length.toLocaleString()} {content.length === 1 ? "character" : "characters"}
                </span>
                <div className="flex items-center gap-3">
                    <AutoSaveToggle value={autoSave} onChange={toggleAutoSave} />
                    <span className="text-muted-foreground/40">·</span>
                    <span title={lastSaved ? lastSaved.toLocaleString() : undefined}>
                        {lastSaved && now ? `Last saved ${formatSaved(lastSaved, now)}` : "\u00A0"}
                    </span>
                </div>
            </footer>
        </div>
    );
}

const URL_REGEX = /https?:\/\/\S+/g;

type Part = { type: "text" | "link"; value: string };

function parseLinks(text: string): Part[] {
    const parts: Part[] = [];
    let lastIdx = 0;
    URL_REGEX.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = URL_REGEX.exec(text)) !== null) {
        let url = m[0];
        while (/[.,;:!?)\]'"]$/.test(url) && url.length > "https://".length) {
            url = url.slice(0, -1);
        }
        const start = m.index;
        const end = start + url.length;
        if (start > lastIdx) parts.push({ type: "text", value: text.slice(lastIdx, start) });
        parts.push({ type: "link", value: url });
        lastIdx = end;
    }
    if (lastIdx < text.length) parts.push({ type: "text", value: text.slice(lastIdx) });
    return parts;
}

function formatSaved(when: Date, now: Date): string {
    const diffSec = Math.round((now.getTime() - when.getTime()) / 1000);
    if (diffSec < 10) return "just now";
    if (diffSec < 60) return `${diffSec}s ago`;
    const diffMin = Math.round(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const sameDay =
        when.getFullYear() === now.getFullYear() &&
        when.getMonth() === now.getMonth() &&
        when.getDate() === now.getDate();
    const time = when.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
    if (sameDay) return `at ${time}`;
    const date = when.toLocaleDateString(undefined, { month: "short", day: "numeric" });
    return `${date}, ${time}`;
}

function SaveIndicator({
    state,
    dirty,
    autoSave,
}: {
    state: SaveState;
    dirty: boolean;
    autoSave: boolean;
}) {
    const base = "inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-colors";

    if (state === "saving") {
        return (
            <span className={cn(base, "bg-muted/60 text-muted-foreground")}>
                <Loader2 className="h-3 w-3 animate-spin" />
                Saving
            </span>
        );
    }
    if (state === "saved") {
        return (
            <span className={cn(base, "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400")}>
                <Check className="h-3 w-3" />
                Saved
            </span>
        );
    }
    if (state === "error") {
        return (
            <span className={cn(base, "bg-destructive/10 text-destructive")}>
                <CloudOff className="h-3 w-3" />
                Not saved
            </span>
        );
    }
    if (!autoSave && dirty) {
        return (
            <span className={cn(base, "bg-amber-500/10 text-amber-700 dark:text-amber-400")}>
                <CloudOff className="h-3 w-3" />
                Unsaved
            </span>
        );
    }
    return null;
}

function AutoSaveToggle({
    value,
    onChange,
}: {
    value: boolean;
    onChange: (v: boolean) => void;
}) {
    return (
        <label
            className="inline-flex cursor-pointer select-none items-center gap-1.5 transition-colors hover:text-foreground"
            title={value ? "Auto-save is on" : "Auto-save is off"}
        >
            <span>Auto-save</span>
            <span
                className={cn(
                    "relative h-3.5 w-6 rounded-full transition-colors",
                    value ? "bg-primary" : "bg-muted-foreground/30"
                )}
            >
                <span
                    className={cn(
                        "absolute top-0.5 h-2.5 w-2.5 rounded-full bg-background shadow transition-all",
                        value ? "left-[12px]" : "left-0.5"
                    )}
                />
            </span>
            <input
                type="checkbox"
                className="sr-only"
                checked={value}
                onChange={(e) => onChange(e.target.checked)}
            />
        </label>
    );
}
