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

function requireEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Variavel obrigatoria ausente: ${name}`);
  return value;
}

for (const file of ENV_FILES) {
  loadEnvFile(resolve(process.cwd(), file));
}

const accessToken = requireEnv("MERCADO_PAGO_ACCESS_TOKEN");
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
const backUrl = process.env.MERCADO_PAGO_PLAN_BACK_URL ?? (siteUrl ? `${siteUrl.replace(/\/$/, "")}/assinatura` : "");

if (!backUrl) {
  throw new Error(
    "Defina NEXT_PUBLIC_SITE_URL ou MERCADO_PAGO_PLAN_BACK_URL antes de criar o plano no Mercado Pago."
  );
}

const amount = Number(process.env.MERCADO_PAGO_PLAN_AMOUNT ?? "15");
if (!Number.isFinite(amount) || amount <= 0) {
  throw new Error("MERCADO_PAGO_PLAN_AMOUNT precisa ser um numero maior que zero.");
}

const body = {
  reason: process.env.MERCADO_PAGO_PLAN_NAME ?? "Plano Mensal",
  auto_recurring: {
    frequency: 1,
    frequency_type: "months",
    transaction_amount: amount,
    currency_id: "BRL",
  },
  payment_methods_allowed: {
    payment_types: [{ id: "credit_card" }],
  },
  back_url: backUrl,
};

const response = await fetch("https://api.mercadopago.com/preapproval_plan", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
    "User-Agent": "dr-marcelopsiquiatra-mercadopago-plan/1.0",
  },
  body: JSON.stringify(body),
});

const payload = await response.json().catch(async () => ({ raw: await response.text() }));

if (!response.ok) {
  console.error(JSON.stringify(payload, null, 2));
  throw new Error(`Falha ao criar plano no Mercado Pago (${response.status}).`);
}

console.log(
  JSON.stringify(
    {
      ok: true,
      preapprovalPlanId: payload.id,
      reason: payload.reason,
      amount,
      backUrl,
      nextStep: "Copie o preapprovalPlanId para MERCADO_PAGO_PREAPPROVAL_PLAN_ID no .env.local.",
    },
    null,
    2
  )
);
