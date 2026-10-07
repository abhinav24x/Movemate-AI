/**
 * Simple in-memory rate limiter — Vercel-compatible (no Redis needed).
 *
 * Uses a sliding window algorithm per IP address.
 * Works correctly within a single serverless function instance.
 * On Vercel, each cold-start gets a fresh store, which is acceptable
 * for basic abuse prevention (not a strict rate-limit guarantee).
 *
 * Limits:
 *   /api/agent      — 30 req / 60s
 *   /api/transcribe — 20 req / 60s
 *   /api/speech     — 30 req / 60s
 */

interface WindowEntry {
  timestamps: number[];
}

const store = new Map<string, WindowEntry>();

// Clean up entries older than 2 minutes to prevent memory growth
function cleanup(now: number): void {
  const cutoff = now - 120_000;
  for (const [key, entry] of store.entries()) {
    entry.timestamps = entry.timestamps.filter((t) => t > cutoff);
    if (entry.timestamps.length === 0) store.delete(key);
  }
}

let lastCleanup = Date.now();

/**
 * Check and record a request for `key` within a sliding `windowMs`.
 * Returns `true` if the request is allowed, `false` if rate-limited.
 */
export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): boolean {
  const now = Date.now();

  // Periodic cleanup (every 30 seconds)
  if (now - lastCleanup > 30_000) {
    cleanup(now);
    lastCleanup = now;
  }

  const cutoff = now - windowMs;
  const entry = store.get(key) ?? { timestamps: [] };

  // Remove timestamps outside window
  entry.timestamps = entry.timestamps.filter((t) => t > cutoff);

  if (entry.timestamps.length >= limit) {
    return false; // rate-limited
  }

  entry.timestamps.push(now);
  store.set(key, entry);
  return true;
}

/**
 * Extract a rate-limit key from a Next.js request.
 * Uses X-Forwarded-For (set by Vercel) or falls back to a generic key.
 */
export function getRateLimitKey(req: Request, prefix: string): string {
  const forwarded = (req.headers as Headers).get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0].trim() : "unknown";
  return `${prefix}:${ip}`;
}

/** Standard 429 response */
export function rateLimitedResponse(): Response {
  return new Response(
    JSON.stringify({ error: "Too many requests. Please wait a moment and try again." }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": "60",
      },
    },
  );
}
