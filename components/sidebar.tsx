"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    LayoutDashboard,
    MessageSquare,
    FolderOpen,
    Settings,
    LogOut,
    User,
    Star
} from "lucide-react";
import { ModeToggle } from "@/components/mode-toggle";

const navItems = [
    {
        label: "Dashboard",
        href: "/",
        icon: LayoutDashboard,
    },
    {
        label: "Prompts",
        href: "/prompts",
        icon: MessageSquare,
    },
    {
        label: "Favorites",
        href: "/prompts?filter=favorites",
        icon: Star,
    },
    {
        label: "Categories",
        href: "/categories",
        icon: FolderOpen,
    },
];

type SidebarProps = React.HTMLAttributes<HTMLDivElement>;

export function Sidebar({ className }: SidebarProps) {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const { data: session } = useSession();

    const isActive = (href: string) => {
        if (href === "/") return pathname === "/";

        // Handle items with query params (like Favorites)
        if (href.includes("?")) {
            const [path, query] = href.split("?");
            if (pathname !== path) return false;

            const params = new URLSearchParams(query);
            for (const [key, value] of params.entries()) {
                if (searchParams.get(key) !== value) return false;
            }
            return true;
        }

        // Special case: Don't highlight "Prompts" if we are on favorites
        if (href === "/prompts" && pathname === "/prompts" && searchParams.get("filter") === "favorites") {
            return false;
        }

        return pathname.startsWith(href);
    };

    const userInitial = session?.user?.name?.[0] || session?.user?.email?.[0] || "?";

    return (
        <div className={cn("pb-12 flex flex-col h-full bg-sidebar border-r border-sidebar-border", className)}>
            <div className="space-y-4 py-4 flex-1">
                <div className="px-6 py-2 flex items-center justify-between">
                    <h2 className="text-xl font-bold tracking-tight text-sidebar-foreground flex items-center gap-2">
                        <span className="text-primary">Primer</span>
                    </h2>
                </div>
                <div className="px-3 py-2">
                    <div className="space-y-1">
                        {navItems.map((item) => (
                            <Button
                                key={item.href}
                                variant={isActive(item.href) ? "secondary" : "ghost"}
                                className={cn(
                                    "w-full justify-start gap-2",
                                    isActive(item.href) && "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                                )}
                                asChild
                            >
                                <Link href={item.href}>
                                    <item.icon className="h-4 w-4" />
                                    {item.label}
                                </Link>
                            </Button>
                        ))}
                    </div>
                </div>

                <div className="px-3 py-2">
                    <h3 className="mb-2 px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Account
                    </h3>
                    <div className="space-y-1">
                        <Button
                            variant={isActive("/settings") ? "secondary" : "ghost"}
                            className={cn(
                                "w-full justify-start gap-2",
                                isActive("/settings") && "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                            )}
                            asChild
                        >
                            <Link href="/settings">
                                <Settings className="h-4 w-4" />
                                Settings
                            </Link>
                        </Button>
                    </div>
                </div>
            </div>

            <div className="mt-auto px-6 py-4 border-t border-sidebar-border">
                <div className="flex items-center justify-between mb-4">
                    <p className="text-xs text-muted-foreground">Theme</p>
                    <ModeToggle />
                </div>

                <div className="flex items-center gap-3 mb-4">
                    <Avatar className="h-9 w-9 border border-border">
                        <AvatarImage src={session?.user?.image || ""} alt={session?.user?.name || ""} />
                        <AvatarFallback>{userInitial.toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 overflow-hidden">
                        <p className="text-sm font-medium leading-none truncate">
                            {session?.user?.name || "User"}
                        </p>
                        <p className="text-xs text-muted-foreground truncate mt-1">
                            {session?.user?.email || ""}
                        </p>
                    </div>
                </div>

                <Button
                    variant="outline"
                    className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground"
                    onClick={() => signOut({ callbackUrl: "/login" })}
                >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                </Button>
            </div>
        </div>
    );
}

export default Sidebar;
