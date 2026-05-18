"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, Loader2, CheckCircle2 } from "lucide-react";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { SocialAuthButton } from "@/components/auth/SocialAuthButton";
import { useAuth } from "@/hooks/useAuth";
import { validateEmail } from "@/data/auth";
import { getAuthNotice } from "@/lib/auth/notices";
import { cn } from "@/lib/utils";

function getSafeRedirect(raw: string | null): string {
  if (!raw) return "/";
  // Só permite paths relativos internos
  try {
    const url = new URL(raw, "http://localhost");
    if (url.protocol === "http:" && url.pathname.startsWith("/")) {
      return url.pathname + url.search;
    }
  } catch {
    if (raw.startsWith("/") && !raw.startsWith("//")) return raw;
  }
  return "/";
}

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, loading, error, clearError } = useAuth();

  const redirectParam = searchParams.get("redirect");
  const redirectTo = getSafeRedirect(redirectParam);
  const redirectQuery = redirectParam ? `?redirect=${encodeURIComponent(redirectParam)}` : "";
  const notice = getAuthNotice(searchParams.get("notice"));

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);

  const validate = () => {
    const errors: Record<string, string> = {};
    if (!email) errors.email = "Informe seu e-mail.";
    else if (!validateEmail(email)) errors.email = "E-mail inválido.";
    if (!password) errors.password = "Informe sua senha.";
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    if (!validate()) return;

    const signedUser = await login({ email, password, rememberMe });
    if (signedUser) {
      setSuccess(true);
      const finalDest =
        signedUser.role === "admin" && redirectTo === "/" ? "/admin" : redirectTo;

      setTimeout(() => router.push(finalDest), 1000);
    }
  };

  return (
    <AuthLayout
      title="Bem-vindo de volta 👋"
      subtitle="Acesse sua conta para continuar aprendendo."
    >
      <div className="space-y-5">

        {/* Social */}
        <SocialAuthButton provider="google" action="login" />

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-border-subtle" />
          <span className="text-xs text-content-disabled">ou continue com e-mail</span>
          <div className="flex-1 h-px bg-border-subtle" />
        </div>

        {/* API Error */}
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
              <p className="text-xs text-status-error leading-relaxed">{error}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Success */}
        <AnimatePresence>
          {success && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2.5 p-3.5 rounded-xl bg-status-successBg border border-[rgba(34,197,94,0.3)]"
            >
              <CheckCircle2 size={15} className="text-status-success" />
              <p className="text-xs text-status-success font-medium">
                Login realizado! Redirecionando...
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>

          {/* Email */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-content-secondary uppercase tracking-wider">
              E-mail
            </label>
            <input
              type="email"
              placeholder="seu@email.com"
              autoComplete="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (fieldErrors.email) setFieldErrors((p) => ({ ...p, email: "" }));
              }}
              className={cn(
                "w-full h-11 bg-background-tertiary border rounded-xl px-4",
                "text-sm text-content-primary placeholder:text-content-disabled",
                "outline-none transition-all duration-200",
                "focus:border-accent-primary focus:shadow-[0_0_0_3px_rgba(124,58,237,0.15)]",
                fieldErrors.email
                  ? "border-status-error"
                  : "border-border-DEFAULT hover:border-border-hover"
              )}
            />
            {fieldErrors.email && (
              <p className="text-xs text-status-error">{fieldErrors.email}</p>
            )}
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-content-secondary uppercase tracking-wider">
                Senha
              </label>
              <Link
                href={`/esqueci-senha${redirectQuery}`}
                className="text-xs text-accent-secondary hover:text-accent-primary transition-colors"
              >
                Esqueceu a senha?
              </Link>
            </div>
            <PasswordInput
              placeholder="Sua senha"
              autoComplete="current-password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (fieldErrors.password) setFieldErrors((p) => ({ ...p, password: "" }));
              }}
              error={fieldErrors.password}
            />
          </div>

          {/* Remember me */}
          <label className="flex items-center gap-2.5 cursor-pointer group">
            <div className="relative">
              <input
                type="checkbox"
                className="sr-only"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <div className={cn(
                "w-4.5 h-4.5 rounded border-2 flex items-center justify-center transition-all duration-200",
                rememberMe
                  ? "bg-accent-primary border-accent-primary"
                  : "border-border-DEFAULT group-hover:border-accent-primary/50"
              )}>
                {rememberMe && (
                  <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                    <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
            </div>
            <span className="text-xs text-content-secondary group-hover:text-content-primary transition-colors">
              Lembrar de mim
            </span>
          </label>

          {/* Submit */}
          <motion.button
            type="submit"
            disabled={loading || success}
            whileHover={!loading && !success ? { scale: 1.01 } : {}}
            whileTap={!loading && !success ? { scale: 0.98 } : {}}
            className={cn(
              "w-full h-12 rounded-xl font-semibold text-sm text-white",
              "bg-accent-primary shadow-glow",
              "hover:bg-accent-primaryHover hover:shadow-glowStrong",
              "transition-all duration-200 disabled:opacity-60",
              "flex items-center justify-center gap-2"
            )}
          >
            {loading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : success ? (
              <CheckCircle2 size={16} />
            ) : null}
            {loading ? "Entrando..." : success ? "Redirecionando..." : "Entrar"}
          </motion.button>
        </form>

        {/* Register link */}
        <p className="text-center text-xs text-content-secondary">
          Não tem uma conta?{" "}
          <Link
            href={`/cadastro${redirectQuery}`}
            className="text-accent-secondary font-semibold hover:text-accent-primary transition-colors"
          >
            Crie grátis agora
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}

export default function LoginPage() {
  return (
    <React.Suspense fallback={
      <AuthLayout title="Bem-vindo de volta 👋" subtitle="Acesse sua conta para continuar aprendendo.">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-accent-primary animate-spin" />
        </div>
      </AuthLayout>
    }>
      <LoginContent />
    </React.Suspense>
  );
}
