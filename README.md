# Dr. Marcelo Psiquiatra

Plataforma Next.js para comunidade paga de conteudos de psiquiatria.

## Stack

- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS
- Supabase Auth + Postgres
- pnpm

## Desenvolvimento

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

Abra `http://localhost:3000`.

## Supabase

1. Crie um projeto no Supabase.
2. Preencha `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` em `.env.local`.
3. Rode o SQL de [supabase/schema.sql](./supabase/schema.sql) no SQL Editor do Supabase. O arquivo e idempotente para poder ser rodado novamente quando novas tabelas/policies forem adicionadas.
4. Para tornar um usuario admin, defina `app_metadata.role = "admin"` no Supabase Auth. Nao use `user_metadata` para autorizacao.
5. Para usar e-mails reais do Auth, configure o Resend e aplique `pnpm auth:emails:apply` com `SUPABASE_ACCESS_TOKEN`, `SUPABASE_PROJECT_REF`, `RESEND_API_KEY` e os dados do remetente em `.env.local`.

## Modelo De Dados

O schema prepara:

- `profiles` e `subscriptions`
- `content_items`, `content_tags` e `content_materials`
- `quizzes`, `quiz_questions`, `quiz_options` e `quiz_attempts`
- `stories` e `story_views`
- `saved_content`, `lesson_progress`, `notifications` e `notification_reads`
- buckets `avatars`, `content-media`, `content-materials` e `story-media`

Todos os datasets locais de aulas, quizzes, e-books, stories, busca, progresso e admin ficam vazios. A partir daqui, o conteudo deve ser lido/escrito pelo Supabase.

Os buckets de conteudo privado nao permitem leitura direta para qualquer usuario logado. Sirva videos, PDFs e stories por URLs assinadas geradas no servidor depois de validar se o conteudo esta publicado e se o aluno tem assinatura ativa.

## Scripts

```bash
pnpm lint
pnpm typecheck
pnpm build
pnpm auth:emails:dry-run
pnpm auth:emails:apply
```

## Segurança

- Rotas protegidas usam `proxy.ts` com sessao Supabase.
- Admin depende de `app_metadata.role`.
- APIs de assinatura exigem usuario autenticado.
- Midia privada deve passar por checagem de acesso antes de gerar URL assinada.
- Checkout e webhooks nao retornam dados simulados; precisam de um gateway real antes de vender assinaturas.
- Os e-mails do Supabase Auth agora podem ser gerenciados por script, com SMTP do Resend e templates versionados no repositorio.
- Para os links de confirmacao funcionarem com confiabilidade, mantenha `NEXT_PUBLIC_SITE_URL` correto e adicione `/auth/confirm` e `/auth/callback` na allowlist de Redirect URLs do Supabase.
- Se o provedor de e-mail tiver rastreamento de links habilitado, desative essa opcao para os e-mails de auth. Links reescritos podem invalidar os fluxos de confirmacao e recuperacao.
- A integracao de assinatura esta preparada para Mercado Pago com recorrencia por cartao de credito, webhook assinado via `x-signature`, trilha de eventos em `payment_webhook_events`, historico em `payment_transactions` e fila de e-mails transacionais em `email_jobs`.
