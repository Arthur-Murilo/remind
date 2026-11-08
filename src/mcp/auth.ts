import { hash, timingSafeEqual } from "node:crypto";

const UNAUTHORIZED_BODY = { error: "Unauthorized" } as const;

export const MCP_UNAUTHORIZED_STATUS = 401;

/** SHA-256 digest (32 bytes) so timingSafeEqual never sees unequal lengths. */
function sha256(value: string): Buffer {
  return hash("sha256", value, "buffer");
}

/**
 * Compara tokens via digestos SHA-256 de 32 bytes para nunca chamar
 * timingSafeEqual com buffers de tamanhos diferentes.
 */
export function tokensMatch(provided: string, expected: string): boolean {
  const providedDigest = sha256(provided);
  const expectedDigest = sha256(expected);
  return timingSafeEqual(providedDigest, expectedDigest);
}

export function extractBearerToken(authorization: string | null): string | null {
  if (!authorization) {
    return null;
  }

  const match = /^Bearer\s+(.*)$/i.exec(authorization);
  if (!match) {
    return null;
  }

  const token = match[1].trim();
  return token.length > 0 ? token : null;
}

export function expectedMcpToken(): string {
  return process.env.MCP_API_TOKEN ?? "";
}

export function isMcpRequestAuthorized(request: Request): boolean {
  const expected = expectedMcpToken();
  const provided = extractBearerToken(request.headers.get("authorization"));

  if (!provided) {
    tokensMatch("", expected || "unconfigured");
    return false;
  }

  if (!expected) {
    tokensMatch(provided, "unconfigured");
    return false;
  }

  return tokensMatch(provided, expected);
}

export function unauthorizedResponse(): Response {
  return new Response(JSON.stringify(UNAUTHORIZED_BODY), {
    status: MCP_UNAUTHORIZED_STATUS,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store"
    }
  });
}

/**
 * IP usado no rate limit. Mesma ordem do login (`src/server/auth.ts`): atrás do Cloudflare,
 * `cf-connecting-ip` é o único que o cliente não forja. O primeiro valor de `x-forwarded-for`
 * vem do cliente; o último é o que o proxy mais próximo anexou.
 */
export function clientIp(request: Request): string {
  const cloudflare = request.headers.get("cf-connecting-ip")?.trim();
  if (cloudflare) return cloudflare;

  const realIp = request.headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;

  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const last = forwarded.split(",").at(-1)?.trim();
    if (last) return last;
  }

  return "unknown";
}
