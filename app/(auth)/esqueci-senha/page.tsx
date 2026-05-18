"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, AlertCircle, CheckCircle2, Loader2, ArrowLeft } from "lucide-react";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { useAuth } from "@/hooks/useAuth";
import { validateEmail } from "@/data/auth";
import { getAuthNotice } from "@/lib/auth/notices";
import { cn } from "@/lib/utils";

function EsqueciSenhaContent() {
  const searchParams = useSearchParams();
  const { forgotPassword, loading, error, clearError } = useAuth();

  const redirectParam = searchParams.get("redirect");
  const redirectQuery = redirectParam ? `?redirect=${encodeURIComponent(redirectParam)}` : "";
  const notice = getAuthNotice(searchParams.get("notice"));

  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    if (!email) return setEmailError("Informe seu e-mail.");
    if (!validateEmail(email)) return setEmailError("E-mail inválido.");
    setEmailError("");

    const ok = await forgotPassword(email);
    if (ok) setSent(true);
  };

  return (
    <AuthLayout
      title="Recuperar senha"
      subtitle="Enviaremos um link para você criar uma nova senha."
    >
      <AnimatePresence mode="wait">
        {!sent ? (
          <motion.div
            key="form"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-5"
          >
            {/* Error */}
            <AnimatePresence>
              {notice && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className={cn(
                    "flex items-start gap-2.5 p-3.5 rounded-xl border",
                    notice.tone === "error"
                      ? "bg-status-errorBg border-[rgba(239,68,68,0.3)]"
                      : "bg-status-successBg border-[rgba(34,197,94,0.3)]"
                  )}
                >
                  {notice.tone === "error" ? (
                    <AlertCircle size={15} className="text-status-error shrink-0 mt-0.5" />
                  ) : (
                    <CheckCircle2 size={15} className="text-status-success shrink-0 mt-0.5" />
                  )}
                  <p
                    className={cn(
                      "text-xs leading-relaxed",
                      notice.tone === "error" ? "text-status-error" : "text-status-success"
                    )}
                  >
                    {notice.message}
                  </p>
                </motion.div>
              )}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex items-start gap-2.5 p-3.5 rounded-xl bg-status-errorBg border border-[rgba(239,68,68,0.3)]"
                >
                  <AlertCircle size={15} className="text-status-error shrink-0 mt-0.5" />
                  <p className="text-xs text-status-error">{error}</p>
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-content-secondary uppercase tracking-wider">
                  E-mail
                </label>
                <div className="relative">
                  <input
                    type="email"
                    placeholder="seu@email.com"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (emailError) setEmailError("");
                    }}
                    className={cn(
                      "w-full h-11 bg-background-tertiary border rounded-xl px-4 pl-11",
                      "text-sm text-content-primary placeholder:text-content-disabled",
                      "outline-none transition-all duration-200",
                      "focus:border-accent-primary focus:shadow-[0_0_0_3px_rgba(124,58,237,0.15)]",
                      emailError
                        ? "border-status-error"
                        : "border-border-DEFAULT hover:border-border-hover"
                    )}
                  />
                  <Mail
                    size={15}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-content-disabled"
                  />
                </div>
                {emailError && (
                  <p className="text-xs text-status-error">{emailError}</p>
                )}
              </div>

              <motion.button
                type="submit"
                disabled={loading}
                whileHover={!loading ? { scale: 1.01 } : {}}
                whileTap={!loading ? { scale: 0.98 } : {}}
                className={cn(
                  "w-full h-12 rounded-xl font-semibold text-sm text-white",
                  "bg-accent-primary shadow-glow",
                  "hover:bg-accent-primaryHover hover:shadow-glowStrong",
                  "transition-all duration-200 disabled:opacity-60",
                  "flex items-center justify-center gap-2"
                )}
              >
                {loading && <Loader2 size={16} className="animate-spin" />}
                {loading ? "Enviando..." : "Enviar link de recuperação"}
              </motion.button>
            </form>

            <div className="flex justify-center">
              <Link
                href={`/login${redirectQuery}`}
                className="flex items-center gap-1.5 text-xs text-content-secondary hover:text-content-primary transition-colors"
              >
                <ArrowLeft size={13} />
                Voltar ao login
              </Link>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center space-y-5"
          >
            {/* Icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
              className="w-16 h-16 rounded-full bg-status-successBg border border-[rgba(34,197,94,0.3)] flex items-center justify-center mx-auto"
            >
              <CheckCircle2 size={28} className="text-status-success" />
            </motion.div>

            <div>
              <h3 className="text-lg font-bold text-content-primary mb-2">
                E-mail enviado!
              </h3>
              <p className="text-sm text-content-secondary leading-relaxed">
                Enviamos um link de recuperação para{" "}
                <span className="font-semibold text-content-primary">{email}</span>.
                Verifique sua caixa de entrada e spam.
              </p>
            </div>

            {/* Resend */}
            <div className="p-4 rounded-xl bg-background-tertiary border border-border-subtle text-left space-y-2">
              <p className="text-xs font-semibold text-content-secondary">Não recebeu?</p>
              <ul className="space-y-1 text-xs text-content-disabled">
                <li>· Verifique a pasta de spam</li>
                <li>· Aguarde até 5 minutos</li>
                <li>· Confirme se o e-mail está correto</li>
              </ul>
              <button
                onClick={() => setSent(false)}
                className="text-xs text-accent-secondary hover:text-accent-primary transition-colors font-medium"
              >
                Tentar com outro e-mail
              </button>
            </div>

            <Link
              href={`/login${redirectQuery}`}
              className="flex items-center justify-center gap-1.5 text-xs text-content-secondary hover:text-content-primary transition-colors"
            >
              <ArrowLeft size={13} />
              Voltar ao login
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </AuthLayout>
  );
}

export default function EsqueciSenhaPage() {
  return (
    <React.Suspense fallback={
      <AuthLayout title="Recuperar senha" subtitle="Enviaremos um link para você criar uma nova senha.">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-accent-primary animate-spin" />
        </div>
      </AuthLayout>
    }>
      <EsqueciSenhaContent />
    </React.Suspense>
  );
}
