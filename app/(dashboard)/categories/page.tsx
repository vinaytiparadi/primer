"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Trash2, FolderOpen, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const PREDEFINED_COLORS = [
    "#ef4444", // red-500
    "#f97316", // orange-500
    "#f59e0b", // amber-500
    "#84cc16", // lime-500
    "#10b981", // emerald-500
    "#06b6d4", // cyan-500
    "#3b82f6", // blue-500
    "#6366f1", // indigo-500
    "#8b5cf6", // violet-500
    "#d946ef", // fuchsia-500
    "#f43f5e", // rose-500
    "#64748b", // slate-500
];

interface Category {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    color: string | null;
    _count: { prompts: number };
}

export default function CategoriesPage() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [open, setOpen] = useState(false);

    // Form state
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [color, setColor] = useState("#10b981");
    const [creating, setCreating] = useState(false);

    useEffect(() => {
        fetchCategories();
    }, []);

    async function fetchCategories() {
        const res = await fetch("/api/categories");
        const data = await res.json();
        setCategories(data);
        setLoading(false);
    }

    async function createCategory(e: React.FormEvent) {
        e.preventDefault();
        if (!name.trim()) return;
        setCreating(true);
        await fetch("/api/categories", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, description: description || null, color }),
        });
        setName("");
        setDescription("");
        setColor("#10b981");
        setOpen(false);
        setCreating(false);
        fetchCategories();
    }

    async function deleteCategory(id: string) {
        if (!confirm("Delete this category? Prompts will become uncategorized.")) return;
        await fetch(`/api/categories/${id}`, { method: "DELETE" });
        fetchCategories();
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Categories</h1>
                    <p className="text-muted-foreground">Organize your prompts into logical groups.</p>
                </div>

                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            New Category
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>Create Category</DialogTitle>
                            <DialogDescription>
                                Add a new category to group your prompts.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={createCategory} className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="name" className="text-right">
                                    Name
                                </Label>
                                <Input
                                    id="name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="col-span-3"
                                    placeholder="e.g. Coding"
                                    required
                                    autoFocus
                                />
                            </div>
                            <div className="grid grid-cols-4 items-start gap-4">
                                <Label className="text-right pt-2">
                                    Color
                                </Label>
                                <div className="col-span-3 flex flex-wrap gap-2">
                                    {PREDEFINED_COLORS.map((c) => (
                                        <button
                                            key={c}
                                            type="button"
                                            onClick={() => setColor(c)}
                                            className={cn(
                                                "h-8 w-8 rounded-full flex items-center justify-center transition-all hover:scale-110 focus:outline-none ring-2 ring-offset-2 ring-offset-background",
                                                color === c ? "ring-ring scale-110" : "ring-transparent"
                                            )}
                                            style={{ backgroundColor: c }}
                                        >
                                            {color === c && <Check className="h-4 w-4 text-white" />}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="description" className="text-right">
                                    Description
                                </Label>
                                <Input
                                    id="description"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    className="col-span-3"
                                    placeholder="Optional description"
                                />
                            </div>
                            <DialogFooter>
                                <Button type="submit" disabled={creating}>
                                    {creating ? "Creating..." : "Create Category"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {loading ? (
                <div className="rounded-md border bg-background">
                    <div className="relative w-full overflow-auto">
                        <table className="w-full caption-bottom text-sm text-left">
                            <thead className="[&_tr]:border-b">
                                <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                    <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Name</th>
                                    <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground hidden md:table-cell">Description</th>
                                    <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Prompts</th>
                                    <th className="h-10 px-4 text-right align-middle font-medium text-muted-foreground">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="[&_tr:last-child]:border-0">
                                {[1, 2, 3].map((i) => (
                                    <tr key={i} className="border-b transition-colors hover:bg-muted/50">
                                        <td className="p-4"><Skeleton className="h-5 w-32" /></td>
                                        <td className="p-4 hidden md:table-cell"><Skeleton className="h-5 w-full" /></td>
                                        <td className="p-4"><Skeleton className="h-5 w-8" /></td>
                                        <td className="p-4 text-right"><Skeleton className="h-8 w-8 ml-auto" /></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : categories.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center animate-in fade-in-50">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                        <FolderOpen className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <h3 className="mt-4 text-lg font-semibold">No categories yet</h3>
                    <p className="mb-4 mt-2 text-sm text-muted-foreground max-w-sm mx-auto">
                        Create categories to organize your prompts into specific topics or projects.
                    </p>
                    <Button onClick={() => setOpen(true)}>
                        Create Category
                    </Button>
                </div>
            ) : (
                <div className="rounded-md border bg-background">
                    <div className="relative w-full overflow-auto">
                        <table className="w-full caption-bottom text-sm text-left">
                            <thead className="[&_tr]:border-b">
                                <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                    <th className="p-4 text-left align-middle font-medium text-muted-foreground">Name</th>
                                    <th className="p-4 text-left align-middle font-medium text-muted-foreground hidden md:table-cell">Description</th>
                                    <th className="p-4 text-left align-middle font-medium text-muted-foreground">Prompts</th>
                                    <th className="p-4 text-right align-middle font-medium text-muted-foreground w-[100px]">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="[&_tr:last-child]:border-0">
                                {categories.map((cat) => (
                                    <tr key={cat.id} className="border-b transition-colors hover:bg-muted/50 group">
                                        <td className="p-4 text-left align-middle">
                                            <Link
                                                href={`/categories/${cat.slug}`}
                                                className="inline-flex items-center px-2.5 py-1 rounded-md text-sm font-medium transition-colors hover:bg-opacity-80"
                                                style={{
                                                    backgroundColor: (cat.color || "#10b981") + "20",
                                                    color: cat.color || "#10b981",
                                                    border: `1px solid ${(cat.color || "#10b981") + "40"}`
                                                }}
                                            >
                                                {cat.name}
                                            </Link>
                                        </td>
                                        <td className="p-4 text-left align-middle hidden md:table-cell text-muted-foreground">
                                            {cat.description || "-"}
                                        </td>
                                        <td className="p-4 text-left align-middle">
                                            <span className="text-muted-foreground text-sm">
                                                {cat._count.prompts}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right align-middle">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                                onClick={() => deleteCategory(cat.id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
