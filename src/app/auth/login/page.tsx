/**
 * Login Page
 *
 * Page: /auth/login
 * Purpose: Authentication page with a single "Sign in with Google" button.
 * Redirects authenticated users to home page.
 *
 * Design: Clean, minimal — dark dotted surface with centered card.
 * No user management UI needed (single-user app).
 *
 * Reference: PRD Section 6.1 (Authentication)
 */
"use client";

import { useState } from "react";
import { m } from "framer-motion";
import { createClient } from "@/lib/supabase/client";

/**
 * LoginPage — Google OAuth login with single button.
 * Uses Supabase Auth for Google OAuth flow.
 */
export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Initiates Google OAuth flow via Supabase.
   * Redirects to Google, then back to app on success.
   */
  const handleSignIn = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          /* Redirect back to home after auth */
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        setError("Failed to sign in. Please try again.");
        setIsLoading(false);
      }
      /* If no error, the browser will redirect to Google */
    } catch {
      setError("An unexpected error occurred.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <m.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-sm"
      >
        {/* App branding */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Classey</h1>
          <p className="text-sm text-muted">
            Your personal university life tracker
          </p>
        </div>

        {/* Login card */}
        <div className="rounded-xl border border-border dotted-surface-elevated p-6">
          <m.button
            onClick={handleSignIn}
            disabled={isLoading}
            whileTap={{ scale: 0.97 }}
            className="
              w-full flex items-center justify-center gap-3
              px-4 py-3 rounded-lg
              bg-foreground text-background
              font-medium text-sm
              hover:opacity-90
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-opacity duration-200
            "
          >
            {/* Google icon */}
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            {isLoading ? "Signing in..." : "Sign in with Google"}
          </m.button>

          {/* Error message */}
          {error && (
            <p className="text-xs text-accent-red text-center mt-3">{error}</p>
          )}
        </div>

        <p className="text-xs text-muted/50 text-center mt-4">
          Personal use only. Your data is private and secure.
        </p>
      </m.div>
    </div>
  );
}
