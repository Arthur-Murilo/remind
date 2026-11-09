import * as Sentry from "@sentry/nextjs";

import { sentryOptions } from "@/lib/sentry-options";

export function register() {
  // DSN lido em runtime (docker compose environment). Roda em nodejs e edge.
  Sentry.init(sentryOptions(process.env.SENTRY_DSN));
}

export const onRequestError = Sentry.captureRequestError;
