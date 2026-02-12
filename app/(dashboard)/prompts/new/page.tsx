"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

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
    const [categoryId, setCategoryId] = useState<string | undefined>(undefined);
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
        <div className="max-w-3xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/prompts">
                        <ChevronLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">New Prompt</h1>
                    <p className="text-muted-foreground">Create a new AI prompt</p>
                </div>
            </div>

            <form onSubmit={handleSubmit}>
                <Card>
                    <CardContent className="p-6 space-y-6">
                        {error && (
                            <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md">
                                {error}
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="title">Title</Label>
                            <Input
                                id="title"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="e.g. Code Review Prompt"
                                required
                                autoFocus
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Description (optional)</Label>
                            <Input
                                id="description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Brief description of what this prompt does"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="model">Target Model</Label>
                                <Select value={modelTarget} onValueChange={setModelTarget}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a model" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="universal">Universal</SelectItem>
                                        <SelectItem value="claude">Claude</SelectItem>
                                        <SelectItem value="chatgpt">ChatGPT</SelectItem>
                                        <SelectItem value="gemini">Gemini</SelectItem>
                                        <SelectItem value="other">Other</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="category">Category (optional)</Label>
                                <Select
                                    value={categoryId}
                                    onValueChange={setCategoryId}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">No category</SelectItem>
                                        {categories.map((c) => (
                                            <SelectItem key={c.id} value={c.id}>
                                                {c.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="systemPrompt">System Prompt (optional)</Label>
                            <Textarea
                                id="systemPrompt"
                                value={systemPrompt}
                                onChange={(e) => setSystemPrompt(e.target.value)}
                                placeholder="System-level instructions for the AI..."
                                className="min-h-[100px] font-mono text-sm"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="content">Prompt Content</Label>
                            <Textarea
                                id="content"
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                placeholder="Write your prompt here. Use {{variable}} for template variables..."
                                className="min-h-[200px] font-mono text-sm leading-relaxed"
                                required
                            />
                            <div className="text-xs text-muted-foreground text-right">
                                {content.length} characters · ~{tokenEstimate} tokens
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="flex justify-between border-t bg-muted/40 px-6 py-4">
                        <Button variant="ghost" type="button" onClick={() => router.back()}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Create Prompt
                        </Button>
                    </CardFooter>
                </Card>
            </form>
        </div>
    );
}
