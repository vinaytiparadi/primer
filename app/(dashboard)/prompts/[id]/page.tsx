"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
    ChevronLeft,
    ChevronDown,
    Star,
    Copy,
    MoreVertical,
    Trash2,
    CopyPlus,
    Plus,
    PenLine,
    Save,
    Check,
    X,
    FileText,
    Settings2,
    Code2
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
    DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

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

interface Category {
    id: string;
    name: string;
    color: string | null;
}

interface PromptData {
    id: string;
    title: string;
    description: string | null;
    isFavorite: boolean;
    isPinned: boolean;
    usageCount: number;
    category: Category | null;
    versions: Version[];
}

export default function PromptDetailPage() {
    const { id } = useParams();
    const router = useRouter();
    const [prompt, setPrompt] = useState<PromptData | null>(null);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeVersionIndex, setActiveVersionIndex] = useState(0);
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
        if (data.versions && data.versions.length > 0) {
            setActiveVersionIndex(data.versions.length - 1);
        }
        setLoading(false);
    }, [id, router]);

    const fetchCategories = useCallback(async () => {
        try {
            const res = await fetch("/api/categories");
            const data = await res.json();
            setCategories(data);
        } catch (error) {
            console.error("Failed to fetch categories", error);
        }
    }, []);

    useEffect(() => {
        fetchPrompt();
        fetchCategories();
    }, [fetchPrompt, fetchCategories]);

    function startEdit(version: Version) {
        setEditContent(version.content);
        setEditSystem(version.systemPrompt || "");
        setEditing(true);
    }

    async function saveEdit() {
        if (!prompt) return;
        setSaving(true);
        const version = prompt.versions[activeVersionIndex];
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
        const version = prompt.versions[activeVersionIndex];
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

    async function updateCategory(categoryId: string | null) {
        if (!prompt) return;
        await fetch(`/api/prompts/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ categoryId }),
        });
        // Optimistic update or fetch
        fetchPrompt();
    }

    async function deletePrompt() {
        if (!confirm("Delete this prompt? This cannot be undone.")) return;
        await fetch(`/api/prompts/${id}`, { method: "DELETE" });
        router.push("/prompts");
    }

    async function deleteVersion(versionId: string) {
        if (!prompt) return;
        if (prompt.versions.length <= 1) {
            alert("Cannot delete the only version of a prompt.");
            return;
        }
        if (!confirm("Delete this version? This cannot be undone.")) return;

        await fetch(`/api/prompts/${id}/versions/${versionId}`, { method: "DELETE" });

        // If we deleted the active version, switch index
        if (activeVersionIndex >= prompt.versions.length - 1) {
            setActiveVersionIndex(Math.max(0, prompt.versions.length - 2));
        }
        fetchPrompt();
    }

    async function duplicatePrompt() {
        const res = await fetch(`/api/prompts/${id}/copy`, { method: "POST" });
        const data = await res.json();
        router.push(`/prompts/${data.id}`);
    }

    async function addVersion() {
        const modelTarget = window.prompt("Model target (e.g. claude, chatgpt, gemini, universal):", "universal");
        if (!modelTarget) return;
        await fetch(`/api/prompts/${id}/versions`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                modelTarget,
                content: prompt?.versions[activeVersionIndex]?.content || "Write your prompt here...",
            }),
        });
        fetchPrompt();
    }

    if (loading) {
        return (
            <div className="max-w-4xl mx-auto space-y-6">
                <div className="flex items-center space-x-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-[250px]" />
                        <Skeleton className="h-4 w-[200px]" />
                    </div>
                </div>
                <Skeleton className="h-[400px] w-full" />
            </div>
        );
    }

    if (!prompt) return null;

    const currentVersion = prompt.versions[activeVersionIndex];

    return (
        <div className="max-w-5xl mx-auto space-y-6 pb-20">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" asChild className="-ml-2">
                            <Link href="/prompts">
                                <ChevronLeft className="h-4 w-4" />
                            </Link>
                        </Button>
                        <h1 className="text-2xl font-bold tracking-tight">{prompt.title}</h1>
                    </div>
                    {prompt.description && (
                        <p className="text-muted-foreground max-w-2xl">{prompt.description}</p>
                    )}
                    <div className="flex flex-wrap items-center gap-2 pt-2">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Badge
                                    variant="secondary"
                                    className={cn(
                                        "bg-primary/10 text-primary hover:bg-primary/20 cursor-pointer",
                                        !prompt.category ? "bg-muted text-muted-foreground border-dashed border" : ""
                                    )}
                                >
                                    {prompt.category ? prompt.category.name : "Add Category"}
                                </Badge>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start">
                                <DropdownMenuLabel>Change Category</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                {categories.map((c) => (
                                    <DropdownMenuItem key={c.id} onClick={() => updateCategory(c.id)}>
                                        {c.name}
                                        {prompt.category?.id === c.id && <span className="ml-auto text-primary">✓</span>}
                                    </DropdownMenuItem>
                                ))}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => updateCategory(null)}>None</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={toggleFavorite}
                        title={prompt.isFavorite ? "Unfavorite" : "Favorite"}
                    >
                        <Star
                            className={cn("h-5 w-5", prompt.isFavorite ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground")}
                        />
                    </Button>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                                <span className="sr-only">More</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={duplicatePrompt}>
                                <CopyPlus className="mr-2 h-4 w-4" />
                                Duplicate Prompt
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={deletePrompt} className="text-destructive focus:text-destructive">
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete Prompt
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" className="w-[120px] justify-between bg-muted/30">
                                    <div className="flex items-center gap-2">
                                        <span className="font-mono text-xs font-semibold">v{activeVersionIndex + 1}</span>
                                        <span className="text-xs text-muted-foreground">{currentVersion?.modelTarget}</span>
                                    </div>
                                    <ChevronDown className="h-4 w-4 opacity-50" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" className="w-[120px]">
                                {prompt.versions.map((v, i) => (
                                    <DropdownMenuItem
                                        key={v.id}
                                        onClick={() => {
                                            setActiveVersionIndex(i);
                                            setEditing(false);
                                        }}
                                        className="justify-between"
                                    >
                                        <div className="flex items-center gap-2">
                                            <span className="font-mono text-xs">v{i + 1}</span>
                                            <span className="text-xs text-muted-foreground">{v.modelTarget}</span>
                                        </div>
                                        {i === activeVersionIndex && <Check className="h-3 w-3" />}
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                        <Button variant="ghost" size="icon" onClick={addVersion} className="h-9 w-9">
                            <Plus className="h-4 w-4" />
                        </Button>
                    </div>

                    {currentVersion && !editing && (
                        <div className="flex items-center gap-2 ml-4">
                            <Button variant="ghost" size="sm" className="text-destructive h-8" onClick={() => deleteVersion(currentVersion.id)} disabled={prompt.versions.length <= 1}>
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete Version
                            </Button>
                        </div>
                    )}
                </div>

                {currentVersion && (
                    <Card className={cn(
                        "!p-0 !gap-0 !py-0 border-muted-foreground/20 shadow-sm transition-all overflow-hidden",
                        editing ? "ring-2 ring-primary/20" : "hover:border-primary/20"
                    )}>
                        <div className="flex items-center justify-between border-b bg-muted/30 px-4 py-2">
                            <div className="flex items-center gap-2">
                                <Code2 className="h-4 w-4 text-muted-foreground" />
                                <span className="text-xs font-medium text-muted-foreground font-mono">
                                    {currentVersion.versionLabel} • {currentVersion.modelTarget}
                                </span>
                            </div>
                            <div className="flex items-center gap-1">
                                {!editing ? (
                                    <>
                                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => startEdit(currentVersion)}>
                                            <PenLine className="h-4 w-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={copyToClipboard}>
                                            {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                                        </Button>
                                    </>
                                ) : (
                                    <Button variant="ghost" size="sm" onClick={() => setEditing(false)} className="h-8">
                                        Cancel
                                    </Button>
                                )}
                            </div>
                        </div>

                        <CardContent className="p-0">
                            {editing ? (
                                <div className="grid grid-cols-1 divide-y">
                                    <div className="p-4 bg-muted/10">
                                        <Label htmlFor="system-prompt" className="text-xs text-muted-foreground uppercase tracking-wider mb-2 block">System Prompt</Label>
                                        <Textarea
                                            id="system-prompt"
                                            value={editSystem}
                                            onChange={(e) => setEditSystem(e.target.value)}
                                            className="min-h-[100px] font-mono text-sm bg-background/50 border-muted-foreground/20 focus-visible:ring-primary/20"
                                            placeholder="Optional system instructions..."
                                        />
                                    </div>
                                    <div className="p-4">
                                        <Label htmlFor="user-prompt" className="text-xs text-muted-foreground uppercase tracking-wider mb-2 block">User Prompt</Label>
                                        <Textarea
                                            id="user-prompt"
                                            value={editContent}
                                            onChange={(e) => setEditContent(e.target.value)}
                                            className="min-h-[300px] font-mono text-sm bg-background/50 border-muted-foreground/20 focus-visible:ring-primary/20 leading-relaxed"
                                            placeholder="Enter your prompt here..."
                                            autoFocus
                                        />
                                        <div className="mt-4 flex justify-end">
                                            <Button onClick={saveEdit} disabled={saving}>
                                                {saving && <span className="mr-2 h-3 w-3 animate-spin rounded-full border-2 border-background border-t-transparent" />}
                                                Save Changes
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-sm font-mono leading-relaxed">
                                    {currentVersion.systemPrompt && (
                                        <div className="bg-muted/30 p-4 border-b">
                                            <span className="text-xs font-semibold text-muted-foreground select-none block mb-1">SYSTEM</span>
                                            <div className="whitespace-pre-wrap text-foreground/80">{currentVersion.systemPrompt}</div>
                                        </div>
                                    )}
                                    <div className="p-6 bg-background whitespace-pre-wrap">
                                        {currentVersion.content}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}


