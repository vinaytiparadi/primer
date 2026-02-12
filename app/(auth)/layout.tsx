import Link from "next/link";
import { MoveLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="relative min-h-screen flex items-center justify-center p-4 bg-muted/40">
            <div className="w-full max-w-sm space-y-6">
                <div className="flex flex-col items-center space-y-2 text-center">
                    <h1 className="text-2xl font-bold tracking-tight text-primary">Primer</h1>
                    <p className="text-sm text-muted-foreground">
                        Your AI prompt command center
                    </p>
                </div>
                {children}
            </div>
            <Button
                variant="ghost"
                className="absolute top-4 left-4 md:top-8 md:left-8"
                asChild
            >
                <Link href="/">
                    <MoveLeft className="mr-2 h-4 w-4" />
                    Back
                </Link>
            </Button>
        </div>
    );
}
