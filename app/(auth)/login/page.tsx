"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError("");
        setLoading(true);

        const result = await signIn("credentials", {
            email,
            password,
            redirect: false,
        });

        if (result?.error) {
            setError("Invalid email or password");
            setLoading(false);
        } else {
            router.push("/");
            router.refresh();
        }
    }

    return (
        <form onSubmit={handleSubmit} className="auth-form">
            <h2 className="auth-title">Welcome back</h2>

            {error && <div className="auth-error">{error}</div>}

            <div className="form-group">
                <label htmlFor="email" className="form-label">
                    Email
                </label>
                <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="form-input"
                    placeholder="you@example.com"
                    required
                    autoFocus
                />
            </div>

            <div className="form-group">
                <label htmlFor="password" className="form-label">
                    Password
                </label>
                <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="form-input"
                    placeholder="••••••••"
                    required
                    minLength={6}
                />
            </div>

            <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
                {loading ? "Signing in…" : "Sign in"}
            </button>

            <p className="auth-footer">
                Don&apos;t have an account?{" "}
                <Link href="/register" className="auth-link">
                    Create one
                </Link>
            </p>
        </form>
    );
}
