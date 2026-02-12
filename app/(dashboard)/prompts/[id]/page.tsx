"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
    ChevronLeft,
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
    FileText
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
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
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
        <div className="max-w-4xl mx-auto space-y-6 pb-20">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" asChild className="mb-1 -ml-2">
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
                        {prompt.category && (
                            <Badge variant="secondary" className="bg-primary/10 text-primary">
                                {prompt.category.name}
                            </Badge>
                        )}
                        {prompt.tags.map((t) => (
                            <Badge key={t.tag.id} variant="outline" className="text-xs font-normal">
                                {t.tag.name}
                            </Badge>
                        ))}
                        <Badge variant="outline" className="text-xs font-normal text-muted-foreground">
                            Used {prompt.usageCount}×
                        </Badge>
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
                                Duplicate
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={deletePrompt} className="text-destructive focus:text-destructive">
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <ScrollAreaWrapper>
                        <Tabs
                            value={String(activeVersionIndex)}
                            onValueChange={(v) => {
                                setActiveVersionIndex(parseInt(v));
                                setEditing(false);
                            }}
                            className="w-full"
                        >
                            <TabsList className="h-auto p-1 bg-background border rounded-lg flex-wrap justify-start">
                                {prompt.versions.map((v, i) => (
                                    <TabsTrigger
                                        key={v.id}
                                        value={String(i)}
                                        className="gap-2 data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
                                    >
                                        {v.versionLabel}
                                        <Badge variant="secondary" className="ml-1 text-[10px] h-4 px-1 leading-none pointer-events-none">
                                            {v.modelTarget}
                                        </Badge>
                                    </TabsTrigger>
                                ))}
                                <Button variant="ghost" size="sm" onClick={addVersion} className="h-8 px-2 ml-1">
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </TabsList>
                        </Tabs>
                    </ScrollAreaWrapper>
                </div>

                {currentVersion && (
                    <Card className="border-muted-foreground/20 shadow-sm transition-all hover:border-primary/20">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 border-b bg-muted/40 p-4">
                            <div className="flex items-center gap-2">
                                <FileText className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm font-medium text-muted-foreground">Prompt Content</span>
                            </div>

                            {!editing && (
                                <div className="flex items-center gap-2">
                                    <Button variant="outline" size="sm" onClick={() => startEdit(currentVersion)}>
                                        <PenLine className="mr-2 h-3 w-3" />
                                        Edit
                                    </Button>
                                    <Button variant="default" size="sm" onClick={copyToClipboard}>
                                        {copied ? <Check className="mr-2 h-3 w-3" /> : <Copy className="mr-2 h-3 w-3" />}
                                        {copied ? "Copied" : "Copy"}
                                    </Button>
                                </div>
                            )}
                        </CardHeader>

                        <CardContent className="p-0">
                            {editing ? (
                                <div className="p-6 space-y-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="system-prompt">System Prompt</Label>
                                        <Textarea
                                            id="system-prompt"
                                            value={editSystem}
                                            onChange={(e) => setEditSystem(e.target.value)}
                                            className="min-h-[100px] font-mono text-sm"
                                            placeholder="Optional system instructions..."
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="user-prompt">User Prompt</Label>
                                        <Textarea
                                            id="user-prompt"
                                            value={editContent}
                                            onChange={(e) => setEditContent(e.target.value)}
                                            className="min-h-[300px] font-mono text-sm leading-relaxed"
                                            placeholder="Enter your prompt here..."
                                            autoFocus
                                        />
                                        <div className="flex justify-between items-center pt-2">
                                            <div className="text-xs text-muted-foreground">
                                                {editContent.length} chars · ~{Math.ceil(editContent.length / 4)} tokens
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>
                                                    Cancel
                                                </Button>
                                                <Button size="sm" onClick={saveEdit} disabled={saving}>
                                                    {saving && <span className="mr-2 h-3 w-3 animate-spin rounded-full border-2 border-background border-t-transparent" />}
                                                    Save Changes
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="p-0">
                                    {currentVersion.systemPrompt && (
                                        <div className="bg-muted/30 p-6 border-b">
                                            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">System</h3>
                                            <div className="text-sm font-mono whitespace-pre-wrap text-foreground/80">
                                                {currentVersion.systemPrompt}
                                            </div>
                                        </div>
                                    )}
                                    <div className="p-6 bg-background">
                                        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">User</h3>
                                        <div className="text-sm font-mono whitespace-pre-wrap leading-relaxed">
                                            {currentVersion.content}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}

                {currentVersion?.notes && (
                    <Card className="bg-muted/30 border-none shadow-none">
                        <CardContent className="p-4 text-sm text-muted-foreground">
                            <span className="font-semibold text-foreground">Notes: </span>
                            {currentVersion.notes}
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}

function ScrollAreaWrapper({ children }: { children: React.ReactNode }) {
    return <div className="overflow-x-auto pb-2 -mb-2">{children}</div>;
}
