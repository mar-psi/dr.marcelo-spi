"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, CheckCircle2, Loader2, ShieldCheck } from "lucide-react";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { useAuth } from "@/hooks/useAuth";
import { validatePassword } from "@/data/auth";
import { getAuthNotice } from "@/lib/auth/notices";
import { cn } from "@/lib/utils";

function NovaSenhaContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const notice = getAuthNotice(searchParams.get("notice"));

  const { resetPassword, loading, error, clearError } = useAuth();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);

  const validate = () => {
    const errors: Record<string, string> = {};
    if (!password) errors.password = "Crie uma nova senha.";
    else if (!validatePassword(password))
      errors.password = "A senha não atende aos requisitos.";
    if (!confirmPassword) errors.confirmPassword = "Confirme a nova senha.";
    else if (password !== confirmPassword)
      errors.confirmPassword = "As senhas não coincidem.";
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    if (!validate()) return;

    const ok = await resetPassword(token, password);
    if (ok) {
      setSuccess(true);
      setTimeout(() => router.push("/login"), 2500);
    }
  };

  return (
    <AnimatePresence mode="wait">
      {!success ? (
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
            <PasswordInput
              label="Nova senha"
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

            <PasswordInput
              label="Confirmar nova senha"
              placeholder="Repita a nova senha"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                if (fieldErrors.confirmPassword)
                  setFieldErrors((p) => ({ ...p, confirmPassword: "" }));
              }}
              error={fieldErrors.confirmPassword}
            />

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
              {loading ? "Salvando..." : "Salvar nova senha"}
            </motion.button>
          </form>
        </motion.div>
      ) : (
        <motion.div
          key="success"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-5"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
            className="w-16 h-16 rounded-full bg-status-successBg border border-[rgba(34,197,94,0.3)] flex items-center justify-center mx-auto"
          >
            <ShieldCheck size={28} className="text-status-success" />
          </motion.div>

          <div>
            <h3 className="text-lg font-bold text-content-primary mb-2">
              Senha atualizada!
            </h3>
            <p className="text-sm text-content-secondary leading-relaxed">
              Sua senha foi alterada com sucesso. Redirecionando para o login...
            </p>
          </div>

          <div className="w-full bg-background-tertiary rounded-full h-1 overflow-hidden">
            <motion.div
              className="h-full bg-accent-primary rounded-full"
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: 2.5, ease: "linear" }}
            />
          </div>

          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-sm text-accent-secondary hover:text-accent-primary transition-colors font-medium"
          >
            <CheckCircle2 size={14} />
            Ir para o login agora
          </Link>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function NovaSenhaPage() {
  return (
    <AuthLayout
      title="Criar nova senha"
      subtitle="Escolha uma senha forte para proteger sua conta."
    >
      <React.Suspense fallback={
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-accent-primary animate-spin" />
        </div>
      }>
        <NovaSenhaContent />
      </React.Suspense>
    </AuthLayout>
  );
}
