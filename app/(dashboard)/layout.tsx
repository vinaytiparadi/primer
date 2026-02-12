import { Suspense } from "react";
import Sidebar from "@/components/sidebar";
import { MobileNav } from "@/components/mobile-nav";
import { Loader2 } from "lucide-react";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex min-h-screen w-full flex-col md:flex-row bg-muted/40">
            {/* Desktop Sidebar */}
            <div className="hidden md:flex h-full w-[260px] flex-col fixed inset-y-0 z-30 border-r bg-background">
                <Suspense fallback={
                    <div className="flex h-full w-full items-center justify-center">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                }>
                    <Sidebar className="h-full" />
                </Suspense>
            </div>

            {/* Mobile Header & Content */}
            <div className="flex flex-col flex-1 md:pl-[260px]">
                <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6 md:hidden">
                    <MobileNav />
                    <div className="flex-1">
                        <span className="font-semibold">Primer</span>
                    </div>
                </header>

                <main className="flex-1 p-4 sm:p-6 md:p-8">
                    {children}
                </main>
            </div>
        </div>
    );
}
