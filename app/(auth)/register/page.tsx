"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
    const router = useRouter();
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError("");
        setLoading(true);

        const res = await fetch("/api/auth/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, email, password }),
        });

        if (!res.ok) {
            const data = await res.json();
            setError(data.error || "Registration failed");
            setLoading(false);
            return;
        }

        const result = await signIn("credentials", {
            email,
            password,
            redirect: false,
        });

        if (result?.error) {
            setError("Account created but login failed. Try signing in.");
            setLoading(false);
        } else {
            router.push("/");
            router.refresh();
        }
    }

    return (
        <form onSubmit={handleSubmit} className="auth-form">
            <h2 className="auth-title">Create your account</h2>

            {error && <div className="auth-error">{error}</div>}

            <div className="form-group">
                <label htmlFor="name" className="form-label">
                    Name
                </label>
                <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="form-input"
                    placeholder="Your name"
                    autoFocus
                />
            </div>

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
                    placeholder="Min. 6 characters"
                    required
                    minLength={6}
                />
            </div>

            <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
                {loading ? "Creating account…" : "Create account"}
            </button>

            <p className="auth-footer">
                Already have an account?{" "}
                <Link href="/login" className="auth-link">
                    Sign in
                </Link>
            </p>
        </form>
    );
}
