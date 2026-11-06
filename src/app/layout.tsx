import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";

import "./globals.css";
import { appTimeZone } from "@/lib/timezone";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter"
});

export const metadata: Metadata = {
  title: "remind",
  description: "Ferramenta interna para projetos, tarefas e lembretes in-app.",
  applicationName: "remind"
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0c0d0e"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    // data-tz: o cliente calcula "hoje"/"agora" no fuso do app, não no do navegador.
    <html lang="pt-BR" className={inter.variable} data-tz={appTimeZone()} suppressHydrationWarning>
      <body style={{ fontFamily: "var(--font-inter), var(--font)" }}>{children}</body>
    </html>
  );
}
