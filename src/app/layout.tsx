/**
 * Root Layout — Tracker Application
 *
 * Purpose: Wraps the entire application with global providers,
 * fonts, theme, and the dotted surface background.
 *
 * Providers included:
 * - Geist font (sans + mono) via next/font
 * - TanStack Query provider for server state
 * - Zustand store is auto-injected (module-level)
 * - Framer Motion LazyMotion for reduced bundle size
 * - Toast notification container
 *
 * Reference: PRD Section 3.1 (Theme), Section 2 (Tech Stack)
 */
import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Providers } from "@/components/providers";
import { UserMenu } from "@/components/ui/user-menu";
import { createClient } from "@/lib/supabase/server";

/** Geist Sans — primary font for all UI text */
const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});

/** Geist Mono — used for code-like elements and stats */
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Classey — University Life Tracker",
  description:
    "Personal university life tracker for managing semesters, classes, attendance, assignments, exams, and academic analytics.",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased bg-background text-foreground`}
      >
        <Providers>
          {/* Dotted surface background — PRD Section 3.1 */}
          <div className="dotted-surface min-h-screen">
            {user && (
              <div className="fixed right-4 top-4 z-50">
                <UserMenu userId={user.id} email={user.email ?? ""} />
              </div>
            )}
            {children}
          </div>
        </Providers>
      </body>
    </html>
  );
}
