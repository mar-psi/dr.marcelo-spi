import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    template: "%s | Dr. Marcelo Psiquiatra",
    default: "Acesso | Dr. Marcelo Psiquiatra",
  },
  description: "Acesse sua conta na plataforma Dr. Marcelo Psiquiatra.",
  robots: { index: false, follow: false },
};

export default function AuthRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
