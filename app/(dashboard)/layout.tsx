import Sidebar from "@/components/sidebar";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex min-h-screen w-full flex-col md:flex-row bg-muted/40">
            {/* Desktop Sidebar */}
            <div className="hidden md:flex h-full w-[260px] flex-col fixed inset-y-0 z-30 border-r bg-background">
                <Sidebar className="h-full" />
            </div>

            {/* Mobile Header & Content */}
            <div className="flex flex-col flex-1 md:pl-[260px]">
                <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6 md:hidden">
                    <Sheet>
                        <SheetTrigger asChild>
                            <Button size="icon" variant="outline" className="md:hidden">
                                <Menu className="h-5 w-5" />
                                <span className="sr-only">Toggle Menu</span>
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="p-0 sm:max-w-xs">
                            <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                            <SheetDescription className="sr-only">
                                Main navigation sidebar
                            </SheetDescription>
                            <Sidebar className="h-full border-r-0" />
                        </SheetContent>
                    </Sheet>
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
