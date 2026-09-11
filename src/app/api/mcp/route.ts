import { getUserByEmail, mcpOwnerEmail } from "@/server/auth";
import {
  clientIp,
  isMcpRequestAuthorized,
  unauthorizedResponse
} from "@/mcp/auth";
import {
  consumeMcpRateLimit,
  rateLimitExceededResponse
} from "@/mcp/rate-limit";
import {
  internalErrorResponse,
  invalidJsonResponse,
  payloadTooLargeResponse,
  readJsonBodyLimited,
  requestBodyTooLarge,
  serviceUnavailableResponse
} from "@/mcp/errors";
import { handleMcpTransport } from "@/mcp/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function handle(request: Request): Promise<Response> {
  try {
    if (requestBodyTooLarge(request)) {
      return payloadTooLargeResponse();
    }

    const limit = consumeMcpRateLimit(clientIp(request));
    if (!limit.ok) {
      return rateLimitExceededResponse(limit.retryAfterSeconds);
    }

    if (!isMcpRequestAuthorized(request)) {
      return unauthorizedResponse();
    }

    let parsedBody: unknown | undefined;
    if (request.method === "POST") {
      const body = await readJsonBodyLimited(request);
      if (!body.ok && "tooLarge" in body) {
        return payloadTooLargeResponse();
      }
      if (!body.ok) {
        return invalidJsonResponse();
      }
      parsedBody = body.parsed;
    }

    const email = mcpOwnerEmail();
    const user = email ? await getUserByEmail(email) : null;
    if (!user) {
      return serviceUnavailableResponse();
    }

    return await handleMcpTransport(request, user, parsedBody);
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      const detail = error instanceof Error ? error.message : "erro interno";
      console.error("[mcp]", detail);
    }
    return internalErrorResponse();
  }
}

export const GET = handle;
export const POST = handle;
export const DELETE = handle;
