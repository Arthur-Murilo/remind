export const MCP_RATE_LIMIT = 60;
export const MCP_RATE_WINDOW_MS = 60_000;

export type RateLimitResult =
  | { ok: true }
  | { ok: false; retryAfterSeconds: number };

type Clock = () => number;

export function createRateLimiter(options?: {
  limit?: number;
  windowMs?: number;
  now?: Clock;
}) {
  const limit = options?.limit ?? MCP_RATE_LIMIT;
  const windowMs = options?.windowMs ?? MCP_RATE_WINDOW_MS;
  const now = options?.now ?? Date.now;
  const hitsByKey = new Map<string, number[]>();

  return {
    consume(key: string): RateLimitResult {
      const current = now();
      const windowStart = current - windowMs;
      const hits = (hitsByKey.get(key) ?? []).filter((stamp) => stamp > windowStart);

      if (hits.length >= limit) {
        const oldest = hits[0] ?? current;
        const retryAfterSeconds = Math.max(1, Math.ceil((oldest + windowMs - current) / 1000));
        hitsByKey.set(key, hits);
        return { ok: false, retryAfterSeconds };
      }

      hits.push(current);
      hitsByKey.set(key, hits);
      return { ok: true };
    },
    reset() {
      hitsByKey.clear();
    }
  };
}

const defaultLimiter = createRateLimiter();

export function consumeMcpRateLimit(key: string): RateLimitResult {
  return defaultLimiter.consume(key);
}

export function resetMcpRateLimit() {
  defaultLimiter.reset();
}

export function rateLimitExceededResponse(retryAfterSeconds: number): Response {
  return new Response(JSON.stringify({ error: "Too Many Requests" }), {
    status: 429,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      "Retry-After": String(retryAfterSeconds)
    }
  });
}
