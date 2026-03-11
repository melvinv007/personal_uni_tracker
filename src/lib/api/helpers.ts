/**
 * API Route Helpers
 *
 * Purpose: Shared utilities for API route handlers.
 * - getAuthUser(): Extract authenticated user from Supabase session
 * - apiError(): Create standardized error responses
 * - sanitizeString(): Basic string sanitization for user input
 *
 * Reference: PRD Section 25.3 (Data Validation), Section 6.3 (Security)
 */
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Gets the authenticated user from the current request.
 * Returns null if not authenticated.
 * Every API route should call this first.
 */
export async function getAuthUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/**
 * Creates a standardized JSON error response.
 * @param message - Human-readable error message
 * @param status - HTTP status code
 */
export function apiError(message: string, status: number = 400) {
  return NextResponse.json({ error: message }, { status });
}

/**
 * Creates a standardized JSON success response.
 * @param data - Response payload
 * @param status - HTTP status code (default 200)
 */
export function apiSuccess<T>(data: T, status: number = 200) {
  return NextResponse.json(data, { status });
}

/**
 * Basic string sanitization — trims whitespace, removes null bytes.
 * Does NOT do HTML escaping (React handles XSS in rendering).
 * @param input - Raw string from user input
 */
export function sanitizeString(input: string): string {
  return input.trim().replace(/\0/g, "");
}
