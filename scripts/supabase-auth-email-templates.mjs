const BRAND = {
  appName: "Dr. Marcelo Psiquiatra",
  accent: "#7C3AED",
  accentSoft: "#A78BFA",
  background: "#0A0A0F",
  surface: "#12121A",
  border: "#26263A",
  text: "#F8FAFC",
  muted: "#94A3B8",
  success: "#22C55E",
  warning: "#F59E0B",
  error: "#EF4444",
};

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function renderLinkButton(label, href) {
  return `
    <tr>
      <td style="padding: 0 32px 28px 32px;">
        <a
          href="${href}"
          style="
            display: inline-block;
            background: ${BRAND.accent};
            color: #ffffff;
            text-decoration: none;
            font-weight: 700;
            font-size: 15px;
            line-height: 15px;
            padding: 15px 22px;
            border-radius: 12px;
          "
        >
          ${escapeHtml(label)}
        </a>
      </td>
    </tr>
  `;
}

function renderNotice(contentHtml, tone = "default") {
  const toneMap = {
    default: { bg: "#151526", border: BRAND.border },
    success: { bg: "rgba(34,197,94,0.08)", border: "rgba(34,197,94,0.28)" },
    warning: { bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.28)" },
    error: { bg: "rgba(239,68,68,0.08)", border: "rgba(239,68,68,0.28)" },
  };

  const colors = toneMap[tone] ?? toneMap.default;

  return `
    <tr>
      <td style="padding: 0 32px 28px 32px;">
        <div
          style="
            background: ${colors.bg};
            border: 1px solid ${colors.border};
            border-radius: 16px;
            padding: 16px 18px;
            color: ${BRAND.muted};
            font-size: 14px;
            line-height: 1.65;
          "
        >
          ${contentHtml}
        </div>
      </td>
    </tr>
  `;
}

function renderCodeBlock(code) {
  return `
    <tr>
      <td style="padding: 0 32px 28px 32px;">
        <div
          style="
            background: #0F1020;
            border: 1px solid ${BRAND.border};
            border-radius: 16px;
            padding: 18px 20px;
            text-align: center;
          "
        >
          <div style="color: ${BRAND.muted}; font-size: 12px; letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 8px;">
            Codigo de verificacao
          </div>
          <div style="color: ${BRAND.text}; font-size: 30px; font-weight: 800; letter-spacing: 0.12em;">
            ${code}
          </div>
        </div>
      </td>
    </tr>
  `;
}

function renderEmail({
  appName,
  appUrl,
  supportEmail,
  preview,
  eyebrow,
  title,
  intro,
  bodyHtml,
  ctaLabel,
  ctaHref,
  noticeHtml,
  noticeTone,
  footerHtml,
  code,
}) {
  const safeAppName = escapeHtml(appName);
  const safeAppUrl = escapeHtml(appUrl);
  const safeSupportEmail = escapeHtml(supportEmail);

  return `<!DOCTYPE html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(title)} | ${safeAppName}</title>
  </head>
  <body style="margin: 0; padding: 0; background: ${BRAND.background}; color: ${BRAND.text}; font-family: Inter, Arial, Helvetica, sans-serif;">
    <div style="display: none; max-height: 0; overflow: hidden; opacity: 0;">
      ${escapeHtml(preview)}
    </div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: ${BRAND.background}; padding: 24px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 640px;">
            <tr>
              <td style="padding: 12px 16px 18px 16px; text-align: center;">
                <a href="${safeAppUrl}" style="color: ${BRAND.text}; text-decoration: none; font-weight: 800; font-size: 20px;">
                  ${safeAppName}
                </a>
              </td>
            </tr>
            <tr>
              <td>
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: ${BRAND.surface}; border: 1px solid ${BRAND.border}; border-radius: 24px; overflow: hidden;">
                  <tr>
                    <td style="padding: 32px 32px 20px 32px;">
                      <div style="color: ${BRAND.accentSoft}; font-size: 12px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 14px;">
                        ${escapeHtml(eyebrow)}
                      </div>
                      <h1 style="margin: 0 0 14px 0; color: ${BRAND.text}; font-size: 28px; line-height: 1.2;">
                        ${escapeHtml(title)}
                      </h1>
                      <p style="margin: 0; color: ${BRAND.muted}; font-size: 16px; line-height: 1.7;">
                        ${intro}
                      </p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 0 32px 28px 32px; color: ${BRAND.text}; font-size: 15px; line-height: 1.75;">
                      ${bodyHtml}
                    </td>
                  </tr>
                  ${code ? renderCodeBlock(code) : ""}
                  ${ctaLabel && ctaHref ? renderLinkButton(ctaLabel, ctaHref) : ""}
                  ${noticeHtml ? renderNotice(noticeHtml, noticeTone) : ""}
                  <tr>
                    <td style="padding: 0 32px 32px 32px; color: ${BRAND.muted}; font-size: 13px; line-height: 1.7;">
                      ${footerHtml ?? `
                        Se voce nao reconhece esta acao, responda este e-mail ou entre em contato por
                        <a href="mailto:${safeSupportEmail}" style="color: ${BRAND.accentSoft}; text-decoration: none;">${safeSupportEmail}</a>.
                      `}
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding: 18px 16px 0 16px; text-align: center; color: ${BRAND.muted}; font-size: 12px; line-height: 1.7;">
                ${safeAppName} • Conteudo para a comunidade do Dr. Marcelo.<br />
                <a href="${safeAppUrl}" style="color: ${BRAND.accentSoft}; text-decoration: none;">${safeAppUrl}</a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function renderAuthConfirmUrl(appUrl, type, fallbackNext) {
  return `{{ if .RedirectTo }}{{ .RedirectTo }}{{ else }}${appUrl}/auth/confirm?next=${encodeURIComponent(fallbackNext)}{{ end }}&token_hash={{ .TokenHash }}&type=${type}`;
}

export function buildSupabaseEmailConfig({
  appName = BRAND.appName,
  appUrl,
  supportEmail,
}) {
  const confirmationUrl = renderAuthConfirmUrl(appUrl, "email", "/login?notice=email_confirmed");
  const magicLinkUrl = renderAuthConfirmUrl(appUrl, "email", "/");
  const recoveryUrl = renderAuthConfirmUrl(
    appUrl,
    "recovery",
    "/nova-senha?notice=password_reset_ready"
  );
  const inviteUrl = renderAuthConfirmUrl(appUrl, "invite", "/nova-senha?notice=invite_ready");
  const emailChangeUrl = renderAuthConfirmUrl(
    appUrl,
    "email_change",
    "/login?notice=email_changed"
  );

  return {
    mailer_subjects_confirmation: `Confirme seu e-mail | ${appName}`,
    mailer_templates_confirmation_content: renderEmail({
      appName,
      appUrl,
      supportEmail,
      preview: "Confirme seu e-mail para ativar o acesso a plataforma.",
      eyebrow: "Confirmacao de conta",
      title: "Confirme seu e-mail",
      intro:
        "Sua conta ja foi criada. Falta so confirmar o e-mail para liberar o acesso aos conteudos da plataforma.",
      bodyHtml:
        "<p style=\"margin: 0;\">Assim que a confirmacao for concluida, voce podera entrar normalmente e acompanhar aulas, materiais e quizzes da comunidade.</p>",
      ctaLabel: "Confirmar e-mail",
      ctaHref: confirmationUrl,
      noticeHtml:
        "Por seguranca, este link pode expirar ou ser consumido se for aberto muitas vezes. Se precisar, solicite um novo e-mail na tela de login.",
      noticeTone: "warning",
    }),
    mailer_subjects_magic_link: `Seu link de acesso | ${appName}`,
    mailer_templates_magic_link_content: renderEmail({
      appName,
      appUrl,
      supportEmail,
      preview: "Entre com um link unico e seguro.",
      eyebrow: "Acesso rapido",
      title: "Seu link de acesso",
      intro:
        "Use este link para entrar de forma segura na plataforma do Dr. Marcelo sem precisar digitar a senha.",
      bodyHtml:
        "<p style=\"margin: 0;\">Se voce nao solicitou este acesso, pode ignorar esta mensagem com tranquilidade.</p>",
      ctaLabel: "Entrar agora",
      ctaHref: magicLinkUrl,
      noticeHtml:
        "Se voce utiliza um provedor de e-mail com verificacao automatica de links, abra o link manualmente a partir desta mensagem para evitar expiracao prematura.",
      noticeTone: "warning",
    }),
    mailer_subjects_recovery: `Redefina sua senha | ${appName}`,
    mailer_templates_recovery_content: renderEmail({
      appName,
      appUrl,
      supportEmail,
      preview: "Crie uma nova senha para sua conta.",
      eyebrow: "Recuperacao de acesso",
      title: "Redefina sua senha",
      intro:
        "Recebemos um pedido para trocar a senha da sua conta. Use o botao abaixo para continuar com seguranca.",
      bodyHtml:
        "<p style=\"margin: 0;\">Se voce nao pediu essa alteracao, ignore este e-mail. Sua senha atual continuara valida ate que uma nova seja salva.</p>",
      ctaLabel: "Criar nova senha",
      ctaHref: recoveryUrl,
      noticeHtml:
        "Ao abrir o link, voce sera levado para a tela de criacao de nova senha dentro do app.",
      noticeTone: "default",
    }),
    mailer_subjects_invite: `Seu acesso foi liberado | ${appName}`,
    mailer_templates_invite_content: renderEmail({
      appName,
      appUrl,
      supportEmail,
      preview: "Voce recebeu um convite para acessar a plataforma.",
      eyebrow: "Convite",
      title: "Seu acesso esta pronto",
      intro:
        "Voce recebeu um convite para entrar na plataforma do Dr. Marcelo. Basta validar o convite e definir sua senha.",
      bodyHtml:
        "<p style=\"margin: 0;\">Depois disso, seu acesso ficara ativo para navegar pela comunidade e consumir o conteudo liberado.</p>",
      ctaLabel: "Aceitar convite",
      ctaHref: inviteUrl,
      noticeHtml:
        "Se este convite chegou por engano, responda este e-mail para que possamos revisar o cadastro.",
      noticeTone: "default",
    }),
    mailer_subjects_reauthentication: `Codigo de verificacao | ${appName}`,
    mailer_templates_reauthentication_content: renderEmail({
      appName,
      appUrl,
      supportEmail,
      preview: "Use este codigo para confirmar uma acao sensivel na sua conta.",
      eyebrow: "Verificacao extra",
      title: "Confirme esta acao",
      intro:
        "Para concluir uma alteracao sensivel na sua conta, use o codigo abaixo na tela que solicitou a verificacao.",
      bodyHtml:
        "<p style=\"margin: 0;\">Nao compartilhe este codigo com ninguem. Nossa equipe nunca vai pedir esse codigo por mensagem ou telefone.</p>",
      code: "{{ .Token }}",
      noticeHtml:
        "Se voce nao iniciou esta acao, interrompa o processo e troque sua senha imediatamente.",
      noticeTone: "error",
    }),
    mailer_subjects_email_change: `Confirme a alteracao do seu e-mail | ${appName}`,
    mailer_templates_email_change_content: renderEmail({
      appName,
      appUrl,
      supportEmail,
      preview: "Confirme a troca do endereco de e-mail da sua conta.",
      eyebrow: "Alteracao de e-mail",
      title: "Confirme seu novo e-mail",
      intro:
        "Estamos quase concluindo a atualizacao do seu endereco de e-mail. Falta so a sua confirmacao.",
      bodyHtml:
        "<p style=\"margin: 0;\">Depois da validacao, este novo endereco passara a ser usado para login, avisos e recuperacao de senha.</p>",
      ctaLabel: "Confirmar alteracao",
      ctaHref: emailChangeUrl,
      noticeHtml:
        "Novo e-mail informado: <strong style=\"color: #F8FAFC;\">{{ .NewEmail }}</strong>",
      noticeTone: "default",
    }),
    mailer_notifications_password_changed_enabled: true,
    mailer_subjects_password_changed_notification: `Sua senha foi alterada | ${appName}`,
    mailer_templates_password_changed_notification_content: renderEmail({
      appName,
      appUrl,
      supportEmail,
      preview: "Aviso de seguranca sobre alteracao de senha.",
      eyebrow: "Seguranca da conta",
      title: "Sua senha foi alterada",
      intro:
        "Este e um aviso de seguranca confirmando que a senha da conta {{ .Email }} foi alterada com sucesso.",
      bodyHtml:
        "<p style=\"margin: 0;\">Se foi voce, nenhuma acao adicional e necessaria. Caso contrario, entre em contato imediatamente para revisarmos o acesso.</p>",
      noticeHtml:
        "Recomendacao: revise dispositivos conectados e altere a senha novamente se suspeitar de uso indevido.",
      noticeTone: "warning",
    }),
    mailer_notifications_email_changed_enabled: true,
    mailer_subjects_email_changed_notification: `Seu e-mail foi alterado | ${appName}`,
    mailer_templates_email_changed_notification_content: renderEmail({
      appName,
      appUrl,
      supportEmail,
      preview: "Aviso de seguranca sobre alteracao de e-mail.",
      eyebrow: "Seguranca da conta",
      title: "Seu e-mail foi alterado",
      intro:
        "O endereco de e-mail da sua conta foi atualizado de {{ .OldEmail }} para {{ .Email }}.",
      bodyHtml:
        "<p style=\"margin: 0;\">Se esta alteracao nao foi autorizada por voce, fale conosco imediatamente para bloquear novas mudancas.</p>",
      noticeHtml:
        "E-mail anterior: <strong style=\"color: #F8FAFC;\">{{ .OldEmail }}</strong><br />Novo e-mail: <strong style=\"color: #F8FAFC;\">{{ .Email }}</strong>",
      noticeTone: "warning",
    }),
    mailer_notifications_phone_changed_enabled: true,
    mailer_subjects_phone_changed_notification: `Seu telefone foi alterado | ${appName}`,
    mailer_templates_phone_changed_notification_content: renderEmail({
      appName,
      appUrl,
      supportEmail,
      preview: "Aviso de seguranca sobre alteracao de telefone.",
      eyebrow: "Seguranca da conta",
      title: "Seu telefone foi alterado",
      intro:
        "O telefone vinculado a conta {{ .Email }} foi alterado de {{ .OldPhone }} para {{ .Phone }}.",
      bodyHtml:
        "<p style=\"margin: 0;\">Se voce nao reconhece esta alteracao, responda este e-mail para tratarmos o caso com prioridade.</p>",
      noticeTone: "warning",
    }),
    mailer_notifications_mfa_factor_enrolled_enabled: true,
    mailer_subjects_mfa_factor_enrolled_notification: `Novo fator de seguranca adicionado | ${appName}`,
    mailer_templates_mfa_factor_enrolled_notification_content: renderEmail({
      appName,
      appUrl,
      supportEmail,
      preview: "Um novo fator MFA foi adicionado a sua conta.",
      eyebrow: "Seguranca da conta",
      title: "Novo fator MFA adicionado",
      intro:
        "Um novo fator de autenticacao do tipo {{ .FactorType }} foi ativado para a conta {{ .Email }}.",
      bodyHtml:
        "<p style=\"margin: 0;\">Se foi voce, otimo. Se nao foi, trate isto como prioridade e entre em contato para proteger a conta.</p>",
      noticeTone: "warning",
    }),
    mailer_notifications_mfa_factor_unenrolled_enabled: true,
    mailer_subjects_mfa_factor_unenrolled_notification: `Fator de seguranca removido | ${appName}`,
    mailer_templates_mfa_factor_unenrolled_notification_content: renderEmail({
      appName,
      appUrl,
      supportEmail,
      preview: "Um fator MFA foi removido da sua conta.",
      eyebrow: "Seguranca da conta",
      title: "Fator MFA removido",
      intro:
        "Um fator de autenticacao do tipo {{ .FactorType }} foi removido da conta {{ .Email }}.",
      bodyHtml:
        "<p style=\"margin: 0;\">Se esta mudanca nao partiu de voce, recomendamos revisar sua senha e acionar suporte imediatamente.</p>",
      noticeTone: "warning",
    }),
    mailer_notifications_identity_linked_enabled: true,
    mailer_subjects_identity_linked_notification: `Novo metodo de acesso vinculado | ${appName}`,
    mailer_templates_identity_linked_notification_content: renderEmail({
      appName,
      appUrl,
      supportEmail,
      preview: "Um novo provedor de acesso foi vinculado a sua conta.",
      eyebrow: "Seguranca da conta",
      title: "Novo metodo de acesso vinculado",
      intro:
        "Um novo provedor de identidade ({{ .Provider }}) foi vinculado a conta {{ .Email }}.",
      bodyHtml:
        "<p style=\"margin: 0;\">Isso permite novos caminhos de login. Se voce nao autorizou essa vinculacao, fale conosco imediatamente.</p>",
      noticeTone: "warning",
    }),
    mailer_notifications_identity_unlinked_enabled: true,
    mailer_subjects_identity_unlinked_notification: `Metodo de acesso removido | ${appName}`,
    mailer_templates_identity_unlinked_notification_content: renderEmail({
      appName,
      appUrl,
      supportEmail,
      preview: "Um provedor de acesso foi removido da sua conta.",
      eyebrow: "Seguranca da conta",
      title: "Metodo de acesso removido",
      intro:
        "O provedor de identidade ({{ .Provider }}) foi removido da conta {{ .Email }}.",
      bodyHtml:
        "<p style=\"margin: 0;\">Se esta acao nao foi feita por voce, entre em contato para revisarmos o historico de acesso e restaurarmos a seguranca da conta.</p>",
      noticeTone: "warning",
    }),
  };
}
