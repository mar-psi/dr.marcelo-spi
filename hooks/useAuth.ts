"use client";

import { useState, useEffect, useCallback } from "react";
import type { User } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import type {
  LoginCredentials,
  RegisterCredentials,
  AuthUser,
} from "@/data/auth";
import { hasSupabaseConfig } from "@/lib/supabase/config";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type RegisterResult = "authenticated" | "pending_confirmation" | null;

interface UseAuthReturn {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
  login: (credentials: LoginCredentials) => Promise<AuthUser | null>;
  register: (
    credentials: RegisterCredentials,
    redirectPath?: string
  ) => Promise<RegisterResult>;
  logout: () => Promise<void>;
  forgotPassword: (email: string) => Promise<boolean>;
  resetPassword: (token: string, password: string) => Promise<boolean>;
  clearError: () => void;
}

function mapSupabaseUser(user: User): AuthUser {
  const role = user.app_metadata?.role === "admin" ? "admin" : "user";
  const name =
    user.user_metadata?.full_name ??
    user.user_metadata?.name ??
    user.email?.split("@")[0] ??
    "Aluno";

  return {
    id: user.id,
    name,
    email: user.email ?? "",
    avatar: user.user_metadata?.avatar_url,
    plan:
      role === "admin" || user.app_metadata?.plan === "assinante"
        ? "assinante"
        : "gratuito",
    role,
    joinedAt: user.created_at,
    emailVerified: Boolean(user.email_confirmed_at),
  };
}

function authErrorMessage(message?: string): string {
  if (!message) return "Nao foi possivel autenticar. Tente novamente.";

  const normalized = message.toLowerCase();
  if (normalized.includes("invalid login credentials")) {
    return "E-mail ou senha incorretos.";
  }
  if (normalized.includes("already registered") || normalized.includes("already exists")) {
    return "Este e-mail ja esta cadastrado.";
  }
  if (normalized.includes("email not confirmed")) {
    return "Confirme seu e-mail antes de entrar.";
  }
  if (normalized.includes("password")) {
    return "A senha nao atende aos requisitos de seguranca.";
  }
  return message;
}

function buildEmailRedirect(redirectPath: string): string | undefined {
  if (typeof window === "undefined") return undefined;

  const url = new URL("/auth/confirm", window.location.origin);
  url.searchParams.set("next", redirectPath);
  return url.toString();
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const clearError = useCallback(() => setError(null), []);

  useEffect(() => {
    if (!hasSupabaseConfig()) {
      setLoading(false);
      setUser(null);
      return;
    }

    const supabase = createSupabaseBrowserClient();
    let mounted = true;

    supabase.auth.getUser().then(({ data }) => {
      if (!mounted) return;
      setUser(data.user ? mapSupabaseUser(data.user) : null);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ? mapSupabaseUser(session.user) : null);
      router.refresh();
    });

    const handleProfileUpdated = (event: Event) => {
      const detail = (event as CustomEvent<{
        name?: string;
        email?: string;
        avatarUrl?: string | null;
      }>).detail;

      setUser((current) =>
        current
          ? {
              ...current,
              name: detail?.name ?? current.name,
              email: detail?.email ?? current.email,
              avatar: detail?.avatarUrl ?? current.avatar,
            }
          : current
      );
      router.refresh();
    };

    window.addEventListener("app:profile-updated", handleProfileUpdated);

    return () => {
      mounted = false;
      window.removeEventListener("app:profile-updated", handleProfileUpdated);
      subscription.unsubscribe();
    };
  }, [router]);

  const login = useCallback(
    async (credentials: LoginCredentials): Promise<AuthUser | null> => {
      setLoading(true);
      setError(null);
      try {
        if (!credentials.email || !credentials.password) {
          setError("Preencha todos os campos.");
          return null;
        }

        if (!hasSupabaseConfig()) {
          setError("Supabase nao configurado. Preencha as variaveis de ambiente.");
          return null;
        }

        const supabase = createSupabaseBrowserClient();
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email: credentials.email.trim(),
          password: credentials.password,
        });

        if (signInError || !data.user) {
          setError(authErrorMessage(signInError?.message));
          return null;
        }

        const signedUser = mapSupabaseUser(data.user);
        setUser(signedUser);
        router.refresh();
        return signedUser;
      } catch {
        setError("Erro de conexão. Verifique sua internet.");
        return null;
      } finally {
        setLoading(false);
      }
    },
    [router]
  );

  const register = useCallback(
    async (
      credentials: RegisterCredentials,
      redirectPath = "/"
    ): Promise<RegisterResult> => {
      setLoading(true);
      setError(null);
      try {
        if (!hasSupabaseConfig()) {
          setError("Supabase nao configurado. Preencha as variaveis de ambiente.");
          return null;
        }

        if (credentials.password !== credentials.confirmPassword) {
          setError("As senhas nao coincidem.");
          return null;
        }

        const supabase = createSupabaseBrowserClient();
        const emailRedirectTo = buildEmailRedirect(redirectPath);
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: credentials.email.trim(),
          password: credentials.password,
          options: {
            emailRedirectTo,
            data: {
              full_name: credentials.name.trim(),
            },
          },
        });

        if (signUpError) {
          setError(authErrorMessage(signUpError.message));
          return null;
        }

        if (data.session?.user) {
          setUser(mapSupabaseUser(data.session.user));
          router.refresh();
          return "authenticated";
        }

        return "pending_confirmation";
      } catch {
        setError("Erro de conexão. Verifique sua internet.");
        return null;
      } finally {
        setLoading(false);
      }
    },
    [router]
  );

  const logout = useCallback(async () => {
    if (hasSupabaseConfig()) {
      const supabase = createSupabaseBrowserClient();
      await supabase.auth.signOut();
    }

    setUser(null);
    router.refresh();
    router.push("/login");
  }, [router]);

  const forgotPassword = useCallback(async (email: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      if (!hasSupabaseConfig()) {
        setError("Supabase nao configurado. Preencha as variaveis de ambiente.");
        return false;
      }

      const supabase = createSupabaseBrowserClient();
      const redirectTo = buildEmailRedirect("/nova-senha?notice=password_reset_ready");
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email.trim(),
        { redirectTo }
      );

      if (resetError) {
        setError(authErrorMessage(resetError.message));
        return false;
      }

      return true;
    } catch {
      setError("Erro de conexão. Verifique sua internet.");
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const resetPassword = useCallback(
    async (_token: string, password: string): Promise<boolean> => {
      setLoading(true);
      setError(null);
      try {
        if (!hasSupabaseConfig()) {
          setError("Supabase nao configurado. Preencha as variaveis de ambiente.");
          return false;
        }

        const supabase = createSupabaseBrowserClient();
        const { error: updateError } = await supabase.auth.updateUser({ password });

        if (updateError) {
          setError(authErrorMessage(updateError.message));
          return false;
        }

        return true;
      } catch {
        setError("Erro de conexão. Verifique sua internet.");
        return false;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return {
    user,
    loading,
    error,
    login,
    register,
    logout,
    forgotPassword,
    resetPassword,
    clearError,
  };
}
