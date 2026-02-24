import { Suspense } from "react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Plus, MessageSquare, ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate } from "@/lib/utils";

export default async function DashboardPage() {
    const session = await auth();
    if (!session?.user?.id) return null;

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

            <Suspense fallback={<StatsSkeleton />}>
                <StatsCards userId={session.user.id} />
            </Suspense>

            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold tracking-tight">Recent Prompts</h2>
                    <Button variant="ghost" size="sm" asChild>
                        <Link href="/prompts" className="gap-1">
                            View all <ArrowRight className="h-4 w-4" />
                        </Link>
                    </Button>
                </div>

                <Suspense fallback={<RecentPromptsSkeleton />}>
                    <RecentPrompts userId={session.user.id} />
                </Suspense>
            </div>
        </div>
    );
}

async function StatsCards({ userId }: { userId: string }) {
    // Run these quick counts in parallel
    const [promptCount, categoryCount, favoriteCount] = await Promise.all([
        prisma.prompt.count({ where: { userId } }),
        prisma.category.count({ where: { userId } }),
        prisma.prompt.count({
            where: { userId, isFavorite: true },
        }),
    ]);

    return (
        <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-lg border bg-card p-6 shadow-sm">
                <h3 className="text-sm font-medium text-muted-foreground">Total Prompts</h3>
                <div className="mt-2 text-3xl font-bold">{promptCount}</div>
                <p className="text-xs text-muted-foreground mt-1">
                    Saved in your library
                </p>
            </div>
            <div className="rounded-lg border bg-card p-6 shadow-sm">
                <h3 className="text-sm font-medium text-muted-foreground">Categories</h3>
                <div className="mt-2 text-3xl font-bold">{categoryCount}</div>
                <p className="text-xs text-muted-foreground mt-1">
                    Active categories
                </p>
            </div>
            <div className="rounded-lg border bg-card p-6 shadow-sm">
                <h3 className="text-sm font-medium text-muted-foreground">Favorites</h3>
                <div className="mt-2 text-3xl font-bold">{favoriteCount}</div>
                <p className="text-xs text-muted-foreground mt-1">
                    Starred prompts
                </p>
            </div>
        </div>
    );
}

function StatsSkeleton() {
    return (
        <div className="grid gap-4 md:grid-cols-3">
            {[1, 2, 3].map((i) => (
                <div key={i} className="rounded-lg border bg-card p-6 shadow-sm" >
                    <Skeleton className="h-4 w-24 mb-2" />
                    <Skeleton className="h-8 w-16 mb-2 mt-2" />
                    <Skeleton className="h-3 w-32 mt-2" />
                </div>
            ))}
        </div>
    );
}

async function RecentPrompts({ userId }: { userId: string }) {
    // Optimized: Only selecting the exact fields needed, dropping the heavy `content` field from versions.
    const recentPrompts = await prisma.prompt.findMany({
        where: { userId },
        orderBy: { updatedAt: "desc" },
        take: 6,
        select: {
            id: true,
            title: true,
            description: true,
            updatedAt: true,
            category: { select: { name: true } }
        }
    });

    if (recentPrompts.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center animate-in fade-in-50">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                    <MessageSquare className="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 className="mt-4 text-lg font-semibold">No prompts yet</h3>
                <p className="mb-4 mt-2 text-sm text-muted-foreground max-w-sm mx-auto">
                    Create your first prompt to get started. Organize them with categories.
                </p>
                <Button asChild>
                    <Link href="/prompts/new">Create Prompt</Link>
                </Button>
            </div>
        );
    }

    return (
        <div className="rounded-md border bg-background">
            <div className="relative w-full overflow-auto">
                <table className="w-full caption-bottom text-sm text-left">
                    <thead className="[&_tr]:border-b">
                        <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                            <th className="p-4 text-left align-middle font-medium text-muted-foreground">Name</th>
                            <th className="p-4 text-left align-middle font-medium text-muted-foreground hidden sm:table-cell">Category</th>
                            <th className="p-4 text-left align-middle font-medium text-muted-foreground">Updated</th>
                        </tr>
                    </thead>
                    <tbody className="[&_tr:last-child]:border-0">
                        {recentPrompts.map((prompt) => (
                            <tr key={prompt.id} className="border-b transition-colors hover:bg-muted/50 animate-in fade-in-50">
                                <td className="p-4 text-left align-middle">
                                    <Link href={`/prompts/${prompt.id}`} className="block group">
                                        <span className="font-medium group-hover:underline">{prompt.title}</span>
                                        {prompt.description && (
                                            <span className="block text-xs text-muted-foreground line-clamp-1 max-w-[300px] mt-0.5">
                                                {prompt.description}
                                            </span>
                                        )}
                                    </Link>
                                </td>
                                <td className="p-4 text-left align-middle hidden sm:table-cell text-muted-foreground text-xs">
                                    {prompt.category ? (
                                        <span>{prompt.category.name}</span>
                                    ) : (
                                        <span>-</span>
                                    )}
                                </td>
                                <td className="p-4 text-left align-middle text-muted-foreground text-xs">
                                    {formatDate(prompt.updatedAt)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function RecentPromptsSkeleton() {
    return (
        <div className="rounded-md border bg-background p-4 space-y-4">
            <Skeleton className="h-6 w-full max-w-[200px]" />
            <div className="space-y-3">
                {[1, 2, 3].map(i => (
                    <Skeleton key={i} className="h-12 w-full" />
                ))}
            </div>
        </div>
    );
}
