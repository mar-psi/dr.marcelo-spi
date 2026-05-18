import React from "react";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui";

export function WelcomeBanner() {
  return (
    <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-accent-primary/20 via-background-tertiary to-background-secondary border border-accent-primary/30 p-6 lg:p-8">
      {/* Decorative blobs */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-accent-primary/10 blur-3xl rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/10 blur-3xl rounded-full pointer-events-none" />

      <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center gap-4 justify-between">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent-primary/20 border border-accent-primary/40 flex items-center justify-center shrink-0 mt-0.5">
            <Sparkles size={18} className="text-accent-secondary" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-content-primary mb-1">
              Bem-vindo à plataforma! 👋
            </h3>
            <p className="text-sm text-content-secondary max-w-md">
              Explore conteúdo gratuito sobre saúde mental ou assine por R$15/mês para acesso completo às aulas, e-books e quizzes do Dr. Marcelo.
            </p>
          </div>
        </div>
        <div className="flex gap-3 shrink-0">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/aulas">Explorar</Link>
          </Button>
          <Button variant="primary" size="sm" asChild>
            <Link href="/assinatura">Assinar agora</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
