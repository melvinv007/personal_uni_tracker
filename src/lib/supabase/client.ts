/**
 * Supabase Browser Client
 *
 * Purpose: Creates a Supabase client for use in client components.
 * Uses @supabase/ssr for cookie-based session management.
 *
 * Security: Only the anon key is used client-side (NEXT_PUBLIC_*).
 * Service role key is never exposed to the browser.
 *
 * Reference: PRD Section 6.1 (Authentication), Section 6.3 (Security Rules)
 */
import { createBrowserClient } from "@supabase/ssr";

/**
 * Creates a Supabase client for browser/client-side usage.
 * Session tokens are stored in cookies managed by @supabase/ssr.
 * @returns Supabase client instance
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
