export const MCP_MAX_BODY_BYTES = 64 * 1024;

export function payloadTooLargeResponse(): Response {
  return new Response(JSON.stringify({ error: "Payload Too Large" }), {
    status: 413,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store"
    }
  });
}

export function internalErrorResponse(): Response {
  return new Response(JSON.stringify({ error: "Internal Server Error" }), {
    status: 500,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store"
    }
  });
}

export function serviceUnavailableResponse(): Response {
  return new Response(JSON.stringify({ error: "Service Unavailable" }), {
    status: 503,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store"
    }
  });
}

export function jsonToolResult(data: unknown, isError = false) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(data) }],
    isError
  };
}

export function invalidInputResult() {
  return jsonToolResult({ error: "invalid_input", message: "Entrada inválida." }, true);
}

export function notFoundResult(message: string) {
  return jsonToolResult({ error: "not_found", message }, true);
}

export function requestBodyTooLarge(request: Request): boolean {
  const header = request.headers.get("content-length");
  if (!header) return false;
  const length = Number(header);
  return Number.isFinite(length) && length > MCP_MAX_BODY_BYTES;
}

export type LimitedJsonBody =
  | { ok: true; parsed: unknown }
  | { ok: false; tooLarge: true }
  | { ok: false; invalidJson: true };

export async function readJsonBodyLimited(request: Request): Promise<LimitedJsonBody> {
  if (requestBodyTooLarge(request)) {
    return { ok: false, tooLarge: true };
  }

  if (!request.body) {
    return { ok: false, invalidJson: true };
  }

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let received = 0;

  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      received += value.byteLength;
      if (received > MCP_MAX_BODY_BYTES) {
        await reader.cancel();
        return { ok: false, tooLarge: true };
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  const bytes = new Uint8Array(received);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }

  try {
    return { ok: true, parsed: JSON.parse(new TextDecoder().decode(bytes)) };
  } catch {
    return { ok: false, invalidJson: true };
  }
}

export function invalidJsonResponse(): Response {
  return new Response(
    JSON.stringify({
      jsonrpc: "2.0",
      error: { code: -32700, message: "Parse error: Invalid JSON" },
      id: null
    }),
    {
      status: 400,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store"
      }
    }
  );
}
