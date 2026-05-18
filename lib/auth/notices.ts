export type AuthNoticeTone = "success" | "error" | "info";

export interface AuthNotice {
  tone: AuthNoticeTone;
  message: string;
}

const AUTH_NOTICES: Record<string, AuthNotice> = {
  confirm_email_sent: {
    tone: "success",
    message: "Conta criada. Verifique seu e-mail para confirmar o acesso.",
  },
  email_confirmed: {
    tone: "success",
    message: "E-mail confirmado com sucesso. Voce ja pode entrar na plataforma.",
  },
  email_changed: {
    tone: "success",
    message: "Seu e-mail foi atualizado com sucesso.",
  },
  password_reset_ready: {
    tone: "info",
    message: "Link validado. Agora escolha sua nova senha.",
  },
  invite_ready: {
    tone: "info",
    message: "Convite validado. Defina sua senha para ativar o acesso.",
  },
  email_link_invalid: {
    tone: "error",
    message: "Este link expirou, ja foi usado ou e invalido. Solicite um novo e-mail.",
  },
};

export function getAuthNotice(key: string | null): AuthNotice | null {
  if (!key) return null;
  return AUTH_NOTICES[key] ?? null;
}
