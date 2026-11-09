"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="pt-BR">
      <body style={{ fontFamily: "system-ui, sans-serif", padding: 24 }}>
        <h1>Algo deu errado</h1>
        <p>O erro foi registrado. Recarregue a página para tentar de novo.</p>
      </body>
    </html>
  );
}
