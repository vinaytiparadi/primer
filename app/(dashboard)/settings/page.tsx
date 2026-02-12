"use client";

import { signOut, useSession } from "next-auth/react";

export default function SettingsPage() {
    const { data: session } = useSession();

    return (
        <div className="animate-fade-in" style={{ maxWidth: 600 }}>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Settings</h1>
                    <p className="page-subtitle">Manage your account and preferences</p>
                </div>
            </div>

            <div className="card" style={{ marginBottom: "var(--space-4)" }}>
                <h3 style={{ fontSize: "0.9375rem", fontWeight: 600, marginBottom: "var(--space-4)" }}>Profile</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
                    <div>
                        <span style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>Name</span>
                        <p style={{ fontSize: "0.9375rem" }}>{session?.user?.name || "—"}</p>
                    </div>
                    <div>
                        <span style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>Email</span>
                        <p style={{ fontSize: "0.9375rem" }}>{session?.user?.email || "—"}</p>
                    </div>
                </div>
            </div>

            <div className="card" style={{ marginBottom: "var(--space-4)" }}>
                <h3 style={{ fontSize: "0.9375rem", fontWeight: 600, marginBottom: "var(--space-4)" }}>Data</h3>
                <div style={{ display: "flex", gap: "var(--space-3)" }}>
                    <a href="/api/export?format=json" className="btn btn-secondary btn-sm" download>
                        Export as JSON
                    </a>
                    <a href="/api/export?format=csv" className="btn btn-secondary btn-sm" download>
                        Export as CSV
                    </a>
                </div>
            </div>

            <div className="card">
                <h3 style={{ fontSize: "0.9375rem", fontWeight: 600, marginBottom: "var(--space-4)", color: "var(--color-danger)" }}>Danger Zone</h3>
                <button
                    className="btn btn-danger btn-sm"
                    onClick={() => signOut({ callbackUrl: "/login" })}
                >
                    Sign Out
                </button>
            </div>
        </div>
    );
}
