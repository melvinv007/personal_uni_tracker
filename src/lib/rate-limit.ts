/**
 * Rate Limiting Utility — Upstash Redis + @upstash/ratelimit
 *
 * Provides rate limiting for API routes and auth endpoints.
 * Uses sliding window algorithm to prevent spam and brute-force attacks.
 *
 * Two limiters:
 * - apiLimiter: 10 requests per 10 seconds per IP (API routes)
 * - authLimiter: 5 requests per 60 seconds per IP (auth endpoints)
 *
 * Falls back gracefully when Redis is not configured (dev environments).
 *
 * Reference: PRD Section 6.3 (Rate limiting), Section 23.4
 */
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

/**
 * Check if Upstash Redis is configured.
 * In development without Redis, rate limiting is bypassed.
 */
const isRedisConfigured =
  !!process.env.UPSTASH_REDIS_REST_URL &&
  !!process.env.UPSTASH_REDIS_REST_TOKEN;

/**
 * Upstash Redis client — only instantiated if env vars are set.
 */
const redis = isRedisConfigured
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  : null;

/**
 * API route rate limiter — sliding window, 10 requests per 10 seconds.
 * Prevents general API abuse.
 */
export const apiLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(10, "10 s"),
      analytics: true,
      prefix: "ratelimit:api",
    })
  : null;

/**
 * Auth endpoint rate limiter — sliding window, 5 requests per 60 seconds.
 * Prevents brute-force login attempts.
 */
export const authLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, "60 s"),
      analytics: true,
      prefix: "ratelimit:auth",
    })
  : null;

/**
 * Result of a rate limit check.
 */
export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

/**
 * Check rate limit for an identifier (typically IP address).
 * Returns { success: true } if within limits, { success: false } if exceeded.
 * Always succeeds when Redis is not configured (dev fallback).
 *
 * @param identifier - Unique key (IP address or user ID)
 * @param type - Which limiter to use: "api" (default) or "auth"
 */
export async function checkRateLimit(
  identifier: string,
  type: "api" | "auth" = "api"
): Promise<RateLimitResult> {
  const limiter = type === "auth" ? authLimiter : apiLimiter;

  /* No Redis configured — allow all requests (development mode) */
  if (!limiter) {
    return { success: true, limit: 0, remaining: 0, reset: 0 };
  }

  const result = await limiter.limit(identifier);

  return {
    success: result.success,
    limit: result.limit,
    remaining: result.remaining,
    reset: result.reset,
  };
}
