create extension if not exists pgcrypto;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'user_role') then
    create type public.user_role as enum ('user', 'admin');
  end if;

  if not exists (select 1 from pg_type where typname = 'subscription_status') then
    create type public.subscription_status as enum (
      'active',
      'trialing',
      'past_due',
      'cancelled',
      'suspended'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'content_category') then
    create type public.content_category as enum ('doencas', 'transtornos', 'curiosidades');
  end if;

  if not exists (select 1 from pg_type where typname = 'content_status') then
    create type public.content_status as enum ('draft', 'published', 'archived');
  end if;

  if not exists (select 1 from pg_type where typname = 'content_access') then
    create type public.content_access as enum ('free', 'subscriber');
  end if;

  if not exists (select 1 from pg_type where typname = 'content_type') then
    create type public.content_type as enum ('lesson', 'ebook', 'quiz', 'story', 'blog');
  end if;

  if not exists (select 1 from pg_type where typname = 'material_type') then
    create type public.material_type as enum ('pdf', 'ebook', 'link');
  end if;

  if not exists (select 1 from pg_type where typname = 'notification_target') then
    create type public.notification_target as enum ('all', 'subscribers', 'free');
  end if;

  if not exists (select 1 from pg_type where typname = 'payment_provider') then
    create type public.payment_provider as enum ('mercado_pago');
  end if;

  if not exists (select 1 from pg_type where typname = 'email_job_status') then
    create type public.email_job_status as enum ('pending', 'processing', 'sent', 'failed', 'cancelled');
  end if;
end $$;

create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin';
$$;

create or replace function public.has_active_subscription(user_id uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.subscriptions s
    where s.user_id = has_active_subscription.user_id
      and s.status in ('active', 'trialing', 'cancelled')
      and coalesce(s.current_period_end, now()) >= now()
  );
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  avatar_url text,
  role public.user_role not null default 'user',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan_id text,
  status public.subscription_status not null default 'suspended',
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  provider text,
  provider_customer_id text,
  provider_subscription_id text unique,
  external_reference text,
  provider_plan_id text,
  provider_status text,
  provider_payment_method text,
  provider_payer_email text,
  provider_checkout_url text,
  last_payment_id text,
  last_payment_status text,
  last_event_at timestamptz,
  cancelled_at timestamptz,
  paused_at timestamptz,
  cancellation_reason text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.content_items (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  description text not null default '',
  body text,
  type public.content_type not null,
  category public.content_category not null,
  status public.content_status not null default 'draft',
  access public.content_access not null default 'subscriber',
  thumbnail_path text,
  thumbnail_url text,
  video_path text,
  video_url text,
  duration_seconds integer not null default 0,
  published_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  search_vector tsvector generated always as (
    to_tsvector('portuguese', coalesce(title, '') || ' ' || coalesce(description, '') || ' ' || coalesce(body, ''))
  ) stored
);

create table if not exists public.content_tags (
  id uuid primary key default gen_random_uuid(),
  content_id uuid not null references public.content_items(id) on delete cascade,
  tag text not null,
  unique (content_id, tag)
);

create table if not exists public.content_materials (
  id uuid primary key default gen_random_uuid(),
  content_id uuid not null references public.content_items(id) on delete cascade,
  title text not null,
  type public.material_type not null default 'pdf',
  storage_path text,
  external_url text,
  pages integer not null default 0,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.quizzes (
  id uuid primary key default gen_random_uuid(),
  content_id uuid references public.content_items(id) on delete cascade,
  slug text not null unique,
  title text not null,
  description text not null default '',
  category public.content_category not null,
  status public.content_status not null default 'draft',
  access public.content_access not null default 'subscriber',
  difficulty text not null default 'Médio',
  estimated_minutes integer not null default 5,
  thumbnail_path text,
  created_by uuid references auth.users(id) on delete set null,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.quiz_questions (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references public.quizzes(id) on delete cascade,
  question text not null,
  explanation text not null default '',
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.quiz_options (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.quiz_questions(id) on delete cascade,
  text text not null,
  is_correct boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references public.quizzes(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  score integer not null default 0,
  answers jsonb not null default '[]'::jsonb,
  elapsed_seconds integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.user_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  push_notifications boolean not null default true,
  email_updates boolean not null default true,
  study_reminders boolean not null default true,
  marketing_emails boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.stories (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  theme text not null default '',
  category public.content_category not null,
  status public.content_status not null default 'draft',
  access public.content_access not null default 'subscriber',
  media_path text,
  thumbnail_path text,
  duration_seconds integer not null default 0,
  reactions jsonb not null default '{}'::jsonb,
  published_at timestamptz,
  expires_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.story_views (
  story_id uuid not null references public.stories(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  seen_at timestamptz not null default now(),
  primary key (story_id, user_id)
);

create table if not exists public.saved_content (
  user_id uuid not null references auth.users(id) on delete cascade,
  content_id uuid not null references public.content_items(id) on delete cascade,
  saved_at timestamptz not null default now(),
  primary key (user_id, content_id)
);

create table if not exists public.lesson_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  content_id uuid not null references public.content_items(id) on delete cascade,
  progress_seconds integer not null default 0,
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (user_id, content_id)
);

create table if not exists public.user_ebook_downloads (
  user_id uuid not null references auth.users(id) on delete cascade,
  content_id uuid not null references public.content_items(id) on delete cascade,
  downloaded_at timestamptz not null default now(),
  primary key (user_id, content_id)
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  title text not null,
  message text not null,
  target public.notification_target not null default 'all',
  kind text not null default 'manual',
  cta_url text,
  dedupe_key text,
  metadata jsonb not null default '{}'::jsonb,
  sent_to_count integer not null default 0,
  sent_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.notification_reads (
  notification_id uuid not null references public.notifications(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  read_at timestamptz not null default now(),
  primary key (notification_id, user_id)
);

create table if not exists public.payment_transactions (
  id uuid primary key default gen_random_uuid(),
  subscription_id uuid not null references public.subscriptions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  provider public.payment_provider not null default 'mercado_pago',
  provider_payment_id text,
  provider_authorized_payment_id text,
  external_reference text,
  description text not null default '',
  amount_cents integer not null default 0,
  currency_id text not null default 'BRL',
  status text not null default 'pending',
  payment_method text,
  installments integer,
  due_date timestamptz,
  paid_at timestamptz,
  invoice_url text,
  receipt_url text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.payment_webhook_events (
  id uuid primary key default gen_random_uuid(),
  provider public.payment_provider not null default 'mercado_pago',
  event_type text not null,
  action text,
  external_resource_id text,
  request_id text,
  signature_ts bigint,
  payload jsonb not null default '{}'::jsonb,
  query_params jsonb not null default '{}'::jsonb,
  processing_status text not null default 'pending',
  processing_error text,
  processed_at timestamptz,
  subscription_id uuid references public.subscriptions(id) on delete set null,
  user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.email_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  subscription_id uuid references public.subscriptions(id) on delete set null,
  payment_transaction_id uuid references public.payment_transactions(id) on delete set null,
  provider text not null default 'resend',
  template_key text not null,
  recipient_email text not null,
  recipient_name text,
  subject text not null,
  dedupe_key text,
  payload jsonb not null default '{}'::jsonb,
  status public.email_job_status not null default 'pending',
  scheduled_for timestamptz not null default now(),
  sent_at timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.subscriptions
  add column if not exists external_reference text,
  add column if not exists provider_plan_id text,
  add column if not exists provider_status text,
  add column if not exists provider_payment_method text,
  add column if not exists provider_payer_email text,
  add column if not exists provider_checkout_url text,
  add column if not exists last_payment_id text,
  add column if not exists last_payment_status text,
  add column if not exists last_event_at timestamptz,
  add column if not exists cancelled_at timestamptz,
  add column if not exists paused_at timestamptz,
  add column if not exists cancellation_reason text,
  add column if not exists metadata jsonb not null default '{}'::jsonb;

alter table public.notifications
  add column if not exists user_id uuid references auth.users(id) on delete cascade,
  add column if not exists kind text not null default 'manual',
  add column if not exists cta_url text,
  add column if not exists dedupe_key text,
  add column if not exists metadata jsonb not null default '{}'::jsonb,
  add column if not exists sent_to_count integer not null default 0;

create index if not exists subscriptions_user_id_idx on public.subscriptions(user_id);
create index if not exists subscriptions_status_idx on public.subscriptions(status);
create index if not exists subscriptions_provider_subscription_id_idx on public.subscriptions(provider_subscription_id);
create index if not exists subscriptions_external_reference_idx on public.subscriptions(external_reference);
create index if not exists content_items_type_status_idx on public.content_items(type, status);
create index if not exists content_items_category_idx on public.content_items(category);
create index if not exists content_items_search_idx on public.content_items using gin(search_vector);
create index if not exists content_tags_tag_idx on public.content_tags(tag);
create index if not exists quizzes_status_idx on public.quizzes(status);
create index if not exists stories_published_idx on public.stories(published_at desc);
create index if not exists lesson_progress_user_idx on public.lesson_progress(user_id);
create index if not exists quiz_attempts_user_idx on public.quiz_attempts(user_id);
create index if not exists notifications_sent_at_idx on public.notifications(sent_at desc);
create index if not exists notifications_user_id_idx on public.notifications(user_id, sent_at desc);
create index if not exists notification_reads_user_idx on public.notification_reads(user_id, read_at desc);
create unique index if not exists notifications_dedupe_key_idx on public.notifications(dedupe_key);
create index if not exists payment_transactions_subscription_id_idx on public.payment_transactions(subscription_id, created_at desc);
create index if not exists payment_transactions_user_id_idx on public.payment_transactions(user_id, created_at desc);
create unique index if not exists payment_transactions_provider_payment_id_idx on public.payment_transactions(provider, provider_payment_id);
create unique index if not exists payment_transactions_provider_authorized_payment_id_idx on public.payment_transactions(provider, provider_authorized_payment_id);
create index if not exists payment_webhook_events_created_at_idx on public.payment_webhook_events(created_at desc);
create unique index if not exists payment_webhook_events_provider_request_id_idx on public.payment_webhook_events(provider, request_id);
create unique index if not exists email_jobs_dedupe_key_idx on public.email_jobs(dedupe_key);
create index if not exists email_jobs_status_idx on public.email_jobs(status, scheduled_for);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_touch_updated_at on public.profiles;
create trigger profiles_touch_updated_at
  before update on public.profiles
  for each row execute procedure public.touch_updated_at();

drop trigger if exists subscriptions_touch_updated_at on public.subscriptions;
create trigger subscriptions_touch_updated_at
  before update on public.subscriptions
  for each row execute procedure public.touch_updated_at();

drop trigger if exists payment_transactions_touch_updated_at on public.payment_transactions;
create trigger payment_transactions_touch_updated_at
  before update on public.payment_transactions
  for each row execute procedure public.touch_updated_at();

drop trigger if exists email_jobs_touch_updated_at on public.email_jobs;
create trigger email_jobs_touch_updated_at
  before update on public.email_jobs
  for each row execute procedure public.touch_updated_at();

drop trigger if exists content_items_touch_updated_at on public.content_items;
create trigger content_items_touch_updated_at
  before update on public.content_items
  for each row execute procedure public.touch_updated_at();

drop trigger if exists quizzes_touch_updated_at on public.quizzes;
create trigger quizzes_touch_updated_at
  before update on public.quizzes
  for each row execute procedure public.touch_updated_at();

drop trigger if exists user_preferences_touch_updated_at on public.user_preferences;
create trigger user_preferences_touch_updated_at
  before update on public.user_preferences
  for each row execute procedure public.touch_updated_at();

drop trigger if exists stories_touch_updated_at on public.stories;
create trigger stories_touch_updated_at
  before update on public.stories
  for each row execute procedure public.touch_updated_at();

alter table public.profiles enable row level security;
alter table public.subscriptions enable row level security;
alter table public.content_items enable row level security;
alter table public.content_tags enable row level security;
alter table public.content_materials enable row level security;
alter table public.quizzes enable row level security;
alter table public.quiz_questions enable row level security;
alter table public.quiz_options enable row level security;
alter table public.quiz_attempts enable row level security;
alter table public.user_preferences enable row level security;
alter table public.stories enable row level security;
alter table public.story_views enable row level security;
alter table public.saved_content enable row level security;
alter table public.lesson_progress enable row level security;
alter table public.user_ebook_downloads enable row level security;
alter table public.notifications enable row level security;
alter table public.notification_reads enable row level security;
alter table public.payment_transactions enable row level security;
alter table public.payment_webhook_events enable row level security;
alter table public.email_jobs enable row level security;

drop policy if exists "profiles_select_own_or_admin" on public.profiles;
create policy "profiles_select_own_or_admin"
  on public.profiles for select
  using (auth.uid() = id or public.is_admin());

drop policy if exists "profiles_update_own_basic_fields" on public.profiles;
create policy "profiles_update_own_basic_fields"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id and role = 'user');

drop policy if exists "profiles_admin_all" on public.profiles;
create policy "profiles_admin_all"
  on public.profiles for all
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "subscriptions_select_own_or_admin" on public.subscriptions;
create policy "subscriptions_select_own_or_admin"
  on public.subscriptions for select
  using (auth.uid() = user_id or public.is_admin());

drop policy if exists "subscriptions_admin_all" on public.subscriptions;
create policy "subscriptions_admin_all"
  on public.subscriptions for all
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "content_read_published_by_access" on public.content_items;
create policy "content_read_published_by_access"
  on public.content_items for select
  using (
    status = 'published'
    and (
      access = 'free'
      or public.has_active_subscription(auth.uid())
      or public.is_admin()
    )
  );

drop policy if exists "content_admin_all" on public.content_items;
create policy "content_admin_all"
  on public.content_items for all
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "content_tags_read" on public.content_tags;
create policy "content_tags_read"
  on public.content_tags for select
  using (
    exists (
      select 1 from public.content_items c
      where c.id = content_tags.content_id
        and c.status = 'published'
        and (c.access = 'free' or public.has_active_subscription(auth.uid()) or public.is_admin())
    )
  );

drop policy if exists "content_tags_admin_all" on public.content_tags;
create policy "content_tags_admin_all"
  on public.content_tags for all
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "content_materials_read" on public.content_materials;
create policy "content_materials_read"
  on public.content_materials for select
  using (
    exists (
      select 1 from public.content_items c
      where c.id = content_materials.content_id
        and c.status = 'published'
        and (c.access = 'free' or public.has_active_subscription(auth.uid()) or public.is_admin())
    )
  );

drop policy if exists "content_materials_admin_all" on public.content_materials;
create policy "content_materials_admin_all"
  on public.content_materials for all
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "quizzes_read_published_by_access" on public.quizzes;
create policy "quizzes_read_published_by_access"
  on public.quizzes for select
  using (
    status = 'published'
    and (access = 'free' or public.has_active_subscription(auth.uid()) or public.is_admin())
  );

drop policy if exists "quizzes_admin_all" on public.quizzes;
create policy "quizzes_admin_all"
  on public.quizzes for all
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "quiz_questions_read" on public.quiz_questions;
create policy "quiz_questions_read"
  on public.quiz_questions for select
  using (
    exists (
      select 1 from public.quizzes q
      where q.id = quiz_questions.quiz_id
        and q.status = 'published'
        and (q.access = 'free' or public.has_active_subscription(auth.uid()) or public.is_admin())
    )
  );

drop policy if exists "quiz_questions_admin_all" on public.quiz_questions;
create policy "quiz_questions_admin_all"
  on public.quiz_questions for all
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "quiz_options_read" on public.quiz_options;
create policy "quiz_options_read"
  on public.quiz_options for select
  using (
    exists (
      select 1
      from public.quiz_questions qq
      join public.quizzes q on q.id = qq.quiz_id
      where qq.id = quiz_options.question_id
        and q.status = 'published'
        and (q.access = 'free' or public.has_active_subscription(auth.uid()) or public.is_admin())
    )
  );

drop policy if exists "quiz_options_admin_all" on public.quiz_options;
create policy "quiz_options_admin_all"
  on public.quiz_options for all
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "quiz_attempts_own" on public.quiz_attempts;
create policy "quiz_attempts_own"
  on public.quiz_attempts for all
  using (auth.uid() = user_id or public.is_admin())
  with check (auth.uid() = user_id or public.is_admin());

drop policy if exists "user_preferences_own_select" on public.user_preferences;
create policy "user_preferences_own_select"
  on public.user_preferences for select
  using (auth.uid() = user_id or public.is_admin());

drop policy if exists "user_preferences_own_insert" on public.user_preferences;
create policy "user_preferences_own_insert"
  on public.user_preferences for insert
  with check (auth.uid() = user_id);

drop policy if exists "user_preferences_own_update" on public.user_preferences;
create policy "user_preferences_own_update"
  on public.user_preferences for update
  using (auth.uid() = user_id or public.is_admin())
  with check (auth.uid() = user_id or public.is_admin());

drop policy if exists "stories_read_published_by_access" on public.stories;
create policy "stories_read_published_by_access"
  on public.stories for select
  using (
    status = 'published'
    and (expires_at is null or expires_at > now())
    and (access = 'free' or public.has_active_subscription(auth.uid()) or public.is_admin())
  );

drop policy if exists "stories_admin_all" on public.stories;
create policy "stories_admin_all"
  on public.stories for all
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "story_views_own" on public.story_views;
create policy "story_views_own"
  on public.story_views for all
  using (auth.uid() = user_id or public.is_admin())
  with check (auth.uid() = user_id or public.is_admin());

drop policy if exists "saved_content_own" on public.saved_content;
create policy "saved_content_own"
  on public.saved_content for all
  using (auth.uid() = user_id or public.is_admin())
  with check (auth.uid() = user_id or public.is_admin());

drop policy if exists "lesson_progress_own" on public.lesson_progress;
create policy "lesson_progress_own"
  on public.lesson_progress for all
  using (auth.uid() = user_id or public.is_admin())
  with check (auth.uid() = user_id or public.is_admin());

drop policy if exists "user_ebook_downloads_own" on public.user_ebook_downloads;
create policy "user_ebook_downloads_own"
  on public.user_ebook_downloads for all
  using (auth.uid() = user_id or public.is_admin())
  with check (auth.uid() = user_id or public.is_admin());

drop policy if exists "notifications_admin_all" on public.notifications;
create policy "notifications_admin_all"
  on public.notifications for all
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "notifications_user_targeted_read" on public.notifications;
create policy "notifications_user_targeted_read"
  on public.notifications for select
  using (
    sent_at is not null
    and (
      public.is_admin()
      or user_id = auth.uid()
      or (
        user_id is null
        and (
          target = 'all'
          or (target = 'subscribers' and public.has_active_subscription(auth.uid()))
          or (target = 'free' and auth.uid() is not null and not public.has_active_subscription(auth.uid()))
        )
      )
    )
  );

drop policy if exists "notification_reads_own" on public.notification_reads;
create policy "notification_reads_own"
  on public.notification_reads for all
  using (auth.uid() = user_id or public.is_admin())
  with check (auth.uid() = user_id or public.is_admin());

drop policy if exists "payment_transactions_select_own_or_admin" on public.payment_transactions;
create policy "payment_transactions_select_own_or_admin"
  on public.payment_transactions for select
  using (auth.uid() = user_id or public.is_admin());

drop policy if exists "payment_transactions_admin_all" on public.payment_transactions;
create policy "payment_transactions_admin_all"
  on public.payment_transactions for all
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "payment_webhook_events_admin_all" on public.payment_webhook_events;
create policy "payment_webhook_events_admin_all"
  on public.payment_webhook_events for all
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "email_jobs_admin_all" on public.email_jobs;
create policy "email_jobs_admin_all"
  on public.email_jobs for all
  using (public.is_admin())
  with check (public.is_admin());

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create or replace function public.delete_own_account()
returns boolean
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  current_user_id uuid := auth.uid();
begin
  if current_user_id is null then
    raise exception 'not_authenticated';
  end if;

  delete from auth.users where id = current_user_id;
  return true;
end;
$$;

revoke all on function public.delete_own_account() from public;
grant execute on function public.delete_own_account() to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('avatars', 'avatars', true, 5242880, array['image/png', 'image/jpeg', 'image/webp']),
  ('content-media', 'content-media', false, 1073741824, array['video/mp4', 'video/webm', 'video/quicktime', 'image/png', 'image/jpeg', 'image/webp']),
  ('content-materials', 'content-materials', false, 104857600, array['application/pdf']),
  ('story-media', 'story-media', false, 104857600, array['video/mp4', 'video/webm', 'video/quicktime', 'image/png', 'image/jpeg', 'image/webp'])
on conflict (id) do nothing;

update storage.buckets
set allowed_mime_types = array['video/mp4', 'video/webm', 'video/quicktime', 'image/png', 'image/jpeg', 'image/webp']
where id in ('content-media', 'story-media');

drop policy if exists "avatars_public_read" on storage.objects;
create policy "avatars_public_read"
  on storage.objects for select
  using (bucket_id = 'avatars');

drop policy if exists "avatars_own_write" on storage.objects;
create policy "avatars_own_write"
  on storage.objects for all
  using (bucket_id = 'avatars' and (auth.uid()::text = (storage.foldername(name))[1] or public.is_admin()))
  with check (bucket_id = 'avatars' and (auth.uid()::text = (storage.foldername(name))[1] or public.is_admin()));

drop policy if exists "admin_private_storage_all" on storage.objects;
create policy "admin_private_storage_all"
  on storage.objects for all
  using (bucket_id in ('content-media', 'content-materials', 'story-media') and public.is_admin())
  with check (bucket_id in ('content-media', 'content-materials', 'story-media') and public.is_admin());

drop policy if exists "authenticated_private_storage_read" on storage.objects;
-- Private media must be served through signed URLs generated after checking
-- publication status and subscription entitlement in application code.
