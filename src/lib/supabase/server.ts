/**
 * Supabase Server Client
 *
 * Purpose: Creates a Supabase client for use in Server Components,
 * API routes, and middleware. Uses cookie-based auth from @supabase/ssr.
 *
 * Security: Uses the anon key by default. For admin operations,
 * use createServiceClient() with the service role key.
 *
 * Reference: PRD Section 6.1 (Authentication), Section 6.3 (Security Rules)
 */
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Creates a Supabase client for server-side usage (Server Components, Route Handlers).
 * Reads auth session from request cookies.
 * @returns Supabase server client instance
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // setAll is called from Server Component — ignore.
            // The middleware will handle refreshing the session.
          }
        },
      },
    }
  );
}

/**
 * Creates a Supabase admin client with the service role key.
 * Bypasses RLS — use only for server-side admin operations.
 * NEVER expose this to client code.
 * @returns Supabase admin client instance
 */
export function createServiceClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll() {
          return [];
        },
        setAll() {},
      },
    }
  );
}
