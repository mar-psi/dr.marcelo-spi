import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import process from "node:process";

const ENV_FILES = [".env.local", ".env"];

function loadEnvFile(filePath) {
  if (!existsSync(filePath)) return;

  for (const line of readFileSync(filePath, "utf8").split(/\r?\n/)) {
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
    process.env[key] = value;
  }
}

function mask(value) {
  if (!value) return "ausente";
  if (value.length <= 10) return "preenchido";
  return `${value.slice(0, 6)}...${value.slice(-4)}`;
}

for (const file of ENV_FILES) {
  loadEnvFile(resolve(process.cwd(), file));
}

if (!process.env.RESEND_API_KEY) {
  throw new Error("RESEND_API_KEY ausente.");
}

const response = await fetch("https://api.resend.com/domains", {
  headers: {
    Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
    "User-Agent": "dr-marcelopsiquiatra-resend-check/1.0",
  },
});

if (!response.ok) {
  const body = await response.text();
  throw new Error(`Resend recusou a chave (${response.status}): ${body}`);
}

const payload = await response.json();
const siteHost = process.env.NEXT_PUBLIC_SITE_URL
  ? new URL(process.env.NEXT_PUBLIC_SITE_URL).hostname
  : null;
const domains = (payload.data ?? []).map((domain) => ({
  name: domain.name,
  status: domain.status,
  sending: domain.capabilities?.sending,
  region: domain.region,
}));
const matchingDomain = domains.find((domain) => domain.name === siteHost) ?? null;

console.log(
  JSON.stringify(
    {
      ok: true,
      apiKey: mask(process.env.RESEND_API_KEY),
      siteHost,
      sender:
        process.env.RESEND_FROM_EMAIL ??
        process.env.SUPABASE_AUTH_FROM_EMAIL ??
        (siteHost ? `no-reply@${siteHost}` : "pendente"),
      domains,
      warnings: [
        !matchingDomain ? "O dominio do NEXT_PUBLIC_SITE_URL nao aparece no Resend." : null,
        matchingDomain && matchingDomain.status !== "verified"
          ? `Dominio encontrado, mas status e ${matchingDomain.status}.`
          : null,
        matchingDomain && matchingDomain.sending !== "enabled"
          ? `Dominio encontrado, mas envio esta ${matchingDomain.sending}.`
          : null,
      ].filter(Boolean),
    },
    null,
    2
  )
);
