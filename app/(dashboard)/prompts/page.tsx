"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Plus,
    Search,
    Star,
    Copy,
    FileText,
    Layers,
    Tag
} from "lucide-react";
import { cn } from "@/lib/utils";

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
        <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Prompts</h1>
                    <p className="text-muted-foreground">{total} prompts in your library</p>
                </div>
                <Button asChild>
                    <Link href="/prompts/new">
                        <Plus className="mr-2 h-4 w-4" />
                        New Prompt
                    </Link>
                </Button>
            </div>

            <div className="flex items-center space-x-2">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="Search prompts..."
                        className="pl-8"
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value);
                            searchPrompts(e.target.value);
                        }}
                    />
                </div>
            </div>

            {loading ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <Card key={i} className="overflow-hidden">
                            <CardContent className="p-6">
                                <Skeleton className="h-6 w-3/4 mb-4" />
                                <Skeleton className="h-4 w-full mb-2" />
                                <Skeleton className="h-4 w-2/3" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : prompts.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center animate-in fade-in-50">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                        <FileText className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <h3 className="mt-4 text-lg font-semibold">
                        {search ? "No results found" : "No prompts yet"}
                    </h3>
                    <p className="mb-4 mt-2 text-sm text-muted-foreground max-w-sm mx-auto">
                        {search
                            ? `No prompts match "${search}". Try different keywords.`
                            : "Create your first prompt to get started collecting and organizing your AI interactions."}
                    </p>
                    {!search && (
                        <Button asChild>
                            <Link href="/prompts/new">Create Prompt</Link>
                        </Button>
                    )}
                </div>
            ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {prompts.map((prompt) => (
                        <Link key={prompt.id} href={`/prompts/${prompt.id}`} className="block group transition-all hover:scale-[1.01] focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-xl">
                            <Card className="h-full overflow-hidden border-muted-foreground/20 hover:border-primary/50 transition-colors">
                                <CardContent className="p-5 flex flex-col h-full">
                                    <div className="flex items-start justify-between mb-2">
                                        <h3 className="font-semibold leading-none tracking-tight line-clamp-1 group-hover:text-primary transition-colors">
                                            {prompt.title}
                                        </h3>
                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8"
                                                onClick={(e) => toggleFavorite(e, prompt.id, prompt.isFavorite)}
                                                title={prompt.isFavorite ? "Unfavorite" : "Favorite"}
                                            >
                                                <Star
                                                    className={cn("h-4 w-4", prompt.isFavorite ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground")}
                                                />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8"
                                                onClick={(e) => copyContent(e, prompt)}
                                                title="Copy content"
                                            >
                                                <Copy className="h-4 w-4 text-muted-foreground" />
                                            </Button>
                                        </div>
                                    </div>

                                    <p className="text-sm text-muted-foreground line-clamp-3 mb-4 flex-1">
                                        {prompt.description || "No description provided."}
                                    </p>

                                    <div className="flex flex-wrap gap-2 mt-auto">
                                        {prompt.category && (
                                            <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20">
                                                {prompt.category.name}
                                            </Badge>
                                        )}
                                        {prompt.versions.slice(0, 2).map((v) => (
                                            <Badge key={v.id} variant="outline" className="text-xs font-normal">
                                                {v.modelTarget}
                                            </Badge>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
