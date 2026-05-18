import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import process from "node:process";
import { buildSupabaseEmailConfig } from "./supabase-auth-email-templates.mjs";

const ENV_FILES = [".env.local", ".env"];

function loadEnvFile(filePath) {
  if (!existsSync(filePath)) return;

  const raw = readFileSync(filePath, "utf8");
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex === -1) continue;

    const key = trimmed.slice(0, separatorIndex).trim();
    if (!key || process.env[key]) continue;

    let value = trimmed.slice(separatorIndex + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    process.env[key] = value.replaceAll("\\n", "\n");
  }
}

for (const file of ENV_FILES) {
  loadEnvFile(resolve(process.cwd(), file));
}

function getEnv(name, fallback) {
  return process.env[name] ?? fallback;
}

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Variavel obrigatoria ausente: ${name}`);
  }
  return value;
}

function normalizeSiteUrl(value) {
  const url = new URL(value);
  return url.toString().replace(/\/$/, "");
}

function defaultSenderFromSiteUrl(appUrl) {
  return `no-reply@${new URL(appUrl).hostname}`;
}

function maskSecret(value) {
  if (!value) return "";
  if (value.length <= 8) return "********";
  return `${value.slice(0, 4)}...${value.slice(-4)}`;
}

async function main() {
  const isDryRun = process.argv.includes("--dry-run");

  const appUrl = normalizeSiteUrl(
    getEnv("NEXT_PUBLIC_SITE_URL", "http://localhost:3000")
  );
  const appName = getEnv("SUPABASE_AUTH_FROM_NAME", "Dr. Marcelo Psiquiatra");
  const fromEmail = getEnv("SUPABASE_AUTH_FROM_EMAIL", defaultSenderFromSiteUrl(appUrl));
  const supportEmail = getEnv("SUPABASE_AUTH_SUPPORT_EMAIL", fromEmail);
  const resendApiKey = getEnv("RESEND_API_KEY", "");

  if (!fromEmail) {
    throw new Error("Defina SUPABASE_AUTH_FROM_EMAIL com o remetente autenticado no Resend.");
  }

  if (!supportEmail) {
    throw new Error("Defina SUPABASE_AUTH_SUPPORT_EMAIL ou SUPABASE_AUTH_FROM_EMAIL.");
  }

  if (!resendApiKey) {
    throw new Error("Defina RESEND_API_KEY para usar o SMTP do Resend.");
  }

  const emailConfig = buildSupabaseEmailConfig({
    appName,
    appUrl,
    supportEmail,
  });

  const payload = {
    external_email_enabled: true,
    mailer_autoconfirm: false,
    mailer_secure_email_change_enabled: true,
    smtp_admin_email: fromEmail,
    smtp_host: "smtp.resend.com",
    smtp_port: getEnv("SUPABASE_AUTH_SMTP_PORT", "465"),
    smtp_user: "resend",
    smtp_pass: resendApiKey,
    smtp_sender_name: appName,
    ...emailConfig,
  };

  if (isDryRun) {
    const preview = {
      projectRef: getEnv("SUPABASE_PROJECT_REF", "(nao definido)"),
      smtp: {
        host: payload.smtp_host,
        port: payload.smtp_port,
        user: payload.smtp_user,
        pass: maskSecret(payload.smtp_pass),
        fromEmail: payload.smtp_admin_email,
        fromName: payload.smtp_sender_name,
      },
      templateKeys: Object.keys(emailConfig),
    };

    console.log(JSON.stringify(preview, null, 2));
    return;
  }

  const projectRef = requireEnv("SUPABASE_PROJECT_REF");
  const accessToken = requireEnv("SUPABASE_ACCESS_TOKEN");

  const response = await fetch(
    `https://api.supabase.com/v1/projects/${projectRef}/config/auth`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "User-Agent": "dr-marcelopsiquiatra-auth-email-config/1.0",
      },
      body: JSON.stringify(payload),
    }
  );

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Falha ao atualizar o Auth do Supabase (${response.status}): ${body}`);
  }

  console.log(
    `SMTP e templates do Supabase Auth atualizados com sucesso para o projeto ${projectRef}.`
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
