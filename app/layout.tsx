import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { SessionProvider } from "next-auth/react";
import CommandPalette from "@/components/command-palette";
import { ThemeProvider } from "@/components/theme-provider"
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Primer — AI Prompt Manager",
  description:
    "A centralized hub for managing, versioning, and organizing your AI prompts across Claude, Gemini, ChatGPT, and more.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <SessionProvider>
            {children}
            <CommandPalette />
          </SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
