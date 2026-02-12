import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import {
    Plus,
    MessageSquare,
    Folder,
    Star,
    ArrowRight
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

export default async function DashboardPage() {
    const session = await auth();
    if (!session?.user?.id) return null;

    const [promptCount, categoryCount, favoriteCount, recentPrompts] =
        await Promise.all([
            prisma.prompt.count({ where: { userId: session.user.id } }),
            prisma.category.count({ where: { userId: session.user.id } }),
            prisma.prompt.count({
                where: { userId: session.user.id, isFavorite: true },
            }),
            prisma.prompt.findMany({
                where: { userId: session.user.id },
                orderBy: { updatedAt: "desc" },
                take: 6,
                include: {
                    category: true,
                    versions: { take: 1, orderBy: { createdAt: "desc" } },
                    tags: { include: { tag: true } },
                },
            }),
        ]);

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                    <p className="text-muted-foreground">
                        Welcome back, {session.user.name || "User"}
                    </p>
                </div>
                <Button asChild>
                    <Link href="/prompts/new">
                        <Plus className="mr-2 h-4 w-4" />
                        New Prompt
                    </Link>
                </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Prompts</CardTitle>
                        <MessageSquare className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{promptCount}</div>
                        <p className="text-xs text-muted-foreground">
                            Saved in your library
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Categories</CardTitle>
                        <Folder className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{categoryCount}</div>
                        <p className="text-xs text-muted-foreground">
                            Active categories
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Favorites</CardTitle>
                        <Star className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{favoriteCount}</div>
                        <p className="text-xs text-muted-foreground">
                            Starred prompts
                        </p>
                    </CardContent>
                </Card>
            </div>

            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold tracking-tight">Recent Prompts</h2>
                    <Button variant="ghost" size="sm" asChild>
                        <Link href="/prompts" className="gap-1">
                            View all <ArrowRight className="h-4 w-4" />
                        </Link>
                    </Button>
                </div>

                {recentPrompts.length === 0 ? (
                    <Card className="flex flex-col items-center justify-center p-8 text-center border-dashed">
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                            <MessageSquare className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <h3 className="mt-4 text-lg font-semibold">No prompts yet</h3>
                        <p className="mb-4 mt-2 text-sm text-muted-foreground max-w-sm mx-auto">
                            Create your first prompt to get started. Organize them with categories and tags.
                        </p>
                        <Button asChild>
                            <Link href="/prompts/new">Create Prompt</Link>
                        </Button>
                    </Card>
                ) : (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {recentPrompts.map((prompt) => (
                            <Link
                                key={prompt.id}
                                href={`/prompts/${prompt.id}`}
                                className="block group"
                            >
                                <Card className="h-full transition-all hover:border-primary/50 hover:shadow-sm">
                                    <CardHeader className="pb-3">
                                        <div className="flex items-start justify-between">
                                            <CardTitle className="text-base font-semibold leading-none group-hover:text-primary transition-colors line-clamp-1">
                                                {prompt.title}
                                            </CardTitle>
                                        </div>
                                        <CardDescription className="line-clamp-2 min-h-[2.5em]">
                                            {prompt.description || "No description provided."}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex flex-wrap gap-2">
                                            {prompt.category && (
                                                <Badge variant="secondary" className="bg-primary/5 text-primary hover:bg-primary/10">
                                                    {prompt.category.name}
                                                </Badge>
                                            )}
                                            {prompt.versions[0] && (
                                                <Badge variant="outline" className="text-xs font-normal">
                                                    {prompt.versions[0].modelTarget}
                                                </Badge>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
