import * as Sentry from "@sentry/nextjs";

import { sentryOptions } from "@/lib/sentry-options";

// NEXT_PUBLIC_* é embutido no build (build arg no Dockerfile). O DSN do navegador é público por desenho.
Sentry.init(sentryOptions(process.env.NEXT_PUBLIC_SENTRY_DSN));

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
