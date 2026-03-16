export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-muted/40">
            <div className="w-full max-w-sm space-y-6">
                <div className="flex flex-col items-center space-y-2 text-center">
                    <h1 className="text-2xl font-bold tracking-tight text-primary">Primer</h1>
                    <p className="text-sm text-muted-foreground">
                        Your AI prompt command center
                    </p>
                </div>
                {children}
            </div>
        </div>
    );
}
