import type { Metadata } from "next";
import { Inter } from "next/font/google";

import "./globals.css";

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

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" className={inter.variable} suppressHydrationWarning>
      <body style={{ fontFamily: "var(--font-inter), var(--font)" }}>{children}</body>
    </html>
  );
}
