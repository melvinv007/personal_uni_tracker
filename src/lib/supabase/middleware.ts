/**
 * Supabase Auth Middleware Helper
 *
 * Purpose: Refreshes the Supabase session on every request.
 * Called from Next.js middleware to keep the auth session alive.
 *
 * Reference: PRD Section 6.1 (Session persistence across browser restarts)
 */
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Updates the Supabase session by refreshing cookies on every request.
 * Redirects unauthenticated users to /auth/login for protected routes.
 * @param request - Next.js request object
 * @returns Modified response with updated session cookies
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          /* Set cookies on the request for downstream Server Components */
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          /* Clone response with updated cookies */
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  /* Refresh session — MUST be called to keep tokens valid */
  const {
    data: { user },
  } = await supabase.auth.getUser();

  /* Protected routes: redirect to login if not authenticated */
  const isAuthPage = request.nextUrl.pathname.startsWith("/auth");
  if (!user && !isAuthPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";
    return NextResponse.redirect(url);
  }

  /* If authenticated user tries to access login page, redirect to home */
  if (user && isAuthPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
