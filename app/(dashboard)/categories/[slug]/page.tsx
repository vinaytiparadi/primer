import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ChevronLeft, MessageSquare } from "lucide-react";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function CategoryDetailPage({
    params,
}: {
    params: Promise<{ slug: string }>;
}) {
    const session = await auth();
    if (!session?.user?.id) return null;

    const { slug } = await params;

    const category = await prisma.category.findFirst({
        where: { userId: session.user.id, slug },
        include: {
            prompts: {
                orderBy: { updatedAt: "desc" },
                include: {
                    versions: { take: 1, orderBy: { createdAt: "desc" } },
                },
            },
        },
    });

    if (!category) return notFound();

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href="/categories">
                            <ChevronLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <h1
                        className="text-3xl font-bold tracking-tight px-3 py-1 rounded-lg border"
                        style={{
                            backgroundColor: (category.color || "#10b981") + "20",
                            color: category.color || "#10b981",
                            borderColor: (category.color || "#10b981") + "40"
                        }}
                    >
                        {category.name}
                    </h1>
                </div>
            </div>
            {category.description && (
                <p className="text-muted-foreground ml-12 -mt-4">{category.description}</p>
            )}

            {category.prompts.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center animate-in fade-in-50">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                        <MessageSquare className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <h3 className="mt-4 text-lg font-semibold">No prompts in this category</h3>
                    <p className="mb-4 mt-2 text-sm text-muted-foreground max-w-sm mx-auto">
                        Assign prompts to this category from the prompt editor or creates a new one.
                    </p>
                    <Button asChild>
                        <Link href="/prompts/new">Create Prompt</Link>
                    </Button>
                </div>
            ) : (
                <div className="rounded-md border bg-background">
                    <div className="relative w-full overflow-auto">
                        <table className="w-full caption-bottom text-sm text-left">
                            <thead className="[&_tr]:border-b">
                                <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                    <th className="p-4 text-left align-middle font-medium text-muted-foreground">Name</th>

                                    <th className="p-4 text-left align-middle font-medium text-muted-foreground">Updated</th>
                                </tr>
                            </thead>
                            <tbody className="[&_tr:last-child]:border-0">
                                {category.prompts.map((prompt) => (
                                    <tr key={prompt.id} className="border-b transition-colors hover:bg-muted/50">
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

                                        <td className="p-4 text-left align-middle text-muted-foreground text-xs">
                                            {formatDate(prompt.updatedAt)}
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
