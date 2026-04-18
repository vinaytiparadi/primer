"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Check, Loader2, CloudOff } from "lucide-react";
import { cn } from "@/lib/utils";

type SaveState = "idle" | "saving" | "saved" | "error";

export function ScratchpadEditor({
    initialContent,
    initialUpdatedAt,
}: {
    initialContent: string;
    initialUpdatedAt: string;
}) {
    const [content, setContent] = useState(initialContent);
    const [state, setState] = useState<SaveState>("idle");
    const [lastSaved, setLastSaved] = useState<Date | null>(null);
    const [now, setNow] = useState<Date | null>(null);
    const [innerWidth, setInnerWidth] = useState(0);
    const [wrapCounts, setWrapCounts] = useState<number[]>([]);
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
        setState("saving");
        if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(flush, 600);
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
        const id = setInterval(() => setNow(new Date()), 30_000);
        return () => {
            clearInterval(id);
            if (timerRef.current) clearTimeout(timerRef.current);
            if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
        };
    }, [initialUpdatedAt]);

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
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Scratchpad</h1>
                    <p className="text-muted-foreground">Paste, think, come back later.</p>
                </div>
                <SaveIndicator state={state} />
            </div>

            <div className="group relative overflow-hidden rounded-2xl bg-card/60 ring-1 ring-border/60 shadow-sm backdrop-blur-sm transition-all duration-200 focus-within:ring-primary/30 focus-within:shadow-md">
                <div
                    aria-hidden
                    className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent opacity-0 transition-opacity duration-300 group-focus-within:opacity-100"
                />
                <div className="flex min-h-[60vh] font-mono text-[14px] leading-6">
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

            <footer className="flex items-center justify-between pt-3 px-1 text-xs text-muted-foreground/70 tabular-nums">
                <span>
                    {wordCount} {wordCount === 1 ? "word" : "words"}
                    <span className="mx-2 text-muted-foreground/40">·</span>
                    {content.length.toLocaleString()} {content.length === 1 ? "character" : "characters"}
                </span>
                <span title={lastSaved ? lastSaved.toLocaleString() : undefined}>
                    {lastSaved && now ? `Last saved ${formatSaved(lastSaved, now)}` : "\u00A0"}
                </span>
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

function SaveIndicator({ state }: { state: SaveState }) {
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
    return null;
}
