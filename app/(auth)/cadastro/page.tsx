"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { SocialAuthButton } from "@/components/auth/SocialAuthButton";
import { useAuth } from "@/hooks/useAuth";
import { validateEmail, validatePassword } from "@/data/auth";
import { cn } from "@/lib/utils";

function getSafeRedirect(raw: string | null): string {
  if (!raw) return "/";
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

function CadastroContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { register, loading, error, clearError } = useAuth();

  const redirectParam = searchParams.get("redirect");
  const redirectTo = getSafeRedirect(redirectParam);
  const redirectQuery = redirectParam ? `?redirect=${encodeURIComponent(redirectParam)}` : "";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [successState, setSuccessState] = useState<"authenticated" | "pending_confirmation" | null>(
    null
  );

  const validate = () => {
    const errors: Record<string, string> = {};
    if (!name.trim() || name.trim().length < 3)
      errors.name = "Informe seu nome completo.";
    if (!email) errors.email = "Informe seu e-mail.";
    else if (!validateEmail(email)) errors.email = "E-mail inválido.";
    if (!password) errors.password = "Crie uma senha.";
    else if (!validatePassword(password))
      errors.password = "A senha não atende aos requisitos.";
    if (!confirmPassword) errors.confirmPassword = "Confirme sua senha.";
    else if (password !== confirmPassword)
      errors.confirmPassword = "As senhas não coincidem.";
    if (!accepted) errors.terms = "Aceite os termos para continuar.";
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    if (!validate()) return;

    const result = await register(
      { name, email, password, confirmPassword },
      redirectTo
    );

    if (result === "authenticated") {
      setSuccessState(result);
      setTimeout(() => router.push(redirectTo), 1200);
      return;
    }

    if (result === "pending_confirmation") {
      setSuccessState(result);
      setTimeout(() => router.push("/login?notice=confirm_email_sent"), 1600);
    }
  };

  return (
    <AuthLayout
      title="Crie sua conta gratuita"
      subtitle="Comece a aprender hoje mesmo. Sem cartão de crédito."
    >
      <div className="space-y-5">

        {/* Social */}
        <SocialAuthButton provider="google" action="register" />

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-border-subtle" />
          <span className="text-xs text-content-disabled">ou cadastre com e-mail</span>
          <div className="flex-1 h-px bg-border-subtle" />
        </div>

        {/* API Error */}
        <AnimatePresence>
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

        {/* Success */}
        <AnimatePresence>
          {successState && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2.5 p-3.5 rounded-xl bg-status-successBg border border-[rgba(34,197,94,0.3)]"
            >
              <CheckCircle2 size={15} className="text-status-success" />
              <p className="text-xs text-status-success font-medium">
                {successState === "authenticated"
                  ? "Conta criada! Redirecionando..."
                  : "Conta criada! Verifique seu e-mail para confirmar o acesso."}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>

          {/* Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-content-secondary uppercase tracking-wider">
              Nome completo
            </label>
            <input
              type="text"
              placeholder="Seu nome"
              autoComplete="name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (fieldErrors.name) setFieldErrors((p) => ({ ...p, name: "" }));
              }}
              className={cn(
                "w-full h-11 bg-background-tertiary border rounded-xl px-4",
                "text-sm text-content-primary placeholder:text-content-disabled",
                "outline-none transition-all duration-200",
                "focus:border-accent-primary focus:shadow-[0_0_0_3px_rgba(124,58,237,0.15)]",
                fieldErrors.name
                  ? "border-status-error"
                  : "border-border-DEFAULT hover:border-border-hover"
              )}
            />
            {fieldErrors.name && (
              <p className="text-xs text-status-error">{fieldErrors.name}</p>
            )}
          </div>

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

          {/* Password with strength */}
          <PasswordInput
            label="Senha"
            placeholder="Mínimo 8 caracteres"
            autoComplete="new-password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (fieldErrors.password)
                setFieldErrors((p) => ({ ...p, password: "" }));
            }}
            error={fieldErrors.password}
            showStrength
            passwordValue={password}
          />

          {/* Confirm password */}
          <PasswordInput
            label="Confirmar senha"
            placeholder="Repita a senha"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              if (fieldErrors.confirmPassword)
                setFieldErrors((p) => ({ ...p, confirmPassword: "" }));
            }}
            error={fieldErrors.confirmPassword}
          />

          {/* Terms */}
          <div>
            <label className="flex items-start gap-2.5 cursor-pointer group">
              <div className="relative mt-0.5 shrink-0">
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={accepted}
                  onChange={(e) => {
                    setAccepted(e.target.checked);
                    if (fieldErrors.terms)
                      setFieldErrors((p) => ({ ...p, terms: "" }));
                  }}
                />
                <div className={cn(
                  "w-4 h-4 rounded border-2 flex items-center justify-center transition-all duration-200",
                  accepted
                    ? "bg-accent-primary border-accent-primary"
                    : fieldErrors.terms
                    ? "border-status-error"
                    : "border-border-DEFAULT group-hover:border-accent-primary/50"
                )}>
                  {accepted && (
                    <svg width="9" height="7" viewBox="0 0 10 8" fill="none">
                      <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
              </div>
              <span className="text-xs text-content-secondary leading-relaxed">
                Li e aceito os{" "}
                <Link href="/termos" className="text-accent-secondary hover:underline">
                  Termos de Uso
                </Link>{" "}
                e a{" "}
                <Link href="/privacidade" className="text-accent-secondary hover:underline">
                  Política de Privacidade
                </Link>
              </span>
            </label>
            {fieldErrors.terms && (
              <p className="text-xs text-status-error mt-1 ml-6">
                {fieldErrors.terms}
              </p>
            )}
          </div>

          {/* Submit */}
          <motion.button
            type="submit"
            disabled={loading || Boolean(successState)}
            whileHover={!loading && !successState ? { scale: 1.01 } : {}}
            whileTap={!loading && !successState ? { scale: 0.98 } : {}}
            className={cn(
              "w-full h-12 rounded-xl font-semibold text-sm text-white",
              "bg-accent-primary shadow-glow",
              "hover:bg-accent-primaryHover hover:shadow-glowStrong",
              "transition-all duration-200 disabled:opacity-60",
              "flex items-center justify-center gap-2"
            )}
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            {successState && <CheckCircle2 size={16} />}
            {loading
              ? "Criando conta..."
              : successState
                ? "Conta criada!"
                : "Criar conta grátis"}
          </motion.button>
        </form>

        {/* Login link */}
        <p className="text-center text-xs text-content-secondary">
          Já tem uma conta?{" "}
          <Link
            href={`/login${redirectQuery}`}
            className="text-accent-secondary font-semibold hover:text-accent-primary transition-colors"
          >
            Entrar
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}

export default function CadastroPage() {
  return (
    <React.Suspense fallback={
      <AuthLayout title="Crie sua conta gratuita" subtitle="Comece a aprender hoje mesmo. Sem cartão de crédito.">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-accent-primary animate-spin" />
        </div>
      </AuthLayout>
    }>
      <CadastroContent />
    </React.Suspense>
  );
}
