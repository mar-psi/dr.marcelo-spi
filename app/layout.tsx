import type { Metadata, Viewport } from "next";
import "@/app/globals.css";
import { ToastProvider } from "@/components/ui";

// ─── Base URL ───────────────────────────────────────────────────────────────
// Usa a env var padrao da Vercel (NEXT_PUBLIC_SITE_URL > VERCEL_URL > localhost)
// para que og/twitter/canonical funcionem em preview, prod e dev.
const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

// ─── Metadata ───────────────────────────────────────────────────────────────
// Os favicons sao gerados automaticamente pelas convenções `app/icon.tsx` e
// `app/apple-icon.tsx` — o Next injeta os <link rel="icon" /> corretos.
export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Dr. Marcelo Psiquiatra — Plataforma de Saúde Mental",
    template: "%s | Dr. Marcelo Psiquiatra",
  },
  description:
    "Acesse conteúdo educativo sobre psiquiatria e saúde mental. Aulas, e-books, quizzes e muito mais por apenas R$15/mês.",
  keywords: ["psiquiatria", "saúde mental", "depressão", "ansiedade", "transtornos"],
  authors: [{ name: "Dr. Marcelo" }],
  applicationName: "Dr. Marcelo Psiquiatra",
  referrer: "origin-when-cross-origin",
  formatDetection: {
    telephone: false,
    email: false,
    address: false,
  },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: "Dr. Marcelo Psiquiatra",
    title: "Dr. Marcelo Psiquiatra — Plataforma de Saúde Mental",
    description:
      "Acesse conteúdo educativo sobre psiquiatria e saúde mental. Aulas, e-books, quizzes e muito mais por apenas R$15/mês.",
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title: "Dr. Marcelo Psiquiatra — Plataforma de Saúde Mental",
    description:
      "Acesse conteúdo educativo sobre psiquiatria e saúde mental.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

// ─── Viewport ───────────────────────────────────────────────────────────────
// A partir do Next 14 o `themeColor` e afins DEVEM ficar no export `viewport`
// (antes ficavam em metadata) — corrige o warning que estava no layout antigo.
export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0A0A0F" },
    { media: "(prefers-color-scheme: light)", color: "#0A0A0F" },
  ],
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className="dark" suppressHydrationWarning>
      <body
        className="font-sans bg-background-primary text-content-primary antialiased"
      >
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
