export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="auth-layout">
            <div className="auth-card">
                <div className="auth-brand">
                    <h1 className="auth-logo">Primer</h1>
                    <p className="auth-tagline">Your AI prompt command center</p>
                </div>
                {children}
            </div>
        </div>
    );
}
