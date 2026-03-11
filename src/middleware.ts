/**
 * Next.js Middleware
 *
 * Purpose: Runs on every request to:
 * 1. Apply rate limiting via Upstash Redis (API routes + auth endpoints)
 * 2. Refresh Supabase auth session (keep cookies alive)
 * 3. Protect routes (redirect unauthenticated users to login)
 *
 * Reference: PRD Section 6.1 (Auth), Section 6.3 (Security / Rate Limiting)
 */
import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { checkRateLimit } from "@/lib/rate-limit";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  /* Determine client IP for rate limiting (forwarded header or fallback) */
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || "127.0.0.1";

  /* Rate limit API routes: 10 req / 10s sliding window */
  if (pathname.startsWith("/api/")) {
    const { success, limit, remaining, reset } = await checkRateLimit(
      ip,
      "api"
    );

    if (!success) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": String(limit),
            "X-RateLimit-Remaining": String(remaining),
            "X-RateLimit-Reset": String(reset),
          },
        }
      );
    }
  }

  /* Rate limit auth endpoints: 5 req / 60s sliding window */
  if (pathname.startsWith("/auth/")) {
    const { success } = await checkRateLimit(ip, "auth");

    if (!success) {
      return NextResponse.json(
        { error: "Too many login attempts. Please wait and try again." },
        { status: 429 }
      );
    }
  }

  /* Supabase session refresh + route protection */
  return await updateSession(request);
}

/**
 * Matcher: apply middleware to all routes except static assets,
 * Next.js internals, and favicon.
 */
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
