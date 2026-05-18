import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Database, Json } from "@/types/database";

type AdminClient = ReturnType<typeof createSupabaseAdminClient>;
type EmailJobRow = Database["public"]["Tables"]["email_jobs"]["Row"];

type TemplatePayload = {
  userName?: string | null;
  amountCents?: number | null;
  nextBillingDate?: string | null;
  subscriptionId?: string | null;
};

function getSiteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? "https://app.blogmarcelopsiquiatra.com.br").replace(
    /\/$/,
    ""
  );
}

function getDefaultSenderEmail() {
  const explicit =
    process.env.RESEND_FROM_EMAIL ??
    process.env.SUPABASE_AUTH_FROM_EMAIL ??
    process.env.TRANSACTIONAL_EMAIL_FROM;

  if (explicit) return explicit;

  const hostname = new URL(getSiteUrl()).hostname;
  return `no-reply@${hostname}`;
}

function getSender() {
  const email = getDefaultSenderEmail();
  const name = process.env.SUPABASE_AUTH_FROM_NAME ?? "Dr. Marcelo Psiquiatra";
  return email.includes("<") ? email : `${name} <${email}>`;
}

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function formatMoney(amountCents?: number | null) {
  if (typeof amountCents !== "number") return "sua assinatura";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(amountCents / 100);
}

function formatDate(value?: string | null) {
  if (!value) return null;
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}

function renderShell(args: {
  title: string;
  preview: string;
  body: string;
  ctaLabel?: string;
  ctaUrl?: string;
}) {
  const siteUrl = getSiteUrl();
  const appName = process.env.SUPABASE_AUTH_FROM_NAME ?? "Dr. Marcelo Psiquiatra";
  const supportEmail =
    process.env.SUPABASE_AUTH_SUPPORT_EMAIL ??
    process.env.RESEND_REPLY_TO_EMAIL ??
    getDefaultSenderEmail();

  return `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(args.title)}</title>
  </head>
  <body style="margin:0;background:#0A0A0F;color:#F8FAFC;font-family:Inter,Arial,Helvetica,sans-serif;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(args.preview)}</div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#0A0A0F;padding:24px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;">
            <tr>
              <td style="padding:14px 16px 20px;text-align:center;">
                <a href="${siteUrl}" style="color:#F8FAFC;text-decoration:none;font-weight:800;font-size:20px;">${escapeHtml(appName)}</a>
              </td>
            </tr>
            <tr>
              <td style="background:#12121A;border:1px solid #26263A;border-radius:24px;overflow:hidden;">
                <div style="padding:32px 32px 18px;">
                  <div style="color:#A78BFA;font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;margin-bottom:14px;">Assinatura</div>
                  <h1 style="margin:0 0 14px;color:#F8FAFC;font-size:28px;line-height:1.2;">${escapeHtml(args.title)}</h1>
                  <div style="color:#CBD5E1;font-size:15px;line-height:1.75;">${args.body}</div>
                </div>
                ${
                  args.ctaLabel && args.ctaUrl
                    ? `<div style="padding:0 32px 28px;"><a href="${args.ctaUrl}" style="display:inline-block;background:#7C3AED;color:#fff;text-decoration:none;font-weight:700;font-size:15px;padding:15px 22px;border-radius:12px;">${escapeHtml(args.ctaLabel)}</a></div>`
                    : ""
                }
                <div style="padding:0 32px 32px;color:#94A3B8;font-size:13px;line-height:1.7;">
                  Se precisar de ajuda, responda este e-mail ou fale com o suporte em
                  <a href="mailto:${escapeHtml(supportEmail)}" style="color:#A78BFA;text-decoration:none;">${escapeHtml(supportEmail)}</a>.
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding:18px 16px 0;text-align:center;color:#94A3B8;font-size:12px;line-height:1.7;">
                ${escapeHtml(appName)}<br />
                <a href="${siteUrl}" style="color:#A78BFA;text-decoration:none;">${siteUrl}</a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function readPayload(payload: Json): TemplatePayload {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return {};
  return payload as TemplatePayload;
}

function renderEmailTemplate(job: EmailJobRow) {
  const payload = readPayload(job.payload);
  const firstName = payload.userName?.split(" ")[0] ?? "Olá";
  const amount = formatMoney(payload.amountCents);
  const nextBilling = formatDate(payload.nextBillingDate);
  const subscriptionUrl = `${getSiteUrl()}/assinatura`;

  switch (job.template_key) {
    case "subscription_activated":
      return renderShell({
        title: "Sua assinatura foi ativada",
        preview: "Seu acesso completo à plataforma foi liberado.",
        body: `
          <p style="margin:0 0 14px;">${escapeHtml(firstName)}, seu acesso completo à plataforma está ativo.</p>
          <p style="margin:0;">${
            nextBilling
              ? `A próxima cobrança está prevista para <strong>${escapeHtml(nextBilling)}</strong>.`
              : "Você já pode acessar os conteúdos exclusivos."
          }</p>
        `,
        ctaLabel: "Acessar plataforma",
        ctaUrl: getSiteUrl(),
      });
    case "subscription_renewed":
      return renderShell({
        title: "Sua assinatura foi renovada",
        preview: "Recebemos o pagamento da sua assinatura.",
        body: `
          <p style="margin:0 0 14px;">Recebemos o pagamento de <strong>${escapeHtml(amount)}</strong>.</p>
          <p style="margin:0;">${
            nextBilling
              ? `Sua próxima cobrança está prevista para <strong>${escapeHtml(nextBilling)}</strong>.`
              : "Seu acesso segue ativo normalmente."
          }</p>
        `,
        ctaLabel: "Ver assinatura",
        ctaUrl: subscriptionUrl,
      });
    case "subscription_payment_failed":
      return renderShell({
        title: "Falha na cobrança da assinatura",
        preview: "Não conseguimos processar a cobrança do seu cartão.",
        body: `
          <p style="margin:0 0 14px;">Não conseguimos processar a cobrança ${
            payload.amountCents ? `de <strong>${escapeHtml(amount)}</strong>` : "da sua assinatura"
          }.</p>
          <p style="margin:0;">Acesse sua assinatura para revisar o pagamento e evitar perda de acesso.</p>
        `,
        ctaLabel: "Revisar assinatura",
        ctaUrl: subscriptionUrl,
      });
    case "subscription_cancelled":
      return renderShell({
        title: "Renovação cancelada",
        preview: "Sua renovação automática foi cancelada.",
        body: `
          <p style="margin:0 0 14px;">Sua renovação automática foi cancelada.</p>
          <p style="margin:0;">${
            nextBilling
              ? `Seu acesso continua liberado até <strong>${escapeHtml(nextBilling)}</strong>.`
              : "Você pode reativar a assinatura quando quiser."
          }</p>
        `,
        ctaLabel: "Ver assinatura",
        ctaUrl: subscriptionUrl,
      });
    case "subscription_paused":
    default:
      return renderShell({
        title: "Sua assinatura foi pausada",
        preview: "Sua assinatura está pausada no momento.",
        body: `
          <p style="margin:0 0 14px;">Sua assinatura foi pausada e novas cobranças estão temporariamente bloqueadas.</p>
          <p style="margin:0;">Você pode acompanhar o status da assinatura pela plataforma.</p>
        `,
        ctaLabel: "Ver assinatura",
        ctaUrl: subscriptionUrl,
      });
  }
}

async function sendWithResend(job: EmailJobRow) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("RESEND_API_KEY ausente.");
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "Idempotency-Key": job.dedupe_key ?? job.id,
      "User-Agent": "dr-marcelopsiquiatra-email-jobs/1.0",
    },
    body: JSON.stringify({
      from: getSender(),
      to: [job.recipient_email],
      reply_to: process.env.RESEND_REPLY_TO_EMAIL ?? process.env.SUPABASE_AUTH_SUPPORT_EMAIL,
      subject: job.subject,
      html: renderEmailTemplate(job),
      tags: [
        { name: "template", value: job.template_key },
        { name: "job", value: job.id },
      ],
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Resend ${response.status}: ${body}`);
  }
}

export async function processPendingEmailJobs(admin: AdminClient, limit = 10) {
  const { data, error } = await admin
    .from("email_jobs")
    .select(
      "id,user_id,subscription_id,payment_transaction_id,provider,template_key,recipient_email,recipient_name,subject,dedupe_key,payload,status,scheduled_for,sent_at,last_error,created_at,updated_at"
    )
    .eq("provider", "resend")
    .eq("status", "pending")
    .lte("scheduled_for", new Date().toISOString())
    .order("scheduled_for", { ascending: true })
    .limit(limit);

  if (error) {
    throw new Error(error.message);
  }

  const jobs = (data ?? []) as EmailJobRow[];
  let sent = 0;
  let failed = 0;

  for (const job of jobs) {
    const processing = await admin
      .from("email_jobs")
      .update({ status: "processing", last_error: null, updated_at: new Date().toISOString() })
      .eq("id", job.id)
      .eq("status", "pending")
      .select("id")
      .maybeSingle();

    if (processing.error || !processing.data) continue;

    try {
      await sendWithResend(job);
      await admin
        .from("email_jobs")
        .update({
          status: "sent",
          sent_at: new Date().toISOString(),
          last_error: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", job.id);
      sent += 1;
    } catch (error) {
      await admin
        .from("email_jobs")
        .update({
          status: "failed",
          last_error: error instanceof Error ? error.message : "Falha ao enviar e-mail.",
          updated_at: new Date().toISOString(),
        })
        .eq("id", job.id);
      failed += 1;
    }
  }

  return { scanned: jobs.length, sent, failed };
}
