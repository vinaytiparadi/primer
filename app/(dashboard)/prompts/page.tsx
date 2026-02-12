"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { toast } from "@/components/ui/use-toast";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Plus,
    Search,
    Star,
    Copy,
    FileText,
    MoreHorizontal,
    PenLine,
    Trash2,
    Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuLabel,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";


interface Prompt {
    id: string;
    title: string;
    description: string | null;
    isFavorite: boolean;
    usageCount: number;
    updatedAt: string;
    category: { id: string; name: string; color: string | null } | null;
    versions: { id: string; modelTarget: string; versionLabel: string; isActive: boolean }[];
}

interface Category {
    id: string;
    name: string;
}

function PromptsContent() {
    const searchParams = useSearchParams();
    const filter = searchParams.get("filter");
    const isFavoritesView = filter === "favorites";

    const [prompts, setPrompts] = useState<Prompt[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [total, setTotal] = useState(0);

    const fetchPrompts = useCallback(async () => {
        setLoading(true);
        const params = new URLSearchParams();
        if (search) params.append("q", search);
        if (isFavoritesView) params.append("favorite", "true");

        const url = search ? `/api/search?${params.toString()}` : `/api/prompts?${params.toString()}`;

        try {
            const res = await fetch(url);
            const data = await res.json();
            setPrompts(data.prompts || data.results || []);
            setTotal(data.total || (data.results ? data.results.length : 0));
        } catch (error) {
            console.error("Failed to fetch prompts", error);
        } finally {
            setLoading(false);
        }
    }, [search, isFavoritesView]);

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
        fetchPrompts();
        fetchCategories();
    }, [fetchPrompts, fetchCategories]);

    async function toggleFavorite(e: React.MouseEvent, id: string, current: boolean) {
        e.preventDefault();
        e.stopPropagation();
        try {
            await fetch(`/api/prompts/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ isFavorite: !current }),
            });

            if (isFavoritesView && current) {
                setPrompts((prev) => prev.filter((p) => p.id !== id));
                setTotal((prev) => prev - 1);
            } else {
                setPrompts((prev) =>
                    prev.map((p) => (p.id === id ? { ...p, isFavorite: !current } : p))
                );
            }
        } catch (error) {
            console.error("Failed to toggle favorite", error);
        }
    }

    function copyTitle(e: React.MouseEvent, prompt: Prompt) {
        e.preventDefault();
        e.stopPropagation();
        navigator.clipboard.writeText(prompt.title);
        toast({
            title: "Copied!",
            description: "Prompt title copied to clipboard.",
        });
    }

    async function updateCategory(promptId: string, categoryId: string | null) {
        try {
            const res = await fetch(`/api/prompts/${promptId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ categoryId }),
            });
            const updated = await res.json();
            setPrompts((prev) => prev.map(p => p.id === promptId ? { ...p, category: updated.category } : p));
        } catch (error) {
            console.error("Failed to update category", error);
        }
    }

    async function deletePrompt(e: React.MouseEvent, id: string) {
        e.preventDefault();
        e.stopPropagation();
        if (!confirm("Are you sure you want to delete this prompt?")) return;

        try {
            await fetch(`/api/prompts/${id}`, { method: "DELETE" });
            setPrompts((prev) => prev.filter((p) => p.id !== id));
            setTotal((prev) => prev - 1);
        } catch (error) {
            console.error("Failed to delete prompt", error);
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">
                        {isFavoritesView ? "Favorites" : "Prompts"}
                    </h1>
                    <p className="text-muted-foreground">
                        {total} {total === 1 ? "prompt" : "prompts"} {isFavoritesView ? "in favorites" : "in your library"}
                    </p>
                </div>
                {!isFavoritesView && (
                    <Button asChild>
                        <Link href="/prompts/new">
                            <Plus className="mr-2 h-4 w-4" />
                            New Prompt
                        </Link>
                    </Button>
                )}
            </div>

            <div className="flex items-center space-x-2">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="Search prompts..."
                        className="pl-8"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            <div className="rounded-md border bg-background">
                <div className="relative w-full overflow-auto">
                    <table className="w-full caption-bottom text-sm text-left">
                        <thead className="[&_tr]:border-b">
                            <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                <th className="p-4 text-left align-middle font-medium text-muted-foreground w-[40px]">
                                    <span className="sr-only">Favorite</span>
                                </th>
                                <th className="p-4 text-left align-middle font-medium text-muted-foreground">Name</th>
                                <th className="p-4 text-left align-middle font-medium text-muted-foreground hidden md:table-cell">Category</th>
                                <th className="p-4 text-left align-middle font-medium text-muted-foreground hidden sm:table-cell">Versions</th>
                                <th className="p-4 text-left align-middle font-medium text-muted-foreground hidden lg:table-cell">Updated</th>
                                <th className="p-4 text-left align-middle font-medium text-muted-foreground text-right w-[100px]">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="[&_tr:last-child]:border-0">
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i} className="border-b transition-colors hover:bg-muted/50">
                                        <td className="p-4 text-left"><Skeleton className="h-4 w-4" /></td>
                                        <td className="p-4 text-left">
                                            <Skeleton className="h-5 w-3/4 mb-1" />
                                            <Skeleton className="h-3 w-1/2" />
                                        </td>
                                        <td className="p-4 text-left hidden md:table-cell"><Skeleton className="h-5 w-20" /></td>
                                        <td className="p-4 text-left hidden sm:table-cell"><Skeleton className="h-5 w-12" /></td>
                                        <td className="p-4 text-left hidden lg:table-cell"><Skeleton className="h-4 w-24" /></td>
                                        <td className="p-4 text-right"><Skeleton className="h-8 w-8 ml-auto" /></td>
                                    </tr>
                                ))
                            ) : prompts.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="h-24 text-center">
                                        <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
                                            <FileText className="h-8 w-8 mb-2 opacity-50" />
                                            <p>{search ? "No matches found" : isFavoritesView ? "No favorites yet" : "No prompt found"}</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                prompts.map((prompt) => (
                                    <tr key={prompt.id} className="border-b transition-colors hover:bg-muted/50 group">
                                        <td className="p-4 text-left align-middle">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6"
                                                onClick={(e) => toggleFavorite(e, prompt.id, prompt.isFavorite)}
                                            >
                                                <Star
                                                    className={cn(
                                                        "h-4 w-4",
                                                        prompt.isFavorite ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground hover:text-foreground"
                                                    )}
                                                />
                                            </Button>
                                        </td>
                                        <td className="p-4 text-left align-middle">
                                            <Link href={`/prompts/${prompt.id}`} className="block group/link">
                                                <div className="font-medium text-foreground group-hover/link:underline cursor-pointer">
                                                    {prompt.title}
                                                </div>
                                                {prompt.description && (
                                                    <div className="text-xs text-muted-foreground line-clamp-1 max-w-[300px]">
                                                        {prompt.description}
                                                    </div>
                                                )}
                                            </Link>
                                        </td>
                                        <td className="p-4 text-left align-middle hidden md:table-cell">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <span
                                                        className={cn(
                                                            "text-xs text-muted-foreground cursor-pointer hover:text-foreground select-none transition-colors",
                                                            !prompt.category ? "opacity-50 italic" : ""
                                                        )}
                                                    >
                                                        {prompt.category?.name || "Add Category"}
                                                    </span>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="start">
                                                    <DropdownMenuLabel>Select Category</DropdownMenuLabel>
                                                    <DropdownMenuSeparator />
                                                    {categories.map((c) => (
                                                        <DropdownMenuItem
                                                            key={c.id}
                                                            onClick={() => updateCategory(prompt.id, c.id)}
                                                            className="flex items-center justify-between"
                                                        >
                                                            {c.name}
                                                            {prompt.category?.id === c.id && <span className="text-primary text-xs ml-2">✓</span>}
                                                        </DropdownMenuItem>
                                                    ))}
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem onClick={() => updateCategory(prompt.id, null)}>
                                                        None
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </td>
                                        <td className="p-4 text-left align-middle hidden sm:table-cell">
                                            <div className="flex items-center gap-1 flex-wrap">
                                                <Badge variant="secondary" className="text-xs h-5 px-1.5">
                                                    {prompt.versions.length}
                                                </Badge>
                                                {prompt.versions.slice(0, 2).map(v => (
                                                    <Badge key={v.id} variant="outline" className="text-[10px] h-5 px-1.5 text-muted-foreground font-normal">
                                                        {v.modelTarget}
                                                    </Badge>
                                                ))}
                                                {prompt.versions.length > 2 && (
                                                    <span className="text-[10px] text-muted-foreground">+{prompt.versions.length - 2}</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-4 text-left align-middle hidden lg:table-cell text-muted-foreground text-xs whitespace-nowrap">
                                            {new Date(prompt.updatedAt).toLocaleDateString()}
                                        </td>
                                        <td className="p-4 align-middle text-right">
                                            <div className="flex items-center justify-end">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                            <span className="sr-only">Actions</span>
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem asChild>
                                                            <Link href={`/prompts/${prompt.id}`}>
                                                                <PenLine className="mr-2 h-4 w-4" />
                                                                Edit
                                                            </Link>
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={(e) => copyTitle(e, prompt)}>
                                                            <Copy className="mr-2 h-4 w-4" />
                                                            Copy Title
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem
                                                            className="text-destructive focus:text-destructive"
                                                            onClick={(e) => deletePrompt(e, prompt.id)}
                                                        >
                                                            <Trash2 className="mr-2 h-4 w-4" />
                                                            Delete
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

export default function PromptsPage() {
    return (
        <Suspense fallback={
            <div className="flex flex-col gap-8">
                <div className="flex flex-col gap-2">
                    <Skeleton className="h-10 w-48" />
                    <Skeleton className="h-4 w-64" />
                </div>
                <div className="space-y-4">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-[400px] w-full" />
                </div>
            </div>
        }>
            <PromptsContent />
        </Suspense>
    );
}
