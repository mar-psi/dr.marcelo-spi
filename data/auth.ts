export interface AuthUser {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  plan: "gratuito" | "assinante";
  role: "user" | "admin";
  joinedAt: string;
  emailVerified: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterCredentials {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface ResetPasswordPayload {
  token: string;
  password: string;
  confirmPassword: string;
}

export type AuthError =
  | "invalid_credentials"
  | "email_already_exists"
  | "email_not_found"
  | "invalid_token"
  | "weak_password"
  | "network_error"
  | "unknown";

export const AUTH_ERRORS: Record<AuthError, string> = {
  invalid_credentials: "E-mail ou senha incorretos. Tente novamente.",
  email_already_exists: "Este e-mail já está cadastrado.",
  email_not_found: "Não encontramos nenhuma conta com este e-mail.",
  invalid_token: "O link de recuperação expirou ou é inválido.",
  weak_password: "Sua senha deve ter ao menos 8 caracteres.",
  network_error: "Erro de conexão. Verifique sua internet.",
  unknown: "Algo deu errado. Tente novamente.",
};

export const PASSWORD_RULES = [
  { id: "length", label: "Mínimo de 8 caracteres", test: (p: string) => p.length >= 8 },
  { id: "upper", label: "Uma letra maiúscula", test: (p: string) => /[A-Z]/.test(p) },
  { id: "number", label: "Um número", test: (p: string) => /\d/.test(p) },
  { id: "special", label: "Um caractere especial", test: (p: string) => /[^A-Za-z0-9]/.test(p) },
];

export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function validatePassword(password: string): boolean {
  return PASSWORD_RULES.every((r) => r.test(password));
}

export function getPasswordStrength(password: string): {
  score: number;
  label: string;
  color: string;
} {
  const passed = PASSWORD_RULES.filter((r) => r.test(password)).length;
  if (passed === 0) return { score: 0, label: "", color: "" };
  if (passed === 1) return { score: 25, label: "Fraca", color: "#EF4444" };
  if (passed === 2) return { score: 50, label: "Razoável", color: "#F59E0B" };
  if (passed === 3) return { score: 75, label: "Boa", color: "#3B82F6" };
  return { score: 100, label: "Forte", color: "#22C55E" };
}
