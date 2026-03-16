"use client";

import { useState } from "react";
import { signOut, useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Download, LogOut, Trash2, User } from "lucide-react";

export default function SettingsPage() {
    const { data: session } = useSession();
    const [deleting, setDeleting] = useState(false);

    async function handleDeleteAccount() {
        setDeleting(true);
        await fetch("/api/user", { method: "DELETE" });
        await signOut({ callbackUrl: "/login" });
    }

    return (
        <div className="space-y-6 max-w-2xl mx-auto">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
                <p className="text-muted-foreground">Manage your account and preferences.</p>
            </div>

            <Separator />

            <div className="grid gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <User className="h-5 w-5" />
                            Profile
                        </CardTitle>
                        <CardDescription>
                            Your personal information.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                Name
                            </label>
                            <p className="text-sm text-muted-foreground">
                                {session?.user?.name || "—"}
                            </p>
                        </div>
                        <div className="space-y-1">
                            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                Email
                            </label>
                            <p className="text-sm text-muted-foreground">
                                {session?.user?.email || "—"}
                            </p>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Download className="h-5 w-5" />
                            Data Export
                        </CardTitle>
                        <CardDescription>
                            Download your prompts and data.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col sm:flex-row gap-4">
                        <Button variant="outline" asChild className="w-full sm:w-auto">
                            <a href="/api/export?format=json" download>
                                Export as JSON
                            </a>
                        </Button>
                        <Button variant="outline" asChild className="w-full sm:w-auto">
                            <a href="/api/export?format=csv" download>
                                Export as CSV
                            </a>
                        </Button>
                    </CardContent>
                </Card>

                <Card className="border-destructive/20 bg-destructive/5">
                    <CardHeader>
                        <CardTitle className="text-destructive flex items-center gap-2">
                            <LogOut className="h-5 w-5" />
                            Danger Zone
                        </CardTitle>
                        <CardDescription className="text-destructive/80">
                            Irreversible actions that affect your account.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col sm:flex-row gap-3">
                        <Button
                            variant="destructive"
                            onClick={() => signOut({ callbackUrl: "/login" })}
                        >
                            Sign Out
                        </Button>

                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="destructive">
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete Account
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Delete your account?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This will permanently delete your account and all your prompts, versions, and categories. This action cannot be undone.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                        onClick={handleDeleteAccount}
                                        disabled={deleting}
                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                        {deleting ? "Deleting..." : "Yes, delete my account"}
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
