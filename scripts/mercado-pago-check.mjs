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
  if (value.length <= 12) return "preenchido";
  return `${value.slice(0, 7)}...${value.slice(-4)}`;
}

for (const file of ENV_FILES) {
  loadEnvFile(resolve(process.cwd(), file));
}

const required = [
  "MERCADO_PAGO_ACCESS_TOKEN",
  "MERCADO_PAGO_PUBLIC_KEY",
  "MERCADO_PAGO_WEBHOOK_SECRET",
];

const missing = required.filter((key) => !process.env[key]);
if (missing.length > 0) {
  throw new Error(`Variaveis ausentes: ${missing.join(", ")}`);
}

const response = await fetch("https://api.mercadopago.com/users/me", {
  headers: {
    Authorization: `Bearer ${process.env.MERCADO_PAGO_ACCESS_TOKEN}`,
    "User-Agent": "dr-marcelopsiquiatra-mercadopago-check/1.0",
  },
});

if (!response.ok) {
  throw new Error(`Mercado Pago recusou o Access Token (${response.status}).`);
}

const account = await response.json();
let plan = null;
if (process.env.MERCADO_PAGO_PREAPPROVAL_PLAN_ID) {
  const planResponse = await fetch(
    `https://api.mercadopago.com/preapproval_plan/${process.env.MERCADO_PAGO_PREAPPROVAL_PLAN_ID}`,
    {
      headers: {
        Authorization: `Bearer ${process.env.MERCADO_PAGO_ACCESS_TOKEN}`,
        "User-Agent": "dr-marcelopsiquiatra-mercadopago-check/1.0",
      },
    }
  );

  if (!planResponse.ok) {
    throw new Error(`Mercado Pago recusou o plano (${planResponse.status}).`);
  }

  const payload = await planResponse.json();
  plan = {
    id: payload.id,
    reason: payload.reason,
    status: payload.status,
    amount: payload.auto_recurring?.transaction_amount,
    currency: payload.auto_recurring?.currency_id,
    frequency: payload.auto_recurring?.frequency,
    frequencyType: payload.auto_recurring?.frequency_type,
    backUrl: payload.back_url,
  };
}

console.log(
  JSON.stringify(
    {
      ok: true,
      account: {
        id: account.id,
        country: account.country_id,
        site: account.site_id,
        nickname: account.nickname,
      },
      config: {
        accessToken: mask(process.env.MERCADO_PAGO_ACCESS_TOKEN),
        publicKey: mask(process.env.MERCADO_PAGO_PUBLIC_KEY),
        webhookSecret: mask(process.env.MERCADO_PAGO_WEBHOOK_SECRET),
        preapprovalPlanId: mask(process.env.MERCADO_PAGO_PREAPPROVAL_PLAN_ID),
        siteUrl: process.env.NEXT_PUBLIC_SITE_URL || "pendente",
      },
      plan,
      warnings: [
        !process.env.NEXT_PUBLIC_SITE_URL
          ? "Defina NEXT_PUBLIC_SITE_URL quando tiver dominio/URL publica para retorno e webhook."
          : null,
        !process.env.MERCADO_PAGO_PREAPPROVAL_PLAN_ID
          ? "Sem plano associado: o app criara assinaturas diretas no checkout."
          : null,
        plan && plan.status !== "active" ? `Plano encontrado, mas status atual e ${plan.status}.` : null,
        plan && (plan.amount !== 15 || plan.currency !== "BRL")
          ? "Plano encontrado, mas valor/moeda nao parecem ser R$15 BRL."
          : null,
        plan && (plan.frequency !== 1 || plan.frequencyType !== "months")
          ? "Plano encontrado, mas frequencia nao parece mensal."
          : null,
      ].filter(Boolean),
    },
    null,
    2
  )
);
