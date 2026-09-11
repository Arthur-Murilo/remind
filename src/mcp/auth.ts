import { createHash, timingSafeEqual } from "node:crypto";

const UNAUTHORIZED_BODY = { error: "Unauthorized" } as const;

export const MCP_UNAUTHORIZED_STATUS = 401;

function sha256(value: string): Buffer {
  return createHash("sha256").update(value, "utf8").digest();
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

export function presentedTokenDigest(request: Request): string {
  const token = extractBearerToken(request.headers.get("authorization"));
  return sha256(token ?? "missing").toString("hex");
}

export function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }

  return request.headers.get("x-real-ip")?.trim() || "unknown";
}
