import path from "node:path";
import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
  // Navegadores ignoram HSTS recebido por http (dev/localhost); sem includeSubDomains para não afetar outros hosts do domínio.
  { key: "Strict-Transport-Security", value: "max-age=31536000" },
  // Sem script-src restritivo para não quebrar os scripts inline do Next; bloqueia embed, <base> e envio de formulário externo.
  {
    key: "Content-Security-Policy",
    value: "frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'"
  }
];

const nextConfig: NextConfig = {
  output: "standalone",
  typedRoutes: true,
  poweredByHeader: false,
  serverExternalPackages: ["@modelcontextprotocol/sdk"],
  turbopack: {
    root: path.join(__dirname)
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  }
};

export default nextConfig;
